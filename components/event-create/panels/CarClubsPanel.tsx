"use client";

import { useEventSteps, useEventRegion } from "@/lib/useEventSteps";
import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";

import { pushStepUrl } from "@/lib/stepNav";

import { useEventCreate } from "@/context/EventCreateContext";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { slugify } from "@/lib/slugify";

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
 *   4. Require ticket after acceptance toggle + cost input.
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

  const renderDateField = (target: DateTarget, value: string | null) => (
    <button
      type="button"
      className={`date-field mb-2 ${value ? "" : "is-empty"}`}
      onClick={() => setPickerTarget(target)}
    >
      <i className="fa-regular fa-calendar df-icon" aria-hidden />
      <span className="df-display">
        {value ? formatEditorDate(value, region) : "Select date"}
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
              <div>
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
              <div>
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
                  Club vehicle ticket cost ({region.currencySymbol})
                </label>
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
              </div>
            )}
          </div>

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
