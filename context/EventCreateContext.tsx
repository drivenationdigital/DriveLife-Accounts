"use client";

/**
 * Form state for the event-create wizard.
 *
 * Architecture:
 * - One `useReducer` for the entire form. Centralising the state means
 *   any panel can read/dispatch without prop-drilling, and complex
 *   nested updates (like editing a single ticket inside `tickets[]`)
 *   stay collocated here in typed actions instead of spread across
 *   panel components.
 * - Initial state matches the mockup so the page renders the same demo
 *   content the original HTML did. Fields default to empty / sensible
 *   values - when we wire the create-event WP route, this is also the
 *   shape that maps onto the API payload.
 *
 * Action discipline:
 * - One generic `SET_FIELD` for top-level scalar updates (title,
 *   description, etc.). Keeps the action surface small.
 * - Specific actions for collections (TOGGLE_CATEGORY, ADD_TICKET,
 *   UPDATE_TICKET, REMOVE_TICKET, etc.) so the reducer can do the
 *   immutable-update plumbing once instead of every caller doing it.
 *
 * As we port more panels in subsequent turns, new actions will be
 * added here. Keep the discriminated union exhaustive - TS will catch
 * missing branches in the reducer switch.
 */

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

// ============================================================
// Domain types
// ============================================================

/** Geographic point for the map preview. */
export type LatLng = { lat: number; lng: number };

/**
 * An image attached to the event - either already uploaded to the
 * server (`remote`) or selected from the user's device but not yet
 * uploaded (`local`).
 *
 * Why a discriminated union rather than a parallel "pending uploads"
 * structure?
 *
 *   - The mapper produces remotes when loading an existing event.
 *   - The image picker produces locals when the user adds a new
 *     image. Both end up in the same `gallery` array - no second
 *     source of truth to keep in sync.
 *   - The save flow gets to switch on `kind` and only upload locals.
 *   - The image preview component renders both kinds the same way:
 *     `kind === "remote"` uses `url`; `kind === "local"` uses
 *     `previewUrl` (a `URL.createObjectURL(file)` blob URL).
 *
 * Local entries hold both the `previewUrl` (for rendering) and the
 * `file` (for the upload payload). The previewUrl must be revoked
 * via `URL.revokeObjectURL` when the entry is removed, otherwise
 * the browser keeps the blob alive - see the gallery panel for the
 * cleanup hooks.
 */
export type EditorImage =
  | {
      kind: "remote";
      url: string;
      /** Media id used by the DELETE /event-image flow - the
       *  Cloudflare image hash for CF uploads, a `wp:<attachment_id>`
       *  handle for WordPress rows. Optional so legacy ACF-backed
       *  images (which only have a url) stay valid; the remove
       *  handlers check for it before calling the server. */
      cloudflareId?: string;
      /** Where the file lives. Only "cloudflare" images are ours to
       *  delete server-side - WordPress attachments are dropped from
       *  local state and the shortened gallery is written on save.
       *  Undefined means "assume cloudflare", which keeps images
       *  uploaded through this editor (and older /event-edit payloads
       *  without the field) on the delete path. */
      source?: "cloudflare" | "wordpress" | string;
    }
  | { kind: "local"; previewUrl: string; file: File };

// ----------------------------------------------------------------
// Tickets & Sections
// ----------------------------------------------------------------

/** Branded ID type - opaque string at runtime, but distinct in TS so
 * we can't accidentally pass a section id where a ticket id is wanted.
 * The actual values are short randoms generated client-side until the
 * API assigns real ones on save. */
export type TicketId = string & { readonly __brand: "TicketId" };
export type SectionId = string & { readonly __brand: "SectionId" };

/** Mode for the top of the Tickets panel. Drives which sub-form
 * renders: the full ticket builder, an external URL field, or just
 * an entry-info textarea + register-required checkbox. */
export type TicketSourceMode = "ce" | "external" | "none";

/** Fee handling on the seller side. `pass` means buyers pay the
 * booking fee on top; `absorb` means the host eats it. Drives the
 * "+ fees" suffix on price displays. */
export type TicketFeeMode = "pass" | "absorb";

/** A single ticket row. Position in the array IS the position - when
 * we POST to the API later we'll send `{tickets:[{id, position}]}`
 * derived from index rather than carrying a separate `position`
 * field that could drift. */
