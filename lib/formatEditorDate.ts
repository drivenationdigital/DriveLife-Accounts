/**
 * Format a yyyy-mm-dd date string as "19 April 2026" — matching the
 * style used throughout the event editor's date fields. We construct
 * the Date manually from parts (rather than `new Date(iso)`) because
 * `new Date('2026-04-19')` is interpreted as midnight UTC, which can
 * land on April 18 in negative-offset timezones. Splitting + Date.UTC
 * keeps the formatted output consistent with what the user picked.
 */
export function formatEditorDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [yStr, mStr, dStr] = parts as [string, string, string];
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return iso;
  // Use UTC so the day doesn't shift across the user's local zone.
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
