/**
 * Which region's public site a visitor should be sent to.
 *
 * Used only for the "Back to CarEvents.com" link. The account itself is
 * network-wide - WordPress keeps users in one global table - and the
 * `sites` arrays on the list endpoints are derived from records the
 * user already owns, so they're empty for a brand-new organiser. There
 * is no server-side answer to "which country is this user in", which
 * leaves the browser.
 *
 * This is a GUESS, and it is only allowed to be one because the cost of
 * getting it wrong is a link landing on the other region's homepage.
 * Nothing here should be reused to decide anything that touches data -
 * an event's region comes from its `site` block, always.
 */

import { DEFAULT_REGION_KEY, isRegionKey, type RegionKey } from "./regions";

/**
 * IANA zones that mean "United States".
 *
 * Listed explicitly rather than matching `America/*`, which also covers
 * Canada, Mexico and South America. Aliases (America/Detroit,
 * America/Indiana/*, …) are deliberately left out: they fall through to
 * the language check below, and failing to the default is better than
 * maintaining the whole tzdb here.
 */
const US_TIME_ZONES = new Set([
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Adak",
  "Pacific/Honolulu",
]);

const UK_TIME_ZONES = new Set(["Europe/London", "Europe/Belfast"]);

/** The visitor's IANA time zone, or "" where it can't be read. */
function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

/**
 * Country codes from the browser's language list, most-preferred first.
 *
 * Reads the region subtag - "en-GB" gives "GB". A bare "en" carries no
 * country and is skipped rather than guessed at.
 */
function languageCountries(): string[] {
  if (typeof navigator === "undefined") return [];
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  const out: string[] = [];
  for (const tag of langs) {
    const parts = (tag ?? "").split("-");
    // "en-GB" → ["en","GB"]; "zh-Hant-TW" → country is the last 2-letter
    // part, since the middle one is a script subtag.
    const country = parts
      .slice(1)
      .find((p) => /^[A-Za-z]{2}$/.test(p));
    if (country) out.push(country.toUpperCase());
  }
  return out;
}

/**
 * Best guess at the visitor's region.
 *
 * Time zone first: it reflects where the device actually is, whereas
 * language is a preference - plenty of people in the UK run their
 * phone in en-US. Language is the fallback for zones we don't list.
 *
 * Anything unrecognised returns the default region, which is what this
 * link pointed at before any of this existed.
 *
 * Browser-only. On the server there's no `Intl` zone worth reading and
 * no `navigator`, so it returns the default - see `useVisitorRegion`
 * for why that matters.
 */
export function detectVisitorRegion(): RegionKey {
  const tz = timeZone();
  if (UK_TIME_ZONES.has(tz)) return "uk";
  if (US_TIME_ZONES.has(tz)) return "us";

  for (const country of languageCountries()) {
    if (country === "GB") return "uk";
    if (country === "US") return "us";
  }

  return DEFAULT_REGION_KEY;
}

/** Narrow an unknown string to a RegionKey, for callers holding one. */
export function asRegionKey(value: unknown): RegionKey {
  return isRegionKey(value) ? value : DEFAULT_REGION_KEY;
}