export type Ticket = {
  kind: "ticket";
  id: TicketId;
  name: string;
  /** Free-text additional info shown at checkout / on the ticket. */
  additionalInfo: string;
  /** How many can be sold. Stored as number (NaN ⇒ unset). */
  quantity: number;
  /** Price in major units (£), e.g. 12.5 for £12.50. Stored as number. */
  price: number;
  /** ISO yyyy-mm-dd, or null if not set (defaults to "on sale now"). */
  saleStart: string | null;
  saleEnd: string | null;
  /** Maximum tickets a single order can buy. NaN ⇒ unset. */
  limitPerOrder: number;
  /** Extra requirement toggles. `requireCarDetails` is the cue for
   *  rendering the dark "SHOW" badge in the list. */
  requireCarDetails: boolean;
  requireCarClubName: boolean;
  individualAttendeeDetails: boolean;
  requestVehiclePhoto: boolean;
  isSecret: boolean;
  /** When `isSecret` is true, the code buyers enter at checkout to
   *  unlock the ticket. Optional so existing call sites that build a
   *  Ticket without it keep typechecking - drawers / mappers default
   *  to empty when absent. */
  secretCode?: string;
  /** Encrypted post id for the ticket. Set by the eventEditMapper
   *  when hydrating from /event-edit; absent on locally-created
   *  tickets that haven't been saved yet. Used by the reorder
   *  mutation, which posts the encrypted id list to the server. */
  encryptedTicketID?: string;
};

/** A divider in the ticket list. Sits *between* tickets to group
 * them visually (Adults, Children, …). Sections drag and reorder
 * alongside tickets in a single flat list. */
export type TicketSection = {
  kind: "section";
  id: SectionId;
  name: string;
  /** When true, this section + its tickets are gated behind a
   *  secret code that buyers enter at checkout. Visual cue in the
   *  list is a small lock badge. */
  isSecret: boolean;
  /** Code buyers enter at checkout to unlock this section. Optional
   *  so existing call sites keep typechecking; drawers default to
   *  empty when absent. */
  secretCode?: string;
  /** Encrypted post id. Set by the eventEditMapper when hydrating
   *  from /event-edit; absent on locally-created sections that
   *  haven't been saved yet. Used by the reorder mutation. */
  encryptedTicketID?: string;
};

/** The ticket list is a flat array of either kind. Discriminated by
 * `.kind` so consumers can fork rendering. */
export type TicketListItem = Ticket | TicketSection;

// ----------------------------------------------------------------
// Discounts
// ----------------------------------------------------------------

export type DiscountId = string & { readonly __brand: "DiscountId" };

/** Discount type - percentage off (e.g. 15%) vs fixed amount (e.g. £5). */
export type DiscountKind = "percentage" | "fixed";

/** A promo / discount code. Many fields mirror the ticket schema:
 *
 *   - `code` is what the buyer enters at checkout. Stored uppercase.
 *   - `kind` + `amount` together describe the discount (15% or £5).
 *   - `usageLimit` / `perCustomerLimit` are nullable - null means
 *     unlimited (matches the "Leave blank for unlimited" copy).
 *   - `usageCount` is server-derived; on the client we keep it for
 *     the demo data so the list rows can render "Used X / Y". A
 *     freshly created discount defaults to 0.
 *   - `applicableTicketIds` - empty array = applies to all tickets,
 *     non-empty = only those ticket ids. We store empty for "all"
 *     rather than every-ticket-id so adding a new ticket later doesn't
 *     silently exclude it.
 *   - `availableFrom` / `availableUntil` window - nullable; null on
 *     either end means "no bound on that side". The "Expired" badge
 *     in the list is derived from `availableUntil` being in the past.
 */
export type Discount = {
  id: DiscountId;
  code: string;
  kind: DiscountKind;
  amount: number;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usageCount: number;
  /** Total £ discount given across all orders that used this code. */
  discountGiven: number;
  applicableTicketIds: TicketId[];
  availableFrom: string | null; // ISO yyyy-mm-dd
  availableUntil: string | null;
  /** Optional eyebrow note shown beneath the code in the list, e.g.
   *  "Club members only". Free-form. */
  note: string;
};

/** ISO weekday short codes used by the day-of-week chips on the
 * recurring-events form. Stored in state as an array (order doesn't
 * matter - the UI sorts by Mon..Sun for display). */
export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

/**
 * Lowercase weekday names - used for the recurring-event "every X"
 * dropdown. Matches the values stored in WP's `recurring_week` field
 * verbatim so we can round-trip without translation.
 */
export type WeekdayLower =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export const WEEKDAYS_LOWER: { value: WeekdayLower; label: string }[] = [
  { value: "monday", label: "Every Monday" },
  { value: "tuesday", label: "Every Tuesday" },
  { value: "wednesday", label: "Every Wednesday" },
  { value: "thursday", label: "Every Thursday" },
  { value: "friday", label: "Every Friday" },
  { value: "saturday", label: "Every Saturday" },
  { value: "sunday", label: "Every Sunday" },
];

