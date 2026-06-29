import type {
  ApiAttendee,
  ApiCarClubRecord,
  ApiDiscount,
  ApiEventCore,
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
  FeatureSection,
  Order,
  OrderStatus,
  ShowCar,
  ShowCarStatus,
  Ticket,
} from "@/context/types";

// ─────────────────────────────────────────────────────────────────────────
// Date / time formatting
// ─────────────────────────────────────────────────────────────────────────

function formatDateHuman(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  if (startTime && endTime) return `${startTime} — ${endTime}`;
  if (startTime) return startTime;
  if (endTime) return endTime;
  return "";
}

function formatOrderDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const today = new Date();
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    if (isToday) {
      return `Today, ${d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatAppliedLabel(iso: string | null): string {
  if (!iso) return "Applied recently";
  try {
    const d = new Date(iso);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (days <= 0) return "Applied today";
    if (days === 1) return "Applied 1d ago";
    if (days < 7) return `Applied ${days}d ago`;
    if (days < 30) return `Applied ${Math.floor(days / 7)}w ago`;
    return `Applied on ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  } catch {
    return "Applied recently";
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Field mappers — core event, tickets, orders, discounts
// ─────────────────────────────────────────────────────────────────────────

function mapEventDetail(core: ApiEventCore): EventDetail {
  const start = core.first_date?.start_date ?? null;
  const startTime = core.first_date?.start_time ?? null;
  const endTime = core.last_date?.end_time ?? core.first_date?.end_time ?? null;

  const locationParts = [core.location.name, core.location.address].filter(
    (v, i, arr) => v && arr.indexOf(v) === i, // de-dupe when name === address
  );

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
    date: formatDateHuman(start),
    timeRange: formatTimeRange(startTime, endTime),
    location: locationParts.join(", ") || "—",
    url: core.link.replace(/^https?:\/\//, ""),
    slug: core.slug,
    encryptedId: core.encrypted_id,
  };
}

function mapTicket(t: ApiTicketType): Ticket {
  return {
    id: t.id != null ? String(t.id) : t.name,
    name: t.name,
    sold: t.stock_sold,
    // `stock` IS the total capacity in this schema (not remaining),
    // so display sold/stock directly. The old `stock_sold + stock`
    // formula double-counted — it assumed stock meant "remaining",
    // giving e.g. 1 sold + 10 stock = 11 instead of 10. `capacity`
    // (when the API sends it) still wins as an explicit override.
    capacity: t.capacity ?? t.stock,
    status: t.sale_status === "sold_out" ? "soldout" : "active",
  };
}

function mapOrderStatus(order: ApiOrder): OrderStatus {
  if (order.payment_method === "admin") return "paid";
  if (order.total_amount > 0) return "paid";
  if (order.total_amount === 0) return "refunded";
  return "pending";
}

function mapOrder(o: ApiOrder): Order {
  return {
    id: String(o.id),
    customerName: `${o.buyer.first_name} ${o.buyer.last_name}`.trim(),
    customerEmail: o.buyer.email,
    quantity: o.quantity,
    amount: o.total_amount,
    status: mapOrderStatus(o),
    date: formatOrderDate(o.date_created),
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

export function mapShowCar(r: ApiShowCarRecord): ShowCar {
  const make = r.car.make ?? "";
  const model = r.car.model ?? "";
  const reg = r.car.registration ?? "";

  // Try to split "1987 Porsche 911 Carrera" → year/make/model
  const modelCombined = [make, model].filter(Boolean).join(" ").trim();
  const yearMatch = modelCombined.match(/^(\d{4})\s+(.+)$/);
  const year = yearMatch ? yearMatch[1] : "";
  const modelName = yearMatch ? yearMatch[2] : model;

  return {
    id: String(r.id),
    model: modelCombined || "Unknown vehicle",
    year,
    make,
    modelName,
    reg,
    ownerFirstName: r.applicant.first_name ?? "",
    ownerLastName: r.applicant.last_name ?? "",
    ownerEmail: r.applicant.email ?? "",
    ownerPhone: r.applicant.phone ?? "",
    instagram: "",
    tiktok: "",
    club: "",
    description: r.notes ?? "",
    photoClass: pickPhotoClass(r.id),
    photoUrl: r.car.photo_url ?? null,
    // Category comes straight from the server now — it's the ticket
    // name the organiser set, not a heuristic guess. Empty string
    // fallback for the edge case where the ticket was deleted after
    // the application was submitted.
    category: r.category || "",
    status: SHOW_CAR_STATUS_MAP[r.status],
    appliedLabel: formatAppliedLabel(r.created_at),
    updatedLabel: formatAppliedLabel(r.updated_at ?? r.created_at),
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
}): ShowCar[] {
  // `recent` is only present on the dashboard /event endpoint, not on
  // the editor's /event-edit. Return an empty list when absent so
  // both surfaces share the same mapper without a runtime crash.
  const r = section.recent;
  if (!r) return [];
  return [...r.applied, ...r.approved, ...r.confirmed, ...r.rejected].map(
    mapShowCar,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Car club mapping
// ─────────────────────────────────────────────────────────────────────────

const CLUB_STATUS_MAP: Record<ApplicationStatusApi, ApplicationStatus> = {
  applied: "pending",
  approved: "approved",
  confirmed: "approved", // UI doesn't distinguish — surface as approved
  rejected: "rejected",
};

export function mapCarClub(r: ApiCarClubRecord): Club {
  return {
    id: String(r.id),
    name: r.club_name ?? "Unnamed club",
    membersAttending: r.num_spaces ?? 0,
    contactName: r.contact_name ?? "",
    contactEmail: r.contact_email ?? "",
    contactPhone: r.contact_phone ?? "",
    description: r.notes ?? "",
    appliedLabel: formatAppliedLabel(r.created_at),
    updatedLabel: formatAppliedLabel(r.updated_at ?? r.created_at),
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
}): Club[] {
  return [
    ...section.recent.applied,
    ...section.recent.approved,
    ...section.recent.confirmed,
    ...section.recent.rejected,
  ].map(mapCarClub);
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
  // /event-edit doesn't ship application counts — only the dashboard
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
// Top-level mapper — EventResponse → EventData
// ─────────────────────────────────────────────────────────────────────────

export function mapEventResponse(resp: EventResponse): EventData {
  const sales: ApiSales = resp.sales;

  const showCars: ShowCar[] = resp.show_cars.enabled
    ? collectRecentShowCars(resp.show_cars)
    : [];

  const clubs: Club[] = resp.clubs.enabled
    ? collectRecentCarClubs(resp.clubs)
    : [];

  return {
    event: mapEventDetail(resp.event),
    kpis: {
      totalOrders: sales.kpis.order_count,
      // Fall back to 0 so older API responses (without these fields) don't
      // break — once the WP side is deployed this will always be populated.
      ordersThisWeek: sales.kpis.orders_this_week ?? 0,
      ticketsSold: sales.kpis.ticket_count,
      ticketsSoldRecent: sales.kpis.tickets_sold_recent ?? 0,
      netSales: sales.kpis.net_revenue,
      fees: sales.kpis.total_fees,
    },
    tickets: sales.tickets.map(mapTicket),
    // Show car tickets are filtered server-side into a separate array
    // so the regular tickets list / breakdown stays clean. Same shape
    // as tickets — same mapper. Absent on older /event responses, so
    // default to [] to keep the contract stable.
    showCarTickets: (sales.show_car_tickets ?? []).map(mapTicket),
    orders: sales.orders.map(mapOrder),
    // The initial /event response returns ~5 recent orders for the Overview
    // card — not a full page. Leave pagination null until the Orders tab
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
 * `mergeAdditionalOrders`, this doesn't preserve earlier results — each
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
    orders: newOrders.map(mapOrder),
    ordersPagination: pagination,
  };
}

/** Merge newly-fetched show-cars (dedupes by id). */
export function mergeAdditionalShowCars(
  existing: EventData,
  newItems: ApiShowCarRecord[],
): EventData {
  const mapped = newItems.map(mapShowCar);
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
  const mapped = newItems.map(mapCarClub);
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
