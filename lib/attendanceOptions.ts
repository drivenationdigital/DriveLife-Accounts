/**
 * Attendance options (2026-11-09).
 *
 * On an event that runs over several days, a show car category and a
 * club's member ticket can be priced per attendance: each single day,
 * or every day ("All days"), each at its own price. Server-side every
 * option is a hidden ticket row under the category / the club's ticket
 * (see drivelife-accounts-api/shared/attendance.php); this module is
 * the client's shared vocabulary for them.
 *
 * Option keys match the server: "all" and "day:YYYY-MM-DD".
 */

import type { Region } from "./regions";

export const ALL_DAYS_KEY = "all";

export interface AttendanceOptionDef {
  key: string;
  label: string;
  /** The "YYYY-MM-DD" dates the option admits. */
  days: string[];
}

export function dayKey(iso: string): string {
  return `day:${iso}`;
}

/** Every calendar day from start to end inclusive ("YYYY-MM-DD"). */
export function eachDayInclusive(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [startIso];
  }
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 366) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard += 1;
  }
  return out.length > 0 ? out : [startIso];
}

/**
 * The days the editor's current (possibly unsaved) dates cover, or []
 * for a single-day or recurring event. Mirrors how the save mapper
 * expands the range into one date row per day, so the options offered
 * here are the ones the server will accept once the dates are saved.
 */
export function editorEventDays(state: {
  dateType: "single" | "recurring";
  startDate: string | null;
  endDate: string | null;
  uniqueTimesPerDay: boolean;
  perDayTimes: Array<{ date: string }>;
}): string[] {
  if (state.dateType !== "single" || !state.startDate) return [];
  const start = state.startDate;
  const end = state.endDate || start;
  let days: string[];
  if (state.uniqueTimesPerDay && state.perDayTimes.length > 0) {
    days = state.perDayTimes.map((d) => d.date);
  } else {
    days = eachDayInclusive(start, end);
  }
  days = Array.from(new Set(days.filter(Boolean))).sort();
  return days.length >= 2 ? days : [];
}

/** "Sat 6 Mar 2027" in the region's locale. */
export function attendanceDayLabel(iso: string, region: Region): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(region.locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** One option per day plus "All days", in that order. */
export function attendanceOptionsForDays(
  days: string[],
  region: Region,
): AttendanceOptionDef[] {
  if (days.length < 2) return [];
  const sorted = Array.from(new Set(days)).sort();
  return [
    ...sorted.map((d) => ({
      key: dayKey(d),
      label: attendanceDayLabel(d, region),
      days: [d],
    })),
    { key: ALL_DAYS_KEY, label: "All days", days: sorted },
  ];
}
