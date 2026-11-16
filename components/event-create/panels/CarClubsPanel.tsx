"use client";

import { useEventSteps, useEventRegion } from "@/lib/useEventSteps";
import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";

import { pushStepUrl } from "@/lib/stepNav";
import {
  attendanceOptionsForDays,
  editorEventDays,
} from "@/lib/attendanceOptions";

import { useEventCreate } from "@/context/EventCreateContext";
import { formatEditorShortDate } from "@/lib/formatEditorDate";
import { slugify } from "@/lib/slugify";
import { isBelowMinimumAmount, minimumPriceMessage } from "@/lib/ticketPrice";

import { ApplicationLinksCard } from "../ApplicationLinksCard";
import { EditorTextarea } from "../EditorTextarea";
import { FullScreenDatePicker } from "../FullScreenDatePicker";
import { PanelHeader } from "../PanelHeader";
import { PerDatePanel } from "../PerDateNotice";

/**
 * Step 8 - Car Clubs.
 *
 * Differs from Show Cars in two ways:
 *   - Single application window for the whole panel (no per-category
 *     windows - clubs aren't categorised in the mockup).
 *   - No category list at all. Just a few config blocks.
 *
 * Sections:
 *   1. Master enable toggle.
 *   2. Application window - open/close dates + times.
 *   3. Limit total club vehicles toggle + max input.
 *   4. Require ticket after acceptance toggle + default price input
 *      (per-club price + allocation are set at approval time).
 *   5. Info textarea.
 *   6. Application links.
 */
type DateTarget = "open" | "close";

