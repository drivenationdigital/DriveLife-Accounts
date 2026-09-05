/**
 * Map the WP `/event-edit` API response into the editor's
 * `EventCreateState` shape.
 *
 * Why a dedicated mapper rather than aligning the two shapes?
 *
 *   - The WP side stores legacy values: integer enums for ticket
 *     type / visibility (1/2/3), strings for booleans ("0"/"1"),
 *     "publish"/"draft"/"future" for status, comma-separated
 *     ticket id lists. Translating these once at the boundary
 *     means the editor itself can use clean string unions and
 *     real booleans throughout.
 *
 *   - The legacy WP form occasionally stores the same logical
 *     value in different spots depending on when the record was
 *     created (e.g. `recurring_month` - slug vs label). Centralising
 *     the cleanup here keeps the smell out of the panels.
 *
 *   - The editor's branded-id types (`TicketId`, `DiscountId`, …)
 *     are nominal. Casting at the mapper boundary is the one place
 *     it's appropriate to bridge from the API's plain strings.
 *
 * NOTE: `lib/eventMapper.ts` exists for the read-only event-view
 * page and uses a different API shape entirely. This file is for
 * the editor's load-event flow specifically.
 */

import type {
  ApiEventDiscount,
  ApiEventEditImage,
  ApiEventEditResponse,
  ApiEventTicket,
  ApiShowCarCategory,
  ApiTraderCategory,
} from "@/lib/apiTypes";
import type {
  Discount,
  EditorImage,
  DiscountId,
  DiscountKind,
  EventCreateState,
  MonthlyOccurrence,
  ShowCarCategory,
  ShowCarCategoryId,
  TraderCategory,
  TraderCategoryId,
  TraderIcon,
  Ticket,
  TicketId,
  TicketListItem,
  TicketSection,
  SectionId,
  WeekdayLower,
} from "@/context/EventCreateContext";

/**
 * The fields produced by the mapper. This is a partial of the full
 * editor state - the mapper only owns fields that the API knows
 * about. Show-cars / car-clubs / traders / event-type (general/
 * dev_club/venue_dover) aren't in the API yet, so they stay at
 * their initial-state defaults until those endpoints land.
 */
export type HydratedEventState = Pick<
  EventCreateState,
  | "encryptedId"
  | "postId"
  | "permalink"
  | "title"
  | "categoryIds"
  | "location"
  | "locationCoords"
  | "dateType"
  | "startDate"
  | "endDate"
  | "startTime"
  | "endTime"
  | "hideTimes"
  | "uniqueTimesPerDay"
  | "perDayTimes"
  | "recurringFrequency"
  | "recurringWeek"
  | "recurringMonth"
  | "recurringFirstDate"
  | "recurringUntilDate"
  | "recurringRepeatUntilCancelled"
  | "recurringCustomDates"
  | "timezone"
  | "description"
  | "websiteUrl"
  | "publicEmail"
  | "publicPhone"
  | "facebookUrl"
  | "instagramUrl"
  | "tiktokUrl"
  | "coverImage"
  | "gallery"
  | "ticketSource"
  | "ticketList"
  | "ticketFeeMode"
  | "showAttendees"
  | "externalTicketUrl"
  | "externalTicketInfo"
  | "freeEntryInfo"
  | "requireRegistration"
  | "ticketLogo"
  | "ticketInfo"
  | "ticketTerms"
  | "ticketsOnGate"
  | "ticketsOnGateInfo"
  | "discounts"
  | "status"
  | "livePostStatus"
  | "scheduledDate"
  | "scheduledTime"
  | "visibility"
  | "hostName"
>;

