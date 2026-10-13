/**
 * Cloudflare Images direct-creator-upload for track images (logo, cover).
 * Same three-step flow as `lib/uploadBusinessImage.ts`, against the
 * track routes:
 *
 *   1. POST /track-image-upload-url?tid= { media_group }
 *   2. multipart POST the file straight to Cloudflare's upload_url
 *   3. POST /track-image-confirm?tid= { media_id, media_group, … }
 *
 * Both dl-accounts calls carry `site` - the confirm step writes the
 * blog_id, so a missing region would mislabel the row.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiPost } from "./apiClient";
import {
  friendlyCloudflareUploadError,
  shrinkImage,
  withUploadSlot,
} from "./prepareImageUpload";
import type { SiteKey } from "./apiTypes";

export type TrackMediaGroup = "logo" | "cover";

interface MintResponse {
  success: true;
  media_id: string;
  upload_url: string;
}

export interface ConfirmedTrackImage {
  id: string;
  url: string;
  media_group: TrackMediaGroup;
  width: number;
  height: number;
}

interface ConfirmResponse {
  success: true;
  image: ConfirmedTrackImage;
}

export interface UploadTrackImageArgs {
  /** Encrypted track id. */
  tid: string;
  site: SiteKey;
  file: File;
  mediaGroup: TrackMediaGroup;
  signal?: AbortSignal;
}

export async function uploadTrackImage(
  args: UploadTrackImageArgs,
): Promise<ConfirmedTrackImage> {
  const { tid, site, file: original, mediaGroup, signal } = args;

  // Shrink + queue before minting (the direct-upload URL is single-use
  // and short-lived). See prepareImageUpload.ts.
  return withUploadSlot(async () => {
    const file = await shrinkImage(original);
    if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");

    const mint = await apiPost<MintResponse, { media_group: TrackMediaGroup }>(
      `/track-image-upload-url?tid=${encodeURIComponent(tid)}`,
      { media_group: mediaGroup },
      { site },
    );

    if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");

    // One-time, pre-authorised URL - no auth headers (Cloudflare rejects
    // them on a direct-creator POST).
    const form = new FormData();
    form.append("file", file);
    const cfRes = await fetch(mint.upload_url, {
      method: "POST",
      body: form,
      signal,
    });

    if (!cfRes.ok) {
      let message = `Cloudflare upload failed (HTTP ${cfRes.status})`;
      try {
        const cfBody = await cfRes.json();
        if (cfBody?.errors?.[0]?.message)
          message = String(cfBody.errors[0].message);
        else if (cfBody?.error) message = String(cfBody.error);
      } catch {
        // non-JSON body; keep the generic message
      }
      throw new Error(friendlyCloudflareUploadError(message));
    }

    const dims = await readImageDimensions(file).catch(() => ({
      width: 0,
      height: 0,
    }));

    const confirm = await apiPost<
      ConfirmResponse,
      {
        media_id: string;
        media_group: TrackMediaGroup;
        width: number;
        height: number;
        mime_type: string;
      }
    >(
      `/track-image-confirm?tid=${encodeURIComponent(tid)}`,
      {
        media_id: mint.media_id,
        media_group: mediaGroup,
        width: dims.width,
        height: dims.height,
        mime_type: file.type || "image/jpeg",
      },
      { site },
    );

    return confirm.image;
  });
}

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image dimensions"));
    };
    img.src = url;
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────

export function useUploadTrackImage() {
  const qc = useQueryClient();
  return useMutation<ConfirmedTrackImage, Error, UploadTrackImageArgs>({
    mutationFn: (args) => uploadTrackImage(args),
    onSuccess: (_data, { tid }) => {
      qc.invalidateQueries({ queryKey: ["my-tracks"] });
      qc.invalidateQueries({ queryKey: ["track-edit", tid] });
    },
  });
}

export function useRemoveTrackImage() {
  const qc = useQueryClient();
  return useMutation<
    { success: true },
    Error,
    { tid: string; site: SiteKey; mediaId: string }
  >({
    mutationFn: ({ tid, site, mediaId }) => {
      const params = new URLSearchParams({ tid, media_id: mediaId });
      return apiDelete<{ success: true }>(`/track-image?${params.toString()}`, {
        site,
      });
    },
    onSuccess: (_data, { tid }) => {
      qc.invalidateQueries({ queryKey: ["my-tracks"] });
      qc.invalidateQueries({ queryKey: ["track-edit", tid] });
    },
  });
}
