// ─────────────────────────────────────────────────────────────────────────
// Types matching the /wp-json/dl-accounts/v1/ response shape
// ─────────────────────────────────────────────────────────────────────────

import { OrderStatus } from "@/context/types";

export type PostStatus = "publish" | "draft" | "future" | "cancelled" | string;
export type PostType = "events" | "club_events";

export interface EventStatus {
  slug: string;
  label: string;
}

export interface EventDate {
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
}

export interface RecurringInfo {
  type: "week" | "month" | "custom" | null;
  weekly_recurrance_type: string;
  monthly_recurrance_type: string;
  /** Pre-formatted human pattern, e.g. "Third Saturday Of Every Month".
   *  Render as-is - the server does the wording. */
  display: string;
  /** How many occurrences the series has. */
  child_count?: number;
  child_event_ids: number[];
  child_last_dates: string[];
}

/**
 * The occurrence a recurring list row now links to: the next upcoming
 * one, so a click lands on a real event view rather than the series
 * overview.
 */
export interface ApiNextOccurrence {
  id: number;
  eid: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: EventStatus;
  /** True when every occurrence has passed and this fell back to the
   *  FIRST child rather than a genuinely upcoming one. The row stays
   *  clickable either way. */
  is_past?: boolean;
}

export type EventPricingType = "free" | "ticketed";

/**
 * The multisite blog an event lives on. Returned per-event on list
 * responses and as the full available set on the response root, so the
 * UI can label an event with its country without a second lookup.
 */
export interface EventSite {
  /** Site slug used in URLs - "uk", "us", … */
  key: string;
  /** WP multisite blog id. */
  blog_id: number;
  /** Human label, e.g. "United Kingdom". */
  label: string;
  /** ISO 3166-1 alpha-2 code, e.g. "GB". Drives the flag icon. */
  country: string;
  /** ISO 4217 code, e.g. "GBP". */
  currency: string;
  currency_symbol: string;
  /** False when the site can't sell tickets. The UK and US sites are
   *  both ticketed; see TICKETING_FORCED_ON in lib/regions.ts for how a
   *  stale false is handled while the API catches up. */
  ticketing: boolean;
}

export interface EventRecord {
  id: number;
  /**
   * The SERIES identity on a recurring row - always the parent, never
   * an occurrence. Two things depend on that: pinning has to pin the
   * whole series, and "View Related Events" has to open the occurrence
   * table. Use `link_eid` for navigation instead; the two ids do
   * different jobs and must not be collapsed into one.
   */
  encrypted_id: string;
  /**
   * What the card links to: the next upcoming occurrence of a recurring
   * series, so a click lands on a real event view. Absent on
   * non-recurring events - fall back to `encrypted_id`.
   */
  link_eid?: string;
  /** Details of the occurrence `link_eid` points at. */
  next_occurrence?: ApiNextOccurrence;
  title: string;
  link: string;
  post_status: PostStatus;
  post_type: PostType;
  status: EventStatus;
  cover_image: string | null;
  dates: EventDate[];
  first_date: EventDate | null;
  last_date: EventDate | null;
  is_pinned: boolean;
  is_repeating: boolean;
  is_recurring: boolean;
  recurring: RecurringInfo | null;
  /** Only sent on the endpoints that gate management (saved events,
   * dashboard summary). Absent on /organiser-events, where everything
   * returned is already the user's own. */
  can_manage?: boolean;
  /** Added by the WP `dl_accounts_event_pricing_type()` helper. May be
   * absent on responses from older deployments - fall back to "free". */
  type?: EventPricingType;
  /** The card UI shows location too; surfaced on list responses when
   * available. Falls back to undefined for older deployments. */
  location?: {
    name: string | null;
    address: string | null;
  };
  /** Which country site the event belongs to. Optional for
   * back-compat with deployments that pre-date the multisite rollout. */
  site?: EventSite;
}

export interface EmptyState {
  title: string;
  content: string;
}

// ─────────────────────────────────────────────────────────────────────────
// /organiser-events
// ─────────────────────────────────────────────────────────────────────────