export function mapEventEditResponse(
  response: ApiEventEditResponse,
): HydratedEventState {
  return {
    encryptedId: response.encrypted_id,
    postId: response.event_id ?? null,

    // ---- Basics -------------------------------------------------------
    title: response.basics.title,
    categoryIds: response.basics.category_ids,
    location: response.basics.location,
    locationCoords: response.basics.location_coords,

    // ---- Host eyebrow -------------------------------------------------
    // The WP form renders one of three hosts (club / venue /
    // organisation). The editor only stores a single string, so we pick
    // the first non-empty one in priority order. No host set means the
    // event is hosted by the organiser personally - "Me", matching the
    // create flow's default. Deliberately NOT the event title: the
    // Basics panel hides the "Hosted by" callout for self-hosted
    // events, and a title fallback made that check depend on the
    // (editable) title.
    hostName:
      response.host.venue ??
      response.host.club ??
      response.host.organisation ??
      "Me",

    // ---- Dates --------------------------------------------------------
    ...mapDates(response.dates),

    // ---- Description / contact ---------------------------------------
    description: response.description.description,
    websiteUrl: response.description.website_url,
    publicEmail: response.description.public_email,
    publicPhone: response.description.public_phone,
    facebookUrl: response.description.facebook_url,
    instagramUrl: response.description.instagram_url,
    tiktokUrl: response.description.tiktok_url,

    // ---- Media --------------------------------------------------------
    // The API returns image rows as { id, url, source } - `id` is the
    // Cloudflare image id, or a `wp:<attachment_id>` handle for
    // WordPress rows, or null for legacy ACF images that have a URL
    // but no removable backing. We carry both id and source through so
    // removal in the editor can hit DELETE /event-image for CF-backed
    // rows and just drop locally for the rest.
    coverImage: response.media.cover_image
      ? mapEditorImage(response.media.cover_image)
      : null,
    gallery: response.media.gallery.map(mapEditorImage),

    // ---- Tickets ------------------------------------------------------
    ticketSource: mapTicketSource(response.tickets.ticket_type),
    ticketFeeMode:
      response.tickets.pass_fees_to_customer === 1 ? "pass" : "absorb",
    showAttendees: response.tickets.show_attendees,
    requireRegistration: response.tickets.requires_registration,
    externalTicketUrl: response.tickets.external_tickets_url,
    externalTicketInfo: response.tickets.external_entry_details,
    freeEntryInfo: response.tickets.entry_details,
    ticketLogo: response.media.ticket_logo
      ? mapEditorImage(response.media.ticket_logo)
      : null,
    ticketInfo: response.tickets.event_tickets_information,
    ticketTerms: response.tickets.ticket_terms_and_conditions,
    ticketsOnGate: response.tickets.on_the_gate,
    ticketsOnGateInfo: response.tickets.on_gate_details,
    ticketList: mapTicketList(response.tickets.tickets),

    // ---- Discounts ----------------------------------------------------
    discounts: response.discounts.map(mapDiscount),

    // ---- Show cars (event-level settings only) ------------------------
    //
    // The API returns a discriminated union: { enabled: false } when
    // the section is off, or { enabled: true, config: {...} } when on.
    // We map each branch onto the flat state fields the panel uses.
    //
    // Categories themselves aren't hydrated here yet - they live as
    // tickets with is_show_car_ticket=1, and /event-edit doesn't
    // currently filter those out of the regular ticket list. Adding
    // that needs a small PHP change; until then showCarCategories
    // hydrates as empty and new categories disappear on refresh.
    ...mapShowCars(response.show_cars),

    // ---- Car clubs ------------------------------------------------------
    ...mapCarClubs(response.car_clubs),

    // ---- Traders --------------------------------------------------------
    ...mapTraders(response.traders),

    // ---- Publish ------------------------------------------------------
    ...mapPublish(response.publish),
  };
}

/**
 * Map one API media row onto the editor's remote EditorImage.
 *
 * Both `cloudflareId` and `source` are only set when the API sends
 * them - an image with no id has no removable backing at all, and a
 * missing `source` is left undefined so the remove handlers fall back
 * to their pre-existing "assume cloudflare" behaviour.
 */
function mapEditorImage(row: ApiEventEditImage): EditorImage {
  return {
    kind: "remote",
    url: row.url,
    ...(row.id ? { cloudflareId: row.id } : {}),
    ...(row.source ? { source: row.source } : {}),
  };
}

/**
 * Map the API's car_clubs union onto the editor's flat fields. Same
 * defaults-when-disabled approach as mapShowCars so the panel renders
 * cleanly if toggled on without a save in between.
 *
 * Server stores open/close as "YYYY-MM-DD HH:MM:SS"; the editor keeps
 * date and time in separate fields, so we split here.
 */
