/**
 * Map the editor's `EventCreateState` into the body for
 * POST /event-update (see dl-accounts-event-update.php).
 *
 * This is the inverse of `lib/eventEditMapper.ts`. Where the edit
 * mapper translates the WP API's legacy shapes (int enums, "0"/"1"
 * strings, "publish"/"draft"/"future") *into* clean editor types,
 * this mapper translates them back *out* for the save.
 *
 * Design notes:
 *
 *   - Every section is optional in the request type, and we only emit
 *     a key when the editor actually has a value for it. The PHP side
 *     does partial updates (only writes fields present in the body),
 *     so omitting is always safe and non-destructive.
 *
 *   - The editor uses `NaN` as the "unset" sentinel for numeric
 *     fields. `finiteOrUndefined` collapses those to `undefined` so
 *     they're dropped from the payload rather than sent as `NaN`
 *     (which JSON.stringify would turn into `null`).
 *
 *   - RECURRING: the dates section is sent for recurring events too.
 *     It used to be omitted entirely, because the endpoint refused
 *     recurring conversion, which meant a schedule the editor happily
 *     collected was silently dropped on save. Now both shapes go up:
 *     a single event sends one `date_rows` entry per calendar day, a
 *     recurring one sends `is_recurring`, the `recurring` pattern
 *     block, and the rows that define the series' span.
 *
 *     The mapping is the exact inverse of what /event-edit returns
 *     (see mapDatesSection in lib/eventEditMapper.ts), so a saved
 *     schedule reloads into the same editor state it was saved from.
 *     That symmetry is the contract worth protecting here: if the two
 *     ever disagree, an edit-then-save round trip quietly rewrites the
 *     user's schedule.
 *
 *   - SHOW CARS: the editor models show-cars per *category* (each with
 *     its own window + ticket cost), but the API/endpoint is
 *     event-level (one window, one cost). The two don't map cleanly,
 *     so we only send the event-level bits the editor genuinely has
 *     (enabled / max / info) and leave open_date/close_date/paid/
 *     ticket_cost untouched. See the TODO in mapShowCars. Car-clubs,
 *     by contrast, is event-level on both sides and maps fully.
 */

import type { ApiEventDateRow } from "@/lib/apiTypes";
import type { EventCreateState } from "@/context/EventCreateContext";

// ============================================================
// Request / response types
// (Co-located with the mapper; promote to apiTypes.ts if preferred.)
// ============================================================

export interface ApiEventUpdateBasics {
  title?: string;
  category_ids?: number[];
  location?: string;
  location_coords?: { lat: number; lng: number } | null;
}

/**
 * The repeat pattern, mirroring `ApiEventRecurring` on the read side.
 *
 * `week` and `month` are always sent, whatever the type: the WP form
 * stores them as independent ACF fields, so a series switched from
 * weekly to monthly and back keeps the weekday the organiser picked
 * rather than falling back to the default.
 */
export interface ApiEventUpdateRecurring {
  type: "week" | "month" | "custom";
  /** Lowercase weekday, e.g. "sunday". Used when type is "week". */
  week: string;
  /** Nth-weekday slug, e.g. "first_sunday". Used when type is "month". */
  month: string;
  /** True when the series has no end date. */
  repeat_until_cancelled: boolean;
}

export interface ApiEventUpdateDates {
  timezone?: string;
  exclude_time?: boolean;
  is_multi_timeslot?: boolean;
  date_rows?: ApiEventDateRow[];
  /** Only sent for a recurring event, alongside `recurring` below. */
  is_recurring?: boolean;
  recurring?: ApiEventUpdateRecurring;
}

export interface ApiEventUpdateDescription {
  description?: string;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  public_email?: string;
  public_phone?: string;
}

export interface ApiEventUpdateTickets {
  ticket_type?: 1 | 2 | 3; // 1=none, 2=CE, 3=external
  pass_fees_to_customer?: 0 | 1;
  show_attendees?: boolean;
  requires_registration?: boolean;
  entry_details?: string;
  external_tickets_url?: string;
  external_entry_details?: string;
  event_tickets_information?: string;
  ticket_terms_and_conditions?: string;
  on_the_gate?: boolean;
  on_gate_details?: string;
}

export interface ApiEventUpdateSection {
  enabled?: boolean;
  open_date?: string | null; // "YYYY-MM-DD HH:MM:SS"
  close_date?: string | null;
  max?: number | "" | null; // "" clears the cap
  info?: string;
  paid?: boolean;
  ticket_cost?: number;
}

