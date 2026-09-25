/**
 * Mutation hooks for saving an event through POST /event-update
 * (dl-accounts-event-update.php).
 *
 * Two entry points:
 *
 *   useUpdateEvent()  - low-level: update a known event by eid with a
 *                       pre-built body. Use when you've already mapped
 *                       state and have an encrypted id.
 *
 *   useSaveEvent()    - high-level "create/update": takes the whole
 *                       EventCreateState, creates the server-side
 *                       draft first if one doesn't exist yet
 *                       (encryptedId === null), then updates. This is
 *                       the one the editor's Save button wants.
 *
 * Both invalidate the editor, detail, and list caches on success so
 * the rest of the app reflects the change without a manual refetch.
 *
 * Kept in a separate file from queries.ts purely to stay additive -
 * the contents could live in queries.ts alongside useCreateEvent /
 * useEventForEdit if you'd rather keep all hooks in one place.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "./apiClient";
import type { EventCreateState } from "@/context/EventCreateContext";
import type { SiteKey } from "./apiTypes";
import { resolveRegion } from "./regions";
import type { CreateEventParams, CreateEventResponse } from "./queries";
import {
  mapStateToUpdateRequest,
  type ApiEventUpdateRequest,
  type ApiEventUpdateResponse,
} from "./eventSaveMapper";

/**
 * WP's ACF event_type select only knows 1=public, 2=private, 3=club, and
 * every storefront listing keeps an event only when it is "1". The host
 * model (me/club/venue) is sent separately as host_type/host_id, so a new
 * event is always created public; the old host-derived placeholders
 * ("general"/"dev_club"/"venue_dover") hid every event from search.
 */
const PUBLIC_EVENT_TYPE: CreateEventParams["event_type"] = "1";

/** POST the update. `eid` and `site` ride in the query string (the
 *  route's registered args); the section payload is the JSON body.
 *
 *  `site` picks the multisite blog to resolve `eid` on. Without it the
 *  API defaults to UK, so saving a US event would write to whatever UK
 *  post shares its id - see the note in eventActions.ts. */
function postEventUpdate(
  eid: string,
  body: ApiEventUpdateRequest,
  site: SiteKey,
) {
  return apiPost<ApiEventUpdateResponse, ApiEventUpdateRequest>(
    `/event-update?eid=${encodeURIComponent(eid)}`,
    body,
    { site },
  );
}

/** Invalidate everything that could now be stale after a save. The
 *  keys mirror those used by useEventForEdit / useEvent /
 *  useOrganiserEvents - prefix matching means we don't need the exact
 *  param objects, and it deliberately clears both regions' entries for
 *  this eid rather than trying to guess which one was written. */
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
    { eid: string; body: ApiEventUpdateRequest; site: SiteKey }
  >({
    mutationFn: ({ eid, body, site }) => postEventUpdate(eid, body, site),
    onSuccess: (_data, { eid }) => invalidateEventCaches(qc, eid),
  });
}

// ============================================================
// High-level: create-or-update from editor state
// ============================================================

export function useSaveEvent() {
  const qc = useQueryClient();

  return useMutation<ApiEventUpdateResponse, Error, EventCreateState>({
    // Shared key so useEditorSave can observe save state fired from ANY
    // of the editor's save buttons via useMutationState - each hook call
    // creates its own mutation instance, but they all report under this
    // key.
    mutationKey: ["save-event"],
    mutationFn: async (state) => {
      let eid = state.encryptedId;
      // Resolved rather than raw: `state.site` is null on an event
      // opened from a link that predates multisite, and every route
      // below needs a concrete region. resolveRegion falls back to UK,
      // which is the same blog the API would have picked itself.
      const site = resolveRegion(state.site).key;

      // No server-side draft yet → create the shell first. Mirrors the
      // wizard's useCreateEvent call so a "save from a brand-new
      // editor" still works even if the create step was skipped.
      if (!eid) {
        const created = await apiPost<CreateEventResponse, CreateEventParams>(
          "/events",
          {
            title: state.title?.trim() || "Untitled event",
            // Always public; the host rides in host_type/host_id.
            event_type: PUBLIC_EVENT_TYPE,
            host_type: state.hostType,
            host_id: state.hostId,
          },
          { site },
        );
        eid = created.encrypted_id;
        // Created and updated on the same blog - the draft doesn't move.
        return postEventUpdate(eid, mapStateToUpdateRequest(state), site);
      }

      return postEventUpdate(eid, mapStateToUpdateRequest(state), site);
    },
    onSuccess: (data) => invalidateEventCaches(qc, data.encrypted_id),
  });
}
