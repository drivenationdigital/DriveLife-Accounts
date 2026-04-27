// ─────────────────────────────────────────────────────────────────────────
// Types matching the /wp-json/dl-accounts/v1/ response shape
// ─────────────────────────────────────────────────────────────────────────

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
  display: string;
  child_event_ids: number[];
  child_last_dates: string[];
}

export type EventPricingType = "free" | "ticketed";

export interface EventRecord {
  id: number;
  encrypted_id: string;
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
  /** Added by the WP `dl_accounts_event_pricing_type()` helper. May be
   * absent on responses from older deployments — fall back to "free". */
  type?: EventPricingType;
  /** The card UI shows location too; surfaced on list responses when
   * available. Falls back to undefined for older deployments. */
  location?: {
    name: string | null;
    address: string | null;
  };
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
  pagination: PaginationMeta;
  search?: string;
  empty_state: EmptyState;
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
  recurring: (RecurringInfo & { parent_id: number | null; is_parent: boolean }) | null;
  created_at: string;
  updated_at: string;
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
}

export interface ApiAttendee {
  ticket_id: number | null;
  order_id: number;
  buyer: ApiBuyer;
  ticket_name: string;
  line_total: number;
  car: ApiCar;
  car_club: string | null;
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
  kpis: ApiSalesKpis;
  tickets: ApiTicketType[];
  orders: ApiOrder[];
  attendees: ApiAttendee[];
  discounts: ApiDiscount[];
  orders_meta: ApiOrdersMeta;
}

export interface ComingSoonStub {
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
  car: {
    make: string | null;
    model: string | null;
    registration: string | null;
    photo_url: string | null;
  };
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
  applied: number;
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
}

export interface ApiShowCarsSection {
  enabled: true;
  config: ApiShowCarsConfig;
  counts: ApiApplicationCounts;
  recent: {
    applied: ApiShowCarRecord[];
    approved: ApiShowCarRecord[];
    confirmed: ApiShowCarRecord[];
    rejected: ApiShowCarRecord[];
  };
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

export type ApiShowCars = ApiShowCarsSection | { enabled: false };
export type ApiCarClubs = ApiCarClubsSection | { enabled: false };

// Traders still stubbed
export type ApiTradersStub =
  | { enabled: false; status: "coming_soon"; message: string }
  | ComingSoonStub;

export interface EventResponse {
  success: true;
  event: ApiEventCore;
  sales: ApiSales;
  show_cars: ApiShowCars;
  clubs: ApiCarClubs;
  traders: ApiTradersStub;
}

export interface EventParams {
  eid: string;
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
  limit?: number;
  offset?: number;
}

// ─────────────────────────────────────────────────────────────────────────
// /event/show-cars + /event/car-clubs
// ─────────────────────────────────────────────────────────────────────────

export interface EventShowCarsParams {
  eid: string;
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
