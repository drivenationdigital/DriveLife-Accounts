/**
 * Regions - the multisite blogs an event can live on, plus everything
 * the UI needs to present one.
 *
 * The API's `EventSite` block is the authority for the facts it carries
 * (label, country, currency, whether ticketing exists). This table adds
 * the one thing it doesn't: a BCP-47 locale for date and number
 * formatting.
 *
 * It also has to stand alone. The create screen has to offer regions
 * *before* any event exists, so there's no `EventSite` to read - and
 * `/organiser-events` only returns `sites` derived from events the user
 * already has, which is empty for a new organiser. So this table is the
 * bootstrap; `regionFromSite()` layers the API's answer on top wherever
 * we do have one.
 *
 * A region is fixed when the event is created. WordPress posts live on
 * one blog, and moving between blogs is a migration rather than a field
 * edit - so the editor shows the region, it doesn't let you change it.
 */

import type { EventSite } from "./apiTypes";

export type RegionKey = "uk" | "us";

export interface Region {
  /** Site slug, and the value sent as `site` on every API call. */
  key: RegionKey;
  /** Human name, e.g. "United Kingdom". Used where there's room - the
   *  country picker, the read-only Country field. */
  label: string;
  /** Short form for badges and chips, e.g. "UK" / "USA".
   *
   *  Spelled out per region rather than derived: uppercasing `key`
   *  gives "US" where the house style is "USA", and `country` is "GB"
   *  for the UK. Neither produces the wanted pair on its own. */
  abbr: string;
  /** ISO 3166-1 alpha-2, drives the flag icon. Note this differs from
   *  `key` for the UK: the site slug is "uk", the country code "GB". */
  country: string;
  /** BCP-47 tag for Intl date/number formatting. This is the field the
   *  API doesn't carry and the whole reason this table exists. */
  locale: string;
  /** ISO 4217. */
  currency: string;
  currencySymbol: string;
  /** False where the region can't sell tickets, which hides the entire
   *  ticketing surface - tickets, discounts, orders, attendees and all
   *  three application types. Both live regions are ticketed now; the
   *  flag stays because a new site can launch listing-only, exactly as
   *  the US did. */
  ticketing: boolean;
}

export const REGIONS: Record<RegionKey, Region> = {
  uk: {
    key: "uk",
    label: "United Kingdom",
    abbr: "UK",
    country: "GB",
    locale: "en-GB",
    currency: "GBP",
    currencySymbol: "£",
    ticketing: true,
  },
  us: {
    key: "us",
    label: "United States",
    abbr: "USA",
    country: "US",
    locale: "en-US",
    currency: "USD",
    currencySymbol: "$",
    ticketing: true,
  },
};

/**
 * Regions the dashboard treats as ticketed whatever the API says.
 *
 * The US site is switching from listing-only to ticketed and the
 * dashboard goes first. The table above is only the bootstrap - on an
 * event view the API's `site.ticketing` wins, so while that still
 * reports false for the US it would overrule the flip and keep the
 * whole ticketing surface hidden.
 *
 * Deliberately one-way: a `true` from the API is always honoured, so
 * this only ever ignores a stale `false` on a region we've already
 * switched on. Drop the entry once the API reports ticketing for the
 * US - nothing else has to change with it.
 */
const TICKETING_FORCED_ON: readonly RegionKey[] = ["us"];

function isTicketingForced(key: string | null | undefined): boolean {
  return isRegionKey(key) && TICKETING_FORCED_ON.includes(key);
}

/** Ordered for display on the create screen. */
export const REGION_LIST: Region[] = [REGIONS.uk, REGIONS.us];

/**
 * The region assumed when none is known. Matches the API, which
 * resolves an omitted `site` against the UK blog - so a link or a
 * record from before the multisite rollout formats as it always did.
 */
export const DEFAULT_REGION_KEY: RegionKey = "uk";

export function isRegionKey(key: unknown): key is RegionKey {
  return key === "uk" || key === "us";
}

/** Look up a region by key, falling back to the default. */
export function resolveRegion(key: string | null | undefined): Region {
  return isRegionKey(key) ? REGIONS[key] : REGIONS[DEFAULT_REGION_KEY];
}

/**
 * Build a Region from an API `site` block.
 *
 * The API wins on every field it sends, so a currency or a ticketing
 * flag changing server-side doesn't need a front-end release. `locale`
 * always comes from the table - the API doesn't carry it. An
 * unrecognised key still yields a usable region rather than throwing,
 * since a third site could appear before this table knows it.
 */
