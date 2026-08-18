"use client";

import { useEventSteps, useEventRegion } from "@/lib/useEventSteps";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  useEventCreate,
  MONTHLY_OCCURRENCES,
  WEEKDAYS_LOWER,
} from "@/context/EventCreateContext";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { enumerateDays } from "@/lib/dateRange";
import { makeLocalId } from "@/lib/makeLocalId";
import { timezoneOptionLabel, timezonesForRegion } from "@/lib/timezones";
import { useAutoTimezone } from "@/lib/useAutoTimezone";

import { PanelHeader } from "../PanelHeader";
import { FullScreenDatePicker } from "../FullScreenDatePicker";

/**
 * Identifies which date field is currently being edited by the
 * shared datepicker. Encodes the title text + the state key to write
 * back to. */
type DatepickerTarget =
  | { key: "startDate"; title: "Start date" }
  | { key: "endDate"; title: "End date" }
  | { key: "recurringFirstDate"; title: "First date" }
  | { key: "recurringUntilDate"; title: "Until" }
  | {
      // Per-row custom date - uses the row id (not a state key) to
      // identify which row to update on apply.
      key: "customDate";
      rowId: string;
      title: "Date";
    };

/**
 * Step 2 of the wizard.
 *
 * Two modes: single event vs recurring series. The toggle is a
 * segmented control; the corresponding sub-form below swaps in/out
 * (no animation - the parent panel's fade already covers entry).
 *
 * Date fields are rendered as `<button class="date-field">` and will
 * eventually open the fullscreen datepicker (separate component, not
 * built yet). For now they're inert visual elements showing the saved
 * date - clicking is a no-op until the datepicker lands. This matches
 * the mockup's behaviour where the buttons exist but the picker JS
 * isn't wired up.
 *
 * Time inputs use the native `<input type="time">` - the iOS-friendly
 * styling is already in editor.css (`.input` rules).
 *
 * Toggle switches use the native checkbox + visual `.slider` span
 * styling already defined in editor.css.
 */