export interface ApiEventUpdateMedia {
  /** Gallery display order as media handles - the Cloudflare image
   *  hash for CF uploads, a `wp:<attachment_id>` handle for legacy
   *  WordPress rows. The files themselves travel through the
   *  /event-image* endpoints; this is only the sequence. */
  gallery_order?: string[];
}

export interface ApiEventUpdatePublish {
  status?: "draft" | "publish" | "future";
  scheduled_date?: string | null; // "YYYY-MM-DD"
  scheduled_time?: string | null; // "HH:MM"
  visibility?: 1 | 2; // 1=public, 2=private
}

export interface ApiEventUpdateRequest {
  basics?: ApiEventUpdateBasics;
  dates?: ApiEventUpdateDates;
  description?: ApiEventUpdateDescription;
  tickets?: ApiEventUpdateTickets;
  show_cars?: ApiEventUpdateSection;
  car_clubs?: ApiEventUpdateSection;
  /** Traders - only the enable flag is sent here. Categories save
   *  individually via /event-trader, so there are no per-section
   *  fields to persist. */
  traders?: { enabled: boolean };
  media?: ApiEventUpdateMedia;
  publish?: ApiEventUpdatePublish;
}

export interface ApiEventUpdateResponse {
  success: true;
  event_id: number;
  encrypted_id: string;
  post_status: string;
  updated_at: string | null;
}

// ============================================================
// Public API
// ============================================================

export function mapStateToUpdateRequest(
  state: EventCreateState,
): ApiEventUpdateRequest {
  const request: ApiEventUpdateRequest = {
    basics: mapBasics(state),
    description: mapDescription(state),
    tickets: mapTickets(state),
    car_clubs: mapCarClubs(state),
    show_cars: mapShowCars(state),
    traders: { enabled: state.tradersEnabled },
    media: mapMedia(state),
    publish: mapPublish(state),
  };

  // Omitted only when the user hasn't picked enough of a schedule to
  // describe one yet - never because of the schedule's shape.
  const dates = mapDates(state);
  if (dates) request.dates = dates;

  return request;
}

// ============================================================
// Section mappers
// ============================================================

function mapBasics(state: EventCreateState): ApiEventUpdateBasics {
  return {
    title: state.title,
    category_ids: state.categoryIds,
    location: state.location,
    // Editor's LatLng is { lat, lng } - same shape the endpoint wants.
    location_coords: state.locationCoords,
  };
}

/** Route to the single-event or recurring shape. */
function mapDates(state: EventCreateState): ApiEventUpdateDates | undefined {
  return state.dateType === "recurring"
    ? mapRecurringDates(state)
    : mapSingleDates(state);
}

/**
 * Build the date_rows array from the editor's flat date fields.
 *
 * Mirrors the legacy WP behaviour of storing one repeater row per
 * calendar day for multi-day events (the new endpoint stores rows
 * verbatim - it does NOT expand ranges - so the client must do it):
 *
 *   - single day              → 1 row
 *   - multi-day, per-day times → 1 row per perDayTimes entry
 *   - multi-day, shared times  → 1 row per day, all same start/end
 */
function mapSingleDates(
  state: EventCreateState,
): ApiEventUpdateDates | undefined {
  if (!state.startDate) return undefined;

  const start = state.startDate;
  const end = state.endDate || start;
  let dateRows: ApiEventDateRow[];

  if (start === end) {
    dateRows = [
      row(start, start, state.startTime, state.endTime, state.hideTimes),
    ];
  } else if (state.uniqueTimesPerDay && state.perDayTimes.length > 0) {
    dateRows = state.perDayTimes.map((d) =>
      row(d.date, d.date, d.startTime, d.endTime, state.hideTimes),
    );
  } else {
    dateRows = eachDayInclusive(start, end).map((date) =>
      row(date, date, state.startTime, state.endTime, state.hideTimes),
    );
  }

  return {
    timezone: state.timezone,
    exclude_time: state.hideTimes,
    is_multi_timeslot: state.uniqueTimesPerDay,
    date_rows: dateRows,
  };
}