function mapCarClubs(
  api: ApiEventEditResponse["car_clubs"] | undefined | null,
): {
  carClubsEnabled: boolean;
  carClubsApplicationsOpen: string | null;
  carClubsApplicationsClose: string | null;
  carClubsApplicationsOpenTime: string;
  carClubsApplicationsCloseTime: string;
  carClubsLimitEnabled: boolean;
  carClubsMax: number;
  carClubsInfo: string;
  carClubsRequireTicket: boolean;
  carClubsTicketCost: number;
} {
  if (!api || !api.enabled) {
    return {
      carClubsEnabled: false,
      carClubsApplicationsOpen: null,
      carClubsApplicationsClose: null,
      carClubsApplicationsOpenTime: "09:00",
      carClubsApplicationsCloseTime: "23:59",
      carClubsLimitEnabled: false,
      carClubsMax: NaN,
      carClubsInfo: "",
      carClubsRequireTicket: false,
      carClubsTicketCost: NaN,
    };
  }
  const c = api.config;
  const hasMax = typeof c.max === "number" && Number.isFinite(c.max);

  const [openDate, openTime] = splitDateTime(c.open_date);
  const [closeDate, closeTime] = splitDateTime(c.close_date);

  return {
    carClubsEnabled: true,
    carClubsApplicationsOpen: openDate,
    carClubsApplicationsClose: closeDate,
    carClubsApplicationsOpenTime: openTime || "09:00",
    carClubsApplicationsCloseTime: closeTime || "23:59",
    carClubsLimitEnabled: hasMax,
    carClubsMax: hasMax ? (c.max as number) : NaN,
    carClubsInfo: c.info ?? "",
    carClubsRequireTicket: !!c.require_ticket,
    carClubsTicketCost:
      typeof c.ticket_cost === "number" && Number.isFinite(c.ticket_cost)
        ? c.ticket_cost
        : NaN,
  };
}

/** "YYYY-MM-DD HH:MM:SS" → ["YYYY-MM-DD", "HH:MM"]. Empty/invalid
 *  input yields [null, ""]. */
function splitDateTime(
  raw: string | null | undefined,
): [string | null, string] {
  if (!raw || typeof raw !== "string") return [null, ""];
  const trimmed = raw.trim();
  if (trimmed === "") return [null, ""];
  const datePart = trimmed.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return [null, ""];
  const timePart = trimmed.length >= 16 ? trimmed.slice(11, 16) : "";
  return [datePart, /^\d{2}:\d{2}$/.test(timePart) ? timePart : ""];
}

/**
 * Map the API's show_cars discriminated union onto the editor's flat
 * fields. When the section is disabled we still seed defaults so the
 * panel renders cleanly if the user toggles it on without saving
 * first.
 */
function mapShowCars(
  api: ApiEventEditResponse["show_cars"] | undefined | null,
): {
  showCarsEnabled: boolean;
  showCarsLimitEnabled: boolean;
  showCarsMax: number;
  showCarsInfo: string;
  showCarCategories: ShowCarCategory[];
} {
  // Missing or disabled → return defaults. The "missing" case covers
  // older /event-edit responses that pre-date the show_cars field;
  // FE and BE don't have to ship in lockstep this way.
  if (!api || !api.enabled) {
    return {
      showCarsEnabled: false,
      showCarsLimitEnabled: false,
      showCarsMax: NaN,
      showCarsInfo: "",
      showCarCategories: [],
    };
  }
  const c = api.config;
  // The capacity-limit toggle is derived: if the server has a max,
  // the limit is on; if it's null, the limit's off and the value
  // sits as NaN ("unset") for the input control.
  const hasMax = typeof c.max === "number" && Number.isFinite(c.max);
  return {
    showCarsEnabled: true,
    showCarsLimitEnabled: hasMax,
    showCarsMax: hasMax ? (c.max as number) : NaN,
    showCarsInfo: c.info ?? "",
    // Categories - empty array if the field is absent. We carry the
    // raw post id (not encrypted) as `id` so it matches what the save
    // endpoint returns and the panel's id-swap-on-create logic stays
    // consistent.
    showCarCategories: (api.categories ?? []).map(mapShowCarCategory),
  };
}

function mapShowCarCategory(api: ApiShowCarCategory): ShowCarCategory {
  return {
    id: api.id as ShowCarCategoryId,
    name: api.name,
    description: api.description,
    applicationsOpen: api.applications_open ?? null,
    applicationsClose: api.applications_close ?? null,
    // The editor uses NaN to mean "unset" so the input renders blank.
    spacesAvailable:
      typeof api.spaces_available === "number" ? api.spaces_available : NaN,
    requireTicket: api.require_ticket,
    // ticket_cost only matters when requireTicket is true - leave NaN
    // otherwise so the drawer's "ticket cost" input doesn't show 0.
    ticketCost:
      api.require_ticket && Number.isFinite(api.ticket_cost)
        ? api.ticket_cost
        : NaN,
    secretCode: api.secret_code ?? "",
  };
}

