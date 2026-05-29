/**
 * Mutation hooks for saving an event through POST /event-update
 * (dl-accounts-event-update.php).
 *
 * Two entry points:
 *
 *   useUpdateEvent()  — low-level: update a known event by eid with a
 *                       pre-built body. Use when you've already mapped
 *                       state and have an encrypted id.
 *
 *   useSaveEvent()    — high-level "create/update": takes the whole
 *                       EventCreateState, creates the server-side
 *                       draft first if one doesn't exist yet
 *                       (encryptedId === null), then updates. This is
 *                       the one the editor's Save button wants.
 *
 * Both invalidate the editor, detail, and list caches on success so
 * the rest of the app reflects the change without a manual refetch.
 *
 * Kept in a separate file from queries.ts purely to stay additive —
 * the contents could live in queries.ts alongside useCreateEvent /
 * useEventForEdit if you'd rather keep all hooks in one place.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "./apiClient";
import type { EventCreateState } from "@/context/EventCreateContext";
import type { CreateEventParams, CreateEventResponse } from "./queries";
import {
  mapStateToUpdateRequest,
  type ApiEventUpdateRequest,
  type ApiEventUpdateResponse,
} from "./eventSaveMapper";

/** POST the update. `eid` rides in the query string (the route's
 *  registered arg); the section payload is the JSON body. */
function postEventUpdate(eid: string, body: ApiEventUpdateRequest) {
  return apiPost<ApiEventUpdateResponse, ApiEventUpdateRequest>(
    `/event-update?eid=${encodeURIComponent(eid)}`,
    body,
  );
}

/** Invalidate everything that could now be stale after a save. The
 *  keys mirror those used by useEventForEdit / useEvent /
 *  useOrganiserEvents — prefix matching means we don't need the exact
 *  param objects. */
function invalidateEventCaches(
  qc: ReturnType<typeof useQueryClient>,
  eid: string,
) {
  qc.invalidateQueries({ queryKey: ["event-edit", eid] });
  qc.invalidateQueries({ queryKey: ["event", eid] });
  qc.invalidateQueries({ queryKey: ["organiser-events"] });
}

// ============================================================
// Low-level: update a known event
// ============================================================

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation<
    ApiEventUpdateResponse,
    Error,
    { eid: string; body: ApiEventUpdateRequest }
  >({
    mutationFn: ({ eid, body }) => postEventUpdate(eid, body),
    onSuccess: (_data, { eid }) => invalidateEventCaches(qc, eid),
  });
}

// ============================================================
// High-level: create-or-update from editor state
// ============================================================

export function useSaveEvent() {
  const qc = useQueryClient();

  return useMutation<ApiEventUpdateResponse, Error, EventCreateState>({
    mutationFn: async (state) => {
      let eid = state.encryptedId;

      // No server-side draft yet → create the shell first. Mirrors the
      // wizard's useCreateEvent call so a "save from a brand-new
      // editor" still works even if the create step was skipped.
      if (!eid) {
        const created = await apiPost<CreateEventResponse, CreateEventParams>(
          "/events",
          {
            title: state.title?.trim() || "Untitled event",
            event_type: state.eventType,
          },
        );
        eid = created.encrypted_id;
      }

      const body = mapStateToUpdateRequest(state);
      return postEventUpdate(eid, body);
    },
    onSuccess: (data) => invalidateEventCaches(qc, data.encrypted_id),
  });
}
