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
  };
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
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
    mutationFn: ({ applicationId, price, spaces }) =>
      apiPost<
        ClubApproveResponse,
        { application_id: number; price?: number; spaces?: number }
      >("/event-car-club-application-approve", {
        application_id: applicationId,
        ...(price !== undefined ? { price } : {}),
        ...(spaces !== undefined ? { spaces } : {}),
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
}

export function useUpdateClubSpaces() {
  const qc = useQueryClient();
  return useMutation<
    ClubUpdateSpacesResponse,
    Error,
    { applicationId: number; spaces?: number; price?: number }
  >({
    mutationFn: ({ applicationId, spaces, price }) =>
      apiPost<
        ClubUpdateSpacesResponse,
        { application_id: number; spaces?: number; price?: number }
      >("/event-car-club-application-update-spaces", {
        application_id: applicationId,
        ...(spaces !== undefined ? { spaces } : {}),
        ...(price !== undefined ? { price } : {}),
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
