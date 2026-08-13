/**
 * Timezones - which zones a region can offer, and how to pick the right
 * one from an address.
 *
 * An event's timezone is not cosmetic. Every start time, every ticket
 * sale window and every "doors open" on the listing is interpreted in
 * it, so a US event left on Europe/London is wrong by five to eight
 * hours on every one of those. Before this, the dropdown offered five
 * hardcoded zones - three of them European - and defaulted to
 * Europe/London whatever the event's region.
 *
 * Two inputs decide it, in order of authority:
 *
 *   1. The address. A lat/lng is the only thing that actually knows the
 *      answer: the US spans six zones, and the boundaries follow county
 *      lines rather than meridians. Resolved through the Google Time
 *      Zone API (see `resolveTimezoneFromCoords`).
 *   2. The region. Narrows the option list and supplies the default
 *      before any address exists. A UK event never needs asking.
 *
 * The offline table below is the fallback for when the API call fails,
 * and it is genuinely approximate - see `offlineZoneFromCoords`.
 */

import { REGIONS, type Region, type RegionKey } from "./regions";

export interface TimezoneOption {
  /** IANA zone id, e.g. "America/Chicago". The stored value. */
  value: string;
  /** Human name for the dropdown, e.g. "Central Time". */
  label: string;
}

/**
 * The zones each region can offer.
 *
 * Region-scoped rather than one global list because the list is also
 * the validation: a UK event has no business being set to
 * America/Denver, and offering it invites exactly that mistake. A new
 * site adds its zones here and needs no other change.
 *
 * The US list is the six civil zones plus Phoenix. Arizona keeps its
 * own entry because America/Phoenix is Mountain time that does NOT
 * observe DST - for half the year it matches Denver and for the other
 * half it matches Los Angeles, so neither of those can stand in for it.
 */
export const TIMEZONES_BY_REGION: Record<RegionKey, TimezoneOption[]> = {
  uk: [{ value: "Europe/London", label: "UK time" }],
  us: [
    { value: "America/New_York", label: "Eastern Time" },
    { value: "America/Chicago", label: "Central Time" },
    { value: "America/Denver", label: "Mountain Time" },
    { value: "America/Phoenix", label: "Mountain Time - Arizona (no DST)" },
    { value: "America/Los_Angeles", label: "Pacific Time" },
    { value: "America/Anchorage", label: "Alaska Time" },
    { value: "Pacific/Honolulu", label: "Hawaii Time" },
  ],
};

/**
 * The zone to use for a region before any address is known.
 *
 * For the US this is Eastern - the most populous zone, and the one a
 * wrong guess is least often wrong for. It is only ever a placeholder:
 * picking an address replaces it.
 */
const DEFAULT_ZONE_BY_REGION: Record<RegionKey, string> = {
  uk: "Europe/London",
  us: "America/New_York",
};

/** Zones available for a region. Unknown regions fall back to the UK
 *  list, matching how `resolveRegion` treats an unknown key. */
export function timezonesForRegion(region: Region): TimezoneOption[] {
  return TIMEZONES_BY_REGION[region.key] ?? TIMEZONES_BY_REGION.uk;
}

/** The region's placeholder zone, used until an address is picked. */
export function defaultTimezoneForRegion(region: Region): string {
  return DEFAULT_ZONE_BY_REGION[region.key] ?? DEFAULT_ZONE_BY_REGION.uk;
}

/** True when `zone` is one this region can actually be set to. */
export function isTimezoneValidForRegion(
  zone: string | null | undefined,
  region: Region,
): boolean {
  if (!zone) return false;
  return timezonesForRegion(region).some((t) => t.value === zone);
}

/**
 * The zone's current UTC offset, as "GMT+1" / "GMT-5".
 *
 * Computed rather than stored because it moves with DST - a table
 * saying "Europe/London (GMT+1)" is wrong for five months of the year,
 * which is exactly what the old hardcoded dropdown said all year round.
 * `at` is injectable so this is testable without faking the clock.
 */
export function timezoneOffsetLabel(zone: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    }).formatToParts(at);
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    // "shortOffset" yields "GMT" exactly at +0; spell that out so the
    // dropdown never shows a bare "GMT" next to a "GMT-5".
    if (!name) return "";
    return name === "GMT" ? "GMT+0" : name;
  } catch {
    return "";
  }
}

