import { resolveRegion, type Region } from "./regions";

/**
 * Format a yyyy-mm-dd date string as "19 April 2026" - matching the
 * style used throughout the event editor's date fields. We construct
 * the Date manually from parts (rather than `new Date(iso)`) because
 * `new Date('2026-04-19')` is interpreted as midnight UTC, which can
 * land on April 18 in negative-offset timezones. Splitting + Date.UTC
 * keeps the formatted output consistent with what the user picked.
 *
 * `region` decides the ordering - "19 April 2026" in the UK,
 * "April 19, 2026" in the US. It defaults to UK, matching the API's own
 * fallback, so a caller with no event in scope still renders sensibly.
 */
export function formatEditorDate(
  iso: string | null | undefined,
  region: Region = resolveRegion(undefined),
): string {
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
  return date.toLocaleDateString(region.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