/**
 * The recurring shape: a pattern plus the rows that anchor it.
 *
 * `date_rows` carries the span rather than an expansion of it - the
 * server generates the occurrences from the pattern, so sending every
 * computed date would both duplicate that work and disagree with it
 * the moment the pattern changes. What goes up is exactly what
 * /event-edit reads back out:
 *
 *   - weekly / monthly → ONE row, first date to until date. The read
 *     mapper takes `date_rows[0].start_date` as the first date and the
 *     last row's `end_date` as the until date.
 *   - custom           → one row per custom date, each with its own
 *     times, which is how the read mapper rebuilds the custom list.
 *
 * Returns `undefined` when the schedule isn't answerable yet (no first
 * date, or custom mode with no dated rows). That matches the
 * single-event branch: an incomplete schedule is omitted rather than
 * sent half-built, so a partial save can't overwrite a good schedule
 * with a broken one.
 */
function mapRecurringDates(
  state: EventCreateState,
): ApiEventUpdateDates | undefined {
  const type = recurringType(state.recurringFrequency);
  const dateRows =
    type === "custom" ? customDateRows(state) : patternDateRows(state);
  if (!dateRows) return undefined;

  return {
    timezone: state.timezone,
    exclude_time: state.hideTimes,
    // Per-day timeslots are a single-event feature; for a series the
    // only rows carrying times of their own are the custom ones.
    // `state.uniqueTimesPerDay` is stale here - the recurring form
    // never touches it - so it's derived rather than passed through.
    is_multi_timeslot: type === "custom",
    is_recurring: true,
    date_rows: dateRows,
    recurring: {
      type,
      week: state.recurringWeek,
      month: state.recurringMonth,
      repeat_until_cancelled: state.recurringRepeatUntilCancelled,
    },
  };
}

/** Editor frequency → the WP `recurring_type` vocabulary. */
function recurringType(
  frequency: EventCreateState["recurringFrequency"],
): ApiEventUpdateRecurring["type"] {
  if (frequency === "monthly") return "month";
  if (frequency === "custom") return "custom";
  return "week";
}

/**
 * The single span row for a weekly / monthly series.
 *
 * "Repeat until cancelled" has no end date to send, so the row ends on
 * the day it starts. The read mapper ignores that end date entirely
 * when the flag is set (it nulls the until-date), so the two agree.
 */
function patternDateRows(state: EventCreateState): ApiEventDateRow[] | null {
  const first = state.recurringFirstDate;
  if (!first) return null;
  const last = state.recurringRepeatUntilCancelled
    ? first
    : state.recurringUntilDate || first;
  return [row(first, last, state.startTime, state.endTime, state.hideTimes)];
}

/**
 * One row per custom date.
 *
 * Undated rows are dropped rather than sent as empty strings - the
 * editor seeds a blank row the moment the user clicks "add date", so
 * an in-progress row would otherwise save as a garbage occurrence.
 */
function customDateRows(state: EventCreateState): ApiEventDateRow[] | null {
  const rows = state.recurringCustomDates
    .filter((r): r is typeof r & { date: string } => Boolean(r.date))
    .map((r) => row(r.date, r.date, r.startTime, r.endTime, state.hideTimes));
  return rows.length > 0 ? rows : null;
}

function mapDescription(state: EventCreateState): ApiEventUpdateDescription {
  return {
    description: state.description,
    website_url: state.websiteUrl,
    facebook_url: state.facebookUrl,
    instagram_url: state.instagramUrl,
    tiktok_url: state.tiktokUrl,
    public_email: state.publicEmail,
    public_phone: state.publicPhone,
  };
}

function mapTickets(state: EventCreateState): ApiEventUpdateTickets {
  return {
    ticket_type:
      state.ticketSource === "none"
        ? 1
        : state.ticketSource === "external"
          ? 3
          : 2,
    pass_fees_to_customer: state.ticketFeeMode === "pass" ? 1 : 0,
    show_attendees: state.showAttendees,
    requires_registration: state.requireRegistration,
    entry_details: state.freeEntryInfo,
    external_tickets_url: state.externalTicketUrl,
    external_entry_details: state.externalTicketInfo,
    event_tickets_information: state.ticketInfo,
    ticket_terms_and_conditions: state.ticketTerms,
    on_the_gate: state.ticketsOnGate,
    // Only meaningful when on_the_gate is set; cleared otherwise so a
    // stale blurb can't linger after the toggle is switched off.
    on_gate_details: state.ticketsOnGate ? state.ticketsOnGateInfo : "",
    // Individual ticket ROWS (state.ticketList) are NOT sent here -
    // they have their own add/edit/remove endpoints.
  };
}

