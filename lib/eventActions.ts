/**
 * Event overview actions - clone / cancel / delete.
 *
 *   POST /event-clone   { eid } → new draft, returns encrypted_id + edit_url
 *   POST /event-cancel  { eid } → status "cancelled"
 *   POST /event-delete  { eid } → status "deleted"
 *
 * All are organiser-only server-side. Cancel/delete invalidate the
 * My Events list so the card drops out.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "./apiClient";

export interface CloneEventResponse {
  success: true;
  event_id: number;
  encrypted_id: string;
  edit_url: string;
}

export interface EventStatusResponse {
  success: true;
  event_id: number;
  status: string;
}

/** Duplicate an event as a new draft owned by the current user. */
export function useCloneEvent() {
  const qc = useQueryClient();
  return useMutation<CloneEventResponse, Error, { eid: string }>({
    mutationFn: (body) =>
      apiPost<CloneEventResponse, { eid: string }>("/event-clone", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-events"] });
    },
  });
}

/** Set the event's status to "cancelled". */
export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation<EventStatusResponse, Error, { eid: string }>({
    mutationFn: (body) =>
      apiPost<EventStatusResponse, { eid: string }>("/event-cancel", body),
    onSuccess: (_d, { eid }) => {
      qc.invalidateQueries({ queryKey: ["my-events"] });
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}

/** Set the event's status to "deleted". */
export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation<EventStatusResponse, Error, { eid: string }>({
    mutationFn: (body) =>
      apiPost<EventStatusResponse, { eid: string }>("/event-delete", body),
    onSuccess: (_d, { eid }) => {
      qc.invalidateQueries({ queryKey: ["my-events"] });
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}