export function DatesPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { region, stepCount, adjacent, stepNumber } = useEventSteps();

  // Mounted here as well as on Basics so the region-level correction
  // runs for someone who lands straight on this step - the hook's
  // address lookup only fires on an explicit place pick.
  useAutoTimezone();
  const timezoneOptions = useMemo(() => timezonesForRegion(region), [region]);

  const { prev, next } = adjacent("dates");

  // ---- Datepicker state ----
  // A single shared picker handles all four date fields (start, end,
  // recurring first, recurring until). The active field is held in
  // local state - null means closed. When a field is clicked, we set
  // the target; the picker reads the corresponding state value via
  // `state[target.key]` and writes back via dispatch on apply.
  const [pickerTarget, setPickerTarget] = useState<DatepickerTarget | null>(
    null,
  );
  const closePicker = () => setPickerTarget(null);
  const applyPicker = (next: string | null) => {
    if (!pickerTarget) return;
    if (pickerTarget.key === "customDate") {
      // Custom-date rows are stored in an array - find and update by id.
      const row = state.recurringCustomDates.find(
        (r) => r.id === pickerTarget.rowId,
      );
      if (!row) return;
      dispatch({
        type: "UPDATE_CUSTOM_DATE",
        row: { ...row, date: next },
      });
      return;
    }
    dispatch({
      type: "SET_FIELD",
      key: pickerTarget.key,
      value: next,
    });
  };

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isSingle = state.dateType === "single";
  const isRecurring = state.dateType === "recurring";

  // ---- Multi-day + per-day-times sync -------------------------------
  //
  // The "Unique times per day" toggle is only meaningful for events
  // that span more than one calendar day - for a single-day event
  // it would just render one row with the same start/end inputs the
  // user already has above. So we gate the toggle on multi-day.
  //
  // When the toggle is on, we keep `perDayTimes` in sync with the
  // current date range:
  //   - new days (range extended) → append a row using the current
  //     scalar startTime/endTime as defaults
  //   - removed days (range shrunk) → drop those rows
  //   - existing days kept → preserve their times so toggling off and
  //     on, or briefly extending the range, doesn't lose user input
  //
  // The sync runs in an effect rather than inline so we only dispatch
  // when something actually needs updating, avoiding render loops.
  const isMultiDay = useMemo(() => {
    if (!state.startDate || !state.endDate) return false;
    return state.startDate !== state.endDate;
  }, [state.startDate, state.endDate]);

  const expectedDays = useMemo(() => {
    if (!isSingle || !state.uniqueTimesPerDay) return null;
    return enumerateDays(state.startDate, state.endDate);
  }, [
    isSingle,
    state.uniqueTimesPerDay,
    state.startDate,
    state.endDate,
  ]);

  useEffect(() => {
    if (!expectedDays) return;
    // Build the next array, preserving any existing rows by date.
    const byDate = new Map(
      state.perDayTimes.map((row) => [row.date, row]),
    );
    const next = expectedDays.map(
      (date) =>
        byDate.get(date) ?? {
          date,
          startTime: state.startTime,
          endTime: state.endTime,
        },
    );
    // Only dispatch if something actually changed - array length, any
    // row's date, or any row's times. Stringify is fine here, both
    // shapes are tiny (≤366 days).
    const sameLength = next.length === state.perDayTimes.length;
    const sameContents =
      sameLength &&
      next.every((row, i) => {
        const prev = state.perDayTimes[i];
        return (
          prev !== undefined &&
          prev.date === row.date &&
          prev.startTime === row.startTime &&
          prev.endTime === row.endTime
        );
      });
    if (sameContents) return;
    dispatch({ type: "SET_PER_DAY_TIMES", items: next });
    // We deliberately depend on expectedDays only - startTime/endTime
    // are only consulted when filling NEW rows, not for re-syncing
    // existing ones. If we depended on them, every keystroke in the
    // global time inputs would re-flatten per-day customisations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedDays]);

  // ---- Mutually-exclusive toggle handlers --------------------------
  //
  // hideTimes hides the time UI entirely; uniqueTimesPerDay opens
  // per-day rows. Both at once doesn't make sense - turning one on
  // forces the other off so the UI never enters an ambiguous state.
  const onHideTimesChange = (value: boolean) => {
    dispatch({ type: "SET_FIELD", key: "hideTimes", value });
    if (value && state.uniqueTimesPerDay) {
      dispatch({
        type: "SET_FIELD",
        key: "uniqueTimesPerDay",
        value: false,
      });
    }
  };
  const onUniqueTimesChange = (value: boolean) => {
    dispatch({ type: "SET_FIELD", key: "uniqueTimesPerDay", value });
    if (value && state.hideTimes) {
      dispatch({ type: "SET_FIELD", key: "hideTimes", value: false });
    }
  };

  // Update one per-day row by date.
  const onPerDayChange = (
    date: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    dispatch({
      type: "SET_PER_DAY_TIMES",
      items: state.perDayTimes.map((row) =>
        row.date === date ? { ...row, [field]: value } : row,
      ),
    });
  };

  return (
    <section className="panel is-active" data-panel="dates" role="tabpanel">
      <PanelHeader
        stepNumber={stepNumber("dates")}
        totalSteps={stepCount}
        title="Dates & times"
        subtitle="When will your event take place? Single day, multi-day, or a recurring series."
      />

      {/* ---- Event type segmented control ---- */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-ink-900 mb-3">
          Event type
        </label>
        <div
          className="seg w-full sm:w-auto sm:inline-flex"
          role="group"
          aria-label="Event type"
        >
          <button
            type="button"
            className={`seg-btn min-w-[150px] ${isSingle ? "is-active" : ""}`}
            onClick={() =>
              dispatch({
                type: "SET_FIELD",
                key: "dateType",
                value: "single",
              })
            }
          >
            <i className="fa-regular fa-calendar mr-2" aria-hidden />
            Single Event
          </button>
          <button
            type="button"
            className={`seg-btn min-w-[150px] ${isRecurring ? "is-active" : ""}`}
            onClick={() =>
              dispatch({
                type: "SET_FIELD",
                key: "dateType",
                value: "recurring",
              })
            }
          >
            <i className="fa-solid fa-repeat mr-2" aria-hidden />
            Recurring
          </button>
        </div>
      </div>

      {/* ---- Single event sub-form ---- */}
      {isSingle && (
        <div>
          <div className="bg-white border border-ink-200 rounded-2xl p-5 sm:p-6 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <DateTimePair
                label="Starts"
                date={state.startDate}
                time={state.startTime}
                hideTime={state.hideTimes || state.uniqueTimesPerDay}
                onDateClick={() =>
                  setPickerTarget({ key: "startDate", title: "Start date" })
                }
                onTimeChange={(value) =>
                  dispatch({ type: "SET_FIELD", key: "startTime", value })
                }
              />
              <DateTimePair
                label="Ends"
                date={state.endDate}
                time={state.endTime}
                hideTime={state.hideTimes || state.uniqueTimesPerDay}
                onDateClick={() =>
                  setPickerTarget({ key: "endDate", title: "End date" })
                }
                onTimeChange={(value) =>
                  dispatch({ type: "SET_FIELD", key: "endTime", value })
                }
              />
            </div>

            <div className="mt-5 pt-5 border-t border-ink-200 space-y-3">
              {/* Hide times - visible unless per-day mode is on
                  (mutually exclusive). */}
              {!state.uniqueTimesPerDay && (
                <ToggleRow
                  title="Hide times on event page"
                  description="Only the date range will be shown"
                  checked={state.hideTimes}
                  onChange={onHideTimesChange}
                />
              )}
              {/* Unique times per day - visible only on multi-day
                  events AND when hideTimes is off (mutually exclusive).
                  For single-day events the toggle would be meaningless
                  so we hide it entirely. */}
              {isMultiDay && !state.hideTimes && (
                <ToggleRow
                  title="Unique times per day"
                  description="Set different start/end times for each day"
                  checked={state.uniqueTimesPerDay}
                  onChange={onUniqueTimesChange}
                />
              )}
            </div>

            {/* Per-day time rows. Only rendered when the mode is on AND
                the date range is multi-day AND we have rows to show. */}
            {state.uniqueTimesPerDay &&
              isMultiDay &&
              state.perDayTimes.length > 0 && (
                <div className="mt-5 pt-5 border-t border-ink-200 space-y-3">
                  {state.perDayTimes.map((row) => (
                    <PerDayTimeRow
                      key={row.date}
                      date={row.date}
                      startTime={row.startTime}
                      endTime={row.endTime}
                      onStartChange={(v) =>
                        onPerDayChange(row.date, "startTime", v)
                      }
                      onEndChange={(v) =>
                        onPerDayChange(row.date, "endTime", v)
                      }
                    />
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* ---- Recurring event sub-form ---- */}
      {isRecurring && (
        <div>
          <div className="bg-white border border-ink-200 rounded-2xl p-5 sm:p-6 mb-4 space-y-4">
            {/* Frequency selector - dropdown, not segmented control,
                to match the WP form's pattern. Three options: Week
                (every X), Month (Nth weekday of each month), or
                Specific Dates (manual list). */}
            <div>
              <label
                htmlFor="f-recurring-type"
                className="block text-sm font-semibold text-ink-900 mb-2"
              >
                Frequency
              </label>
              <select
                id="f-recurring-type"
                className="select"
                value={state.recurringFrequency}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    key: "recurringFrequency",
                    value: e.target.value as "weekly" | "monthly" | "custom",
                  })
                }
              >
                <option value="weekly">Repeat every: Week</option>
                <option value="monthly">Repeat every: Month</option>
                <option value="custom">Specific Dates</option>
              </select>
            </div>

            {/* Weekly mode: pick which day of the week. */}
            {state.recurringFrequency === "weekly" && (
              <div>
                <label
                  htmlFor="f-recurring-week"
                  className="block text-sm font-semibold text-ink-900 mb-2"
                >
                  Day of week
                </label>
                <select
                  id="f-recurring-week"
                  className="select"
                  value={state.recurringWeek}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "recurringWeek",
                      // The select's value is one of the 7 lowercase
                      // weekday strings - guaranteed by the option list.
                      value: e.target.value as typeof state.recurringWeek,
                    })
                  }
                >
                  {WEEKDAYS_LOWER.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Monthly mode: 35-option dropdown. */}
            {state.recurringFrequency === "monthly" && (
              <div>
                <label
                  htmlFor="f-recurring-month"
                  className="block text-sm font-semibold text-ink-900 mb-2"
                >
                  Day of month
                </label>
                <select
                  id="f-recurring-month"
                  className="select"
                  value={state.recurringMonth}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "recurringMonth",
                      value: e.target.value as typeof state.recurringMonth,
                    })
                  }
                >
                  {MONTHLY_OCCURRENCES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date+time block. Different shape per mode:
                  - Weekly / Monthly: a single date pair + time pair
                    with the "Repeat until cancelled" toggle in the
                    end-date corner (matches the WP screenshot).
                  - Custom: a list of individual date+time rows plus
                    an "Add date" button. */}
            {state.recurringFrequency !== "custom" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <DateField
                  label="Start date"
                  required
                  value={state.recurringFirstDate}
                  onClick={() =>
                    setPickerTarget({
                      key: "recurringFirstDate",
                      title: "First date",
                    })
                  }
                />
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-ink-500">
                      End date
                    </span>
                    <label className="inline-flex items-center gap-2 text-xs text-ink-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-gold-500"
                        checked={state.recurringRepeatUntilCancelled}
                        onChange={(e) =>
                          dispatch({
                            type: "SET_FIELD",
                            key: "recurringRepeatUntilCancelled",
                            value: e.target.checked,
                          })
                        }
                      />
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        Repeat until cancelled
                      </span>
                    </label>
                  </div>
                  <button
                    type="button"
                    className={`date-field ${state.recurringUntilDate && !state.recurringRepeatUntilCancelled ? "" : "is-empty"}`}
                    onClick={() =>
                      setPickerTarget({
                        key: "recurringUntilDate",
                        title: "Until",
                      })
                    }
                    disabled={state.recurringRepeatUntilCancelled}
                  >
                    <i className="fa-regular fa-calendar df-icon" aria-hidden />
                    <span className="df-display">
                      {state.recurringRepeatUntilCancelled
                        ? "Ongoing - no end date"
                        : state.recurringUntilDate
                          ? formatEditorDate(state.recurringUntilDate, region)
                          : "Pick a date"}
                    </span>
                    <i
                      className="fa-solid fa-chevron-down df-chev"
                      aria-hidden
                    />
                  </button>
                </div>
                <TimeField
                  label="Start time"
                  required
                  value={state.startTime}
                  onChange={(value) =>
                    dispatch({ type: "SET_FIELD", key: "startTime", value })
                  }
                />
                <TimeField
                  label="End time"
                  required
                  value={state.endTime}
                  onChange={(value) =>
                    dispatch({ type: "SET_FIELD", key: "endTime", value })
                  }
                />
              </div>
            ) : (
              <CustomDateList
                rows={state.recurringCustomDates}
                onAdd={() =>
                  dispatch({
                    type: "ADD_CUSTOM_DATE",
                    row: {
                      id: makeLocalId("cd"),
                      date: null,
                      startTime: "09:00",
                      endTime: "16:00",
                    },
                  })
                }
                onUpdate={(row) =>
                  dispatch({ type: "UPDATE_CUSTOM_DATE", row })
                }
                onRemove={(id) => dispatch({ type: "REMOVE_CUSTOM_DATE", id })}
                onPickDate={(rowId) =>
                  setPickerTarget({
                    key: "customDate",
                    rowId,
                    title: "Date",
                  })
                }
              />
            )}
          </div>

          {/* Info callout - mockup uses gold-200/gold-50 to match the
              host callout aesthetic on the Basics panel. */}
          <div className="flex items-start gap-3 p-4 bg-gold-50 border border-gold-200 rounded-xl">
            <i
              className="fa-solid fa-circle-info text-gold-600 mt-0.5"
              aria-hidden
            />
            <div className="text-sm">
              <p className="font-semibold text-gold-900">
                Recurring event schedule
              </p>
              <p className="text-gold-800 mt-1">
                Your event will be duplicated and published for each date in the
                series when you hit publish.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Timezone ----
          Options are scoped to the event's region, and the value is
          set from the address on the Basics step. Offsets are computed
          live so they stay right across DST. */}
      <div className="mt-6">
        <label
          htmlFor="f-timezone"
          className="block text-sm font-semibold text-ink-900 mb-2"
        >
          Timezone
        </label>
        <div className="relative">
          <i
            className="fa-solid fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            aria-hidden
          />
          <select
            id="f-timezone"
            className="select"
            style={{ paddingLeft: 44, paddingRight: 40 }}
            value={state.timezone}
            onChange={(e) => {
              dispatch({
                type: "SET_FIELD",
                key: "timezone",
                value: e.target.value,
              });
              // A deliberate choice. From here on, changing the address
              // leaves the timezone alone.
              dispatch({
                type: "SET_FIELD",
                key: "timezoneIsAuto",
                value: false,
              });
            }}
          >
            {timezoneOptions.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {timezoneOptionLabel(tz)}
              </option>
            ))}
          </select>
        </div>
        {timezoneOptions.length > 1 && state.timezoneIsAuto && (
          <p className="mt-2 text-xs text-ink-500">
            {state.locationCoords
              ? "Set from your event address. Change it here if it's not right."
              : "Pick your event address on the Basics step and we'll set this for you."}
          </p>
        )}
      </div>

      {/* ---- Desktop nav row (Back / Continue). Hidden on mobile -
              the sticky bottom bar handles those on phones. */}
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

      {/* Shared datepicker - controlled by `pickerTarget`. Sits at the
          end of the section so it's last in DOM order; the portal it
          uses internally still escapes to <body>, but rendering it
          here keeps the JSX tree colocated with the panel that owns
          its state. */}
      <FullScreenDatePicker
        open={pickerTarget !== null}
        title={pickerTarget?.title ?? "Select date"}
        value={(() => {
          if (!pickerTarget) return null;
          if (pickerTarget.key === "customDate") {
            return (
              state.recurringCustomDates.find(
                (r) => r.id === pickerTarget.rowId,
              )?.date ?? null
            );
          }
          return state[pickerTarget.key];
        })()}
        onClose={closePicker}
        onChange={applyPicker}
      />
    </section>
  );
}

// ============================================================
// Internal subcomponents - local to the file because they're
// only used here.
// ============================================================

/** Date trigger button - looks like an input, opens the fullscreen
 * datepicker. Shows a placeholder string when no value is set so the
 * button isn't visually empty. */
function DateField({
  label,
  value,
  required = false,
  onClick,
}: {
  label: string;
  value: string | null;
  required?: boolean;
  onClick: () => void;
}) {
  const region = useEventRegion();
  const display = value ? formatEditorDate(value, region) : "Pick a date";
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
        {label}
        {required && <span className="text-gold-600 ml-1">*</span>}
      </label>
      <button
        type="button"
        className={`date-field ${value ? "" : "is-empty"}`}
        onClick={onClick}
      >
        <i className="fa-regular fa-calendar df-icon" aria-hidden />
        <span className="df-display">{display}</span>
        <i className="fa-solid fa-chevron-down df-chev" aria-hidden />
      </button>
    </div>
  );
}

