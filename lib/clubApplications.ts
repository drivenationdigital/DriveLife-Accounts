/**
 * Club applications for the event view (Clubs tab).
 *
 * Wraps GET /event-car-club-applications and maps rows to the Club
 * type the tab renders. Same dedicated-query approach as
 * useShowCarApplications - applications churn independently of the
 * rest of the event payload, so they get their own key + tab-focus
 * refetch.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import type { Club, ApplicationStatus } from "@/context/types";
import type { EventSite } from "./apiTypes";
import { formatRelativeDate, type Region } from "./regions";

/** Server status is already collapsed to pending|approved|rejected. */
export interface ApiCarClubRecord {
  id: number;
  event_id: number;
  status: ApplicationStatus;
  club: {
    name: string;
    website: string | null;
    instagram: string | null;
    tiktok: string | null;
    members: number;
    /** Multi-day events: the days the club attends (labels). */
    days?: string[];
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  /** Per-club ticket + sales. Populated for confirmed clubs (each
   *  gets its own ticket); zeros/null for pending/rejected. */
  ticket: {
    id: number | null;
    tickets_sold: number;
    price: number;
    sales: number;
    /** Spaces the club holds (sold + unsold); null without a ticket. */
    allocated: number | null;
    /** Attendance options (multi-day events): price + sales per option;
     *  [] / absent when the club sells one ticket for every day. */
    options?: ApiClubTicketOption[];
  };
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiClubTicketOption {
  key: string;
  label: string;
  days: string[];
  ticket_id: number;
  price: number;
  sold: number;
  /** Spaces this day holds (sold + unsold); null for an all-days row,
   *  which is bounded by the day rows instead. */
  allocated?: number | null;
  /** True for the earlier pooled layout (one shared allocation). */
  pooled?: boolean;
  /** The discounted every-day ticket: a sale takes a space on each day. */
  all_days?: boolean;
  /** Day-only tickets sold for a day row (`sold` also counts all-days
   *  members present that day); equals `sold` on an all-days row. */
  sold_day_only?: number;
}

export interface ClubSalesSummary {
  /** Sum of per-club ticket sales across confirmed clubs. */
  total: number;
  /** Attending members: real tickets sold (paid) or confirmed slots
   *  (free) - not total applied. */
  attending: number;
}

/** Event-level figures the approve / allocation dialogs start from. */
export interface ClubApprovalConfig {
  /** Whether members pay for tickets at all. */
  require_ticket: boolean;
  /** The editor's "Default club ticket price" (0 when not charged). */
  default_price: number;
  /** Cap on club vehicles, null when unlimited. */
  max: number | null;
  confirmed_slots: number;
  /** max - confirmed, null when unlimited. */
  remaining: number | null;
  /** Default member price for the discounted all-days ticket a club
   *  attending two or more days can offer (multi-day events). */
  all_days_default_price?: number;
  /** Whether the organiser offers clubs the all-days ticket at all
   *  (Car clubs step tick box). Absent = yes. */
  all_days_offered?: boolean;
  /** Attendance options (multi-day events): every option with the
   *  organiser's default member price. [] / absent on a single-day
   *  event, where `default_price` alone applies. */
  event_days?: string[];
  attendance_options?: {
    key: string;
    label: string;
    days: string[];
    default_price: number;
  }[];
}

export interface ClubApplicationsResponse {
  success: true;
  event_id: number;
  sales: ClubSalesSummary;
  config: ClubApprovalConfig;
  applications: ApiCarClubRecord[];
}

/** Shaped result the tab consumes: mapped clubs + the sales summary. */
export interface ClubApplicationsData {
  clubs: Club[];
  sales: ClubSalesSummary;
}

/** Relative status-change label, prefixed by the verb for the status. */
function statusLabel(
  status: ApplicationStatus,
  iso: string | null,
  region: Region,
): string {
  const verb =
    status === "approved"
      ? "Confirmed"
      : status === "rejected"
        ? "Rejected"
        : "Updated";
  return formatRelativeDate(iso, region, verb);
}

export function mapClub(r: ApiCarClubRecord, region: Region): Club {
  return {
    id: String(r.id),
    name: r.club.name || "Unnamed club",
    membersAttending: r.club.members,
    contactName: r.contact.name,
    contactEmail: r.contact.email,
    contactPhone: r.contact.phone,
    description: r.notes ?? "",
    appliedLabel: formatRelativeDate(
      r.created_at,
      region,
      "Applied",
      "Applied recently",
    ),
    updatedLabel: statusLabel(r.status, r.updated_at ?? r.created_at, region),
    status: r.status,
    ticketsSold: r.ticket?.tickets_sold ?? 0,
    ticketSales: r.ticket?.sales ?? 0,
    spacesAllocated: r.ticket?.allocated ?? null,
    ticketPrice: r.ticket?.id ? (r.ticket.price ?? 0) : null,
    currencySymbol: region.currencySymbol,
    options: (r.ticket?.options ?? []).map((o) => ({
      key: o.key,
      label: o.label,
      price: o.price ?? 0,
      sold: o.sold ?? 0,
      allocated: o.allocated ?? null,
      pooled: !!o.pooled,
      allDays: !!o.all_days,
      soldDayOnly: o.sold_day_only ?? o.sold ?? 0,
      ticketId: o.ticket_id,
    })),
    days: r.club?.days ?? [],
  };
}

/** @param region the event's region - dates in the "Applied" labels are
 *  rendered in it. Pass `event.region` from the tab. */
export function useClubApplications(eid: string | undefined, region: Region) {
  return useQuery<ClubApplicationsResponse, Error, ClubApplicationsData>({
    queryKey: ["event-car-club-applications", eid, region.key],
    queryFn: () =>
      apiGet<ClubApplicationsResponse>(
        `/event-car-club-applications?eid=${encodeURIComponent(eid ?? "")}`,
        { site: region.key },
      ),
    enabled: !!eid,
    staleTime: 30_000,
    select: (data) => ({
      clubs: data.applications.map((r) => mapClub(r, region)),
      sales: data.sales,
    }),
  });
}

// ============================================================
// Approve / reject mutations
// ============================================================

/**
 * Approve response. Clubs are confirmed in a single step now, so
 * status is always "confirmed". `price` / `spaces` are the terms the
 * club was confirmed on.
 */
export interface ClubApproveResponse {
  success: true;
  application_id: number;
  status: "confirmed";
  ticket_id: number;
  price: number;
  spaces: number;
}

/** What an approval runs with. Both optional: left out, the server
 *  uses the event's default club price and the spaces requested
 *  ("Approve all" relies on that). */
export interface ClubApproveVars {
  applicationId: number;
  /** Member ticket price for this club. 0 = free. */
  price?: number;
  /** Spaces to allocate (the club's ticket stock). */
  spaces?: number;
  /** Attendance options (multi-day events): member price per option
   *  key. An option left out takes `price`, else the event default. */
  prices?: Record<string, number>;
  /** Per-day terms (multi-day events): spaces and member price for each
   *  day the club applied for, keyed "day:YYYY-MM-DD". */
  days?: Record<string, { spaces: number; price?: number }>;
  /** The discounted every-day ticket for a club on two or more days:
   *  whether to offer it and at what member price. Offered by default
   *  at the event's all-days default when left out. */
  all_days?: { offer: boolean; price?: number };
}

export interface ClubRejectResponse {
  success: true;
  application_id: number;
  status: "rejected";
}

/**
 * Approve mutation. No eid needed - invalidation is by query prefix,
 * so the call works from the global DetailModal without EventContext.
 * Also invalidates ["event"] because a free-club approval bumps
 * car_club_confirmed_slots, which the Clubs KPIs / capacity read.
 */
export function useApproveClubApplication() {
  const qc = useQueryClient();
  return useMutation<ClubApproveResponse, Error, ClubApproveVars>({
    mutationFn: ({ applicationId, price, spaces, prices, days, all_days }) =>
      apiPost<
        ClubApproveResponse,
        {
          application_id: number;
          price?: number;
          spaces?: number;
          prices?: Record<string, number>;
          days?: Record<string, { spaces: number; price?: number }>;
          all_days?: { offer: boolean; price?: number };
        }
      >("/event-car-club-application-approve", {
        application_id: applicationId,
        ...(price !== undefined ? { price } : {}),
        ...(spaces !== undefined ? { spaces } : {}),
        ...(prices !== undefined ? { prices } : {}),
        ...(days !== undefined ? { days } : {}),
        ...(all_days !== undefined ? { all_days } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-car-club-applications"] });
      qc.invalidateQueries({ queryKey: ["event"] });
    },
  });
}

export function useRejectClubApplication() {
  const qc = useQueryClient();
  return useMutation<ClubRejectResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<ClubRejectResponse, { application_id: number }>(
        "/event-car-club-application-reject",
        { application_id: applicationId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-car-club-applications"] });
      qc.invalidateQueries({ queryKey: ["event"] });
    },
  });
}

// ============================================================
// Approval terms (what the approve dialog pre-fills)
// ============================================================

export interface ClubApprovalTerms extends ClubApprovalConfig {
  success: true;
  application_id: number;
  status: ApplicationStatus;
  club_name: string;
  /** Spaces the club asked for on its application. */
  requested: number;
  /** Present once confirmed. */
  allocated: number | null;
  sold: number;
  price: number | null;
  /** Per-option prices once confirmed (multi-day events). */
  options?: ApiClubTicketOption[];
  /** The days the club applied for (multi-day events), each with the
   *  event's default member price - the approve dialog's rows. */
  requested_days?: {
    key: string;
    label: string;
    days: string[];
    default_price: number;
  }[];
  site: EventSite;
}

/** Fresh per-application terms for the approve dialog: the event's
 *  default price, whether tickets are charged, and the capacity still
 *  unallocated. Fetched on open so the numbers are current. */
export function useClubApprovalTerms(applicationId: number | null) {
  return useQuery<ClubApprovalTerms, Error>({
    queryKey: ["event-car-club-application-terms", applicationId],
    queryFn: () =>
      apiPost<ClubApprovalTerms, { application_id: number }>(
        "/event-car-club-application-terms",
        { application_id: applicationId ?? 0 },
      ),
    enabled: applicationId !== null && applicationId > 0,
    staleTime: 0,
    gcTime: 0,
  });
}

// ============================================================
// Allocation / price edit (confirmed clubs)
// ============================================================

/**
 * POST /event-car-club-application-update-spaces
 *   { application_id, spaces?, price? }
 *
 *   - Confirmed clubs only (the UI only offers the control there).
 *   - `spaces` resizes the club's ticket stock. The server clamps it
 *     to no less than tickets_sold rather than refusing (the count
 *     can move between render and submit) and echoes the settled
 *     value, so callers should read `spaces` from the response.
 *   - `price` changes what members pay from now on; the ticket price
 *     rule applies (free or at least the checkout minimum).
 */
export interface ClubUpdateSpacesResponse {
  success: true;
  application_id: number;
  /** The allocation the server settled on - echo it back rather than
   *  trusting the requested number, in case it clamps. */
  spaces: number;
  price: number;
  sold: number;
  /** Per-option prices after the update (multi-day events). */
  options?: ApiClubTicketOption[];
}

export function useUpdateClubSpaces() {
  const qc = useQueryClient();
  return useMutation<
    ClubUpdateSpacesResponse,
    Error,
    {
      applicationId: number;
      spaces?: number;
      price?: number;
      /** One option's new price, {key: price} (multi-day events). */
      prices?: Record<string, number>;
      /** One day's new spaces and/or price (per-day clubs). */
      days?: Record<string, { spaces?: number; price?: number }>;
    }
  >({
    mutationFn: ({ applicationId, spaces, price, prices, days }) =>
      apiPost<
        ClubUpdateSpacesResponse,
        {
          application_id: number;
          spaces?: number;
          price?: number;
          prices?: Record<string, number>;
          days?: Record<string, { spaces?: number; price?: number }>;
        }
      >("/event-car-club-application-update-spaces", {
        application_id: applicationId,
        ...(spaces !== undefined ? { spaces } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(prices !== undefined ? { prices } : {}),
        ...(days !== undefined ? { days } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-car-club-applications"] });
      // Capacity KPIs read confirmed slots off the event payload.
      qc.invalidateQueries({ queryKey: ["event"] });
    },
  });
}

export interface ClubResendResponse {
  success: true;
  application_id: number;
  status: string;
  sent: string;
  to: string;
}
export interface ClubDeleteResponse {
  success: true;
  application_id: number;
  deleted: true;
}

/** Resend the confirmation (members' booking link) or the rejection,
 *  whichever this club was last sent. 409 while still pending. */
export function useResendClubConfirmation() {
  return useMutation<ClubResendResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<ClubResendResponse, { application_id: number }>(
        "/event-car-club-application-resend",
        { application_id: applicationId },
      ),
  });
}

/** Permanently delete a club application. A confirmed club's slots are
 *  released and its members' ticket closed server-side, hence the
 *  ["event"] invalidation for the Clubs KPIs. */
export function useDeleteClubApplication() {
  const qc = useQueryClient();
  return useMutation<ClubDeleteResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<ClubDeleteResponse, { application_id: number }>(
        "/event-car-club-application-delete",
        { application_id: applicationId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-car-club-applications"] });
      qc.invalidateQueries({ queryKey: ["event"] });
    },
  });
}