/**
 * Map the API's traders block onto the editor's flat fields. Trader
 * categories come from ce_event_trader_categories (their own table),
 * not from tickets - so unlike show cars they hydrate from a dedicated
 * `categories` array regardless of the ticket list.
 */
function mapTraders(api: ApiEventEditResponse["traders"] | undefined | null): {
  tradersEnabled: boolean;
  traderCategories: TraderCategory[];
} {
  if (!api || !api.enabled) {
    return { tradersEnabled: false, traderCategories: [] };
  }
  return {
    tradersEnabled: true,
    traderCategories: (api.categories ?? []).map(mapTraderCategory),
  };
}

const TRADER_ICON_SET = new Set<TraderIcon>([
  "utensils",
  "shirt",
  "wrench",
  "handshake",
]);

function mapTraderCategory(api: ApiTraderCategory): TraderCategory {
  // Guard the icon against unexpected values so the union type holds.
  const icon = TRADER_ICON_SET.has(api.icon as TraderIcon)
    ? (api.icon as TraderIcon)
    : "utensils";
  const mode: "online" | "in_person" =
    api.payment_mode === "in_person" ? "in_person" : "online";
  return {
    // Raw category id (matches what the save endpoint returns), so
    // edits route to update.
    id: String(api.id) as TraderCategoryId,
    name: api.name,
    icon,
    info: api.info ?? "",
    paymentMode: mode,
    ticketCost: Number.isFinite(api.ticket_cost) ? api.ticket_cost : NaN,
    spacesAvailable:
      typeof api.spaces_available === "number" ? api.spaces_available : NaN,
    secretCode: api.secret_code ?? "",
    applicationsOpen: api.applications_open ?? null,
    applicationsClose: api.applications_close ?? null,
  };
}

/**
 * The WP form's "ticket_type" is a 3-way enum:
 *   1 = none / not required
 *   2 = CarEvents managed ticketing
 *   3 = external website
 * Map onto the editor's string union. Anything unrecognised falls
 * back to "ce" because that's the most common default and matches
 * the legacy template's behaviour ("ticket_type=undefined" is
 * treated as 2 in the WP code).
 */
function mapTicketSource(value: number): "ce" | "external" | "none" {
  if (value === 1) return "none";
  if (value === 3) return "external";
  return "ce";
}

/**
 * Convert one ticket-table row (could be a section or an actual
 * ticket) into the editor's flat `TicketListItem` union.
 *
 * Sections only need a name + secret flag. Tickets carry the full
 * shape - we coerce all the string-encoded numerics into real
 * numbers, with NaN representing "unset".
 */
function mapTicketRow(row: ApiEventTicket): TicketListItem {
  if (row.ticket_section) {
    const section: TicketSection = {
      kind: "section",
      id: row.ticket_id as unknown as SectionId,
      name: row.name,
      // Sections carry their own secret_code_ticket flag - that's
      // what powers the "Secret ticket section" UI checkbox.
      isSecret: row.secret_code_ticket,
      // Pre-fill the code so the drawer shows what was stored rather
      // than silently overwriting it on the next save.
      secretCode: row.secret_code ?? "",
      encryptedTicketID: row.encrypted_ticket_id,
    };
    return section;
  }

  const ticket: Ticket = {
    kind: "ticket",
    id: row.ticket_id as unknown as TicketId,
    name: row.name,
    additionalInfo: row.description,
    // parseFloat returns NaN for "" and other non-numeric, which is
    // exactly the sentinel the editor uses for "unset".
    //
    // `stock` is REMAINING stock, not the total allocation: a
    // completed sale decrements it and increments `stock_sold`. That
    // is the same figure the drawer edits and the same figure the save
    // route writes straight back into the column, so it passes through
    // untouched in both directions.
    quantity: parseFloat(row.stock),
    quantitySold: parseCount(row.stock_sold),
    price: parseFloat(row.price),
    saleStart: extractIsoDate(row.ticket_date_start),
    saleEnd: extractIsoDate(row.ticket_date_end),
    // limit_per_order: 0 is the WP "no limit" sentinel. We translate
    // to NaN so the editor's `Number.isFinite` checks treat it as
    // unset (the limit field's placeholder text shows). If the user
    // wanted an explicit limit of 0 (i.e. nobody can buy any), they
    // wouldn't add the ticket in the first place.
    limitPerOrder: parseLimitOrUnlimited(row.limit_per_order),
    requireCarDetails: row.car_details_required,
    requireCarClubName: row.request_car_club,
    individualAttendeeDetails: row.request_attendance_details,
    requestVehiclePhoto: row.request_vehicle_photo,
    customQuestions: parseCustomQuestions(row.custom_questions),
    isSecret: row.secret_code_ticket,
    // Pre-fill the code so the drawer shows what's stored. Falls back
    // to empty string when isSecret is false (and the API returns "")
    // so the drawer's "auto-generate on first toggle" still kicks in
    // if the user later flips it on.
    secretCode: row.secret_code ?? "",
    encryptedTicketID: row.encrypted_ticket_id,
  };
  return ticket;
}