/** Native time input wrapped with the standard label styling. */
function TimeField({
  label,
  value,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
        {label}
        {required && <span className="text-gold-600 ml-1">*</span>}
      </label>
      <input
        type="time"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Date button stacked above a time input - the layout used twice in
 * the single-event view. Saves repeating the markup. */
function DateTimePair({
  label,
  date,
  time,
  hideTime = false,
  onDateClick,
  onTimeChange,
}: {
  label: string;
  date: string | null;
  time: string;
  /** When true, the time input is hidden - used when `hideTimes` or
   *  `uniqueTimesPerDay` modes are on for the parent event. */
  hideTime?: boolean;
  onDateClick: () => void;
  onTimeChange: (value: string) => void;
}) {
  const region = useEventRegion();
  const display = date ? formatEditorDate(date, region) : "Pick a date";
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
        {label}
      </label>
      <button
        type="button"
        className={`date-field ${hideTime ? "" : "mb-2"} ${date ? "" : "is-empty"}`}
        onClick={onDateClick}
      >
        <i className="fa-regular fa-calendar df-icon" aria-hidden />
        <span className="df-display">{display}</span>
        <i className="fa-solid fa-chevron-down df-chev" aria-hidden />
      </button>
      {!hideTime && (
        <input
          type="time"
          className="input"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
        />
      )}
    </div>
  );
}

/** Toggle switch with title + description on the left. Used twice. */
function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <p className="text-xs text-ink-500">{description}</p>
      </div>
      <span className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider" />
      </span>
    </label>
  );
}

