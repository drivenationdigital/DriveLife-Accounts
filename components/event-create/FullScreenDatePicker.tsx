"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { formatEditorDate } from "@/lib/formatEditorDate";
import { useEventRegion } from "@/lib/useEventSteps";

/**
 * Fullscreen datepicker overlay.
 *
 * UX:
 *   - Mobile: full-screen sheet covering the viewport.
 *   - Desktop (>= sm): centered modal with rounded corners, max width ~480px.
 *   - The CSS for both lives in editor.css under `.fsdp-*`.
 *
 * Selection model:
 *   - `value` is the current committed value from the parent.
 *   - Tapping a date commits it straight away (`onChange`) and closes
 *     the picker, so there's no extra Apply step. "Today" and "Clear"
 *     behave the same way; "Cancel", the X, ESC and the backdrop close
 *     without changing anything.
 *
 * Calendar logic:
 *   - Week starts Monday (UK convention used throughout the app).
 *   - The grid is always 6 rows × 7 cols = 42 cells, with leading days
 *     from the previous month and trailing days from the next month
 *     muted out so the grid stays a stable shape (no jumping rows
 *     between months).
 *
 * Accessibility:
 *   - `role="dialog"`, `aria-modal`, focusable, ESC closes, body scroll
 *     locked while open (via the `body.fsdp-open` class added in
 *     editor.css).
 *
 * Portal:
 *   - Rendered via `createPortal` into `document.body` so the overlay
 *     escapes any transformed/positioned ancestor (e.g. the editor's
 *     sticky topbar / sidebar). Without the portal, fixed positioning
 *     can be confined by parent transforms.
 */