/**
 * Parse a numeric counter column that the table stores as a string and
 * may leave null. Anything unparseable counts as 0 - these are running
 * totals, so "unknown" and "none yet" are the same thing to the editor.
 */
function parseCount(raw: string | null | undefined): number {
  const n = parseFloat(raw ?? "");
  return Number.isFinite(n) ? n : 0;
}

/** Map the full ticket array. The API returns rows already sorted
 *  by display_order ASC and trash-filtered, so we don't re-sort. */
function mapTicketList(rows: ApiEventTicket[]): TicketListItem[] {
  return rows.map(mapTicketRow);
}

/**
 * Pull a "YYYY-MM-DD" out of the ticket table's "YYYY-MM-DD HH:MM:SS"
 * format. Returns null for missing/empty values so the editor's
 * datepicker treats the field as unset.
 *
 * The editor doesn't yet show the time portion of ticket sale
 * windows - only the date. Times default to 00:00 on save.
 */
function extractIsoDate(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const datePart = trimmed.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  return datePart;
}

/**
 * Convert WP's "0 = unlimited" sentinel for limit fields into the
 * editor's NaN-as-unset convention. Any positive integer passes
 * through; "0", "", null all become NaN.
 */
function parseLimitOrUnlimited(raw: string | null | undefined): number {
  if (!raw) return NaN;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return n;
}

/**
 * Convert a discount row from the WP shape to the editor's Discount
 * type. The major coercions:
 *
 *   - allowed_products is a comma-separated string. Empty string
 *     means "applies to all tickets" - same convention as the
 *     editor's empty array. Any populated list is split + cast.
 *   - discount_type maps from "percentage"/"fixed" to the editor's
 *     DiscountKind union directly. Unknown values default to
 *     "percentage" since that's the more common form.
 *   - 0-as-unlimited sentinels for max_usage_per_coupon /
 *     max_usage_per_user → null, matching the editor's
 *     `usageLimit: number | null` shape.
 *   - start_date / end_date are "YYYY-MM-DD HH:MM:SS"; we drop the
 *     time portion since the editor only renders dates.
 */
function mapDiscount(row: ApiEventDiscount): Discount {
  const allowed = row.allowed_products
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s as unknown as TicketId);

  return {
    id: row.ID as unknown as DiscountId,
    code: row.coupon_code,
    kind: mapDiscountKind(row.discount_type),
    amount: parseFloat(row.discount_amount),
    usageLimit: parseLimitNullable(row.max_usage_per_coupon),
    perCustomerLimit: parseLimitNullable(row.max_usage_per_user),
    // The custom table doesn't track per-discount usage counts on
    // the editor surface - bookings are summed elsewhere. Default
    // to 0 for new editor sessions; once we have a usage-summary
    // endpoint, populate from there.
    usageCount: 0,
    applicableTicketIds: allowed,
    availableFrom: extractIsoDate(row.start_date),
    availableUntil: extractIsoDate(row.end_date),
    // Free-text "note" doesn't have a column in the legacy table.
    note: "",
    discountGiven: row.discount_given ?? 0,
  };
}

function mapDiscountKind(raw: string): DiscountKind {
  if (raw === "fixed") return "fixed";
  return "percentage";
}