/**
 * "Nth weekday of the month" slugs for the monthly recurring mode.
 * Format: `{ ordinal }_{ weekday }` - e.g. "first_monday",
 * "last_friday". 35 total. Matches WP's `recurring_month` legacy
 * value (the slug, not the human label - see notes in the field
 * mapper for the slug-vs-label gotcha).
 */
export type MonthlyOrdinal = "first" | "second" | "third" | "fourth" | "last";
export type MonthlyOccurrence = `${MonthlyOrdinal}_${WeekdayLower}`;

const MONTHLY_ORDINALS: MonthlyOrdinal[] = [
  "first",
  "second",
  "third",
  "fourth",
  "last",
];

/**
 * Build the full 35-option list as `{ value, label }` pairs. We
 * compute it once at module scope rather than on every render.
 *
 * Label format matches the WP form: "First Monday of each month".
 */
export const MONTHLY_OCCURRENCES: {
  value: MonthlyOccurrence;
  label: string;
}[] = (() => {
  const out: { value: MonthlyOccurrence; label: string }[] = [];
  for (const ord of MONTHLY_ORDINALS) {
    for (const wd of WEEKDAYS_LOWER) {
      const value = `${ord}_${wd.value}` as MonthlyOccurrence;
      const ordCap = ord[0]!.toUpperCase() + ord.slice(1);
      const wdCap = wd.value[0]!.toUpperCase() + wd.value.slice(1);
      out.push({ value, label: `${ordCap} ${wdCap} of each month` });
    }
  }
  return out;
})();

// ----------------------------------------------------------------
// Application categories - Show Cars, Traders
// ----------------------------------------------------------------
//
// Show-car categories and trader categories share most of their
// shape (name, application window, info text). They differ in:
//
//   - Show-car categories carry "spaces available" + a "ticket
//     required after acceptance" pair (with cost). Traders don't.
//   - Trader categories carry an icon (food / shirt / wrench /
//     handshake) used as the visual cue in the list. Show-car
//     categories all use the trophy icon.
//
// Rather than fight a discriminated union over two near-shapes, they
// stay as separate types - easier to reason about per-panel.

export type ShowCarCategoryId = string & {
  readonly __brand: "ShowCarCategoryId";
};
export type TraderCategoryId = string & {
  readonly __brand: "TraderCategoryId";
};

export type ShowCarCategory = {
  id: ShowCarCategoryId;
  name: string;
  description: string;
  applicationsOpen: string | null; // ISO yyyy-mm-dd
  applicationsClose: string | null;
  spacesAvailable: number; // NaN ⇒ unset
  /** When true, the row reveals a ticket-cost field. Stored
   *  separately from cost so toggling off doesn't lose the value.
   *  Even free categories (requireTicket=false) still flow through
   *  application + approval; approval just auto-confirms them
   *  instead of triggering a "buy ticket" email. */
  requireTicket: boolean;
  ticketCost: number; // NaN ⇒ unset
  /** Per-category secret code that gates the public ticket URL for
   *  this category. Each approved application gets a ticket link
   *  built from this code, so two applicants for different
   *  categories receive different links. Replaces the old
   *  event-wide showcar_secret_code which forced one code to unlock
   *  every category. */
  secretCode: string;
};

/** Curated icon set for trader categories - matches the mockup. */
export type TraderIcon = "utensils" | "shirt" | "wrench" | "handshake";

export const TRADER_ICONS: {
  id: TraderIcon;
  faClass: string;
  label: string;
}[] = [
  { id: "utensils", faClass: "fa-solid fa-utensils", label: "Food & drink" },
  { id: "shirt", faClass: "fa-solid fa-shirt", label: "Apparel" },
  { id: "wrench", faClass: "fa-solid fa-wrench", label: "Tools / parts" },
  { id: "handshake", faClass: "fa-solid fa-handshake", label: "Sponsors" },
];

export type TraderCategory = {
  id: TraderCategoryId;
  name: string;
  icon: TraderIcon;
  applicationsOpen: string | null;
  applicationsClose: string | null;
  /** Per-category info text (the WYSIWYG textarea content). */
  info: string;
  /** Payment mode - never free. 'online' takes payment at checkout
   *  via a hidden ticket; 'in_person' is invoice / bank transfer /
   *  pay-on-the-day (organiser marks confirmed once cleared). Both
   *  use the pending→approved→confirmed→rejected flow. */
  paymentMode: "online" | "in_person";
  /** Fee for the pitch. Recorded for both modes (in_person collects
   *  it offline). NaN ⇒ unset. */
  ticketCost: number;
  /** Spaces cap. NaN ⇒ unset/unlimited. */
  spacesAvailable: number;
  /** Per-category secret code gating the online ticket link. */
  secretCode: string;
};

