/**
 * Club applications for the event view (Clubs tab).
 *
 * Wraps GET /event-car-club-applications and maps rows to the Club
 * type the tab renders. Same dedicated-query approach as
 * useShowCarApplications — applications churn independently of the
 * rest of the event payload, so they get their own key + tab-focus
 * refetch.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import type { Club, ApplicationStatus } from "@/context/types";

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
  };
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClubSalesSummary {
  /** Sum of per-club ticket sales across confirmed clubs. */
  total: number;
  /** Attending members: real tickets sold (paid) or confirmed slots
   *  (free) — not total applied. */
  attending: number;
}

export interface ClubApplicationsResponse {
  success: true;
  event_id: number;
  sales: ClubSalesSummary;
  applications: ApiCarClubRecord[];
}

/** Shaped result the tab consumes: mapped clubs + the sales summary. */
export interface ClubApplicationsData {
  clubs: Club[];
  sales: ClubSalesSummary;
}

/** Relative "Applied Nd/Nw ago" label from an ISO timestamp. */
function appliedLabel(iso: string | null): string {
  if (!iso) return "Applied recently";
  try {
    const d = new Date(iso);
    const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (days <= 0) return "Applied today";
    if (days === 1) return "Applied 1 day ago";
    if (days < 7) return `Applied ${days} days ago`;
    if (days < 30) return `Applied ${Math.floor(days / 7)}w ago`;
    return `Applied ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  } catch {
    return "Applied recently";
  }
}

/** Relative status-change label, prefixed by the verb for the status. */
function statusLabel(status: ApplicationStatus, iso: string | null): string {
  if (!iso) return "";
  const verb =
    status === "approved"
      ? "Confirmed"
      : status === "rejected"
        ? "Rejected"
        : "Updated";
  try {
    const d = new Date(iso);
    const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (days <= 0) return `${verb} today`;
    if (days === 1) return `${verb} 1 day ago`;
    if (days < 7) return `${verb} ${days} days ago`;
    if (days < 30) return `${verb} ${Math.floor(days / 7)}w ago`;
    return `${verb} ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  } catch {
    return "";
  }
}

export function mapClub(r: ApiCarClubRecord): Club {
  return {
    id: String(r.id),
    name: r.club.name || "Unnamed club",
    membersAttending: r.club.members,
    contactName: r.contact.name,
    contactEmail: r.contact.email,
    contactPhone: r.contact.phone,
    description: r.notes ?? "",
    appliedLabel: appliedLabel(r.created_at),
    updatedLabel: statusLabel(r.status, r.updated_at ?? r.created_at),
    status: r.status,
    ticketsSold: r.ticket?.tickets_sold ?? 0,
    ticketSales: r.ticket?.sales ?? 0,
  };
}

export function useClubApplications(eid: string | undefined) {
  return useQuery<ClubApplicationsResponse, Error, ClubApplicationsData>({
    queryKey: ["event-car-club-applications", eid],
    queryFn: () =>
      apiGet<ClubApplicationsResponse>(
        `/event-car-club-applications?eid=${encodeURIComponent(eid ?? "")}`,
      ),
    enabled: !!eid,
    staleTime: 30_000,
    select: (data) => ({
      clubs: data.applications.map(mapClub),
      sales: data.sales,
    }),
  });
}

// ============================================================
// Approve / reject mutations
// ============================================================

/**
 * Approve response. Clubs are confirmed in a single step now, so
 * status is always "confirmed".
 */
export interface ClubApproveResponse {
  success: true;
  application_id: number;
  status: "confirmed";
  ticket_id: number;
}

export interface ClubRejectResponse {
  success: true;
  application_id: number;
  status: "rejected";
}

/**
 * Approve mutation. No eid needed — invalidation is by query prefix,
 * so the call works from the global DetailModal without EventContext.
 * Also invalidates ["event"] because a free-club approval bumps
 * car_club_confirmed_slots, which the Clubs KPIs / capacity read.
 */
export function useApproveClubApplication() {
  const qc = useQueryClient();
  return useMutation<ClubApproveResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<ClubApproveResponse, { application_id: number }>(
        "/event-car-club-application-approve",
        { application_id: applicationId },
      ),
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
