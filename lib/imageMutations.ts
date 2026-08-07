/**
 * Mutation hooks for event image upload / removal.
 *
 *   useUploadEventImage()  - runs the full mint → CF upload → confirm
 *                            pipeline. Resolves with { id, url, … }
 *                            so the caller can drop the new image
 *                            straight into editor state.
 *
 *   useRemoveEventImage()  - DELETE /event-image. Deletes from
 *                            Cloudflare and ce_cf_events_media.
 *
 * Both invalidate ["event-images", eid] on success so any future
 * useEventImages() reader (the hydration path, not built this turn)
 * picks up the change.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete } from "./apiClient";
import type { SiteKey } from "./apiTypes";
import {
  uploadEventImage,
  type ConfirmedImage,
  type UploadEventImageArgs,
} from "./uploadEventImage";

export function useUploadEventImage() {
  const qc = useQueryClient();
  return useMutation<ConfirmedImage, Error, UploadEventImageArgs>({
    mutationFn: (args) => uploadEventImage(args),
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-images", eid] });
    },
  });
}

export function useRemoveEventImage() {
  const qc = useQueryClient();
  return useMutation<
    { success: true },
    Error,
    { eid: string; site: SiteKey; mediaId: string }
  >({
    mutationFn: ({ eid, site, mediaId }) => {
      const params = new URLSearchParams({ eid, media_id: mediaId });
      return apiDelete<{ success: true }>(`/event-image?${params.toString()}`, {
        site,
      });
    },
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-images", eid] });
    },
  });
}
