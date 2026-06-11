/**
 * Fetches show car applications for the event view + approve/reject
 * mutations.
 *
 * Wraps GET /event-show-car-applications and pipes the rows through
 * the existing mapShowCar() so consumers receive ShowCar[] in the
 * same shape they were already expecting from useEventData().
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import { mapShowCar } from "./eventMapper";
import type { ApiShowCarRecord } from "./apiTypes";
import type { ShowCar } from "@/context/types";

export interface ShowCarApplicationsResponse {
  success: true;
  event_id: number;
  applications: ApiShowCarRecord[];
}

export function useShowCarApplications(eid: string | undefined) {
  return useQuery<ShowCarApplicationsResponse, Error, ShowCar[]>({
    queryKey: ["event-show-car-applications", eid],
    queryFn: () =>
      apiGet<ShowCarApplicationsResponse>(
        `/event-show-car-applications?eid=${encodeURIComponent(eid ?? "")}`,
      ),
    enabled: !!eid,
    staleTime: 30_000,
    select: (data) => data.applications.map(mapShowCar),
  });
}

// ============================================================
// Approve / reject mutations
// ============================================================

/**
 * Server response shape for approve. `status` reflects the resulting
 * DB status:
 *   - paid category → "approved" (now waiting on the applicant to
 *     buy the ticket from the link they were emailed)
 *   - free category → "paid"     (auto-confirmed, no purchase step)
 */
export interface ApproveResponse {
  success: true;
  application_id: number;
  status: "approved" | "paid";
}

export interface RejectResponse {
  success: true;
  application_id: number;
  status: "rejected";
}

/**
 * Approve mutation.
 *
 * Doesn't need an eid passed in — the success handler invalidates the
 * applications query by *prefix*, which catches whatever eid is
 * currently cached. This keeps the mutation usable from anywhere
 * (e.g. the global DetailModal) without dragging EventContext into
 * the call site.
 *
 * Server enforces the pending → approved transition; double-clicking
 * doesn't double-email because the second call returns 400.
 */
export function useApproveShowCarApplication() {
  const qc = useQueryClient();
  return useMutation<ApproveResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<ApproveResponse, { application_id: number }>(
        "/event-show-car-application-approve",
        { application_id: applicationId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-show-car-applications"] });
    },
  });
}

export function useRejectShowCarApplication() {
  const qc = useQueryClient();
  return useMutation<RejectResponse, Error, { applicationId: number }>({
    mutationFn: ({ applicationId }) =>
      apiPost<RejectResponse, { application_id: number }>(
        "/event-show-car-application-reject",
        { application_id: applicationId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-show-car-applications"] });
    },
  });
}
