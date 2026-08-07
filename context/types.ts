import type { Region } from "@/lib/regions";

export type EventStatus = "published" | "draft" | "cancelled";
export type OrderStatus = "paid" | "pending" | "refunded" | "cancelled" | "free";
export type ShowCarStatus =
  | "pending"
  | "awaiting-payment"
  | "confirmed"
  | "rejected";
export type ShowCarCategory = "classic" | "retro" | "modern" | "supercar";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type TicketStatus = "active" | "soldout";
export type CarPhotoClass =
  | "car-1"
  | "car-2"
  | "car-3"
  | "car-4"
  | "car-5"
  | "car-6"
  | "car-7";

export interface EventDetail {
  id: string;
  title: string;
  status: EventStatus;
  date: string;
  timeRange: string;
  location: string;
  url: string;
  slug: string;
  encryptedId: string;
  /** Multisite blog key this event lives on ("uk", "us", …). Every
   *  event-scoped API call needs it alongside `encryptedId`, since
   *  encrypted ids are only unique within a site. Empty string when
   *  unknown - the API then falls back to its default site. */
  site: string;
  /** Everything the UI needs to present that region: label, flag
   *  country, locale for dates, currency, and whether ticketing exists
   *  there. Resolved from the API's site block where present, and from
   *  the local region table otherwise, so it's never null. */
  region: Region;

  // ---- Recurring series ----
  /** True when this eid resolves to the series PARENT rather than a
   *  single dated event. The parent renders an occurrence table in
   *  place of the sales dashboard. */
  isRecurringParent: boolean;
  /** True when this is one occurrence of a series - it renders as a
   *  normal event, plus a back-link up to the parent. */
  isRecurringChild: boolean;
  /** Pre-formatted pattern from the API, e.g. "Third Saturday Of Every
   *  Month". Render as-is. Empty when not recurring. */
  recurringDisplay: string;
  /** Encrypted id of the series parent, for a child's "View Related
   *  Events" link. Empty when there's no parent to link to.
   *
   *  This is now the main route into the series overview: the events
   *  list links to the next occurrence rather than the parent, so this
   *  button is how a user reaches the occurrence table at all. */
  parentEid: string;
  /** How many occurrences the series has. 0 when unknown. */
  recurringCount: number;
}

export interface Ticket {
  id: string;
  name: string;
  sold: number;
  capacity: number;
  status: TicketStatus;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  quantity: number;
  amount: number;
  status: OrderStatus;
  date: string;
  encryptedId: string;
}

export interface ShowCar {
  id: string;
  model: string; // e.g. "1987 Porsche 911 Carrera"
  year: string;
  make: string;
  modelName: string;
  reg: string;
  /** Free-text colour from the apply form. Empty when not supplied. */
  color: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  /** Did the applicant say they're coming with a car club? */
  clubAttending: boolean;
  /** Club name - empty string when `clubAttending` is false. */
  club: string;
  /** Instagram handle without the leading "@". Collected on every
   *  application, club or not. Empty when not supplied. */
  clubInstagram: string;
  description: string;
  photoClass: CarPhotoClass;
  /** The category as set by the organiser on the ticket type - a
   *  free-form string ("Modified", "Concours", etc.) rather than the
   *  fixed enum it used to be. The pre-existing per-category CSS
   *  classes (`showcar-category.classic`, etc.) won't match anymore;
   *  the base `.showcar-category` styling still applies. Re-add
   *  per-category colours via slugified class names if desired. */
  category: string;
  /** Cloudflare imagedelivery URL when the applicant uploaded a
   *  photo. When null/undefined the UI falls back to the gradient
   *  placeholder driven by `photoClass`. */
  photoUrl?: string | null;
  status: ShowCarStatus;
  appliedLabel: string;
  updatedLabel: string;
}

export interface Club {
  id: string;
  name: string;
  membersAttending: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  appliedLabel: string;
  updatedLabel: string;
  status: ApplicationStatus;
  /** Per-club ticket sales (confirmed clubs only; 0 otherwise). */
  ticketsSold: number;
  ticketSales: number;
}