/**
 * Car clubs - clean event-level → event-level mapping.
 * Combines the separate date + time fields into the single datetime
 * the ACF field stores; the PHP side canonicalises it via strtotime.
 */
function mapCarClubs(state: EventCreateState): ApiEventUpdateSection {
  const section: ApiEventUpdateSection = {
    enabled: state.carClubsEnabled,
    open_date: combineDateTime(
      state.carClubsApplicationsOpen,
      state.carClubsApplicationsOpenTime,
      "00:00",
    ),
    close_date: combineDateTime(
      state.carClubsApplicationsClose,
      state.carClubsApplicationsCloseTime,
      "23:59",
    ),
    max: state.carClubsLimitEnabled ? finiteOrUndefined(state.carClubsMax) : "",
    info: state.carClubsInfo,
    paid: state.carClubsRequireTicket,
  };

  if (state.carClubsRequireTicket) {
    const cost = finiteOrUndefined(state.carClubsTicketCost);
    if (cost !== undefined) section.ticket_cost = cost;
  }

  return section;
}

/**
 * Show cars - only the event-level fields the editor genuinely has.
 *
 * TODO: the editor models show-cars per category (windows + per-cat
 * ticket cost via state.showCarCategories), which the event-level
 * endpoint can't represent. Until there's a per-category show-cars
 * save endpoint (or the editor collapses to a single event-level
 * window), open_date/close_date/paid/ticket_cost are deliberately
 * NOT sent - the PHP leaves those fields untouched.
 */
function mapShowCars(state: EventCreateState): ApiEventUpdateSection {
  return {
    enabled: state.showCarsEnabled,
    max: state.showCarsLimitEnabled ? finiteOrUndefined(state.showCarsMax) : "",
    // Defensive `?? ""`: if older context drops these fields from
    // state, send an empty string so the server gets an explicit
    // "clear" rather than JSON dropping the key entirely (which
    // leaves the previous value in place).
    info: state.showCarsInfo ?? "",
    // Secret codes moved per-category - see ShowCarCategoryDrawer.
    // The event-level secret_code field is gone; each show car
    // ticket carries its own code in the cc table now.
  };
}

/**
 * Media - the gallery's display order, as the handles the server
 * already knows each image by. Local images still uploading have no
 * server handle yet, so they're skipped; the upload flow swaps them
 * for remote entries in place, and the next save records them where
 * they sit. Sent even when empty so clearing the gallery clears the
 * stored order with it.
 */
function mapMedia(state: EventCreateState): ApiEventUpdateMedia {
  return {
    gallery_order: state.gallery.flatMap((img) =>
      img.kind === "remote" && img.cloudflareId ? [img.cloudflareId] : [],
    ),
  };
}

function mapPublish(state: EventCreateState): ApiEventUpdatePublish {
  const status =
    state.status === "published"
      ? "publish"
      : state.status === "scheduled"
        ? "future"
        : "draft";

  const publish: ApiEventUpdatePublish = {
    status,
    visibility: state.visibility === "private" ? 2 : 1,
  };

  // Only meaningful for scheduled events; the endpoint validates that
  // the combined datetime is in the future.
  if (status === "future") {
    publish.scheduled_date = state.scheduledDate;
    publish.scheduled_time = state.scheduledTime;
  }

  return publish;
}

// ============================================================
// Small helpers
// ============================================================

function row(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  excludeTime: boolean,
): ApiEventDateRow {
  return {
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    exclude_time: excludeTime,
  };
}

/** NaN (the editor's "unset" sentinel) → undefined, so the key is
 *  dropped from the payload rather than serialised as null. */
function finiteOrUndefined(n: number): number | undefined {
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Combine an ISO date ("YYYY-MM-DD") and a time ("HH:MM") into the
 * "YYYY-MM-DD HH:MM:SS" string the ACF datetime field stores. Returns
 * null when there's no date (clears the field). Falls back to a
 * sensible default time when the time is missing/malformed.
 */
function combineDateTime(
  date: string | null,
  time: string,
  fallbackTime: string,
): string | null {
  if (!date) return null;
  const t = /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : fallbackTime;
  return `${date} ${t}:00`;
}

/**
 * Inclusive list of "YYYY-MM-DD" dates from start to end. Uses UTC to
 * avoid local-timezone off-by-one drift around DST boundaries. Capped
 * at 366 iterations as a guard against an inverted/garbage range.
 */
function eachDayInclusive(startIso: string, endIso: string): string[] {
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