/** Top-level form state. Only Basics is wired up so far; later panels
 * will populate dates / description / tickets / etc. */
export type EventCreateState = {
  // ---- Server identity ----
  // Set after the create-event API responds (or when the editor is
  // loaded via /events/new?eid=…). null = local-only state, no draft
  // saved on the server yet.
  encryptedId: string | null;

  // Which multisite blog the event lives on ("uk", "us", …). Comes from
  // the `?site=` param the events list puts on the editor link, and
  // must go back up on every save - encrypted ids repeat across
  // regions, so `encryptedId` alone doesn't identify the post. null on
  // a brand-new event (it's created on the API's default site) and on
  // older links that predate multisite.
  site: string | null;

  // Raw WP post id of the saved event, when editing an existing event.
  // null for a brand-new event with nothing saved yet. Used to build
  // the topbar Preview link (WP preview URL), which only shows when set.
  postId: number | null;

  // The post status the event actually has on the server right now
  // ("publish" | "draft" | "future"), as opposed to `status` below
  // which is the radio selection in the Publish panel. Hydrated on
  // load and refreshed after every save. null = never saved. Used to
  // decide whether the CTA reads "Publish" (going live is a change)
  // or "Save" (already live, this is just an update).
  livePostStatus: "publish" | "draft" | "future" | null;

  // ---- Create-flow result ----
  // Who the event is hosted by, chosen from the "Hosted by" dropdown
  // under the title. Replaces the old three-card event-type step.
  //   me    → the user's own event
  //   club  → hosted by a club they own/admin  (hostId = club id)
  //   venue → hosted by a venue they own        (hostId = venue id)
  hostType: "me" | "club" | "venue";
  hostId: number | null;

  // ---- Basics ----
  // Display name of the host (the dropdown label, e.g. the club/venue
  // name, or the user's name for "me").
  hostName: string;
  title: string;
  categoryIds: number[];
  location: string;
  locationCoords: LatLng | null;

  // ---- Dates ----
  // dateType drives which sub-form is visible. Single-event uses
  // start/end date+time directly; recurring uses recurring* fields.
  // Both shapes coexist in state so toggling between modes doesn't
  // wipe the user's entries.
  dateType: "single" | "recurring";
  startDate: string | null; // ISO yyyy-mm-dd
  endDate: string | null;
  startTime: string; // 24h "HH:MM"
  endTime: string;
  hideTimes: boolean; // hides times on event page
  uniqueTimesPerDay: boolean; // multi-day events with daily times
  /**
   * When `uniqueTimesPerDay` is on, each calendar day in the range
   * gets its own start/end times. Stored as an array keyed by date
   * so the UI can render per-day rows. The array is kept in sync
   * with the date range - new days are appended with current default
   * times, removed days drop, existing days preserve their times so
   * toggling the mode off and back on doesn't lose user input.
   *
   * When `uniqueTimesPerDay` is off, this array is ignored on save -
   * the single `startTime`/`endTime` scalars are the source of truth.
   * We don't clear the array on toggle-off, so flipping back on
   * restores the per-day values.
   */
  perDayTimes: Array<{
    date: string; // "YYYY-MM-DD"
    startTime: string; // "HH:MM"
    endTime: string;
  }>;
  recurringFrequency: "weekly" | "monthly" | "custom";
  /**
   * For `weekly` mode: which day of the week the event repeats on.
   * Single-select (matches the WP `recurring_week` field), not multi.
   * Lowercase day name to match WP's stored value verbatim.
   */
  recurringWeek: WeekdayLower;
  /**
   * For `monthly` mode: which "Nth weekday of the month" the event
   * repeats on. Stored as a slug like "first_monday" / "last_friday"
   * - same shape as WP's `recurring_month` field.
   *
   * 35 combinations: { first | second | third | fourth | last } ×
   * { sunday | monday | … | saturday }. Helpers below build the list.
   */
  recurringMonth: MonthlyOccurrence;
  recurringFirstDate: string | null;
  recurringUntilDate: string | null;
  /**
   * Pairs with the "Repeat until cancelled" checkbox in the WP form.
   * When true, the until-date input is disabled and the series has
   * no end. Maps to WP's `event_end_date_checkbox`.
   */
  recurringRepeatUntilCancelled: boolean;
  /**
   * For `custom` mode: a flat list of one-off dates with their own
   * start/end times. Maps to WP's `custom_event_start_date[]` /
   * `custom_event_start_time[]` / `custom_event_end_time[]` arrays.
   * Distinct from `perDayTimes` (which is for multi-day single events).
   */
  recurringCustomDates: Array<{
    /** Synthetic id so React can key rows even when dates duplicate. */
    id: string;
    date: string | null; // "YYYY-MM-DD" or null while picking
    startTime: string;
    endTime: string;
  }>;
  timezone: string;
  /**
   * True while `timezone` is still an automatic value that picking an
   * address is allowed to replace.
   *
   * Cleared the moment the organiser changes the dropdown themselves,
   * and cleared on hydrate so a saved event's stored zone is treated as
   * a decision already made. Without this, editing the address on an
   * event whose timezone had been deliberately corrected would silently
   * revert it - and a wrong timezone shifts every start time, sale
   * window and door time on the event by hours.
   *
   * UI-only: not sent to the API and not read back from it.
   */
  timezoneIsAuto: boolean;

  // ---- Description ----
  description: string;
  websiteUrl: string;
  publicEmail: string;
  publicPhone: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;

  // ---- Cover image + gallery ----
  // Each image is either a "remote" URL (already uploaded - typical
  // for events loaded from the API) or a "local" File that's been
  // selected from the device but not yet uploaded. The save flow
  // walks the gallery, uploads any locals, and replaces them with
  // remotes. See EditorImage below.
  coverImage: EditorImage | null;
  gallery: EditorImage[];

  // ---- Tickets ----
  // The mode drives which sub-form is visible. Each mode has its own
  // satellite fields - they all coexist in state so toggling between
  // modes doesn't wipe entries.
  ticketSource: TicketSourceMode;

  // CE mode (managed ticketing) - full list + fee/attendees toggles.
  ticketList: TicketListItem[];
  ticketFeeMode: TicketFeeMode;
  showAttendees: boolean;

  // External mode - URL the buyer's "Buy tickets" button points at,
  // plus optional info text shown alongside.
  externalTicketUrl: string;
  externalTicketInfo: string;

  // None / Free mode - entry info + whether visitors must register.
  freeEntryInfo: string;
  requireRegistration: boolean;

  // Applies to every ticketing mode: the logo printed on the ticket,
  // the blurb shown alongside the ticket selection, the T&Cs / refund
  // policy the buyer agrees to, and whether tickets are also sold on
  // the gate (with the details of that arrangement).
  ticketLogo: EditorImage | null;
  ticketInfo: string;
  ticketTerms: string;
  ticketsOnGate: boolean;
  ticketsOnGateInfo: string;

  // ---- Discounts ----
  discounts: Discount[];

  // ---- Show Cars ----
  // Master toggle gates the section. Capacity limit is paired -
  // toggle on reveals the maxShowCars input. Categories list is
  // reorderable. Info text is the per-event blurb shown on the
  // application landing page.
  showCarsEnabled: boolean;
  showCarsLimitEnabled: boolean;
  showCarsMax: number; // NaN ⇒ unset
  showCarCategories: ShowCarCategory[];
  showCarsInfo: string;

  // ---- Car Clubs ----
  // Single application window (no per-category windows, unlike show
  // cars / traders). Optional capacity cap, optional ticket-after-
  // acceptance with cost.
  carClubsEnabled: boolean;
  carClubsApplicationsOpen: string | null;
  carClubsApplicationsClose: string | null;
  carClubsApplicationsOpenTime: string;
  carClubsApplicationsCloseTime: string;
  carClubsLimitEnabled: boolean;
  carClubsMax: number;
  carClubsRequireTicket: boolean;
  carClubsTicketCost: number;
  carClubsInfo: string;

  // ---- Traders ----
  // No event-level application window - each trader category has its
  // own. Info text per category lives on TraderCategory.
  tradersEnabled: boolean;
  traderCategories: TraderCategory[];

  // ---- Publish ----
  // `scheduled` adds two extra fields (scheduledDate / scheduledTime)
  // that are only meaningful when status === 'scheduled'. Kept as
  // separate scalars rather than a discriminated union for ease of
  // SET_FIELD updates.
  status: "draft" | "published" | "scheduled";
  scheduledDate: string | null;
  scheduledTime: string;
  visibility: "public" | "private";

  // ---- Change tracking ----
  // True when the user has edited anything since the last load/save.
  // Maintained by the reducer wrapper (not dispatched directly): every
  // editing action sets it, HYDRATE/RESET clear it. Drives the topbar
  // "Not saved" indicator.
  isDirty: boolean;
};