function parseLimitNullable(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Map the dates section to the editor's flat date fields.
 *
 * The legacy form supports several modes (single one-day, single
 * multi-day with shared time, single multi-day with per-day times,
 * recurring weekly/monthly, custom dates). The editor's existing
 * EventCreateState only models the simpler subset. For events that
 * use modes beyond this subset (custom-recurring with N rows of
 * per-day times; monthly with first/second/etc) we map what we can
 * - the date span - and leave the unsupported details out.
 */
function mapDates(
  api: ApiEventEditResponse["dates"],
): Pick<
  HydratedEventState,
  | "dateType"
  | "startDate"
  | "endDate"
  | "startTime"
  | "endTime"
  | "hideTimes"
  | "uniqueTimesPerDay"
  | "perDayTimes"
  | "recurringFrequency"
  | "recurringWeek"
  | "recurringMonth"
  | "recurringFirstDate"
  | "recurringUntilDate"
  | "recurringRepeatUntilCancelled"
  | "recurringCustomDates"
  | "timezone"
> {
  const dateType: "single" | "recurring" = api.is_recurring
    ? "recurring"
    : "single";

  const firstRow = api.date_rows[0];
  const lastRow = api.date_rows[api.date_rows.length - 1] ?? firstRow;

  // Default to today-ish if the event has no rows (shouldn't happen
  // for a saved event, but defensively).
  const todayIso = new Date().toISOString().slice(0, 10);

  const startDate = firstRow?.start_date || todayIso;
  const endDate = lastRow?.end_date || startDate;
  const startTime = firstRow?.start_time || "09:00";
  const endTime =
    firstRow?.end_time && firstRow.end_time !== "00:00"
      ? firstRow.end_time
      : "16:00";

  // Map recurring frequency. The WP `type` is "week" / "month" /
  // "custom"; the editor union now matches all three.
  const recurringFrequency: "weekly" | "monthly" | "custom" =
    api.recurring?.type === "month"
      ? "monthly"
      : api.recurring?.type === "custom"
        ? "custom"
        : "weekly";

  // Build perDayTimes from the API's date_rows. The legacy WP form
  // always emits one row per day (even for events that share a single
  // start/end time across the range - they're just identical). For
  // events with `is_multi_timeslot: true` each row's start_time and
  // end_time are the per-day values; for the others, they're all the
  // same and the editor's per-day UI is hidden anyway.
  //
  // We build the array regardless of mode so toggling on later
  // shows the existing values rather than blank rows. Empty/00:00
  // times get the editor's defaults so the time input has something
  // sensible to render.
  const perDayTimes = api.date_rows.map((row) => ({
    date: row.start_date,
    startTime:
      row.start_time && row.start_time !== "00:00" ? row.start_time : "09:00",
    endTime: row.end_time && row.end_time !== "00:00" ? row.end_time : "16:00",
  }));

  // Recurring week/month - the WP form stores these on the event as
  // top-level ACF fields. The API surfaces them inside the `recurring`
  // object only when `is_recurring=true`. Fall back to safe defaults
  // when missing - `sunday` and `first_sunday` match the legacy
  // template's defaults.
  const recurringWeek = mapWeekdayLower(api.recurring?.week);
  const recurringMonth = mapMonthlyOccurrence(api.recurring?.month);

  // Custom recurring dates - only for `type=custom` events. The API
  // currently exposes the date range via `date_rows` (same shape as
  // perDayTimes). Each row becomes one custom-date entry. We give
  // each a synthetic id so React keys are stable across reorders;
  // the date itself isn't unique enough (custom mode allows the
  // same date twice for split-day events).
  const recurringCustomDates =
    api.recurring?.type === "custom"
      ? api.date_rows.map((row, i) => ({
          id: `cd-${i}-${row.start_date}`,
          date: row.start_date || null,
          startTime:
            row.start_time && row.start_time !== "00:00"
              ? row.start_time
              : "09:00",
          endTime:
            row.end_time && row.end_time !== "00:00" ? row.end_time : "16:00",
        }))
      : [];

  return {
    dateType,
    startDate,
    endDate,
    startTime,
    endTime,
    hideTimes: api.exclude_time,
    uniqueTimesPerDay: api.is_multi_timeslot,
    perDayTimes,
    recurringFrequency,
    recurringWeek,
    recurringMonth,
    recurringFirstDate: dateType === "recurring" ? startDate : null,
    recurringUntilDate:
      dateType === "recurring" && !api.recurring?.repeat_until_cancelled
        ? endDate
        : null,
    recurringRepeatUntilCancelled:
      api.recurring?.repeat_until_cancelled ?? false,
    recurringCustomDates,
    timezone: api.timezone,
  };
}

/**
 * Coerce an arbitrary string from the API into a valid WeekdayLower.
 * Falls back to "sunday" for unknown values so the form has
 * something to render.
 */
function mapWeekdayLower(raw: string | undefined | null): WeekdayLower {
  if (!raw) return "sunday";
  const allowed: WeekdayLower[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const lower = raw.toLowerCase().trim();
  return (allowed as readonly string[]).includes(lower)
    ? (lower as WeekdayLower)
    : "sunday";
}

/**
 * Coerce the API's `recurring_month` into a valid MonthlyOccurrence
 * slug. The legacy WP form has a slug-vs-label gotcha: depending on
 * how ACF was configured, the saved value can be either:
 *   - the slug ("first_monday")
 *   - the label ("First Monday of each month")
 *
 * We try slug first; if it doesn't match, we parse the label by
 * extracting the ordinal + weekday words. Falls back to "first_sunday"
 * when nothing fits.
 */
function mapMonthlyOccurrence(
  raw: string | undefined | null,
): MonthlyOccurrence {
  if (!raw) return "first_sunday";
  const trimmed = raw.trim().toLowerCase();
  // Slug form first.
  if (
    /^(first|second|third|fourth|last)_(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/.test(
      trimmed,
    )
  ) {
    return trimmed as MonthlyOccurrence;
  }
  // Label form: "First Monday of each month" → "first_monday".
  const labelMatch = trimmed.match(
    /^(first|second|third|fourth|last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (labelMatch) {
    return `${labelMatch[1]}_${labelMatch[2]}` as MonthlyOccurrence;
  }
  return "first_sunday";
}

/**
 * Convert WP's post-status enum + ACF visibility to the editor's
 * shapes. WP returns:
 *   - status:    "publish" | "draft" | "future" (raw post status)
 *   - visibility: 1 (public) | 2 (private)
 *
 * Editor stores:
 *   - status:    "draft" | "published" | "scheduled"
 *   - visibility: "public" | "private"
 */
function mapPublish(
  api: ApiEventEditResponse["publish"],
): Pick<
  HydratedEventState,
  | "status"
  | "livePostStatus"
  | "scheduledDate"
  | "scheduledTime"
  | "visibility"
  | "permalink"
> {
  let status: "draft" | "published" | "scheduled";
  switch (api.status) {
    case "future":
      status = "scheduled";
      break;
    case "draft":
      status = "draft";
      break;
    case "publish":
    default:
      // 'publish', plus any other transient state ('pending', etc.)
      // - treat as published. The public/private distinction we
      // care about lives in the ACF visibility field, not the post
      // status.
      status = "published";
      break;
  }

  return {
    status,
    // Keep the raw server status alongside the radio mapping - the
    // editor chrome uses it to tell "already live" apart from "user
    // has picked Publish now but not saved yet".
    livePostStatus:
      api.status === "future" || api.status === "draft"
        ? api.status
        : "publish",
    scheduledDate: api.scheduled_date,
    scheduledTime: api.scheduled_time ?? "09:00",
    visibility: api.visibility === 2 ? "private" : "public",
    // The event's real public URL. WP owns the slug - it dedupes one
    // that's already taken, and leaves it alone when an event is
    // renamed - so this is the only trustworthy source for it. Absent
    // on older deploys; the Publish panel falls back to a preview.
    permalink: api.permalink ?? "",
  };
}

/**
 * Custom checkout questions off a ticket row. The API decodes the
 * stored JSON to [{id, label}]; a raw string (older backend) is parsed
 * here, and anything malformed collapses to "no questions".
 */
function parseCustomQuestions(
  raw: { id: string; label: string }[] | string | null | undefined,
): { id: string; label: string }[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: { id: string; label: string }[] = [];
  for (const q of list) {
    if (!q || typeof q !== "object") continue;
    const rec = q as Record<string, unknown>;
    const label = typeof rec.label === "string" ? rec.label.trim() : "";
    if (!label) continue;
    out.push({ id: typeof rec.id === "string" ? rec.id : "", label });
  }
  return out;
}
