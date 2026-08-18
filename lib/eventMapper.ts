import type {
  ApiAttendee,
  ApiCarClubRecord,
  ApiDiscount,
  ApiEventCore,
  ApiOccurrences,
  ApiOrder,
  ApiSales,
  ApiShowCarRecord,
  ApiTicketType,
  ApplicationStatusApi,
  EventResponse,
} from "./apiTypes";
import type {
  ApplicationStatus,
  CarPhotoClass,
  Club,
  Discount,
  EventData,
  EventDetail,
  EventFeatures,
  EventOccurrences,
  FeatureSection,
  Order,
  OrderStatus,
  SoldTicket,
  ShowCar,
  ShowCarStatus,
  Ticket,
} from "@/context/types";
import {
  formatRegionDate,
  formatRegionShortDate,
  formatRegionTime,
  formatRelativeDate,
  regionFromSite,
  resolveRegion,
  type Region,
} from "./regions";

// ─────────────────────────────────────────────────────────────────────────
// Date / time formatting
// ─────────────────────────────────────────────────────────────────────────

/**
 * Long-form date in the event's own region. A US event reads
 * "Sat, August 15, 2026" where a UK one reads "Sat, 15 August 2026".
 */
function formatDateHuman(
  iso: string | null | undefined,
  region: Region,
): string {
  return formatRegionDate(iso, region);
}

/**
 * "10:00 - 16:00" in the UK, "10:00 AM - 4:00 PM" in the US. The API
 * sends a 24h clock string either way; the region decides how it reads.
 */