// ============================================================
// Initial state - a blank event. Nothing here is demo content:
// every text field starts empty so "Add new event" opens a clean
// form, and only structural defaults (times, timezone, mode
// switches) are pre-set.
// ============================================================

const INITIAL_STATE: EventCreateState = {
  encryptedId: null,
  site: null,
  postId: null,
  livePostStatus: null,
  hostType: "me",
  hostId: null,
  hostName: "Me",
  title: "",
  categoryIds: [],
  location: "",
  locationCoords: null,

  dateType: "single",
  startDate: null,
  endDate: null,
  startTime: "09:00",
  endTime: "17:00",
  hideTimes: false,
  uniqueTimesPerDay: false,
  perDayTimes: [],
  recurringFrequency: "weekly",
  recurringWeek: "sunday",
  recurringMonth: "first_sunday",
  recurringFirstDate: null,
  recurringUntilDate: null,
  recurringRepeatUntilCancelled: false,
  recurringCustomDates: [],
  // Placeholder only - the region's default replaces this as soon as
  // the editor knows the region, and the address replaces that.
  timezone: "Europe/London",
  timezoneIsAuto: true,

  description: "",
  websiteUrl: "",
  publicEmail: "",
  publicPhone: "",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",

  coverImage: null,
  gallery: [],

  ticketSource: "ce",
  ticketList: [],
  ticketFeeMode: "pass",
  showAttendees: false,
  externalTicketUrl: "",
  externalTicketInfo: "",
  freeEntryInfo: "",
  requireRegistration: false,
  ticketLogo: null,
  ticketInfo: "",
  ticketTerms: "",
  ticketsOnGate: false,
  ticketsOnGateInfo: "",

  discounts: [],
  showCarsEnabled: true,
  showCarsLimitEnabled: false,
  showCarsMax: NaN,
  showCarCategories: [],
  showCarsInfo: "",

  carClubsEnabled: true,
  carClubsApplicationsOpen: null,
  carClubsApplicationsClose: null,
  carClubsApplicationsOpenTime: "09:00",
  carClubsApplicationsCloseTime: "23:59",
  carClubsLimitEnabled: false,
  carClubsMax: NaN,
  carClubsRequireTicket: false,
  carClubsTicketCost: NaN,
  carClubsInfo: "",

  tradersEnabled: true,
  traderCategories: [],

  status: "published",
  scheduledDate: null,
  scheduledTime: "09:00",
  visibility: "public",

  isDirty: false,
};