export function FullScreenDatePicker({
  value,
  open,
  onChange,
  onClose,
  title = "Select date",
}: {
  /** Current committed date in `yyyy-mm-dd` format, or null. */
  value: string | null;
  /** Controlled visibility. */
  open: boolean;
  /** Called with the picked date on Apply. */
  onChange: (next: string | null) => void;
  /** Called on Cancel / X / ESC / backdrop click. */
  onClose: () => void;
  /** Header title - small distinguishing copy when multiple pickers
   *  are wired (e.g. "Start date" vs "End date"). */
  title?: string;
}) {
  // Locale for the month header and the per-day accessible labels.
  const region = useEventRegion();
  // ---- Draft selection (internal). Resets to `value` whenever the
  // picker opens so reopening always starts from the committed state. ----
  const [draft, setDraft] = useState<string | null>(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // ---- Visible month. Driven by draft if it's set, otherwise the
  // committed value, otherwise today. Stored as {year, month0} where
  // month0 is 0-indexed. We don't use a Date because Date+getMonth
  // jumps around with timezones; an explicit pair is safer. ----
  const initialMonth = useMemo(
    () => deriveInitialMonth(draft ?? value),
    // We deliberately re-derive when `open` flips so a closed→open
    // transition recenters the calendar on the active value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );
  const [view, setView] = useState(initialMonth);
  useEffect(() => {
    if (open) setView(deriveInitialMonth(value));
  }, [open, value]);

  // ---- ESC closes. Body scroll lock via class on <body>. ----
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.classList.add("fsdp-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("fsdp-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // SSR / pre-mount: nothing to render.
  if (!open || typeof document === "undefined") return null;

  const todayIso = isoToday();
  const cells = buildMonthGrid(view.year, view.month0, region.locale);
  const monthLabel = new Date(Date.UTC(view.year, view.month0, 1))
    .toLocaleDateString(region.locale, { month: "long", year: "numeric", timeZone: "UTC" });

  const goPrev = () => setView(addMonths(view, -1));
  const goNext = () => setView(addMonths(view, 1));

  // Picking commits immediately and dismisses - no separate Apply step.
  const commit = (next: string | null) => {
    setDraft(next);
    onChange(next);
    onClose();
  };

  const setToday = () => commit(todayIso);
  const clear = () => commit(null);

  // The overlay backdrop closes on backdrop click but not on inner
  // clicks. We stop propagation on the panel so taps inside don't
  // bubble back up.
  return createPortal(
    <div
      className="fsdp-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fsdp-title"
      onClick={onClose}
    >
      <div className="fsdp-panel" onClick={(e) => e.stopPropagation()}>
        <header className="fsdp-header">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold">
              Calendar
            </p>
            <h3 id="fsdp-title" className="font-display text-xl text-ink-900">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-ink-700" aria-hidden />
          </button>
        </header>

        <div className="fsdp-body">
          {/* Month nav */}
          <div className="fsdp-nav">
            <button
              type="button"
              className="fsdp-nav-btn"
              onClick={goPrev}
              aria-label="Previous month"
            >
              <i className="fa-solid fa-chevron-left text-sm" aria-hidden />
            </button>
            <div className="text-center">
              <p className="fsdp-month-label">{monthLabel}</p>
            </div>
            <button
              type="button"
              className="fsdp-nav-btn"
              onClick={goNext}
              aria-label="Next month"
            >
              <i className="fa-solid fa-chevron-right text-sm" aria-hidden />
            </button>
          </div>

          {/* Weekday headers - Mon-first */}
          <div className="fsdp-weekdays">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="fsdp-weekday">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="fsdp-days">
            {cells.map((cell) => {
              const classes = [
                "fsdp-day",
                cell.muted && "is-muted",
                cell.iso === todayIso && "is-today",
                cell.iso === draft && "is-selected",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={classes}
                  onClick={() => commit(cell.iso)}
                  aria-label={cell.label}
                  aria-pressed={cell.iso === draft}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Selected preview - small text for confirmation. */}
          <p className="text-xs text-ink-500 mt-4 text-center">
            {draft ? formatEditorDate(draft, region) : "No date selected"}
          </p>
        </div>

        <footer className="fsdp-footer">
          <button type="button" className="fsdp-quickbtn" onClick={setToday}>
            Today
          </button>
          <button type="button" className="fsdp-quickbtn" onClick={clear}>
            Clear
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

// ============================================================
// Calendar maths - pure helpers, no React, easy to unit-test if
// we ever pull them out.
// ============================================================

type MonthView = { year: number; month0: number };
type Cell = {
  iso: string;
  year: number;
  month0: number;
  day: number;
  muted: boolean;
  label: string;
};

/** Today as `yyyy-mm-dd` in UTC - avoids timezone drift across the app. */
function isoToday(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convert ISO yyyy-mm-dd to a MonthView. Falls back to today if the
 *  input is null or malformed. */
function deriveInitialMonth(iso: string | null | undefined): MonthView {
  if (iso) {
    const parts = iso.split("-");
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (y && m) return { year: y, month0: m - 1 };
    }
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month0: now.getUTCMonth() };
}

/** Add ±N months to a MonthView, wrapping years correctly. */
function addMonths({ year, month0 }: MonthView, delta: number): MonthView {
  const total = year * 12 + month0 + delta;
  return { year: Math.floor(total / 12), month0: total % 12 };
}

/** Build a 6×7 = 42-cell grid for the given month, with leading/
 *  trailing days from adjacent months marked muted. Mon-first. */
function buildMonthGrid(year: number, month0: number, locale: string): Cell[] {
  const firstOfMonth = new Date(Date.UTC(year, month0, 1));
  // getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat. We want Mon=0..Sun=6.
  const dowMonFirst = (firstOfMonth.getUTCDay() + 6) % 7;
  // Number of days in this month - day 0 of next month is the last day of this month.
  const lastDayOfMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  // Number of days in the previous month, for leading filler.
  const lastDayOfPrev = new Date(Date.UTC(year, month0, 0)).getUTCDate();

  const cells: Cell[] = [];

  // Leading muted days from previous month.
  for (let i = dowMonFirst - 1; i >= 0; i--) {
    const day = lastDayOfPrev - i;
    const prev = addMonths({ year, month0 }, -1);
    cells.push(makeCell(prev.year, prev.month0, day, true, locale));
  }

  // Days of this month.
  for (let day = 1; day <= lastDayOfMonth; day++) {
    cells.push(makeCell(year, month0, day, false, locale));
  }

  // Trailing muted days from next month - fill to 42 cells.
  let trailingDay = 1;
  while (cells.length < 42) {
    const next = addMonths({ year, month0 }, 1);
    cells.push(makeCell(next.year, next.month0, trailingDay, true, locale));
    trailingDay++;
  }

  return cells;
}

function makeCell(
  year: number,
  month0: number,
  day: number,
  muted: boolean,
  locale: string,
): Cell {
  const m = String(month0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const iso = `${year}-${m}-${d}`;
  return {
    iso,
    year,
    month0,
    day,
    muted,
    label: new Date(Date.UTC(year, month0, day)).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
      timeZone: "UTC",
    }),
  };
}