export function CarClubsPanel() {
  const { state, dispatch } = useEventCreate();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { stepCount, adjacent, stepNumber } = useEventSteps();

  const { prev, next } = adjacent("car-clubs");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    pushStepUrl(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- Datepicker ----
  const [pickerTarget, setPickerTarget] = useState<DateTarget | null>(null);

  const region = useEventRegion();
  // Attendance options (multi-day events): a default member price per
  // day / all days, which the approve dialog pre-fills for each club.
  // Clubs are priced per day: a club picks the days it attends and the
  // organiser sets spaces + price for each. "All days" is the discounted
  // every-day ticket a club attending two or more days can offer.
  const attendanceDefs = attendanceOptionsForDays(
    editorEventDays(state),
    region,
  ).map((d) =>
    d.key === "all" ? { ...d, label: "All days (every day, discounted)" } : d,
  );
  const attendancePrices = state.carClubsAttendancePrices ?? {};
  const setAttendancePrice = (key: string, raw: string) => {
    const parsed = parseFloat(raw);
    const next = { ...attendancePrices };
    if (Number.isFinite(parsed)) next[key] = Math.max(0, parsed);
    else delete next[key];
    dispatch({ type: "SET_FIELD", key: "carClubsAttendancePrices", value: next });
  };
  // Which day options clubs are offered: a tick per day plus one for the
  // all-days ticket. Unset (null) means everything is offered.
  const eventDayKeys = attendanceDefs
    .filter((d) => d.key !== "all")
    .map((d) => d.days[0]);
  const offer = state.carClubsAttendanceOffer ?? {
    days: eventDayKeys,
    all: true,
  };
  const dayOffered = (iso: string) => offer.days.includes(iso);
  const setOffer = (next: { days: string[]; all: boolean }) =>
    dispatch({ type: "SET_FIELD", key: "carClubsAttendanceOffer", value: next });
  const toggleOfferDay = (iso: string, checked: boolean) => {
    const days = checked
      ? Array.from(new Set([...offer.days, iso])).sort()
      : offer.days.filter((d) => d !== iso);
    // At least one day stays on - with none, clubs could not apply.
    if (days.length === 0) return;
    setOffer({ days, all: offer.all });
  };
  const offeredDayCount = offer.days.length;

  const renderDateField = (target: DateTarget, value: string | null) => (
    <button
      type="button"
      // flex-1: the open/close fields sit side by side, so each fills
      // its cell and the pair always ends up the same height.
      className={`date-field flex-1 mb-2 ${value ? "" : "is-empty"}`}
      onClick={() => setPickerTarget(target)}
    >
      <i className="fa-regular fa-calendar df-icon" aria-hidden />
      <span className="df-display">
        {value ? formatEditorShortDate(value, region) : "Select date"}
      </span>
      <i className="fa-solid fa-chevron-down df-chev" aria-hidden />
    </button>
  );

  // One application window, one vehicle limit, one ticket cost - all of
  // it describes a single meet. A recurring event sets these up on each
  // date instead, so the series shows the notice in place of the form.
  if (state.dateType === "recurring") {
    return (
      <PerDatePanel
        step="car-clubs"
        title="Car clubs"
        subtitle="Invite clubs to apply for a dedicated stand or group booking at your event."
        feature="carClubs"
      />
    );
  }

  return (
    <section className="panel is-active" data-panel="car-clubs" role="tabpanel">
      <PanelHeader
        stepNumber={stepNumber("car-clubs")}
        totalSteps={stepCount}
        title="Car clubs"
        subtitle="Invite clubs to apply for a dedicated stand or group booking at your event."
      />

      {/* Master enable toggle */}
      <label className="flex items-center justify-between gap-3 p-5 bg-white border border-ink-200 rounded-xl cursor-pointer mb-6">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            Enable car club applications
          </p>
          <p className="text-xs text-ink-500 mt-0.5">
            Accept applications from clubs wanting a group presence
          </p>
        </div>
        <span className="switch">
          <input
            type="checkbox"
            checked={state.carClubsEnabled}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                key: "carClubsEnabled",
                value: e.target.checked,
              })
            }
          />
          <span className="slider" />
        </span>
      </label>

      {state.carClubsEnabled && (
        <>
          {/* Application window */}
          <div className="bg-white border border-ink-200 rounded-xl p-5 sm:p-6 mb-4">
            <label className="block text-sm font-semibold text-ink-900 mb-3">
              Application window
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  Applications open
                </label>
                {renderDateField("open", state.carClubsApplicationsOpen)}
                <input
                  type="time"
                  className="input"
                  value={state.carClubsApplicationsOpenTime}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "carClubsApplicationsOpenTime",
                      value: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  Applications close
                </label>
                {renderDateField("close", state.carClubsApplicationsClose)}
                <input
                  type="time"
                  className="input"
                  value={state.carClubsApplicationsCloseTime}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "carClubsApplicationsCloseTime",
                      value: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Limit */}
          <div className="bg-white border border-ink-200 rounded-xl p-5 mb-4 hidden">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Limit total club vehicles
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  Cap the number of cars across all accepted clubs
                </p>
              </div>
              <span className="switch">
                <input
                  type="checkbox"
                  checked={state.carClubsLimitEnabled}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "carClubsLimitEnabled",
                      value: e.target.checked,
                    })
                  }
                />
                <span className="slider" />
              </span>
            </label>
            {state.carClubsLimitEnabled && (
              <div className="mt-4 pt-4 border-t border-ink-200">
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  Maximum club vehicles
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  className="input"
                  placeholder="e.g. 100"
                  value={
                    Number.isFinite(state.carClubsMax)
                      ? String(state.carClubsMax)
                      : ""
                  }
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    dispatch({
                      type: "SET_FIELD",
                      key: "carClubsMax",
                      value: Number.isFinite(parsed) ? Math.max(1, parsed) : NaN,
                    });
                  }}
                />
              </div>
            )}
          </div>

          {/* Ticket required */}
          <div className="bg-white border border-ink-200 rounded-xl p-5 mb-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Require ticket purchase after acceptance
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  Accepted club vehicles will need to buy a ticket to secure
                  their spot
                </p>
              </div>
              <span className="switch">
                <input
                  type="checkbox"
                  checked={state.carClubsRequireTicket}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "carClubsRequireTicket",
                      value: e.target.checked,
                    })
                  }
                />
                <span className="slider" />
              </span>
            </label>
            {state.carClubsRequireTicket && (
              <div className="mt-4 pt-4 border-t border-ink-200">
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  Default club ticket price ({region.currencySymbol})
                </label>
                <p className="text-xs text-ink-500 mb-3">
                  You can set a different price, and how many spaces to
                  give them, for each club when you approve its
                  application.
                </p>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  className="input"
                  placeholder="0.00"
                  value={
                    Number.isFinite(state.carClubsTicketCost)
                      ? String(state.carClubsTicketCost)
                      : ""
                  }
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    dispatch({
                      type: "SET_FIELD",
                      key: "carClubsTicketCost",
                      value: Number.isFinite(parsed) ? Math.max(0, parsed) : NaN,
                    });
                  }}
                />
                {/* Free or at least 1.00 - see lib/ticketPrice. The
                    save skips a cost in between (mapCarClubs), so say
                    here that it hasn't been kept. */}
                {isBelowMinimumAmount(state.carClubsTicketCost) && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {minimumPriceMessage(region)} This cost won&apos;t be
                    saved until it&apos;s changed.
                  </p>
                )}

              </div>
            )}
          </div>

          {/* Days offered to clubs (multi-day events): tick per day and
              for the all-days ticket; default price per option when
              tickets are charged. */}
          {attendanceDefs.length > 0 && (
            <div className="bg-white border border-ink-200 rounded-xl p-5 mb-4">
              <p className="text-sm font-semibold text-ink-900">
                Days clubs can apply for
              </p>
              <p className="text-xs text-ink-500 mt-0.5 mb-4">
                This event runs over {attendanceDefs.length - 1} days. Tick
                the days clubs may apply for; they pick from these on the
                form and members book a ticket per day.
                {state.carClubsRequireTicket
                  ? " Set a default member price for each - blank uses the default club ticket price. You can change prices for each club when you approve it."
                  : ""}
              </p>
              <div className="space-y-2">
                {attendanceDefs.map((def) => {
                  const isAll = def.key === "all";
                  const iso = def.days[0];
                  const on = isAll ? offer.all : dayOffered(iso);
                  const lastDay = !isAll && on && offeredDayCount === 1;
                  const value = attendancePrices[def.key];
                  const shown = Number.isFinite(value) ? String(value) : "";
                  const bad = Number.isFinite(value) && isBelowMinimumAmount(value);
                  return (
                    <div
                      key={def.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        on ? "border-ink-200 bg-white" : "border-ink-100 bg-ink-50"
                      }${isAll ? " mt-3" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-gold-500 shrink-0"
                        checked={on}
                        disabled={lastDay}
                        title={lastDay ? "Clubs need at least one day to apply for" : undefined}
                        aria-label={`Offer ${def.label}`}
                        onChange={(e) =>
                          isAll
                            ? setOffer({ days: offer.days, all: e.target.checked })
                            : toggleOfferDay(iso, e.target.checked)
                        }
                      />
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block text-sm ${
                            on ? "text-ink-900 font-medium" : "text-ink-500"
                          }`}
                        >
                          {isAll ? "All days" : def.label}
                        </span>
                        {isAll && (
                          <span className="block text-xs text-ink-500">
                            One discounted ticket for every day, for clubs attending
                            two or more days
                          </span>
                        )}
                      </span>
                      {state.carClubsRequireTicket && (
                        <div className="w-32 shrink-0 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
                            {region.currencySymbol}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            className={`input ${bad ? "border-red-400" : ""}`}
                            style={{ paddingLeft: 28 }}
                            placeholder={
                              Number.isFinite(state.carClubsTicketCost)
                                ? state.carClubsTicketCost.toFixed(2)
                                : "0.00"
                            }
                            value={shown}
                            disabled={!on}
                            aria-label={`${def.label} default price`}
                            onChange={(e) => setAttendancePrice(def.key, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {state.carClubsRequireTicket &&
                Object.values(attendancePrices).some((v) => isBelowMinimumAmount(v)) && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {minimumPriceMessage(region)} A price in between won&apos;t
                    be saved.
                  </p>
                )}
            </div>
          )}

          {/* Info textarea */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink-900 mb-2">
              Car club information
            </label>
            <p className="text-xs text-ink-500 mb-3">
              Stand sizes, perks, arrival times, group discount codes -
              anything club organisers need.
            </p>
            <EditorTextarea
              value={state.carClubsInfo}
              onChange={(value) =>
                dispatch({ type: "SET_FIELD", key: "carClubsInfo", value })
              }
              placeholder="e.g. Clubs can book a dedicated stand for groups of 10+. Arrival from 7:30am for club stands. Minimum of 6 cars required."
            />
          </div>

          {/* Application links */}
          <ApplicationLinksCard
            applicationKind="car-club"
            site={state.site}
            slug={state.encryptedId ? state.encryptedId : ""}
            iframeTitle="Car club applications"
          />
        </>
      )}

      <div className="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button
          type="button"
          onClick={() => prev && goTo(prev)}
          className="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back
        </button>
        <button
          type="button"
          onClick={() => next && goTo(next)}
          className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      </div>

      <FullScreenDatePicker
        open={pickerTarget !== null}
        title={
          pickerTarget === "open" ? "Applications open" : "Applications close"
        }
        value={
          pickerTarget === "open"
            ? state.carClubsApplicationsOpen
            : pickerTarget === "close"
              ? state.carClubsApplicationsClose
              : null
        }
        onClose={() => setPickerTarget(null)}
        onChange={(next) => {
          if (pickerTarget === "open") {
            dispatch({
              type: "SET_FIELD",
              key: "carClubsApplicationsOpen",
              value: next,
            });
            // Pre-fill an empty close date with the open date; a value
            // the user already picked is never overwritten.
            if (next && !state.carClubsApplicationsClose) {
              dispatch({
                type: "SET_FIELD",
                key: "carClubsApplicationsClose",
                value: next,
              });
            }
          } else if (pickerTarget === "close") {
            dispatch({
              type: "SET_FIELD",
              key: "carClubsApplicationsClose",
              value: next,
            });
          }
        }}
      />
    </section>
  );
}