export function regionFromSite(site: EventSite | null | undefined): Region {
  const base = resolveRegion(site?.key);
  if (!site) return base;
  return {
    ...base,
    // Keep the API's key when it isn't one we know, so calls made with
    // this region still address the right blog.
    key: (isRegionKey(site.key) ? site.key : base.key) as RegionKey,
    label: site.label || base.label,
    // An unknown region falls back to its own key rather than
    // inheriting the default region's abbreviation, which would
    // mislabel a third site as "UK".
    abbr: isRegionKey(site.key) ? base.abbr : site.key.toUpperCase(),
    country: site.country || base.country,
    currency: site.currency || base.currency,
    currencySymbol: site.currency_symbol || base.currencySymbol,
    ticketing: isTicketingForced(site.key) || (site.ticketing ?? base.ticketing),
  };
}

/**
 * Whether an event should show its ticketing surface.
 *
 * Two separate flags have to agree: the region-level `site.ticketing`
 * (can this blog sell tickets at all) and the per-event
 * `sales.ticketing_available` (did the API build a real sales block for
 * this event). Both default to true when absent, which is what a
 * pre-multisite deployment sends - it was UK-only and ticketed.
 *
 * `fallbackKey` is the page's `?site=` param, used only when the
 * response carries no site block of its own.
 */
export function ticketingEnabled(
  site: EventSite | null | undefined,
  salesAvailable?: boolean,
  fallbackKey?: string | null,
): boolean {
  const region = site ? regionFromSite(site) : resolveRegion(fallbackKey);
  // A forced-on region ignores the per-event flag too: the API sets it
  // false for the same stale reason it sets `site.ticketing` false.
  if (isTicketingForced(region.key)) return true;
  return region.ticketing && (salesAvailable ?? true);
}

// ─────────────────────────────────────────────────────────────────────
// Region-aware formatting
// ─────────────────────────────────────────────────────────────────────

/**
 * Format an ISO date in the region's locale.
 *
 * The whole point is ordering: en-GB renders 8 August 2026 as
 * "Sat, 8 August 2026", en-US as "Sat, August 8, 2026". Getting this
 * wrong on a numeric date is worse than cosmetic - 08/09 is two
 * different days depending on which side of the Atlantic you read it.
 *
 * Dates that are date-only ("2026-08-15") are pinned to UTC, because
 * `new Date("2026-08-15")` is midnight UTC and would render as the 14th
 * for anyone in a negative-offset zone - which is most of the US.
 */
export function formatRegionDate(
  iso: string | null | undefined,
  region: Region,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  if (!iso) return "";
  try {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
    const date = dateOnly ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(region.locale, {
      ...options,
      ...(dateOnly ? { timeZone: "UTC" } : {}),
    });
  } catch {
    return iso;
  }
}

/**
 * A date range in the region's locale.
 *
 * Uses `Intl.DateTimeFormat.formatRange`, which collapses the shared
 * parts itself and knows where they belong per locale - en-GB gives
 * "Sat, 15 - Sun, 16 August 2026", en-US "Sat, August 15 - Sun, August
 * 16, 2026". Hand-building this from parts only ever produces one
 * region's shape.
 *
 * Same UTC pinning as formatRegionDate, for the same reason.
 */
export function formatRegionDateRange(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  region: Region,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  if (!startIso) return formatRegionDate(endIso, region, options);
  if (!endIso || endIso === startIso) {
    return formatRegionDate(startIso, region, options);
  }
  try {
    const dateOnly =
      /^\d{4}-\d{2}-\d{2}$/.test(startIso) && /^\d{4}-\d{2}-\d{2}$/.test(endIso);
    const start = new Date(dateOnly ? `${startIso}T00:00:00Z` : startIso);
    const end = new Date(dateOnly ? `${endIso}T00:00:00Z` : endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return `${startIso} - ${endIso}`;
    }
    return new Intl.DateTimeFormat(region.locale, {
      ...options,
      ...(dateOnly ? { timeZone: "UTC" } : {}),
    }).formatRange(start, end);
  } catch {
    // formatRange is widely supported but not universal; two full dates
    // is always correct, just longer.
    return `${formatRegionDate(startIso, region, options)} - ${formatRegionDate(
      endIso,
      region,
      options,
    )}`;
  }
}

/**
 * Money in the region's currency and locale.
 *
 * Symbol placement and grouping both move with the region, so this
 * builds the whole string rather than prefixing a symbol onto a number.
 */
export function formatRegionCurrency(
  amount: number,
  region: Region,
  options: Intl.NumberFormatOptions = {},
): string {
  try {
    return new Intl.NumberFormat(region.locale, {
      style: "currency",
      currency: region.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    // An unknown ISO currency code makes Intl throw. Fall back to the
    // bare symbol rather than losing the number entirely.
    return `${region.currencySymbol}${amount.toFixed(2)}`;
  }
}