// ============================================================
// Actions
// ============================================================

/** Keys whose values are scalar (string / number / boolean / null /
 * LatLng-or-null). Listed explicitly rather than computed - TS conditional
 * types over union state keys can be brittle, and an explicit list is
 * easier to read and maintain. */
type ScalarStateKey =
  | "encryptedId"
  | "site"
  | "livePostStatus"
  | "hostType"
  | "hostId"
  | "hostName"
  | "title"
  | "location"
  | "locationCoords"
  | "dateType"
  | "startDate"
  | "endDate"
  | "startTime"
  | "endTime"
  | "hideTimes"
  | "uniqueTimesPerDay"
  | "recurringFrequency"
  | "recurringWeek"
  | "recurringMonth"
  | "recurringFirstDate"
  | "recurringUntilDate"
  | "recurringRepeatUntilCancelled"
  | "timezone"
  | "timezoneIsAuto"
  | "description"
  | "websiteUrl"
  | "publicEmail"
  | "publicPhone"
  | "facebookUrl"
  | "instagramUrl"
  | "tiktokUrl"
  | "coverImage"
  | "ticketSource"
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
  | "showCarsEnabled"
  | "showCarsLimitEnabled"
  | "showCarsMax"
  | "showCarsInfo"
  | "carClubsEnabled"
  | "carClubsApplicationsOpen"
  | "carClubsApplicationsClose"
  | "carClubsApplicationsOpenTime"
  | "carClubsApplicationsCloseTime"
  | "carClubsLimitEnabled"
  | "carClubsMax"
  | "carClubsRequireTicket"
  | "carClubsTicketCost"
  | "carClubsInfo"
  | "tradersEnabled"
  | "status"
  | "scheduledDate"
  | "scheduledTime"
  | "visibility";

/**
 * SET_FIELD action - distributed over each scalar key so `value` is
 * narrowed to that key's field type. This means
 *   dispatch({ type: 'SET_FIELD', key: 'title', value: 123 })
 * is a type error, but
 *   dispatch({ type: 'SET_FIELD', key: 'title', value: 'My event' })
 * is fine. Similarly for null-able fields like locationCoords.
 */
type SetFieldAction = {
  [K in ScalarStateKey]: {
    type: "SET_FIELD";
    key: K;
    value: EventCreateState[K];
  };
}[ScalarStateKey];