export type EventTypeFilter = 1 | 2 | 3 | 4 | 5;
// 1=All, 2=Live, 3=Draft, 4=Scheduled, 5=Club-only
export type EventDateFilter = 1 | 2;
// 1=Upcoming, 2=Past

export interface OrganiserEventsParams {
  filter_eventtype?: EventTypeFilter;
  filter_eventdate?: EventDateFilter;
  page?: number;
  per_page?: number;
  search?: string;
  /** Region FILTER, not an identifier - unlike the detail routes.
   *  Omitted merges every region the user organises on, which is what
   *  the account view wants. Pass a key only for an explicit filter. */
  site?: SiteKey;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface OrganiserEventsResponse {
  success: true;
  events: EventRecord[];
  /** Every site the user can organise on - the superset of the `site`
   * values on `events`. Intended for a future site filter; optional so
   * older deployments still parse. */
  sites?: EventSite[];
  pagination: PaginationMeta;
  search?: string;
  empty_state: EmptyState;
  /** Server-side diagnostics, null unless explicitly requested. */
  debug?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────
// /event + /event/orders
// ─────────────────────────────────────────────────────────────────────────

export interface ApiLocation {
  name: string | null;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

export interface ApiOrganiser {
  id: number;
  name: string;
}

export interface ApiEventCore {
  id: number;
  encrypted_id: string;
  /** Which country site this event lives on. Echoed back so the page
   *  doesn't have to trust the `site` it sent up; optional for
   *  back-compat with pre-multisite deployments. */
  site?: EventSite;
  title: string;
  slug: string;
  link: string;
  post_status: PostStatus;
  post_type: PostType | "recurring_events";
  status: EventStatus;
  description: string;
  description_plain: string;
  cover_image: string | null;
  dates: EventDate[];
  first_date: EventDate | null;
  last_date: EventDate | null;
  location: ApiLocation;
  organisers: ApiOrganiser[];
  is_pinned: boolean;
  is_recurring: boolean;
  recurring: ApiEventCoreRecurring | null;
  created_at: string;
  updated_at: string;
}

/**
 * Recurrence block on a single event. Present on BOTH the series parent
 * (`is_parent: true`) and each child occurrence, so a child can link
 * back up to its series without a second request.
 */
export interface ApiEventCoreRecurring {
  type: "week" | "month" | "custom" | null;
  /** Null when the pattern isn't of that granularity. */
  weekly_recurrance_type: string | null;
  monthly_recurrance_type: string | null;
  /** Pre-formatted pattern, e.g. "Third Saturday Of Every Month".
   *  Correct on children as well as parents - it used to come back
   *  empty on children. */
  display: string;
  /** Post id of the series parent. Null on the parent itself. */
  parent_id: number | null;
  /** Encrypted id of the series parent - what the child view's
   *  "View Related Events" link needs. Optional because older
   *  deployments returned `parent_id` only, which the UI can't link to. */
  parent_eid?: string | null;
  is_parent: boolean;
  has_end_date: boolean;
  /** How many occurrences the series has. */
  child_count?: number;
}

/**
 * One occurrence row on a recurring series parent. Each is a real
 * `events` post, so `eid` links straight through to its own event view.
 */
export interface ApiOccurrence {
  id: number;
  /** Encrypted id of the CHILD event. */
  eid: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  /** Flattened display string, not the structured ApiLocation. */
  location: string | null;
  status: EventStatus;
  is_deleted: boolean;
  /** False for finished / cancelled / deleted occurrences. Gates the
   *  row's actions. */
  can_manage: boolean;
  /** Public permalink. */
  link: string;
}

/**
 * The occurrence table shown in place of the sales dashboard when an
 * eid resolves to a series parent. Non-null ONLY for a parent.
 */
export interface ApiOccurrences {
  /** In the organiser's stored ACF order, NOT date order. Render as
   *  received - re-sorting client-side loses their ordering. */
  items: ApiOccurrence[];
  total: number;
  /** True when `items` contains deleted rows - gates the
   *  "Show deleted events" toggle. */
  has_deleted: boolean;
  /** Next upcoming occurrence, else the first. The anchor the legacy
   *  "Add Additional Dates" control used. */
  next: { id: number; eid: string } | null;
  /** Both derive from the FIRST child - the legacy page used them to
   *  decide whether to show the sales panels on the parent. */
  ticketed: boolean;
  registration_required: boolean;
}

export interface ApiTicketType {
  id: number | null;
  name: string;
  stock: number;
  stock_sold: number;
  capacity: number | null;
  price: number | null;
  date_start: string | null;
  date_end: string | null;
  sale_status: "active" | "sold_out" | "upcoming" | "ended";
  status_label: string;
}

export interface ApiBuyer {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface ApiCar {
  make: string | null;
  model: string | null;
  reg: string | null;
}

export interface ApiOrder {
  id: number;
  encrypted_id: string;
  date_created: string | null;
  buyer: ApiBuyer;
  quantity: number;
  total_amount: number;
  processing_fees: number;
  payment_method: string;
  marketing_opt_in: boolean;
  marketing_source: string | null;
  cars: ApiCar[];
  status: OrderStatus;
}

/**
 * One SOLD TICKET, not one order.
 *
 * A two-ticket order produces two of these, and because
 * `carevents_order_tickets` has no quantity column, buying two of the
 * same ticket gives two rows identical in every field except
 * `ticket_id`. Duplicate-looking rows are correct - don't dedupe them.
 *
 * The same shape is returned by `sales.attendees` on `/event` (the
 * recent slice) and by `tickets` on `/event/tickets` (paginated).
 */
export interface ApiAttendee {
  /** This row's own id (`carevents_order_ticket_meta.ID`), and the only
   *  field that distinguishes two otherwise-identical rows.
   *
   *  It used to repeat across every ticket in an order - the legacy
   *  query selected one arbitrary id per order - so a response where
   *  these collide is a stale backend, not bad data. */
  ticket_id: number;
  /** Which ticket TYPE was bought. Not shown in the table; kept so a
   *  row can be traced back to its ticket. */
  ticket_type_id: number;
  order_id: number;
  buyer: ApiBuyer;
  ticket_name: string;
  /** A number, unformatted - format with the region's currency. The US
   *  site returns USD, so this must never be prefixed with a hardcoded
   *  pound sign. */
  line_total: number;
  car: ApiCar;
  car_club: string | null;
  /** The legacy dashboard only showed this to users with the
   *  `tickets_concours` flag. We don't surface it, so there's nothing
   *  to gate yet. */
  is_concours: boolean;
}

export interface ApiDiscount {
  id: number | null;
  code: string;
  status: string;
  active_state: "active" | "upcoming" | "ended";
  status_label: string;
  discount_type: "percentage" | "fixed" | null;
  discount_amount: number;
  display_amount: string;
  usage: number;
  max_usage: number | null;
  start_date: string | null;
  end_date: string | null;
}

export interface ApiSalesKpis {
  order_count: number;
  ticket_count: number;
  gross_revenue: number;
  total_fees: number;
  net_revenue: number;
  orders_this_week: number;
  tickets_sold_recent: number;
}

export interface ApiOrdersMeta {
  total_count: number;
  returned_count: number;
  truncated: boolean;
}

export interface ApiSales {
  /** False on a region without ticketing. The
   *  block is still shape-identical - every count 0, every list empty -
   *  so nothing crashes; the UI hides the sales surfaces instead of
   *  rendering zeroes. Optional for back-compat: absent means true. */
  ticketing_available?: boolean;
  kpis: ApiSalesKpis;
  /** Regular ticket types. Show car tickets are filtered server-side
   *  into `show_car_tickets` below - same shape, just separated so
   *  they render in the show cars tab instead of the tickets
   *  breakdown. Optional for back-compat with older /event responses
   *  that don't yet filter; the FE treats absence as "no show car
   *  tickets" rather than erroring. */
  tickets: ApiTicketType[];
  show_car_tickets?: ApiTicketType[];
  orders: ApiOrder[];
  attendees: ApiAttendee[];
  discounts: ApiDiscount[];
  orders_meta: ApiOrdersMeta;
}

export interface ComingSoonStub {
  /** Always disabled - a coming-soon feature is off. Present so the
   *  traders union shares `enabled` as a common discriminant. */
  enabled: false;
  status: "coming_soon";
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Show cars + car clubs
// ─────────────────────────────────────────────────────────────────────────

export type ApplicationStatusApi =
  | "applied"
  | "approved"
  | "confirmed"
  | "rejected";

export interface ApiShowCarRecord {
  id: number;
  event_id: number;
  status: ApplicationStatusApi;
  /** Category name as set by the organiser on the ticket type. Empty
   *  string when the ticket was deleted after the application was
   *  submitted (LEFT JOIN). */
  category: string;
  car: {
    make: string | null;
    model: string | null;
    registration: string | null;
    /** Free-text colour from the apply form. Optional on the form, so
     *  frequently null/empty. */
    color: string | null;
    photo_url: string | null;
  };
  /** Car club block from the apply form. `attending` is the yes/no
   *  radio; `name` is only meaningful when it's true (the form clears
   *  it otherwise). `instagram` is the handle without the leading "@"
   *  and is collected regardless of club attendance.
   *
   *  Optional because the older /event `recent` buckets predate this
   *  block - treat a missing object as "not attending, no handle". */
  club?: {
    attending: boolean;
    name: string | null;
    instagram: string | null;
  } | null;
  applicant: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiCarClubRecord {
  id: number;
  event_id: number;
  status: ApplicationStatusApi;
  club_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  num_spaces: number | null;
  website_link: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiApplicationCounts {
  /** Legacy bucket - no longer populated by the API; use `pending`. */
  applied: number;
  /** Awaiting review. */
  pending: number;
  approved: number;
  confirmed: number;
  rejected: number;
  total: number;
}

export interface ApiShowCarsConfig {
  open_date: string | null;
  close_date: string | null;
  max: number | null;
  paid: boolean;
  ticket_cost: string | number | null;
  ticket_id: number | null;
  ticket_url: string | null;
  /** Free-text "show car info" the organiser writes (arrival times,
   *  parking instructions, perks). Stored in the `show_cars_description`
   *  ACF field server-side. */
  info: string;
}

/**
 * Per-category record returned in the /event-edit `show_cars.categories`
 * array. Each row maps 1:1 to a ticket with is_show_car_ticket=1; the
 * eventEditMapper translates it to the editor's ShowCarCategory shape.
 */
export interface ApiShowCarCategory {
  /** Raw post id as a string - matches what the show-car save endpoint
   *  returns (`String(ticket_id)`) so refresh-then-edit re-uses the
   *  same id. */
  id: string;
  encrypted_id: string;
  name: string;
  description: string;
  /** "YYYY-MM-DD" (date only - server strips the time portion). */
  applications_open: string | null;
  applications_close: string | null;
  spaces_available: number | null;
  /** Derived from price > 0 on the server. */
  require_ticket: boolean;
  ticket_cost: number;
  /** Per-category secret code. Gates the public ticket URL for this
   *  category; each approved application gets a personalised link
   *  built from this code. Replaces the old event-wide
   *  showcar_secret_code. */
  secret_code: string;
}

export interface ApiShowCarsSection {
  enabled: true;
  config: ApiShowCarsConfig;
  /** Application counts - only present on the events-dashboard
   *  endpoint, not the editor's /event-edit. */
  counts?: ApiApplicationCounts;
  /** Recent applications - same as counts: dashboard only. */
  recent?: {
    applied: ApiShowCarRecord[];
    approved: ApiShowCarRecord[];
    confirmed: ApiShowCarRecord[];
    rejected: ApiShowCarRecord[];
  };
  /** Per-category list - only present on the editor's /event-edit
   *  endpoint, omitted on the dashboard endpoint. */
  categories?: ApiShowCarCategory[];
}

export interface ApiCarClubsSection {
  enabled: true;
  config: ApiShowCarsConfig; // same shape
  counts: ApiApplicationCounts;
  recent: {
    applied: ApiCarClubRecord[];
    approved: ApiCarClubRecord[];
    confirmed: ApiCarClubRecord[];
    rejected: ApiCarClubRecord[];
  };
}

/**
 * A section the API deliberately turned off. `reason` is
 * "ticketing_unavailable" on a region without ticketing; absent when
 * the organiser simply hasn't enabled the feature.
 */
export interface DisabledSection {
  enabled: false;
  reason?: "ticketing_unavailable" | string;
}

export type ApiShowCars = ApiShowCarsSection | DisabledSection;

/** Car clubs section in the /event-edit response. Single hidden
 *  ticket per event (vs. show cars' per-category tickets); ticket_id
 *  persists across disable/re-enable cycles so the same secret code
 *  keeps working for links already emailed to clubs. */
export interface ApiCarClubsConfig {
  open_date: string; // ISO "YYYY-MM-DD HH:MM:SS" or ""
  close_date: string; // same
  max: number | null;
  info: string;
  require_ticket: boolean;
  ticket_cost: number | null;
  ticket_id: number | null;
  secret_code: string;
  /** Confirmed slots: sold tickets (paid clubs) or the ACF
   *  confirmed-slots counter (free clubs). */
  confirmed: number;
  /** cap − confirmed, floored at 0. null when no cap is set. */
  remaining: number | null;
  /** Raw ticket stock counters - present only when a ticket exists. */
  stock: number | null;
  stock_sold: number;
  ticket_url: string; // "" until the ticket exists
}

/** Car clubs CONFIG block - returned by the editor's /event-edit
 *  endpoint. Distinct from ApiCarClubs (the dashboard /event
 *  applications section); don't conflate the two. */
export type ApiCarClubsConfigBlock =
  | { enabled: true; config: ApiCarClubsConfig }
  | DisabledSection;

/** Dashboard /event clubs section - application counts + recent
 *  lists. */
export type ApiCarClubs = ApiCarClubsSection | DisabledSection;

/** One trader category row from ce_event_trader_categories, as
 *  returned by /event-edit for editor hydration. */
export interface ApiTraderCategory {
  id: number;
  encrypted_id: string;
  name: string;
  icon: string;
  info: string;
  payment_mode: "online" | "in_person";
  ticket_cost: number;
  spaces_available: number | null;
  secret_code: string;
  ticket_id: number | null;
  applications_open: string | null; // yyyy-mm-dd
  applications_close: string | null;
}

/** Traders config block (editor /event-edit). */
export type ApiTradersConfigBlock =
  | { enabled: true; categories: ApiTraderCategory[] }
  | { enabled: false };

// Dashboard /event traders section. The dashboard now returns a real
// enabled flag + counts (config/recent intentionally omitted for now).
// The legacy coming_soon stub is still tolerated for older deploys.
export interface ApiTradersSection {
  enabled: true;
  counts: ApiApplicationCounts;
}
export type ApiTradersStub =
  | ApiTradersSection
  | (DisabledSection & { counts?: ApiApplicationCounts })
  | ComingSoonStub;

export interface EventResponse {
  success: true;
  /** The region the API actually resolved this eid on. Authoritative -
   *  prefer it over whatever `site` the page sent up. Optional for
   *  back-compat with pre-multisite deployments. */
  site?: EventSite;
  event: ApiEventCore;
  /** Non-null ONLY when the eid resolves to a recurring series parent.
   *  Switch the whole view on `occurrences !== null`. */
  occurrences?: ApiOccurrences | null;
  /** On a parent this is combined across every occurrence. */
  sales: ApiSales;
  show_cars: ApiShowCars;
  clubs: ApiCarClubs;
  traders: ApiTradersStub;
}

/**
 * Site key ("uk", "us", …) sent alongside an `eid` so the API knows
 * which multisite blog to switch to before resolving it. Encrypted ids
 * are only unique within a site, so every event-scoped route takes it.
 *
 * Optional everywhere: when omitted the API falls back to its default
 * site, which keeps older links (and endpoints that don't yet return a
 * site) working.
 */
export type SiteKey = string;

export interface EventParams {
  eid: string;
  site?: SiteKey;
  orders_limit?: number;
  apps_limit?: number;
}

export interface EventOrdersResponse {
  success: true;
  orders: ApiOrder[];
  attendees: ApiAttendee[];
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface EventOrdersParams {
  eid: string;
  site?: SiteKey;
  limit?: number;
  offset?: number;
}

// ─────────────────────────────────────────────────────────────────────────
// /event/show-cars + /event/car-clubs
// ─────────────────────────────────────────────────────────────────────────

export interface EventShowCarsParams {
  eid: string;
  site?: SiteKey;
  status?: ApplicationStatusApi;
  limit?: number;
  offset?: number;
}

export interface EventShowCarsResponse {
  success: true;
  items: ApiShowCarRecord[];
  status: ApplicationStatusApi | null;
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface EventCarClubsParams {
  eid: string;
  site?: SiteKey;
  status?: ApplicationStatusApi;
  limit?: number;
  offset?: number;
}

export interface EventCarClubsResponse {
  success: true;
  items: ApiCarClubRecord[];
  status: ApplicationStatusApi | null;
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// /next-dash-login + /me
// ─────────────────────────────────────────────────────────────────────────

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  display_name: string;
  roles: string[];
  /**
   * Profile types the user picked in the welcome flow - indices into
   * PROFILE_TYPE_OPTIONS (lib/profileTypes.ts), stored in the shared
   * `ce_user_meta.about_contents` row. Optional because tokens issued
   * before this shipped cached a user object without it.
   */
  about_contents?: number[];
  /** True while `about_contents` is empty, i.e. a brand-new account. */
  needs_onboarding?: boolean;
}

export interface LoginResponse {
  success: true;
  token: string;
  expires_at: number; // unix seconds
  user: AuthUser;
}

export interface MeResponse {
  success: true;
  user: AuthUser;
}

// ============================================================
// Load event for editing - GET /event-edit?eid=...
// ============================================================
//
// Mirrors the response shape from dl-accounts-event-edit.php.
// Field names match the PHP keys exactly; the FE-side mapper in
// lib/eventMapper.ts converts these to the editor's
// EventCreateState shape (camelCase, branded ids, enum unions).

/** Single date pair from the ACF `event_dates` repeater. Times are
 *  HH:MM strings; "00:00" is the default placeholder when no time
 *  has been set. `exclude_time` is per-row in storage but the legacy
 *  UI only exposes an event-wide checkbox. */
export interface ApiEventDateRow {
  start_date: string; // "YYYY-MM-DD" or ""
  end_date: string;
  start_time: string; // "HH:MM" or ""
  end_time: string;
  exclude_time: boolean;
}

export interface ApiEventRecurring {
  /** "week" | "month" | "custom". Stored as string to round-trip
   *  any future modes without breaking the type. */
  type: string;
  /** Day of the week for `type=week` - "monday" | … | "sunday". */
  week: string;
  /** "first_sunday" etc for `type=month`. May be a slug or a label
   *  depending on legacy save state - FE mapper handles both. */
  month: string;
  /** Pairs with the "Repeat until cancelled" checkbox. */
  repeat_until_cancelled: boolean;
}

/** Raw ticket row from the cc_tickets custom table. Many columns are
 *  null/optional because the table is shared between tickets,
 *  sections, and upsells. The mapper picks out the bits the editor
 *  needs for each kind. */
export interface ApiEventTicket {
  ID: string;
  event_id: string;
  ticket_id: string;
  encrypted_ticket_id: string;
  name: string;
  price: string;
  stock: string;
  stock_sold: string | null;
  stock_status: string;
  product_image: string;
  product_image_thumbnail: string;
  product_status: string; // 'publish' | 'draft' | 'trash' (trash filtered server-side)
  visibility: string;
  description: string;
  // Booleans normalised server-side from "0"/"1"/null.
  ticket_section: boolean;
  contact_details_required: boolean;
  car_details_required: boolean;
  concours: boolean;
  request_attendance_details: boolean;
  request_vehicle_photo: boolean;
  request_car_club: boolean;
  hidden_ticket: boolean;
  secret_code_ticket: boolean;
  secret_code: string;
  // Date strings: "YYYY-MM-DD HH:MM:SS" or null.
  ticket_date_start: string | null;
  ticket_date_end: string | null;
  display_order: string | null;
  max_tickets: string;
  limit_per_order: string;
  // Upsell-only columns; usually null on plain tickets.
  upsell_item: string | null;
  upsell_image: string;
  category_id: string | null;
  collection_delivery: string | null;
  collection_information: string | null;
  required_tickets: string | null;
  discount_code: string | null;
  secondary_email: string;
}

/** Raw discount/coupon row. */
export interface ApiEventDiscount {
  ID: string;
  encrypted_id: string;
  event_id: string;
  coupon_code: string;
  start_date: string | null; // "YYYY-MM-DD HH:MM:SS"
  end_date: string | null;
  status: string; // "active" | "inactive" | other
  discount_amount: string;
  discount_type: string; // "percentage" | "fixed" | …
  /** Comma-separated ticket_id values. */
  allowed_products: string;
  max_usage_per_coupon: string;
  max_usage_per_user: string;
  max_products_per_basket: string;
  /** Times used - populated when /event-edit calls
   *  cc_get_coupons_for_event with include_usage. */
  usage?: number;
  /** Total discount given for this coupon (sum of per-order
   *  `discounted` across non-cancelled orders). Editor-only - added
   *  in the /event-edit discount mapping, not the shared helper. */
  discount_given?: number;
}

export interface ApiEventEditResponse {
  success: true;
  event_id: number;
  encrypted_id: string;
  post_type: string;
  host: {
    club?: string;
    venue?: string;
    organisation?: string;
  };
  basics: {
    title: string;
    category_ids: number[];
    location: string;
    location_coords: { lat: number; lng: number } | null;
  };
  dates: {
    timezone: string;
    is_recurring: boolean;
    is_recurring_child: boolean;
    recurring_parent_id: string | null;
    date_rows: ApiEventDateRow[];
    is_multi_day: boolean;
    is_multi_timeslot: boolean;
    exclude_time: boolean;
    recurring: ApiEventRecurring | null;
  };
  description: {
    description: string;
    website_url: string;
    public_email: string;
    public_phone: string;
    facebook_url: string;
    instagram_url: string;
    tiktok_url: string;
  };
  media: {
    /** Editor-form media. `id` is the Cloudflare image id when the
     *  row comes from `ce_cf_events_media`; null for legacy ACF
     *  uploads where we only have a URL. The id is what powers
     *  server-side deletion (DELETE /event-image expects it). */
    cover_image: { id: string | null; url: string } | null;
    gallery: Array<{ id: string | null; url: string }>;
    /** Logo printed on this event's tickets (media_group
     *  "ticket_logo"). Optional so older /event-edit deploys that
     *  pre-date the ticket-logo rollout still parse; the mapper
     *  treats absence as "no logo set". */
    ticket_logo?: { id: string | null; url: string } | null;
  };
  tickets: {
    ticket_type: 1 | 2 | 3; // 1=none, 2=CE, 3=external
    pass_fees_to_customer: 0 | 1; // 1=pass, 0=absorb
    show_attendees: boolean;
    requires_registration: boolean;
    entry_details: string;
    external_tickets_url: string;
    external_entry_details: string;
    event_tickets_information: string;
    ticket_terms_and_conditions: string;
    on_the_gate: boolean;
    on_gate_details: string;
    tickets: ApiEventTicket[];
  };
  discounts: ApiEventDiscount[];
  /** Event-level show-cars settings. Reuses ApiShowCars from the
   *  event-detail endpoint - same shape, same discriminated union.
   *  May be absent in older /event-edit deploys that pre-date the
   *  show-cars rollout; the eventEditMapper tolerates that. */
  show_cars?: ApiShowCars;
  /** Car clubs config block (editor). Optional for the same
   *  older-deploy tolerance reason as show_cars. */
  car_clubs?: ApiCarClubsConfigBlock;
  /** Traders block (editor). Categories come from the dedicated
   *  ce_event_trader_categories table. */
  traders?: ApiTradersConfigBlock;
  publish: {
    /** Raw WP status - FE mapper converts to draft/published/scheduled. */
    status: string;
    scheduled_date: string | null; // "YYYY-MM-DD" when status='future'
    scheduled_time: string | null; // "HH:MM"
    visibility: 1 | 2; // 1=public, 2=private
    permalink: string;
  };
}