/**
 * One row in the per-day-times list. Renders the date label on the
 * left and start/end time inputs on the right, mirroring the legacy
 * WP form's `multi_event_start_time[]` / `multi_event_end_time[]`
 * pairs (one per day).
 *
 * The date itself is not editable here - it's derived from the date
 * range. To change which days are present, the user adjusts the
 * Start/End date fields above and the panel re-syncs the array.
 */
function PerDayTimeRow({
  date,
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: {
  date: string;
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  const region = useEventRegion();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr] gap-3 sm:items-center">
      <div className="text-sm font-semibold text-ink-900 sm:pr-2">
        {formatEditorDate(date, region)}
      </div>
      <div>
        <label className="block sm:hidden text-xs uppercase tracking-wider font-semibold text-ink-500 mb-1">
          Start time
        </label>
        <input
          type="time"
          className="input"
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
          aria-label={`Start time for ${formatEditorDate(date, region)}`}
        />
      </div>
      <div>
        <label className="block sm:hidden text-xs uppercase tracking-wider font-semibold text-ink-500 mb-1">
          End time
        </label>
        <input
          type="time"
          className="input"
          value={endTime}
          onChange={(e) => onEndChange(e.target.value)}
          aria-label={`End time for ${formatEditorDate(date, region)}`}
        />
      </div>
    </div>
  );
}