export type EventCreateAction =
  | SetFieldAction
  | { type: "TOGGLE_CATEGORY"; id: number }
  // Custom recurring dates - flat list of one-off (date, startTime,
  // endTime) rows. Add/Update/Remove follow the same pattern as the
  // ticket/discount lists.
  | {
      type: "ADD_CUSTOM_DATE";
      row: {
        id: string;
        date: string | null;
        startTime: string;
        endTime: string;
      };
    }
  | {
      type: "UPDATE_CUSTOM_DATE";
      row: {
        id: string;
        date: string | null;
        startTime: string;
        endTime: string;
      };
    }
  | { type: "REMOVE_CUSTOM_DATE"; id: string }
  | { type: "SET_GALLERY"; items: EditorImage[] }
  // Replace the entire per-day times array atomically. Used by both
  // the user-editing-a-row flow (replace one entry by date) and the
  // sync helper that adds/removes rows when the date range changes.
  | {
      type: "SET_PER_DAY_TIMES";
      items: Array<{ date: string; startTime: string; endTime: string }>;
    }
  // Ticket-list mutations. Add/Update accept full Ticket/Section
  // objects so the panel/drawer can compose IDs, defaults, etc.,
  // before dispatching. Reorder accepts the full new array - same
  // pattern as SET_GALLERY.
  | { type: "ADD_TICKET"; ticket: Ticket }
  | { type: "UPDATE_TICKET"; ticket: Ticket }
  | { type: "REMOVE_TICKET"; id: TicketId }
  | { type: "ADD_SECTION"; section: TicketSection }
  | { type: "UPDATE_SECTION"; section: TicketSection }
  | { type: "REMOVE_SECTION"; id: SectionId }
  | { type: "REORDER_TICKET_LIST"; items: TicketListItem[] }
  // Discount-list mutations follow the same pattern as ticket actions.
  | { type: "ADD_DISCOUNT"; discount: Discount }
  | { type: "UPDATE_DISCOUNT"; discount: Discount }
  | { type: "REMOVE_DISCOUNT"; id: DiscountId }
  | { type: "REORDER_DISCOUNTS"; items: Discount[] }
  // Show-car category mutations.
  | { type: "ADD_SHOW_CAR_CATEGORY"; category: ShowCarCategory }
  | { type: "UPDATE_SHOW_CAR_CATEGORY"; category: ShowCarCategory }
  | { type: "REMOVE_SHOW_CAR_CATEGORY"; id: ShowCarCategoryId }
  | { type: "REORDER_SHOW_CAR_CATEGORIES"; items: ShowCarCategory[] }
  // Trader category mutations.
  | { type: "ADD_TRADER_CATEGORY"; category: TraderCategory }
  | { type: "UPDATE_TRADER_CATEGORY"; category: TraderCategory }
  | { type: "REMOVE_TRADER_CATEGORY"; id: TraderCategoryId }
  | { type: "REORDER_TRADER_CATEGORIES"; items: TraderCategory[] }
  // HYDRATE: atomically replace many fields at once. Used by the
  // editor page's load-event flow - the API mapper produces a
  // partial of the full state, and HYDRATE merges it in. This is
  // safer than dispatching N SET_FIELDs in sequence (which would
  // cause N renders) and keeps the loaded values invisible to the
  // user until they're all in place.
  | { type: "HYDRATE"; partial: Partial<EventCreateState> }
  | { type: "RESET" };

// ============================================================
// Reducer
// ============================================================

function reducer(
  state: EventCreateState,
  action: EventCreateAction,
): EventCreateState {
  const next = applyAction(state, action);

  // Dirty flag, handled once here rather than per-case: HYDRATE and
  // RESET represent server/pristine state (a load, a completed save,
  // or a fresh editor), so they mark the state clean. Every other
  // action is a user edit and marks it dirty.
  if (action.type === "HYDRATE" || action.type === "RESET") {
    return next.isDirty ? { ...next, isDirty: false } : next;
  }
  if (next === state) {
    return state;
  }
  return next.isDirty ? next : { ...next, isDirty: true };
}

