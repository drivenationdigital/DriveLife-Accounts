/**
 * Trader applications for the event view (Traders tab).
 *
 * Wraps GET /event-trader-applications and maps rows to the Trader
 * type the tab renders. Dedicated query (not useEventData().traders)
 * so the list refreshes on tab focus + after approve/reject, same
 * pattern as show cars / clubs.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import type { Trader, ApplicationStatus } from "@/context/types";
import { formatRelativeDate, type Region } from "./regions";

export interface ApiTraderRecord {
  id: number;
  event_id: number;
  status: ApplicationStatus;
  /** Within the "approved" group: has an online/in_person trader
   *  actually paid yet? 'paid' = confirmed, 'unpaid' = approved but
   *  awaiting payment. */
  payment_status: "paid" | "unpaid";
  payment_mode: "online" | "in_person";
  business_name: string;
  category_name: string;
  description: string;
  pitch_size: string;
  power_required: boolean;
  power_details: string;
  website: string;
  instagram: string;
  tiktok: string;
  contact_name: string;
  email: string;
  contact_phone: string;
  notes: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface TraderApplicationsResponse {
  success: true;
  event_id: number;
  applications: ApiTraderRecord[];
}

/** "Required · 2kW" / "Required" / "Not required" - the power line
 *  the card shows. */
function powerLabel(required: boolean, details: string): string {
  if (!required) return "Not required";
  return details.trim() ? `Required · ${details.trim()}` : "Required";
}

export function mapTrader(r: ApiTraderRecord, region: Region): Trader {
  return {
    id: String(r.id),
    name: r.business_name || "Unnamed trader",
    category: r.category_name || "",
    pitch: r.pitch_size || "-",
    power: powerLabel(r.power_required, r.power_details),
    contactName: r.contact_name,
    contactEmail: r.email,
    contactPhone: r.contact_phone,
    instagram: r.instagram,
    tiktok: r.tiktok,
    appliedLabel: formatRelativeDate(
      r.created_at,
      region,
      "Applied",
      "Applied recently",
    ),
    status: r.status,
  };
}

/** @param region the event's region - see useClubApplications. */
export function useTraderApplications(eid: string | undefined, region: Region) {
  return useQuery<TraderApplicationsResponse, Error, Trader[]>({
    queryKey: ["event-trader-applications", eid],
    queryFn: () =>
      apiGet<TraderApplicationsResponse>(
        `/event-trader-applications?eid=${encodeURIComponent(eid ?? "")}`,
      ),
    enabled: !!eid,
    staleTime: 30_000,
    select: (data) => data.applications.map((r) => mapTrader(r, region)),
  });
}

// ============================================================
// Approve / reject / confirm mutations
// ============================================================

export interface TraderApproveResponse {
  success: true;
  application_id: number;
  status: "approved";
}
export interface TraderRejectResponse {
  success: true;
  application_id: number;
  status: "rejected";
}
export interface TraderConfirmResponse {
  success: true;
  application_id: number;
  status: "confirmed";
}

/** Approve (pending → approved). Emails the applicant their pay link
 *  (online) or pay-offline instructions (in_person). */
export function useApproveTraderApplication() {
  const qc = useQueryClient();
  return useMutation<TraderApproveResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<TraderApproveResponse, { application_id: number }>(
        "/event-trader-application-approve",
        { application_id: applicationId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-trader-applications"] });
    },
  });
}

export function useRejectTraderApplication() {
  const qc = useQueryClient();
  return useMutation<TraderRejectResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<TraderRejectResponse, { application_id: number }>(
        "/event-trader-application-reject",
        { application_id: applicationId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-trader-applications"] });
    },
  });
}

/** Confirm (approved → confirmed). Organiser marks paid - mainly for
 *  in_person once payment clears. */
export function useConfirmTraderApplication() {
  const qc = useQueryClient();
  return useMutation<TraderConfirmResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<TraderConfirmResponse, { application_id: number }>(
        "/event-trader-application-confirm",
        { application_id: applicationId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-trader-applications"] });
    },
  });
}