function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  region: Region,
): string {
  const start = formatRegionTime(startTime, region);
  const end = formatRegionTime(endTime, region);
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function formatOrderDate(iso: string | null, region: Region): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const today = new Date();
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    if (isToday) {
      // Today's orders show the clock instead of the date - 24h in the
      // UK, "2:30 PM" in the US.
      return `Today, ${d.toLocaleTimeString(region.locale, {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
    return formatRegionShortDate(iso, region, true);
  } catch {
    return iso;
  }
}

function formatAppliedLabel(iso: string | null, region: Region): string {
  return formatRelativeDate(iso, region, "Applied", "Applied recently");
}

// ─────────────────────────────────────────────────────────────────────────
// Field mappers - core event, tickets, orders, discounts
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param fallbackSite site key from the page URL, used when the API
 *   response doesn't echo a site back (pre-multisite deployments).
 */
function mapEventDetail(core: ApiEventCore, fallbackSite?: string): EventDetail {
  // The response's own site block wins; the URL's `?site=` is only a
  // fallback for deployments that don't echo one back.
  const region = core.site
    ? regionFromSite(core.site)
    : resolveRegion(fallbackSite);
  const start = core.first_date?.start_date ?? null;
  const startTime = core.first_date?.start_time ?? null;
  const endTime = core.last_date?.end_time ?? core.first_date?.end_time ?? null;

  const locationParts = [core.location.name, core.location.address].filter(
    (v, i, arr) => v && arr.indexOf(v) === i, // de-dupe when name === address
  );

  // A series parent is a `recurring_events` post: it holds the pattern
  // and the child list, and has no single date of its own. Either
  // signal is authoritative; we check both because `post_type` is the
  // one the legacy page switched on and `is_parent` is the newer flag.
  const isParent =
    core.post_type === "recurring_events" || core.recurring?.is_parent === true;
  const recurringDisplay = core.recurring?.display ?? "";

  return {
    id: String(core.id),
    title: core.title,
    status:
      core.post_status === "publish"
        ? "published"
        : core.post_status === "draft"
          ? "draft"
          : core.post_status === "cancelled"
            ? "cancelled"
            : "published",
    // The parent has no date of its own, so the pattern stands in for
    // one - same as the list row, which shows "Third Saturday Of Every
    // Month" where a one-off event shows its date.
    date: isParent
      ? recurringDisplay || "Recurring"
      : formatDateHuman(start, region),
    timeRange: formatTimeRange(startTime, endTime, region),
    location: locationParts.join(", ") || "-",
    url: core.link.replace(/^https?:\/\//, ""),
    slug: core.slug,
    encryptedId: core.encrypted_id,
    // description_plain, not description. The HTML version would need
    // a sanitiser before it could go through dangerouslySetInnerHTML,
    // and there isn't one in the project - adding a dependency is a
    // call for the repo owner, not a side effect of a layout change.
    description: core.description_plain || "",
    // The response wins over the URL - it's the server's own answer for
    // which blog it resolved the eid on.
    site: core.site?.key ?? fallbackSite ?? "",
    region,
    isRecurringParent: isParent,
    // Keyed on parent_eid first: it's what the back-link actually
    // needs, and it can be present on responses where parent_id isn't.
    isRecurringChild:
      !isParent &&
      Boolean(core.recurring?.parent_eid || core.recurring?.parent_id),
    recurringDisplay,
    parentEid: core.recurring?.parent_eid ?? "",
    recurringCount: core.recurring?.child_count ?? 0,
  };
}

/**
 * Occurrence rows for a recurring series parent.
 *
 * Deliberately order-preserving: the API returns the organiser's stored
 * ACF order, which is theirs to control and is what the legacy page
 * rendered. Sorting by date here would silently override it.
 *
 * Deleted rows are kept rather than filtered - the parent view hides
 * them behind a toggle, so it needs them in the list to reveal.
 */
function mapOccurrences(
  api: ApiOccurrences,
  region: Region,
): EventOccurrences {
  return {
    items: api.items.map((o) => ({
      id: String(o.id),
      eid: o.eid,
      title: o.title,
      dateLabel: formatOccurrenceDate(o.start_date, o.end_date, region),
      startDate: o.start_date,
      endDate: o.end_date,
      timeLabel: formatTimeRange(o.start_time, o.end_time, region),
      location: o.location || "-",
      statusSlug: o.status?.slug ?? "",
      statusLabel: o.status?.label ?? "",
      isDeleted: o.is_deleted,
      canManage: o.can_manage,
      link: o.link,
    })),
    total: api.total,
    hasDeleted: api.has_deleted,
    next: api.next ? { id: String(api.next.id), eid: api.next.eid } : null,
    ticketed: api.ticketed,
    registrationRequired: api.registration_required,
  };
}

/** Single date, or "start - end" when the occurrence spans days. */
function formatOccurrenceDate(
  start: string | null,
  end: string | null,
  region: Region,
): string {
  const startLabel = formatDateHuman(start, region);
  if (!end || end === start) return startLabel;
  const endLabel = formatDateHuman(end, region);
  return startLabel && endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

function mapTicket(t: ApiTicketType): Ticket {
  return {
    id: t.id != null ? String(t.id) : t.name,
    name: t.name,
    sold: t.stock_sold,
    // `stock` IS the total capacity in this schema (not remaining),
    // so display sold/stock directly. The old `stock_sold + stock`
    // formula double-counted - it assumed stock meant "remaining",
    // giving e.g. 1 sold + 10 stock = 11 instead of 10. `capacity`
    // (when the API sends it) still wins as an explicit override.
    capacity: t.capacity ?? t.stock,
    status: t.sale_status === "sold_out" ? "soldout" : "active",
  };
}

/**
 * The subset of order fields mapOrder actually reads. Both ApiOrder
 * (event context) and EventOrder (orders query hook) satisfy this, so
 * either source can be mapped without the two full types having to
 * agree on every field (they differ only on `status`, which we derive
 * here anyway).
 */
export interface MappableOrder {
  id: number;
  encrypted_id: string;
  date_created: string | null;
  buyer: { first_name: string; last_name: string; email: string };
  quantity: number;
  total_amount: number;
  payment_method: string;
  /** Raw order status from the API, when available (e.g. "cancelled",
   *  "refunded", "completed"). Preferred over the amount heuristic. */
  status?: string;
}

function mapOrderStatus(
  order: Pick<MappableOrder, "payment_method" | "total_amount" | "status">,
): OrderStatus {
  // 1. Real status always wins. A cancelled or refunded order stays
  //    cancelled/refunded regardless of its amount - otherwise a £0
  //    cancelled order would be mislabelled "free" and look actionable.
  const raw = (order.status ?? "").toLowerCase();
  if (raw === "cancelled") return "cancelled";
  if (raw === "refunded") return "refunded";
  if (raw === "pending" || raw === "processing") return "pending";

  // 2. Otherwise (completed / paid / admin), derive the label from the
  //    amount: £0 reads as "free", anything above as "paid".
  if (order.total_amount === 0) return "free";
  return "paid";
}

/**
 * @param region formats the order date in the event's own region.
 *   Defaults to UK, matching the API's own fallback, so a caller that
 *   genuinely has no event context still renders a sensible date.
 */
export function mapOrder(
  o: MappableOrder,
  region: Region = resolveRegion(undefined),
): Order {
  return {
    id: String(o.id),
    encryptedId: o.encrypted_id,
    customerName: `${o.buyer.first_name} ${o.buyer.last_name}`.trim(),
    customerEmail: o.buyer.email,
    quantity: o.quantity,
    amount: o.total_amount,
    status: mapOrderStatus(o),
    date: formatOrderDate(o.date_created, region),
  };
}

/**
 * One sold ticket.
 *
 * Car fields and the club collapse null/whitespace to "" so the table
 * has a single "missing" case to render a dash for - the API sends
 * `null` on some rows and `""` on others for the same absent value.
 *
 * Shared by the event response's `sales.attendees` and the paginated
 * /event/tickets list, which return the identical row shape.
 */
export function mapSoldTicket(a: ApiAttendee): SoldTicket {
  const text = (v: string | null | undefined): string => (v ?? "").trim();
  return {
    id: a.ticket_id,
    ticketTypeId: a.ticket_type_id,
    orderId: a.order_id,
    buyerName: `${text(a.buyer?.first_name)} ${text(a.buyer?.last_name)}`.trim(),
    buyerEmail: text(a.buyer?.email),
    buyerPhone: text(a.buyer?.phone),
    ticketName: text(a.ticket_name),
    lineTotal: Number.isFinite(a.line_total) ? a.line_total : 0,
    carMake: text(a.car?.make),
    carModel: text(a.car?.model),
    carReg: text(a.car?.reg),
    carClub: text(a.car_club),
    isConcours: a.is_concours === true,
  };
}

function mapDiscount(d: ApiDiscount): Discount {
  return {
    id: d.id != null ? String(d.id) : d.code,
    code: d.code,
    displayAmount: d.display_amount,
    statusLabel: d.status_label,
    activeState: d.active_state,
    usage: d.usage,
    maxUsage: d.max_usage,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Show car mapping
// ─────────────────────────────────────────────────────────────────────────

const SHOW_CAR_STATUS_MAP: Record<ApplicationStatusApi, ShowCarStatus> = {
  applied: "pending",
  approved: "awaiting-payment",
  confirmed: "confirmed",
  rejected: "rejected",
};

/** Deterministic photo class pick based on id so cards look varied. */
function pickPhotoClass(id: number): CarPhotoClass {
  const classes: CarPhotoClass[] = [
    "car-1",
    "car-2",
    "car-3",
    "car-4",
    "car-5",
    "car-6",
    "car-7",
  ];
  return classes[id % classes.length];
}

export function mapShowCar(r: ApiShowCarRecord, region: Region): ShowCar {
  const make = r.car.make ?? "";
  const model = r.car.model ?? "";
  const reg = r.car.registration ?? "";

  // Try to split "1987 Porsche 911 Carrera" → year/make/model
  const modelCombined = [make, model].filter(Boolean).join(" ").trim();
  const yearMatch = modelCombined.match(/^(\d{4})\s+(.+)$/);
  const year = yearMatch ? yearMatch[1] : "";
  const modelName = yearMatch ? yearMatch[2] : model;

  // The club block is optional on older payloads (the /event `recent`
  // buckets). Absent → not attending with a club, no handle.
  const clubAttending = r.club?.attending === true;
  // Handles are stored without the "@" but be defensive - the apply
  // form only strips leading ones on the client.
  const clubInstagram = (r.club?.instagram ?? "").trim().replace(/^@+/, "");

  return {
    id: String(r.id),
    model: modelCombined || "Unknown vehicle",
    year,
    make,
    modelName,
    reg,
    color: r.car.color ?? "",
    ownerFirstName: r.applicant.first_name ?? "",
    ownerLastName: r.applicant.last_name ?? "",
    ownerEmail: r.applicant.email ?? "",
    ownerPhone: r.applicant.phone ?? "",
    clubAttending,
    // Server clears the name when they aren't attending with a club,
    // but don't rely on it - a stale name would read as a false yes.
    club: clubAttending ? (r.club?.name ?? "") : "",
    clubInstagram,
    description: r.notes ?? "",
    photoClass: pickPhotoClass(r.id),
    // Some stored Cloudflare URLs carry the "blurred" variant (the
    // upload used to take variants[0] blindly) - swap it for the
    // sharp public variant when displaying. Newly uploaded photos
    // store the public variant directly.
    photoUrl: r.car.photo_url
      ? r.car.photo_url.replace(/\/blurred$/, "/public")
      : null,
    // Category comes straight from the server now - it's the ticket
    // name the organiser set, not a heuristic guess. Empty string
    // fallback for the edge case where the ticket was deleted after
    // the application was submitted.
    category: r.category || "",
    status: SHOW_CAR_STATUS_MAP[r.status],
    appliedLabel: formatAppliedLabel(r.created_at, region),
    updatedLabel: formatAppliedLabel(r.updated_at ?? r.created_at, region),
  };
}

/** Flatten the recent-by-status bucket into a single array. */
function collectRecentShowCars(section: {
  recent?: {
    applied: ApiShowCarRecord[];
    approved: ApiShowCarRecord[];
    confirmed: ApiShowCarRecord[];
    rejected: ApiShowCarRecord[];
  };
}, region: Region): ShowCar[] {
  // `recent` is only present on the dashboard /event endpoint, not on
  // the editor's /event-edit. Return an empty list when absent so
  // both surfaces share the same mapper without a runtime crash.
  const r = section.recent;
  if (!r) return [];
  return [...r.applied, ...r.approved, ...r.confirmed, ...r.rejected].map(
    (rec) => mapShowCar(rec, region),
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Car club mapping
// ─────────────────────────────────────────────────────────────────────────

const CLUB_STATUS_MAP: Record<ApplicationStatusApi, ApplicationStatus> = {
  applied: "pending",
  approved: "approved",
  confirmed: "approved", // UI doesn't distinguish - surface as approved
  rejected: "rejected",
};

export function mapCarClub(r: ApiCarClubRecord, region: Region): Club {
  return {
    id: String(r.id),
    name: r.club_name ?? "Unnamed club",
    membersAttending: r.num_spaces ?? 0,
    contactName: r.contact_name ?? "",
    contactEmail: r.contact_email ?? "",
    contactPhone: r.contact_phone ?? "",
    description: r.notes ?? "",
    appliedLabel: formatAppliedLabel(r.created_at, region),
    updatedLabel: formatAppliedLabel(r.updated_at ?? r.created_at, region),
    status: CLUB_STATUS_MAP[r.status],
    // Per-club ticket sales aren't carried on this /event-embedded
    // record (the Clubs tab fetches them via useClubApplications).
    // Default to 0 so the Club shape stays complete.
    ticketsSold: 0,
    ticketSales: 0,
  };
}

function collectRecentCarClubs(section: {
  recent: {
    applied: ApiCarClubRecord[];
    approved: ApiCarClubRecord[];
    confirmed: ApiCarClubRecord[];
    rejected: ApiCarClubRecord[];
  };
}, region: Region): Club[] {
  return [
    ...section.recent.applied,
    ...section.recent.approved,
    ...section.recent.confirmed,
    ...section.recent.rejected,
  ].map((rec) => mapCarClub(rec, region));
}

// ─────────────────────────────────────────────────────────────────────────
// Feature-flag extraction
// ─────────────────────────────────────────────────────────────────────────

const EMPTY_COUNTS = {
  applied: 0,
  pending: 0,
  approved: 0,
  confirmed: 0,
  rejected: 0,
  total: 0,
};

function extractFeatures(resp: EventResponse): EventFeatures {
  // counts is optional on ApiShowCarsSection (the editor's
  // /event-edit doesn't ship application counts - only the dashboard
  // /event endpoint does). When absent, fall back to EMPTY_COUNTS so
  // the FeatureSection type stays concrete.
  const showCars: FeatureSection = resp.show_cars.enabled
    ? {
        enabled: true,
        counts: { ...EMPTY_COUNTS, ...(resp.show_cars.counts ?? {}) },
      }
    : { enabled: false, counts: EMPTY_COUNTS };

  const carClubs: FeatureSection = resp.clubs.enabled
    ? { enabled: true, counts: { ...EMPTY_COUNTS, ...resp.clubs.counts } }
    : { enabled: false, counts: EMPTY_COUNTS };

  const traders: FeatureSection =
    resp.traders && resp.traders.enabled
      ? {
          enabled: true,
          counts: { ...EMPTY_COUNTS, ...(resp.traders.counts ?? {}) },
        }
      : { enabled: false, counts: EMPTY_COUNTS };

  return {
    show_cars: showCars,
    car_clubs: carClubs,
    traders,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Top-level mapper - EventResponse → EventData
// ─────────────────────────────────────────────────────────────────────────

export function mapEventResponse(
  resp: EventResponse,
  opts: { fallbackSite?: string } = {},
): EventData {
  const sales: ApiSales = resp.sales;

  // The region is echoed on the response root as well as on the event
  // itself; either is the server's own answer for which blog it
  // resolved the eid on, so take whichever is present.
  const core: ApiEventCore = resp.event.site
    ? resp.event
    : { ...resp.event, site: resp.site };
  const event = mapEventDetail(core, opts.fallbackSite);
  // Everything below formats in the event's own region - dates and
  // money both move with it. Resolved before the application lists
  // because their "Applied" labels need it too.
  const region = event.region;

  const showCars: ShowCar[] = resp.show_cars.enabled
    ? collectRecentShowCars(resp.show_cars, region)
    : [];

  const clubs: Club[] = resp.clubs.enabled
    ? collectRecentCarClubs(resp.clubs, region)
    : [];

  return {
    event,
    // Non-null only for a series parent. `?? null` normalises the
    // absent-key case from deployments that predate the field, so
    // consumers can branch on a plain `!== null`.
    occurrences: resp.occurrences
      ? mapOccurrences(resp.occurrences, region)
      : null,
    kpis: {
      totalOrders: sales.kpis.order_count,
      // Fall back to 0 so older API responses (without these fields) don't
      // break - once the WP side is deployed this will always be populated.
      ordersThisWeek: sales.kpis.orders_this_week ?? 0,
      ticketsSold: sales.kpis.ticket_count,
      ticketsSoldRecent: sales.kpis.tickets_sold_recent ?? 0,
      netSales: sales.kpis.net_revenue,
      fees: sales.kpis.total_fees,
    },
    tickets: sales.tickets.map(mapTicket),
    // Show car tickets are filtered server-side into a separate array
    // so the regular tickets list / breakdown stays clean. Same shape
    // as tickets - same mapper. Absent on older /event responses, so
    // default to [] to keep the contract stable.
    showCarTickets: (sales.show_car_tickets ?? []).map(mapTicket),
    orders: sales.orders.map((o) => mapOrder(o, region)),
    // One row per ticket sold. The /event response carries a recent
    // slice for the Overview card; the Tickets tab fetches its own
    // paginated set. Defaulted to [] for responses that predate the
    // field, so the tab renders empty rather than throwing.
    soldTickets: (sales.attendees ?? []).map(mapSoldTicket),
    // The initial /event response returns ~5 recent orders for the Overview
    // card - not a full page. Leave pagination null until the Orders tab
    // fires /event/orders and calls applyOrdersPage().
    ordersPagination: null,
    discounts: sales.discounts.map(mapDiscount),
    showCars,
    clubs,
    traders: [],
    notifications: [],
    categoryStats: [
      { category: "classic", confirmed: 0, capacity: 0 },
      { category: "retro", confirmed: 0, capacity: 0 },
      { category: "modern", confirmed: 0, capacity: 0 },
      { category: "supercar", confirmed: 0, capacity: 0 },
    ],
    features: extractFeatures(resp),
  };
}

/**
 * Replace the orders list with a specific paginated page. Unlike the old
 * `mergeAdditionalOrders`, this doesn't preserve earlier results - each
 * page is a standalone view.
 */
export function applyOrdersPage(
  existing: EventData,
  newOrders: ApiOrder[],
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  },
): EventData {
  return {
    ...existing,
    // Reuse the region already resolved on the loaded event rather than
    // re-deriving it - this page of orders belongs to that event.
    orders: newOrders.map((o) => mapOrder(o, existing.event.region)),
    ordersPagination: pagination,
  };
}

/** Merge newly-fetched show-cars (dedupes by id). */
export function mergeAdditionalShowCars(
  existing: EventData,
  newItems: ApiShowCarRecord[],
): EventData {
  const mapped = newItems.map((r) => mapShowCar(r, existing.event.region));
  const seen = new Set(existing.showCars.map((c) => c.id));
  const merged = [...existing.showCars];
  for (const c of mapped) {
    if (!seen.has(c.id)) {
      merged.push(c);
      seen.add(c.id);
    }
  }
  return { ...existing, showCars: merged };
}

/** Merge newly-fetched car clubs (dedupes by id). */
export function mergeAdditionalCarClubs(
  existing: EventData,
  newItems: ApiCarClubRecord[],
): EventData {
  const mapped = newItems.map((r) => mapCarClub(r, existing.event.region));
  const seen = new Set(existing.clubs.map((c) => c.id));
  const merged = [...existing.clubs];
  for (const c of mapped) {
    if (!seen.has(c.id)) {
      merged.push(c);
      seen.add(c.id);
    }
  }
  return { ...existing, clubs: merged };
}