/** "Central Time (GMT-5)" - the dropdown's display text. */
export function timezoneOptionLabel(
  option: TimezoneOption,
  at: Date = new Date(),
): string {
  const offset = timezoneOffsetLabel(option.value, at);
  return offset ? `${option.label} (${offset})` : option.label;
}

// ─────────────────────────────────────────────────────────────────────
// Coordinates → zone
// ─────────────────────────────────────────────────────────────────────

export interface LatLngLike {
  lat: number;
  lng: number;
}

/**
 * Offline fallback: guess the zone from longitude within a region.
 *
 * Deliberately labelled a guess. Real zone boundaries follow state and
 * county lines, not meridians, so this is wrong for anywhere near an
 * edge - the Florida panhandle, west Texas, the Dakotas, most of Idaho
 * and Oregon, and the split counties in Indiana and Kentucky. It also
 * cannot detect Arizona, which is a latitude/longitude box rather than
 * a band.
 *
 * It exists only so a failed API call still lands closer than
 * "Europe/London", and the organiser can always correct it. The
 * boundaries below are the approximate midpoints of the real ones.
 */
export function offlineZoneFromCoords(
  region: Region,
  coords: LatLngLike,
): string {
  if (region.key !== "us") return defaultTimezoneForRegion(region);

  const { lat, lng } = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return defaultTimezoneForRegion(region);
  }

  // Hawaii and Alaska sit well outside the continental bands, so they
  // have to be checked first or the longitude test swallows them.
  if (lat < 25 && lng < -150) return "Pacific/Honolulu";
  if (lat > 51) return "America/Anchorage";

  // Arizona as a bounding box. Crude, but it covers the state's
  // populated south-west without reaching into New Mexico or Nevada,
  // and getting Phoenix wrong means a one-hour error for half the year.
  if (lat >= 31.3 && lat <= 37.0 && lng >= -115.0 && lng <= -109.0) {
    return "America/Phoenix";
  }

  if (lng > -87.5) return "America/New_York";
  if (lng > -102) return "America/Chicago";
  if (lng > -115) return "America/Denver";
  return "America/Los_Angeles";
}

export interface TimezoneLookup {
  zone: string;
  /** How we got it. Surfaced so the caller can tell an authoritative
   *  answer from a guess, and so this is visible when debugging a
   *  wrong-timezone report. */
  source: "api" | "offline" | "default";
}

/**
 * Resolve an address's timezone, best source first.
 *
 * Calls our own `/api/timezone` route rather than Google directly: the
 * Time Zone API is a web service, so going straight at it from the
 * browser means both a CORS dependency and putting the key in client
 * JS. The route keeps the key server-side.
 *
 * Never throws or returns null - a failed lookup degrades to the
 * offline guess and then to the region default, because leaving the
 * field untouched would leave it on whatever it was, which is the
 * behaviour being fixed.
 */
export async function resolveTimezoneFromCoords(
  region: Region,
  coords: LatLngLike,
  signal?: AbortSignal,
): Promise<TimezoneLookup> {
  try {
    const res = await fetch("/api/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: coords.lat, lng: coords.lng }),
      signal,
    });
    if (res.ok) {
      const data: unknown = await res.json();
      const zone =
        data && typeof data === "object"
          ? (data as { timeZoneId?: unknown }).timeZoneId
          : null;
      if (typeof zone === "string" && zone) {
        return { zone, source: "api" };
      }
    }
  } catch {
    // Aborted, offline, or the route is unavailable. Fall through to
    // the offline guess rather than surfacing an error - a timezone the
    // organiser can correct beats a blocked address pick.
  }

  const offline = offlineZoneFromCoords(region, coords);
  return {
    zone: offline,
    source: offline === defaultTimezoneForRegion(region) ? "default" : "offline",
  };
}

/**
 * Reconcile a zone with the region it has to belong to.
 *
 * Google will happily return America/Toronto for a spot near the border
 * and Europe/Dublin for one in Northern Ireland. Neither is in the
 * region's option list, so the select would render blank and save a
 * value the organiser never saw. Anything off-list collapses to the
 * region default.
 */
export function constrainToRegion(zone: string, region: Region): string {
  return isTimezoneValidForRegion(zone, region)
    ? zone
    : defaultTimezoneForRegion(region);
}

/** Every zone any region can use - for validating stored values. */
export const ALL_TIMEZONES: readonly string[] = Object.values(REGIONS).flatMap(
  (r) => (TIMEZONES_BY_REGION[r.key] ?? []).map((t) => t.value),
);
