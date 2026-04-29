/**
 * Enumerate ISO date strings ("YYYY-MM-DD") from `start` through
 * `end` inclusive. Used by the per-day-times UI to materialise one
 * row per day.
 *
 * Implementation note — the safe way to walk dates in JS is to add
 * 86400 seconds via `setUTCDate`, NOT to add 1 to a Date object's
 * milliseconds. The latter breaks across DST transitions where a
 * "day" can be 23 or 25 hours. We work in UTC throughout because we
 * only care about the calendar date string, not the local time.
 *
 * Returns:
 *   - empty array if either date is missing or unparseable
 *   - empty array if `start > end`
 *   - a hard-capped result to avoid blowing up if a user accidentally
 *     enters a multi-year range (cap = 366 days; a year of dates is
 *     enough for any realistic event)
 */
export function enumerateDays(
  start: string | null,
  end: string | null,
): string[] {
  if (!start || !end) return [];
  if (!isIsoDate(start) || !isIsoDate(end)) return [];
  if (start > end) return [];

  const out: string[] = [];
  // Construct the UTC midnight Date for the start so the
  // setUTCDate(+1) walk is timezone-safe.
  const cur = new Date(`${start}T00:00:00Z`);
  const stop = new Date(`${end}T00:00:00Z`);

  // Hard cap — keeps a typo'd "2026 → 2046" from creating 7300 rows
  // and freezing the UI.
  const MAX_DAYS = 366;
  let safety = 0;

  while (cur.getTime() <= stop.getTime() && safety < MAX_DAYS) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
    safety++;
  }
  return out;
}

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
