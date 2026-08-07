"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useEventCreate } from "@/context/EventCreateContext";
import { eventDetailPath } from "@/lib/siteRoutes";
import {
  EVENT_CREATE_STEP_COUNT,
  adjacentSteps,
} from "@/lib/eventCreateSteps";
import { useEditorSave } from "@/lib/useEditorSave";
import { ApiError } from "@/lib/apiClient";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { slugify } from "@/lib/slugify";

import { PanelHeader } from "../PanelHeader";
import { FullScreenDatePicker } from "../FullScreenDatePicker";

/**
 * Step 10 of the wizard - the final review + publish action.
 *
 * Sections:
 *   1. Event status - radio grid (draft / publish now / scheduled).
 *      Picking "scheduled" reveals a date+time row below using the
 *      shared FullScreenDatePicker.
 *
 *   2. Visibility - public / private toggle. Affects whether the
 *      event is listed in directory pages or only accessible via
 *      direct link.
 *
 *   3. Summary card - recaps the values the user has entered. The
 *      values are read live from state so they update as you tab
 *      back to other steps and edit. The bullet count for "Categories"
 *      and the price summary for "Tickets" are derived.
 *
 *   4. Big "Publish event" button - the actual mutation will hook
 *      here when the WP create-event route is wired. For now the
 *      button is decorative.
 *
 * No "Continue" button on the desktop nav since this is the last
 * step - Back only.
 */
