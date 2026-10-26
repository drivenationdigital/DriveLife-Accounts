"use client";

import { resolveRegion } from "@/lib/regions";

import { useEffect, useMemo, useState } from "react";

type AddSeriesDatesProps = {
  /** The series parent's eid (an occurrence's also works). */
  eid: string;
  site: SiteKey;
  patternType: "week" | "month" | "custom" | null;
  /** Pre-formatted pattern, e.g. "Third Saturday Of Every Month". */
  patternLabel: string;
  /** Latest live occurrence date, "YYYY-MM-DD", or null. */
  lastDate: string | null;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  seriesIsLive: boolean;
  onClose: () => void;
};
import { XIcon, CalendarIcon } from "@/components/ui/Icons";
import { useAddSeriesDates } from "@/lib/eventActions";
import { useAction } from "@/context/ActionContext";
import type { SiteKey } from "@/lib/apiTypes";

/**
 * "Add dates" for a recurring series.
 *
 * Until 2026-10-13 a series could only be created, never extended: the
 * editor's "Recurring" switch on an occurrence was refused by the API
 * ("already part of a recurring series"), so an organiser whose series
 * had run out of dates was stuck. This posts to /event-series-add-dates,
 * which clones the latest occurrence for each new date.
 *
 * Two ways in:
 *   - Continue the pattern: the series' own weekly / monthly rule carries
 *     on from its last date up to the chosen day. Only offered when the
 *     series has such a rule.
 *   - Pick dates: any list of days, for hand-picked series or one-offs.
 *
 * Times default to the latest occurrence's; the new dates go live when
 * the series is live, or stay drafts when it isn't.
 */
export function AddSeriesDatesModal({
  open,
  ...props
}: AddSeriesDatesProps & { open: boolean }) {
  // Mounted only while open, so every opening starts from fresh
  // defaults without an effect having to reset the form.
  if (!open) return null;
  return <AddSeriesDatesDialog {...props} />;
}

