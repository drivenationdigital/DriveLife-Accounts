/**
 * Event overview actions - clone / cancel / delete.
 *
 *   POST /event-clone   { eid, site } → new draft, returns encrypted_id + edit_url
 *   POST /event-cancel  { eid, site } → status "cancelled"
 *   POST /event-delete  { eid, site } → status "deleted"
 *
 * All are organiser-only server-side. Cancel/delete invalidate the
 * My Events list so the card drops out.
 *
 * `site` says which multisite blog to resolve the eid against. It is
 * part of the event's identity, not an optional filter: encrypted ids
 * repeat across regions, so omitting it on a US event resolves the same
 * id on the UK blog. Usually that 404s, but if the organiser owns a UK
 * event with the matching post id it silently hits the wrong event -
 * and these three actions are destructive.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "./apiClient";
import type { SiteKey } from "./apiTypes";

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

/** Args every one of these actions takes. `site` is required - the API
 *  client rejects these routes without it, because resolving the eid
 *  against the wrong blog on a delete is unrecoverable. */
export interface EventActionArgs {
  eid: string;
  site: SiteKey;
}

/** Everything keyed on this event, across both the dashboard and the
 *  editor. `site` lives in a trailing options object in those keys, so
 *  a prefix of ["…", eid] still matches regardless of region. */
function invalidateForEvent(
  qc: ReturnType<typeof useQueryClient>,
  eid: string,
) {
  qc.invalidateQueries({ queryKey: ["my-events"] });
  qc.invalidateQueries({ queryKey: ["organiser-events"] });
  qc.invalidateQueries({ queryKey: ["event", eid] });
  qc.invalidateQueries({ queryKey: ["event-edit", eid] });
}

/** Duplicate an event as a new draft owned by the current user. */
export function useCloneEvent() {
  const qc = useQueryClient();
  return useMutation<CloneEventResponse, Error, EventActionArgs>({
    mutationFn: (args) =>
      apiPost<CloneEventResponse, { eid: string }>(
        "/event-clone",
        { eid: args.eid },
        { site: args.site },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-events"] });
      qc.invalidateQueries({ queryKey: ["organiser-events"] });
    },
  });
}

/** Set the event's status to "cancelled". */
export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation<EventStatusResponse, Error, EventActionArgs>({
    mutationFn: (args) =>
      apiPost<EventStatusResponse, { eid: string }>(
        "/event-cancel",
        { eid: args.eid },
        { site: args.site },
      ),
    onSuccess: (_d, { eid }) => invalidateForEvent(qc, eid),
  });
}

/** Set the event's status to "deleted". */
export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation<EventStatusResponse, Error, EventActionArgs>({
    mutationFn: (args) =>
      apiPost<EventStatusResponse, { eid: string }>(
        "/event-delete",
        { eid: args.eid },
        { site: args.site },
      ),
    onSuccess: (_d, { eid }) => invalidateForEvent(qc, eid),
  });
}
