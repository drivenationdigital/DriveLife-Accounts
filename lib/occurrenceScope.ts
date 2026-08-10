/**
 * Splitting a series parent's occurrences into Upcoming and Past.
 *
 * The parent view shows the two as separate tabs, and the tab labels
 * carry counts, so the split has to be callable from both the table and
 * the tab bar without them disagreeing. One rule, one place.
 */

import type { Occurrence } from "@/context/types";

export type OccurrenceScope = "upcoming" | "past";

/**
 * Whether an occurrence has finished.
 *
 * Compared on whole days, not instants: an event running today is still
 * upcoming at 9pm, and dropping it into Past the moment its start time
 * passes would be wrong for anyone still on their way to it. A
 * multi-day occurrence is judged on its end date, so it stays upcoming
 * for the whole run.
 *
 * An occurrence with no date at all counts as upcoming. Undated rows
 * are unfinished drafts of a date rather than history, and burying them
 * in Past is how they'd never get filled in.
 */
export function isPastOccurrence(o: Occurrence, today = startOfToday()): boolean {
  const iso = o.endDate || o.startDate;
  if (!iso) return false;
  const day = parseDay(iso);
  return day !== null && day < today;
}

/**
 * The rows one tab should render.
 *
 * Order is preserved exactly as the API sent it - the organiser's
 * stored ACF order - for the same reason the single table never sorted:
 * it's theirs to control. The split only decides membership.
 *
 * Deleted rows keep whichever side their date puts them on, and are
 * filtered out unless the tab's "show deleted" toggle asks for them.
 */
export function occurrencesInScope(
  items: Occurrence[],
  scope: OccurrenceScope,
  { includeDeleted = false }: { includeDeleted?: boolean } = {},
): Occurrence[] {
  const today = startOfToday();
  return items.filter((o) => {
    if (o.isDeleted && !includeDeleted) return false;
    return isPastOccurrence(o, today) === (scope === "past");
  });
}

/** Local midnight today, the boundary both sides compare against. */
function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/**
 * An ISO date as local midnight on that day.
 *
 * Date-only strings are the common case here and are parsed by hand:
 * `new Date("2026-08-15")` is midnight *UTC*, which is the previous day
 * for anyone in a negative-offset zone - so a US organiser would see an
 * event drop into Past a day early. Values that carry a time are parsed
 * normally and then flattened to their local day.
 */
function parseDay(iso: string): number | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    ).getTime();
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  ).getTime();
}
