"use client";

import { useEffect, useRef, useState } from "react";
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
  const [showErrors, setShowErrors] = useState(false);
  const spacesRef = useRef<HTMLInputElement>(null);

  const price =
    priceDraft ?? (terms.data ? terms.data.default_price.toFixed(2) : "");
  const spaces =
    spacesDraft ??
    (terms.data ? String(Math.max(1, terms.data.requested || 1)) : "");
  const touched = showErrors || priceDraft !== null || spacesDraft !== null;

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

  const parsedPrice = requireTicket ? parseFloat(price) : 0;
  const parsedSpaces = parseInt(spaces, 10);

  const priceError = !requireTicket
    ? null
    : price.trim() === "" || !Number.isFinite(parsedPrice) || parsedPrice < 0
      ? "Enter a ticket price, or 0 for free."
      : isBelowMinimumAmount(parsedPrice) && region
        ? minimumPriceMessage(region, "Club tickets")
        : null;

  const spacesError =
    spaces.trim() === "" || !Number.isFinite(parsedSpaces) || parsedSpaces < 1
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
    const res = await runAction({
      loadingLabel: "Approving club...",
      successTitle: "Club confirmed",
      successMessage: `${club.name} has ${parsedSpaces} ${parsedSpaces === 1 ? "space" : "spaces"}${
        requireTicket && region
          ? ` at ${formatRegionCurrency(parsedPrice, region)} each`
          : ""
      }. They've been emailed a unique link to share with their members.`,
      errorTitle: "Couldn't approve the club",
      run: async () => {
        await approve.mutateAsync({
          applicationId,
          price: requireTicket ? Math.round(parsedPrice * 100) / 100 : 0,
          spaces: parsedSpaces,
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

              {requireTicket && region && (
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