export interface Trader {
  id: string;
  name: string;
  category: string;
  pitch: string;
  power: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  tiktok: string;
  appliedLabel: string;
  status: ApplicationStatus;
}

export interface Notification {
  id: string;
  kind: "car" | "order" | "club" | "warn";
  message: string;
  time: string;
  unread: boolean;
}

export interface Discount {
  id: string;
  code: string;
  displayAmount: string; // "10%" or "£5.00"
  statusLabel: string; // "Active" / "Ended 2 days ago"
  activeState: "active" | "upcoming" | "ended";
  usage: number;
  maxUsage: number | null; // null = unlimited
}

export interface CategoryStat {
  category: ShowCarCategory;
  confirmed: number;
  capacity: number;
}

/** One dated occurrence of a recurring series, as rendered in the
 *  parent's occurrence table. Each is a real event with its own eid, so
 *  a row links through to its own event view. */
export interface Occurrence {
  id: string;
  /** Encrypted id of the CHILD event. */
  eid: string;
  title: string;
  /** Formatted date, or a range when the occurrence spans days. */
  dateLabel: string;
  timeLabel: string;
  location: string;
  statusSlug: string;
  statusLabel: string;
  /** Deleted occurrences stay in the list. They're hidden behind a
   *  toggle, render as plain text rather than a link, and get no
   *  actions - matching the legacy page. */
  isDeleted: boolean;
  /** False for finished / cancelled / deleted rows. Gates the actions. */
  canManage: boolean;
  /** Public permalink. */
  link: string;
}

export interface EventOccurrences {
  /** In the organiser's stored order, NOT date order. Never re-sort. */
  items: Occurrence[];
  total: number;
  /** True when `items` contains deleted rows - gates the toggle. */
  hasDeleted: boolean;
  /** Next upcoming occurrence, else the first. */
  next: { id: string; eid: string } | null;
  /** Both derive from the first child, and gate whether the parent
   *  shows sales surfaces at all. */
  ticketed: boolean;
  registrationRequired: boolean;
}

/** Pagination metadata for the orders tab. `null` means we only have the
 * first N recent orders from the main /event load - not a paginated page. */
export interface OrdersPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/** Feature flags + counts per section, sourced from the API. */
export interface FeatureSection {
  enabled: boolean;
  counts: {
    /** Legacy bucket - no longer populated; use `pending`. */
    applied: number;
    /** Awaiting review. This is the real "needs attention" number. */
    pending: number;
    approved: number;
    confirmed: number;
    rejected: number;
    total: number;
  };
}

export interface EventFeatures {
  show_cars: FeatureSection;
  car_clubs: FeatureSection;
  traders: FeatureSection;
}

export interface EventData {
  event: EventDetail;
  /** Non-null ONLY when this eid resolved to a recurring series parent.
   *  The whole view switches on it: the parent shows this table where a
   *  normal event shows its sales dashboard. */
  occurrences: EventOccurrences | null;
  kpis: {
    totalOrders: number;
    ordersThisWeek: number;
    ticketsSold: number;
    ticketsSoldRecent: number;
    netSales: number;
    fees: number;
  };
  tickets: Ticket[];
  /** Show car tickets (filtered server-side from the regular ticket
   *  list via the show_car_ticket=1 flag). Same shape as tickets;
   *  rendered in the show cars tab rather than the tickets breakdown. */
  showCarTickets: Ticket[];
  orders: Order[];
  /** Non-null when the Orders tab's paginated /event/orders has loaded. */
  ordersPagination: OrdersPagination | null;
  discounts: Discount[];
  showCars: ShowCar[];
  clubs: Club[];
  traders: Trader[];
  notifications: Notification[];
  categoryStats: CategoryStat[];
  features: EventFeatures;
}

export type TabKey = "overview" | "orders" | "showcars" | "clubs" | "traders";

export type DetailType = "showcar" | "club" | "trader";
export type DetailPayload =
  | { type: "showcar"; data: ShowCar }
  | { type: "club"; data: Club }
  | { type: "trader"; data: Trader };