function AddSeriesDatesDialog({
  onClose,
  eid,
  site,
  patternType,
  patternLabel,
  lastDate,
  defaultStartTime,
  defaultEndTime,
  seriesIsLive,
}: AddSeriesDatesProps) {
  // Dates in the event's own region (was hardcoded en-GB).
  const locale = resolveRegion(site).locale;
  const hasPattern = patternType === "week" || patternType === "month";
  const runAction = useAction();
  const addDates = useAddSeriesDates();

  const [mode, setMode] = useState<"pattern" | "custom">(
    hasPattern ? "pattern" : "custom",
  );
  const [until, setUntil] = useState<string>(
    () => addMonths(lastDate, 12) ?? "",
  );
  const [draftDate, setDraftDate] = useState<string>("");
  const [dates, setDates] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>(defaultStartTime ?? "");
  const [endTime, setEndTime] = useState<string>(defaultEndTime ?? "");
  const [status, setStatus] = useState<"publish" | "draft">(
    seriesIsLive ? "publish" : "draft",
  );
  const [error, setError] = useState<string | null>(null);

  // The earliest day a new date can fall on: the day after the last one.
  const minDate = useMemo(() => addDays(lastDate, 1), [lastDate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const addDraftDate = () => {
    if (!draftDate) return;
    // A date earlier than the series' last one is fine (a missed month);
    // a day the series already has is skipped by the API.
    setDates((prev) => (prev.includes(draftDate) ? prev : [...prev, draftDate].sort()));
    setDraftDate("");
  };

  const removeDate = (d: string) => setDates((prev) => prev.filter((x) => x !== d));

  const submit = async () => {
    setError(null);
    if (mode === "pattern" && !until) {
      setError("Choose the date to continue the series until.");
      return;
    }
    if (mode === "custom" && dates.length === 0) {
      setError("Add at least one date.");
      return;
    }

    const res = await runAction({
      loadingLabel: "Adding dates...",
      successTitle: "Dates added",
      errorTitle: "Couldn't add the dates",
      run: () =>
        addDates.mutateAsync({
          eid,
          site,
          mode,
          until: mode === "pattern" ? until : undefined,
          dates: mode === "custom" ? dates : undefined,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          status,
        }),
    });
    if (res) onClose();
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="addSeriesDatesTitle"
      >
        <div className="modal-header">
          <h3 className="modal-title" id="addSeriesDatesTitle">
            Add dates to this series
          </h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="modal-body">
          <p className="sad-intro">
            Each new date becomes its own event, copied from the latest one
            in the series
            {lastDate ? ` (${formatDay(lastDate, locale)})` : ""} - same details,
            images and settings.
          </p>

          {hasPattern && (
            <div className="sad-modes" role="group" aria-label="How to add dates">
              <button
                type="button"
                className={`sad-mode${mode === "pattern" ? " is-active" : ""}`}
                onClick={() => setMode("pattern")}
              >
                Continue the pattern
                <small>{patternLabel || "Repeat the series' schedule"}</small>
              </button>
              <button
                type="button"
                className={`sad-mode${mode === "custom" ? " is-active" : ""}`}
                onClick={() => setMode("custom")}
              >
                Pick dates
                <small>Choose each date yourself</small>
              </button>
            </div>
          )}

          {mode === "pattern" ? (
            <div className="sad-field">
              <label className="sad-label" htmlFor="sadUntil">
                Continue until
              </label>
              <input
                id="sadUntil"
                type="date"
                className="sad-input"
                value={until}
                min={minDate ?? undefined}
                onChange={(e) => setUntil(e.target.value)}
              />
              <div className="sad-hint">
                {lastDate
                  ? `The series currently runs until ${formatDay(lastDate, locale)}. New dates follow the pattern from there.`
                  : "New dates follow the series' pattern from today."}
              </div>
            </div>
          ) : (
            <div className="sad-field">
              <label className="sad-label" htmlFor="sadDate">
                Dates to add
              </label>
              <div className="sad-add-row">
                <input
                  id="sadDate"
                  type="date"
                  className="sad-input"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDraftDate();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addDraftDate}
                  disabled={!draftDate}
                >
                  Add
                </button>
              </div>
              {dates.length > 0 ? (
                <ul className="sad-dates">
                  {dates.map((d) => (
                    <li key={d} className="sad-date">
                      <CalendarIcon />
                      {formatDay(d, locale)}
                      <button
                        type="button"
                        onClick={() => removeDate(d)}
                        aria-label={`Remove ${formatDay(d, locale)}`}
                      >
                        <XIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="sad-hint">
                  Pick a date and press Add. Days the series already has are
                  skipped.
                </div>
              )}
            </div>
          )}

          <div className="sad-row">
            <div className="sad-field">
              <label className="sad-label" htmlFor="sadStart">
                Start time
              </label>
              <input
                id="sadStart"
                type="time"
                className="sad-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="sad-field">
              <label className="sad-label" htmlFor="sadEnd">
                End time
              </label>
              <input
                id="sadEnd"
                type="time"
                className="sad-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="sad-field">
            <span className="sad-label">Visibility</span>
            <label className="sad-radio">
              <input
                type="radio"
                name="sadStatus"
                checked={status === "publish"}
                onChange={() => setStatus("publish")}
              />
              Publish the new dates straight away
            </label>
            <label className="sad-radio">
              <input
                type="radio"
                name="sadStatus"
                checked={status === "draft"}
                onChange={() => setStatus("draft")}
              />
              Save them as drafts to review first
            </label>
          </div>

          {error && <div className="sad-error">{error}</div>}
        </div>

        <div className="sad-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={addDates.isPending}
          >
            <CalendarIcon /> {addDates.isPending ? "Adding…" : "Add dates"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- date helpers (local, calendar-day arithmetic) ------------------

function parseIso(iso: string | null): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string | null, n: number): string | null {
  const d = parseIso(iso);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return toIso(d);
}

function addMonths(iso: string | null, n: number): string | null {
  const d = parseIso(iso) ?? new Date();
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toIso(d);
}

function formatDay(iso: string, locale: string): string {
  const d = parseIso(iso);
  if (!d) return iso;
  return d.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