function applyAction(
  state: EventCreateState,
  action: EventCreateAction,
): EventCreateState {
  switch (action.type) {
    case "SET_FIELD":
      // Each variant of SetFieldAction has a matching key/value pair, so
      // the resulting object is correctly typed.
      return { ...state, [action.key]: action.value };

    case "TOGGLE_CATEGORY": {
      const exists = state.categoryIds.includes(action.id);
      return {
        ...state,
        categoryIds: exists
          ? state.categoryIds.filter((id) => id !== action.id)
          : [...state.categoryIds, action.id],
      };
    }

    case "ADD_CUSTOM_DATE":
      return {
        ...state,
        recurringCustomDates: [...state.recurringCustomDates, action.row],
      };

    case "UPDATE_CUSTOM_DATE":
      return {
        ...state,
        recurringCustomDates: state.recurringCustomDates.map((r) =>
          r.id === action.row.id ? action.row : r,
        ),
      };

    case "REMOVE_CUSTOM_DATE":
      return {
        ...state,
        recurringCustomDates: state.recurringCustomDates.filter(
          (r) => r.id !== action.id,
        ),
      };

    case "SET_GALLERY":
      return { ...state, gallery: action.items };

    case "SET_PER_DAY_TIMES":
      return { ...state, perDayTimes: action.items };

    case "ADD_TICKET":
      return { ...state, ticketList: [...state.ticketList, action.ticket] };

    case "UPDATE_TICKET":
      return {
        ...state,
        ticketList: state.ticketList.map((item) =>
          item.kind === "ticket" && item.id === action.ticket.id
            ? action.ticket
            : item,
        ),
      };

    case "REMOVE_TICKET":
      return {
        ...state,
        ticketList: state.ticketList.filter(
          (item) => !(item.kind === "ticket" && item.id === action.id),
        ),
      };

    case "ADD_SECTION":
      return {
        ...state,
        ticketList: [...state.ticketList, action.section],
      };

    case "UPDATE_SECTION":
      return {
        ...state,
        ticketList: state.ticketList.map((item) =>
          item.kind === "section" && item.id === action.section.id
            ? action.section
            : item,
        ),
      };

    case "REMOVE_SECTION":
      return {
        ...state,
        ticketList: state.ticketList.filter(
          (item) => !(item.kind === "section" && item.id === action.id),
        ),
      };

    case "REORDER_TICKET_LIST":
      return { ...state, ticketList: action.items };

    case "ADD_DISCOUNT":
      return { ...state, discounts: [...state.discounts, action.discount] };

    case "UPDATE_DISCOUNT":
      return {
        ...state,
        discounts: state.discounts.map((d) =>
          d.id === action.discount.id ? action.discount : d,
        ),
      };

    case "REMOVE_DISCOUNT":
      return {
        ...state,
        discounts: state.discounts.filter((d) => d.id !== action.id),
      };

    case "REORDER_DISCOUNTS":
      return { ...state, discounts: action.items };

    case "ADD_SHOW_CAR_CATEGORY":
      return {
        ...state,
        showCarCategories: [...state.showCarCategories, action.category],
      };

    case "UPDATE_SHOW_CAR_CATEGORY":
      return {
        ...state,
        showCarCategories: state.showCarCategories.map((c) =>
          c.id === action.category.id ? action.category : c,
        ),
      };

    case "REMOVE_SHOW_CAR_CATEGORY":
      return {
        ...state,
        showCarCategories: state.showCarCategories.filter(
          (c) => c.id !== action.id,
        ),
      };

    case "REORDER_SHOW_CAR_CATEGORIES":
      return { ...state, showCarCategories: action.items };

    case "ADD_TRADER_CATEGORY":
      return {
        ...state,
        traderCategories: [...state.traderCategories, action.category],
      };

    case "UPDATE_TRADER_CATEGORY":
      return {
        ...state,
        traderCategories: state.traderCategories.map((c) =>
          c.id === action.category.id ? action.category : c,
        ),
      };

    case "REMOVE_TRADER_CATEGORY":
      return {
        ...state,
        traderCategories: state.traderCategories.filter(
          (c) => c.id !== action.id,
        ),
      };

    case "REORDER_TRADER_CATEGORIES":
      return { ...state, traderCategories: action.items };

    case "HYDRATE": {
      // Spread order matters: existing state first (so any keys not
      // in the partial are preserved), then the partial overrides.
      // The partial is typed as Partial<EventCreateState> so the
      // mapper can't accidentally introduce unknown fields.
      const next = { ...state, ...action.partial };
      // A saved event's stored timezone is a decision already taken -
      // by whoever created it, on that event's address. Editing the
      // address later must not silently move it. A saved event with no
      // timezone at all stays auto, so picking an address still fills
      // it in.
      return action.partial.timezone
        ? { ...next, timezoneIsAuto: false }
        : next;
    }

    case "RESET":
      return INITIAL_STATE;

    default: {
      // Exhaustiveness check - if a new action variant is added but no
      // case is added here, TS will error on this line.
      const _never: never = action;
      return state;
    }
  }
}

// ============================================================
// Provider + hook
// ============================================================

type ContextValue = {
  state: EventCreateState;
  dispatch: Dispatch<EventCreateAction>;
};

const EventCreateContext = createContext<ContextValue | null>(null);

export function EventCreateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  // Memoise so consumers don't re-render whenever the provider does (it
  // doesn't have its own state besides the reducer pair, but this is
  // the standard belt-and-braces pattern).
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <EventCreateContext.Provider value={value}>
      {children}
    </EventCreateContext.Provider>
  );
}

export function useEventCreate(): ContextValue {
  const ctx = useContext(EventCreateContext);
  if (!ctx) {
    throw new Error(
      "useEventCreate must be used inside an <EventCreateProvider>",
    );
  }
  return ctx;
}
