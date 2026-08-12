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
  /** Font Awesome class for the currency glyph, for the few places that
   *  show an icon rather than a character (the discount type picker).
   *  Lives here so a new region declares its icon alongside its symbol
   *  instead of a component switching on the key. */
  currencyIcon: string;
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
    currencyIcon: "fa-solid fa-sterling-sign",
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
    currencyIcon: "fa-solid fa-dollar-sign",
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
 * The date shapes the dashboard uses, in one place.
 *
 * Named rather than spelled out at each call site so "the short date"
 * means the same thing everywhere, and so widening one (adding the year
 * to subtitles, say) is a single edit. Intl turns each of these into the
 * region's own ordering - `short` is "15 Apr" in the UK and "Apr 15" in
 * the US - which is exactly why call sites must not hand-assemble them
 * from parts or post-process the string.
 */
export const DATE_STYLES = {
  /** "Sat, 15 August 2026" / "Sat, August 15, 2026" - headline dates. */
  long: {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  },
  /** "15 August 2026" / "August 15, 2026" - editor date fields. */
  full: { day: "numeric", month: "long", year: "numeric" },
  /** "15 Apr" / "Apr 15" - tight subtitles where the year is implied. */
  short: { day: "numeric", month: "short" },
  /** "15 Apr 2026" / "Apr 15, 2026" - subtitles that need the year. */
  shortWithYear: { day: "numeric", month: "short", year: "numeric" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

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
  options: Intl.DateTimeFormatOptions = DATE_STYLES.long,
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
  options: Intl.DateTimeFormatOptions = DATE_STYLES.long,
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
 * "15 Apr" / "Apr 15" - the tight form used in list subtitles.
 *
 * Replaces the hand-rolled "format long, then regex the month down to
 * three letters and strip the year" that had been copied into four
 * panels. That trick only ever produced the UK shape: it left the US
 * comma behind ("Apr 15,") and its month regex matched English month
 * names only, so it silently no-opped on any other locale.
 *
 * Pass `withYear` where the date could be more than a year out and the
 * bare day/month would be ambiguous.
 */
export function formatRegionShortDate(
  iso: string | null | undefined,
  region: Region,
  withYear = false,
): string {
  return formatRegionDate(
    iso,
    region,
    withYear ? DATE_STYLES.shortWithYear : DATE_STYLES.short,
  );
}

/**
 * "Applied today" / "Applied 3 days ago" / "Applied 15 Apr".
 *
 * Relative for the first month, then an absolute short date. Only that
 * tail is region-dependent, but it's the part that was hardcoded to
 * en-GB in three separate copies of this function - so there is one
 * copy now and it takes a region.
 *
 * `verb` is the leading word ("Applied", "Confirmed", "Rejected"), so
 * the status-change labels share the same shape as the applied ones.
 */
export function formatRelativeDate(
  iso: string | null | undefined,
  region: Region,
  verb: string,
  fallback = "",
): string {
  if (!iso) return fallback;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return fallback;
    const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (days <= 0) return `${verb} today`;
    if (days === 1) return `${verb} 1 day ago`;
    if (days < 7) return `${verb} ${days} days ago`;
    if (days < 30) return `${verb} ${Math.floor(days / 7)}w ago`;
    return `${verb} ${formatRegionShortDate(iso, region)}`;
  } catch {
    return fallback;
  }
}

/**
 * A time of day in the region's clock - "14:30" in the UK, "2:30 PM" in
 * the US.
 *
 * Accepts the "HH:MM" / "HH:MM:SS" the editor and API deal in, as well
 * as a full ISO timestamp. Anything it can't read is returned unchanged
 * rather than blanked, so a server string in some other shape still
 * reaches the page.
 */
export function formatRegionTime(
  value: string | null | undefined,
  region: Region,
): string {
  if (!value) return "";
  const trimmed = value.trim();
  // Pull the clock time out of either shape. Pinned to a fixed UTC date
  // so only the hour/minute matter - we're formatting a time of day, not
  // an instant, and must not let the viewer's zone shift it.
  const match = /^(\d{1,2}):(\d{2})/.exec(
    trimmed.includes("T") ? (trimmed.split("T")[1] ?? "") : trimmed,
  );
  if (!match) return trimmed;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return trimmed;
  try {
    // A 24-hour locale pads the hour ("09:00"); a 12-hour one doesn't
    // ("9:00 AM", never "09:00 AM"). Asked from the locale rather than
    // hardcoded per region, so a third site gets its own convention.
    const cycle = new Intl.DateTimeFormat(region.locale, {
      hour: "numeric",
    }).resolvedOptions().hourCycle;
    const is24Hour = cycle === "h23" || cycle === "h24";
    return new Date(Date.UTC(2000, 0, 1, hour, minute)).toLocaleTimeString(
      region.locale,
      {
        hour: is24Hour ? "2-digit" : "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      },
    );
  } catch {
    return trimmed;
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

/**
 * Money with the trailing ".00" dropped - "£1,234", "$15", "£12.50".
 *
 * The compact form the editor uses for badges and summary figures,
 * where a column of ".00"s is noise. Grouping and symbol placement
 * still come from the region, so this is `formatRegionCurrency` with a
 * variable number of decimals rather than a separate implementation.
 */
export function formatRegionAmount(amount: number, region: Region): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return formatRegionCurrency(n, region, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  });
}

/**
 * Re-format a money string the server already rendered.
 *
 * Some endpoints (order detail, most visibly) hand back display strings
 * rather than numbers - "£55.00", "-£5.00". Those are formatted by
 * WooCommerce against whichever blog answered the request, so a US order
 * fetched without a region comes back in pounds. Parsing the number back
 * out and re-rendering it in the region we know we're showing is the
 * only fix available on this side of the API.
 *
 * Deliberately conservative: anything that isn't a plain symbol-and-
 * digits amount is passed through untouched, because a wrong guess here
 * would misstate a price. Grouping separators are read per region -
 * "1.234,56" is twelve hundred in de-DE and one-point-two in en-GB - so
 * we only strip separators we can identify from the string's own shape.
 */
export function formatRegionMoneyString(
  value: string | null | undefined,
  region: Region,
): string {
  if (!value) return value ?? "";
  const trimmed = value.trim();
  // Strip currency symbols/codes and whitespace, keeping sign, digits
  // and separators. Anything left over that isn't numeric means we
  // didn't understand the string, and we bail.
  const stripped = trimmed.replace(/[^\d.,\-+]/g, "");
  if (!/^[-+]?[\d.,]+$/.test(stripped) || !/\d/.test(stripped)) return trimmed;

  const negative = stripped.startsWith("-") || /^\(.*\)$/.test(trimmed);
  const digits = stripped.replace(/^[-+]/, "");
  const lastDot = digits.lastIndexOf(".");
  const lastComma = digits.lastIndexOf(",");
  // The LAST separator is the decimal one - but only if it leaves 1-2
  // digits behind it. "1,234" and "1.234" are both whole thousands.
  const sepIdx = Math.max(lastDot, lastComma);
  const tail = sepIdx >= 0 ? digits.length - sepIdx - 1 : 0;
  const isDecimal = sepIdx >= 0 && tail >= 1 && tail <= 2;
  const whole = (isDecimal ? digits.slice(0, sepIdx) : digits).replace(
    /[.,]/g,
    "",
  );
  const frac = isDecimal ? digits.slice(sepIdx + 1) : "";
  const amount = Number(`${whole}.${frac || "0"}`);
  if (!Number.isFinite(amount)) return trimmed;

  return formatRegionCurrency(negative ? -amount : amount, region);
}

/**
 * Re-format a date string the server already rendered, where we can.
 *
 * Same problem as `formatRegionMoneyString`: some endpoints send display
 * text. A machine-readable date ("2026-08-15" or a full ISO timestamp)
 * is reformatted into the region; anything else is passed through
 * unchanged. We deliberately do NOT try to read "08/09/2026" - that is
 * two different days depending on which region wrote it, and guessing
 * would put the wrong day on a ticket.
 */
export function formatRegionDateString(
  value: string | null | undefined,
  region: Region,
  options: Intl.DateTimeFormatOptions = DATE_STYLES.full,
): string {
  if (!value) return value ?? "";
  const trimmed = value.trim();
  const machineReadable =
    /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(trimmed);
  if (!machineReadable) return trimmed;
  return formatRegionDate(trimmed.replace(" ", "T"), region, options);
}
