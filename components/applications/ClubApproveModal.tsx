"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAction } from "@/context/ActionContext";
import type { Club } from "@/context/types";
import {
  useApproveClubApplication,
  useClubApprovalTerms,
} from "@/lib/clubApplications";
import { formatRegionCurrency, regionFromSite } from "@/lib/regions";
import { isBelowMinimumAmount, minimumPriceMessage } from "@/lib/ticketPrice";
import { CheckIcon, XIcon } from "@/components/ui/Icons";

/**
 * The step between "Accept" and the approval itself for a car club:
 * the organiser sets the member ticket price for THIS club and how
 * many spaces it gets, starting from the event's default club price
 * and the number the club asked for. The spaces become the club's
 * ticket stock; the price is what each member pays at checkout.
 *
 * Portalled to <body> so it sits over the detail modal and the
 * application cards alike, and swallows clicks / keys so the card
 * underneath doesn't open its own detail view.
 */
export function ClubApproveModal({
  club,
  onClose,
  onApproved,
}: {
  club: Club;
  onClose: () => void;
  /** Called after a successful approval (the caller typically closes
   *  whatever it has open). */
  onApproved?: () => void;
}) {
  const applicationId = Number(club.id);
  const terms = useClubApprovalTerms(applicationId);
  const approve = useApproveClubApplication();
  const runAction = useAction();

  // Drafts are null until the organiser types, so the fields show the
  // terms' defaults the moment they land without an effect copying
  // them into state.
  const [priceDraft, setPriceDraft] = useState<string | null>(null);
  const [spacesDraft, setSpacesDraft] = useState<string | null>(null);
  // Attendance options (multi-day events): one price per option, keyed
  // "all" / "day:YYYY-MM-DD"; null until typed, showing the default.
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});
  // Per-day clubs (multi-day events): spaces and price for each day the
  // club applied for, keyed "day:YYYY-MM-DD"; undefined until typed.
  const [dayDrafts, setDayDrafts] = useState<
    Record<string, { spaces?: string; price?: string }>
  >({});
  // The discounted every-day ticket for a club on two or more days.
  const [allDaysOffer, setAllDaysOffer] = useState(true);
  const [allDaysPriceDraft, setAllDaysPriceDraft] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const spacesRef = useRef<HTMLInputElement>(null);

  const price =
    priceDraft ?? (terms.data ? terms.data.default_price.toFixed(2) : "");
  const spaces =
    spacesDraft ??
    (terms.data ? String(Math.max(1, terms.data.requested || 1)) : "");
  const touched =
    showErrors ||
    priceDraft !== null ||
    spacesDraft !== null ||
    Object.keys(optionDrafts).length > 0 ||
    Object.keys(dayDrafts).length > 0 ||
    allDaysPriceDraft !== null;

  useEffect(() => {
    if (terms.data) spacesRef.current?.select();
  }, [terms.data]);

  const submitting = approve.isPending;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, submitting]);

  const region = terms.data ? regionFromSite(terms.data.site) : null;
  const requireTicket = terms.data?.require_ticket ?? false;
  const remaining = terms.data?.remaining ?? null;
  const attendanceOptions = terms.data?.attendance_options ?? [];
  // Per-day clubs: the days the club applied for, each with spaces and
  // a member price. Takes precedence over the pooled per-option prices.
  const requestedDays = terms.data?.requested_days ?? [];
  const perDay = requestedDays.length > 0;
  // Multi-day event with paid tickets: a price per option replaces the
  // single price field (pooled layout, kept for older data).
  const byOption = !perDay && requireTicket && attendanceOptions.length > 0;

  const parsedPrice = requireTicket ? parseFloat(price) : 0;
  const parsedSpaces = parseInt(spaces, 10);

  const defaultDaySpaces = terms.data
    ? String(Math.max(1, terms.data.requested || 1))
    : "";
  const daySpacesValue = (key: string) =>
    dayDrafts[key]?.spaces ?? defaultDaySpaces;
  const dayPriceValue = (key: string, fallback: number) =>
    dayDrafts[key]?.price ?? fallback.toFixed(2);
  const dayTerms: Record<string, { spaces: number; price?: number }> = {};
  let dayError: string | null = null;
  let busiestDay = 0;
  if (perDay) {
    for (const day of requestedDays) {
      const sp = parseInt(daySpacesValue(day.key), 10);
      if (!Number.isFinite(sp) || sp < 1) {
        dayError = `Allocate at least 1 space for ${day.label}.`;
        break;
      }
      busiestDay = Math.max(busiestDay, sp);
      let p: number | undefined;
      if (requireTicket) {
        const raw = dayPriceValue(day.key, day.default_price);
        const parsed = parseFloat(raw);
        if (raw.trim() === "" || !Number.isFinite(parsed) || parsed < 0) {
          dayError = `Enter a price for ${day.label}, or 0 for free.`;
          break;
        }
        if (isBelowMinimumAmount(parsed) && region) {
          dayError = minimumPriceMessage(region, "Club tickets");
          break;
        }
        p = Math.round(parsed * 100) / 100;
      }
      dayTerms[day.key] = { spaces: sp, ...(p !== undefined ? { price: p } : {}) };
    }
    if (!dayError && remaining !== null && busiestDay > remaining) {
      dayError = `Only ${remaining} ${remaining === 1 ? "space is" : "spaces are"} left to allocate.`;
    }
  }
  const canOfferAllDays =
    perDay &&
    requestedDays.length >= 2 &&
    (terms.data?.all_days_offered ?? true);
  const allDaysDefault = terms.data?.all_days_default_price ?? 0;
  const allDaysPrice = allDaysPriceDraft ?? allDaysDefault.toFixed(2);
  let allDaysTerms: { offer: boolean; price?: number } | undefined;
  if (canOfferAllDays) {
    if (!allDaysOffer) {
      allDaysTerms = { offer: false };
    } else if (requireTicket) {
      const parsed = parseFloat(allDaysPrice);
      if (
        !dayError &&
        (allDaysPrice.trim() === "" || !Number.isFinite(parsed) || parsed < 0)
      ) {
        dayError = "Enter a price for the all-days ticket, or 0 for free.";
      } else if (!dayError && isBelowMinimumAmount(parsed) && region) {
        dayError = minimumPriceMessage(region, "Club tickets");
      }
      allDaysTerms = { offer: true, price: Math.round(parsed * 100) / 100 };
    } else {
      allDaysTerms = { offer: true, price: 0 };
    }
  }

  const optionPrice = (key: string, fallback: number) =>
    optionDrafts[key] ?? fallback.toFixed(2);
  const optionPrices: Record<string, number> = {};
  let optionError: string | null = null;
  if (byOption) {
    for (const opt of attendanceOptions) {
      const raw = optionPrice(opt.key, opt.default_price);
      const parsed = parseFloat(raw);
      if (raw.trim() === "" || !Number.isFinite(parsed) || parsed < 0) {
        optionError = `Enter a price for ${opt.label}, or 0 for free.`;
        break;
      }
      if (isBelowMinimumAmount(parsed) && region) {
        optionError = minimumPriceMessage(region, "Club tickets");
        break;
      }
      optionPrices[opt.key] = Math.round(parsed * 100) / 100;
    }
  }

  const priceError = !requireTicket
    ? null
    : byOption
      ? optionError
      : price.trim() === "" || !Number.isFinite(parsedPrice) || parsedPrice < 0
        ? "Enter a ticket price, or 0 for free."
        : isBelowMinimumAmount(parsedPrice) && region
          ? minimumPriceMessage(region, "Club tickets")
          : null;

  const spacesError = perDay
    ? dayError
    : spaces.trim() === "" || !Number.isFinite(parsedSpaces) || parsedSpaces < 1
      ? "Allocate at least 1 space."
      : remaining !== null && parsedSpaces > remaining
        ? `Only ${remaining} ${remaining === 1 ? "space is" : "spaces are"} left to allocate.`
        : null;

  const canSubmit = !!terms.data && !priceError && !spacesError && !submitting;

  const submit = async () => {
    if (!canSubmit) {
      setShowErrors(true);
      return;
    }
    if (perDay) {
      const lines = requestedDays
        .map((d) => {
          const t = dayTerms[d.key];
          const priceText =
            requireTicket && region && t?.price !== undefined
              ? ` at ${formatRegionCurrency(t.price, region)}`
              : "";
          return `${d.label}: ${t?.spaces ?? 0}${priceText}`;
        })
        .join("; ");
      const allDaysLine =
        allDaysTerms?.offer && region
          ? `; All days: ${formatRegionCurrency(allDaysTerms.price ?? 0, region)}`
          : "";
      const res = await runAction({
        loadingLabel: "Approving club...",
        successTitle: "Club confirmed",
        successMessage: `${club.name} is confirmed - ${lines}${allDaysLine}. They've been emailed a unique link to share with their members.`,
        errorTitle: "Couldn't approve the club",
        run: async () => {
          await approve.mutateAsync({
            applicationId,
            days: dayTerms,
            ...(allDaysTerms ? { all_days: allDaysTerms } : {}),
          });
          return true;
        },
      });
      if (res) {
        onApproved?.();
        onClose();
      }
      return;
    }
    const priceSummary =
      requireTicket && region
        ? byOption
          ? `. Members pay ${attendanceOptions
              .map(
                (o) =>
                  `${o.label}: ${formatRegionCurrency(optionPrices[o.key] ?? 0, region)}`,
              )
              .join(", ")}`
          : ` at ${formatRegionCurrency(parsedPrice, region)} each`
        : "";
    const res = await runAction({
      loadingLabel: "Approving club...",
      successTitle: "Club confirmed",
      successMessage: `${club.name} has ${parsedSpaces} ${parsedSpaces === 1 ? "space" : "spaces"}${priceSummary}. They've been emailed a unique link to share with their members.`,
      errorTitle: "Couldn't approve the club",
      run: async () => {
        await approve.mutateAsync({
          applicationId,
          price: requireTicket
            ? byOption
              ? (optionPrices.all ?? Math.round(parsedPrice * 100) / 100)
              : Math.round(parsedPrice * 100) / 100
            : 0,
          spaces: parsedSpaces,
          ...(byOption ? { prices: optionPrices } : {}),
        });
        return true;
      },
    });
    if (res) {
      onApproved?.();
      onClose();
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid var(--border-strong, #d9d9d9)",
    borderRadius: 8,
    outline: "none",
    background: "var(--surface)",
    color: "var(--ink)",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: 6,
  };
  const hintStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: "var(--muted)",
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-backdrop open"
      style={{ zIndex: 110 }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clubApproveTitle"
        style={{ maxWidth: 440, width: "calc(100% - 32px)" }}
      >
        <div className="modal-header">
          <div>
            <div className="modal-title" id="clubApproveTitle">
              Approve {club.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
              Set what this club pays and how many spaces it gets.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Close"
            disabled={submitting}
          >
            <XIcon />
          </button>
        </div>

        <div className="modal-body" style={{ padding: "18px 22px 6px" }}>
          {terms.isLoading && (
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "6px 0 18px" }}>
              Loading the club&apos;s application…
            </p>
          )}
          {terms.error && (
            <div
              className="field-error"
              style={{ marginBottom: 16, fontSize: 13 }}
            >
              {terms.error.message || "Couldn't load this application."}{" "}
              <button
                type="button"
                onClick={() => terms.refetch()}
                style={{
                  textDecoration: "underline",
                  color: "inherit",
                  background: "none",
                  border: 0,
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}

          {terms.data && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 18,
                  padding: "10px 12px",
                  background: "var(--bg-2, #f6f5f2)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    Spaces requested
                  </div>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    {terms.data.requested}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    Left to allocate
                  </div>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    {remaining === null ? "No limit" : remaining}
                  </div>
                </div>
              </div>

              {perDay && (
                <div style={{ marginBottom: 16 }}>
                  <div style={labelStyle}>Spaces and price per day</div>
                  <div style={{ ...hintStyle, marginTop: 0, marginBottom: 8 }}>
                    The club applied for {requestedDays.length === 1 ? "this day" : "these days"}.
                    Set how many member tickets it can book
                    {requireTicket ? " and what each costs" : ""} for each.
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: requireTicket ? "1fr 90px 110px" : "1fr 90px",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ ...hintStyle, marginTop: 0 }}>Day</div>
                    <div style={{ ...hintStyle, marginTop: 0 }}>Spaces</div>
                    {requireTicket && region && (
                      <div style={{ ...hintStyle, marginTop: 0 }}>
                        Price ({region.currencySymbol})
                      </div>
                    )}
                    {requestedDays.map((day) => {
                      const idBase = `clubDay-${day.key.replace(/[^a-z0-9]/gi, "-")}`;
                      return (
                        <Fragment key={day.key}>
                          <label
                            htmlFor={`${idBase}-spaces`}
                            style={{ fontSize: 13, color: "var(--ink)" }}
                          >
                            {day.label}
                          </label>
                          <input
                            id={`${idBase}-spaces`}
                            type="number"
                            inputMode="numeric"
                            step={1}
                            min={1}
                            max={remaining ?? undefined}
                            style={{ ...fieldStyle, padding: "8px 10px" }}
                            value={daySpacesValue(day.key)}
                            disabled={submitting}
                            onChange={(e) =>
                              setDayDrafts((d) => ({
                                ...d,
                                [day.key]: { ...d[day.key], spaces: e.target.value },
                              }))
                            }
                          />
                          {requireTicket && region && (
                            <input
                              id={`${idBase}-price`}
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              aria-label={`${day.label} price`}
                              style={{ ...fieldStyle, padding: "8px 10px" }}
                              value={dayPriceValue(day.key, day.default_price)}
                              disabled={submitting}
                              onChange={(e) =>
                                setDayDrafts((d) => ({
                                  ...d,
                                  [day.key]: { ...d[day.key], price: e.target.value },
                                }))
                              }
                            />
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                  {canOfferAllDays && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid var(--border, #e8e6e1)",
                        display: "grid",
                        gridTemplateColumns: requireTicket ? "1fr 110px" : "1fr",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <label
                        htmlFor="clubAllDaysOffer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--ink)",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          id="clubAllDaysOffer"
                          type="checkbox"
                          checked={allDaysOffer}
                          disabled={submitting}
                          onChange={(e) => setAllDaysOffer(e.target.checked)}
                        />
                        <span>
                          Also offer an <strong>all-days</strong> ticket
                          {requireTicket ? " (one discounted price for every day)" : " (one ticket for every day)"}
                        </span>
                      </label>
                      {requireTicket && region && (
                        <input
                          id="clubAllDaysPrice"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          aria-label="All-days ticket price"
                          style={{ ...fieldStyle, padding: "8px 10px" }}
                          value={allDaysPrice}
                          disabled={submitting || !allDaysOffer}
                          onChange={(e) => setAllDaysPriceDraft(e.target.value)}
                        />
                      )}
                    </div>
                  )}
                  {touched && spacesError ? (
                    <div className="field-error">{spacesError}</div>
                  ) : (
                    <div style={hintStyle}>
                      Spaces default to what the club asked for
                      {requireTicket ? "; prices to the event's defaults" : ""}.
                      {canOfferAllDays
                        ? " An all-days ticket takes a space on every day."
                        : ""}{" "}
                      You can change prices and spaces later from the
                      club&apos;s details.
                    </div>
                  )}
                </div>
              )}

              {byOption && region && (
                <div style={{ marginBottom: 16 }}>
                  <div style={labelStyle}>
                    Ticket price per member ({region.currencySymbol})
                  </div>
                  <div style={{ ...hintStyle, marginTop: 0, marginBottom: 8 }}>
                    This event runs over {attendanceOptions.length - 1} days.
                    Members choose the day(s) they attend when they book;
                    set what each option costs this club&apos;s members.
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {attendanceOptions.map((opt) => {
                      const id = `clubApprovePrice-${opt.key.replace(/[^a-z0-9]/gi, "-")}`;
                      return (
                        <div
                          key={opt.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <label
                            htmlFor={id}
                            style={{ flex: 1, fontSize: 13, color: "var(--ink)" }}
                          >
                            {opt.label}
                          </label>
                          <input
                            id={id}
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            style={{ ...fieldStyle, width: 120 }}
                            value={optionPrice(opt.key, opt.default_price)}
                            disabled={submitting}
                            onChange={(e) =>
                              setOptionDrafts((d) => ({
                                ...d,
                                [opt.key]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                  {touched && priceError ? (
                    <div className="field-error">{priceError}</div>
                  ) : (
                    <div style={hintStyle}>
                      Pre-filled from the event&apos;s default prices.
                    </div>
                  )}
                </div>
              )}

              {requireTicket && region && !byOption && !perDay && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle} htmlFor="clubApprovePrice">
                    Ticket price per member ({region.currencySymbol})
                  </label>
                  <input
                    id="clubApprovePrice"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    style={fieldStyle}
                    value={price}
                    disabled={submitting}
                    onChange={(e) => setPriceDraft(e.target.value)}
                  />
                  {touched && priceError ? (
                    <div className="field-error">{priceError}</div>
                  ) : (
                    <div style={hintStyle}>
                      Event default is{" "}
                      {formatRegionCurrency(terms.data.default_price, region)}.
                      Each of this club&apos;s members pays this at checkout.
                    </div>
                  )}
                </div>
              )}

              {!perDay && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle} htmlFor="clubApproveSpaces">
                  Spaces to allocate
                </label>
                <input
                  id="clubApproveSpaces"
                  ref={spacesRef}
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={1}
                  max={remaining ?? undefined}
                  style={fieldStyle}
                  value={spaces}
                  disabled={submitting}
                  onChange={(e) => setSpacesDraft(e.target.value)}
                />
                {touched && spacesError ? (
                  <div className="field-error">{spacesError}</div>
                ) : (
                  <div style={hintStyle}>
                    How many member tickets the club can book. You can add
                    more later from the club&apos;s details.
                  </div>
                )}
              </div>
              )}
            </form>
          )}
        </div>

        <div className="detail-footer" style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Not yet
          </button>
          <button
            type="button"
            className="btn btn-approve"
            onClick={() => void submit()}
            disabled={!terms.data || submitting}
          >
            <CheckIcon /> Approve club
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