export function PublishPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { prev } = adjacentSteps("publish");

  const [pickerOpen, setPickerOpen] = useState(false);

  // Shared save controller - same mutation the topbar/bottombar use, so
  // the topbar "Saved" pill reflects a save triggered from here too.
  const { run, isSaving, error } = useEditorSave();

  const onSave = async () => {
    if (isSaving) return;
    try {
      // Save with the status the user picked in this panel's radio.
      const res = await run();
      // Draft → stay so they can keep editing; live/scheduled → view.
      if (res.post_status !== "draft") {
        router.push(eventDetailPath(res.encrypted_id, state.site));
      }
    } catch {
      // Surfaced inline below via `error`.
    }
  };

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setStatus = (
    next: "draft" | "published" | "scheduled",
  ) => {
    dispatch({ type: "SET_FIELD", key: "status", value: next });
  };

  // ---- Summary derivations ----
  // We compute the small labels in the summary card up front so the
  // JSX stays readable. All purely view-side; no side effects.
  const summaryDate =
    state.startDate && state.startTime
      ? `${formatShort(state.startDate)}, ${state.startTime}`
      : state.startDate
        ? formatShort(state.startDate)
        : "Not set";

  // Count actual tickets (sections are dividers, not sellable rows).
  const ticketCount = state.ticketList.filter((i) => i.kind === "ticket").length;
  const summaryTickets =
    ticketCount > 0
      ? `${ticketCount} type${ticketCount === 1 ? "" : "s"}`
      : "No tickets yet";

  const summarySlug = slugify(state.title);
  const summaryUrl = `carevents.com/${summarySlugTrunc(summarySlug, 28)}`;

  const [copied, setCopied] = useState(false);
  const onCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`https://${summaryUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write blocked (e.g. iOS without HTTPS) - ignore.
    }
  };

  return (
    <section className="panel is-active" data-panel="publish" role="tabpanel">
      <PanelHeader
        stepNumber={10}
        totalSteps={EVENT_CREATE_STEP_COUNT}
        title="Ready to go live?"
        subtitle="Review the basics and push your event out to the world."
      />

      {/* ---- Status ---- */}
      <div className="bg-white border border-ink-200 rounded-xl p-5 mb-4">
        <label className="block text-sm font-semibold text-ink-900 mb-3">
          Event status
        </label>
        <div className="grid grid-cols-3 gap-2">
          <StatusOption
            checked={state.status === "draft"}
            onClick={() => setStatus("draft")}
            icon="fa-regular fa-file-lines"
            iconClass="text-ink-500"
            label="Draft"
          />
          <StatusOption
            checked={state.status === "published"}
            onClick={() => setStatus("published")}
            icon="fa-solid fa-rocket"
            iconClass="text-gold-600"
            label="Publish now"
          />
          <StatusOption
            checked={state.status === "scheduled"}
            onClick={() => setStatus("scheduled")}
            icon="fa-regular fa-clock"
            iconClass="text-ink-500"
            label="Schedule"
          />
        </div>

        {/* Schedule date+time fields - only when status is scheduled. */}
        {state.status === "scheduled" && (
          <div className="mt-4 pt-4 border-t border-ink-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  Go live on
                </label>
                <button
                  type="button"
                  className={`date-field ${state.scheduledDate ? "" : "is-empty"}`}
                  onClick={() => setPickerOpen(true)}
                >
                  <i
                    className="fa-regular fa-calendar df-icon"
                    aria-hidden
                  />
                  <span className="df-display">
                    {state.scheduledDate
                      ? formatEditorDate(state.scheduledDate)
                      : "Select date"}
                  </span>
                  <i
                    className="fa-solid fa-chevron-down df-chev"
                    aria-hidden
                  />
                </button>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  At
                </label>
                <input
                  type="time"
                  className="input"
                  value={state.scheduledTime}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "scheduledTime",
                      value: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- Visibility ---- */}
      <div className="bg-white border border-ink-200 rounded-xl p-5 mb-4">
        <label className="block text-sm font-semibold text-ink-900 mb-3">
          Visibility
        </label>
        <div className="grid grid-cols-2 gap-2">
          <VisibilityOption
            checked={state.visibility === "public"}
            onClick={() =>
              dispatch({ type: "SET_FIELD", key: "visibility", value: "public" })
            }
            icon="fa-solid fa-globe"
            iconClass="text-gold-600"
            title="Public"
            description="Listed everywhere"
          />
          <VisibilityOption
            checked={state.visibility === "private"}
            onClick={() =>
              dispatch({
                type: "SET_FIELD",
                key: "visibility",
                value: "private",
              })
            }
            icon="fa-solid fa-lock"
            iconClass="text-ink-500"
            title="Private"
            description="Link-only access"
          />
        </div>
      </div>

      {/* ---- Summary card ---- */}
      <div className="bg-ink-900 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
        {/* Soft glow blob in the corner - purely decorative. */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center">
              <i className="fa-solid fa-check text-white" aria-hidden />
            </div>
            <div>
              <p className="font-display text-lg">Your event is ready</p>
              <p className="text-xs text-ink-300">
                Review the details before publishing
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
            <SummaryItem label="Event" value={state.title} truncate />
            <SummaryItem label="Date" value={summaryDate} />
            <SummaryItem label="Tickets" value={summaryTickets} />
            <SummaryItem
              label="Categories"
              value={`${state.categoryIds.length} selected`}
            />
          </dl>
          <div className="p-3 bg-white/10 border border-white/10 rounded-lg flex items-center gap-2">
            <i
              className="fa-solid fa-link text-gold-400 text-xs"
              aria-hidden
            />
            <span className="text-xs font-mono text-ink-200 truncate min-w-0 flex-1">
              {summaryUrl}
            </span>
            <button
              type="button"
              onClick={onCopyUrl}
              className="text-xs text-gold-400 hover:text-gold-300 transition font-semibold shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Big publish button ---- */}
      <button
        type="button"
        disabled={isSaving}
        className="w-full py-4 text-base font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={onSave}
      >
        <i
          className={isSaving ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-rocket"}
          aria-hidden
        />
        {isSaving
          ? "Saving…"
          : state.status === "scheduled"
            ? "Schedule event"
            : state.status === "draft"
              ? "Save draft"
              : "Publish event"}
      </button>

      {/* Save error - only rendered on failure. */}
      {error && (
        <p className="mt-3 text-sm text-red-600 text-center">
          {error instanceof ApiError
            ? error.message
            : "Couldn’t save your event. Please try again."}
        </p>
      )}

      {/* ---- Desktop nav row - Back only on the last step. ---- */}
      <div className="hidden sm:flex items-center justify-start gap-3 pt-6 mt-6 border-t border-ink-200">
        <button
          type="button"
          onClick={() => prev && goTo(prev)}
          className="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back
        </button>
      </div>

      {/* Datepicker for schedule date. Same shared component as the
          Dates panel; we don't need to worry about state collisions
          since it's controlled by `pickerOpen` here. */}
      <FullScreenDatePicker
        open={pickerOpen}
        title="Go live date"
        value={state.scheduledDate}
        onClose={() => setPickerOpen(false)}
        onChange={(next) =>
          dispatch({ type: "SET_FIELD", key: "scheduledDate", value: next })
        }
      />
    </section>
  );
}

// ============================================================
// Subcomponents - local; no need to export.
// ============================================================

function StatusOption({
  checked,
  onClick,
  icon,
  iconClass,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  icon: string;
  iconClass: string;
  label: string;
}) {
  // Built as a button rather than the radio pattern from the mockup -
  // simpler accessibility tree, no need for the visually-hidden input
  // trick because we manage selected state explicitly. Adds
  // `aria-pressed` so screen readers know which option is active.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`text-center p-3 border-2 rounded-lg transition ${
        checked
          ? "border-gold-500 bg-gold-50"
          : "border-ink-200 hover:border-ink-300 bg-white"
      }`}
    >
      <i className={`${icon} ${iconClass} text-lg mb-1 block`} aria-hidden />
      <p className="text-sm font-semibold">{label}</p>
    </button>
  );
}

function VisibilityOption({
  checked,
  onClick,
  icon,
  iconClass,
  title,
  description,
}: {
  checked: boolean;
  onClick: () => void;
  icon: string;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition text-left ${
        checked
          ? "border-gold-500 bg-gold-50"
          : "border-ink-200 hover:border-ink-300 bg-white"
      }`}
    >
      <i className={`${icon} ${iconClass}`} aria-hidden />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-ink-500">{description}</p>
      </div>
    </button>
  );
}

function SummaryItem({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-400 mb-1">{label}</dt>
      <dd
        className={`font-medium ${truncate ? "truncate" : ""}`}
        title={truncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

/** "2026-04-19" → "19 Apr 2026" - short variant for tight summary copy. */
function formatShort(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [yStr, mStr, dStr] = parts as [string, string, string];
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Truncate a slug for the preview URL display so long titles don't
 *  blow out the dark card on narrow screens. */
function summarySlugTrunc(slug: string, max: number): string {
  if (!slug) return "your-event";
  return slug.length <= max ? slug : `${slug.slice(0, max - 1)}…`;
}