/**
 * Specific-dates list for the custom recurring mode.
 *
 * Each row holds one date + start time + end time. The user can add
 * as many rows as they want; each one becomes a separate event
 * instance when the series is published. Mirrors the WP form's
 * `custom_event_start_date[]` / `custom_event_start_time[]` /
 * `custom_event_end_time[]` flat arrays.
 *
 * Rows are addressed by synthetic id, not array index, so reorders
 * (if we add them later) won't break in-flight datepicker references.
 *
 * Dates are picked via the parent's shared full-screen datepicker -
 * we hand back the row id via `onPickDate` so the parent can route
 * the apply back to the right row.
 */
function CustomDateList({
  rows,
  onAdd,
  onUpdate,
  onRemove,
  onPickDate,
}: {
  rows: Array<{
    id: string;
    date: string | null;
    startTime: string;
    endTime: string;
  }>;
  onAdd: () => void;
  onUpdate: (row: {
    id: string;
    date: string | null;
    startTime: string;
    endTime: string;
  }) => void;
  onRemove: (id: string) => void;
  onPickDate: (rowId: string) => void;
}) {
  const region = useEventRegion();
  return (
    <div className="space-y-3 pt-2">
      {rows.length === 0 ? (
        <div className="text-center py-6 px-4 border border-dashed border-ink-200 rounded-xl bg-ink-50 text-ink-500 text-sm">
          No dates yet. Add at least one date for your event.
        </div>
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            className="bg-ink-50 border border-ink-200 rounded-xl p-3 sm:p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 sm:items-end">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  Date
                </label>
                <button
                  type="button"
                  className={`date-field ${row.date ? "" : "is-empty"}`}
                  onClick={() => onPickDate(row.id)}
                >
                  <i
                    className="fa-regular fa-calendar df-icon"
                    aria-hidden
                  />
                  <span className="df-display">
                    {row.date
                      ? formatEditorDate(row.date, region)
                      : "Pick a date"}
                  </span>
                  <i
                    className="fa-solid fa-chevron-down df-chev"
                    aria-hidden
                  />
                </button>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  Start time
                </label>
                <input
                  type="time"
                  className="input"
                  value={row.startTime}
                  onChange={(e) =>
                    onUpdate({ ...row, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  End time
                </label>
                <input
                  type="time"
                  className="input"
                  value={row.endTime}
                  onChange={(e) =>
                    onUpdate({ ...row, endTime: e.target.value })
                  }
                />
              </div>
              {/* Remove button - sits at the same baseline as the
                  inputs on sm+, full-width on mobile so it's easy to
                  hit. */}
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                aria-label="Remove this date"
                className="h-11 w-full sm:w-11 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center shrink-0"
              >
                <i className="fa-solid fa-trash text-sm" aria-hidden />
                <span className="sm:hidden ml-2 text-sm">Remove date</span>
              </button>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition"
      >
        <i className="fa-solid fa-plus text-xs" aria-hidden /> Add Date
      </button>
    </div>
  );
}
