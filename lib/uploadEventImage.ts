/**
 * Cloudflare Images direct-creator-upload helper.
 *
 * Three-step flow:
 *   1. POST /event-image-upload-url → { upload_url, media_id }.
 *      Server mints a one-time URL via Cloudflare's /images/v2/direct_upload.
 *   2. POST the file as multipart/form-data direct to upload_url.
 *      Cloudflare returns its own JSON; we don't need the body, just
 *      a 2xx status.
 *   3. POST /event-image-confirm with { media_id, media_group, width,
 *      height, mime_type } → server inserts the row in ce_cf_events_media
 *      and returns { id, url, … }.
 *
 * Each of our two calls resolves the region independently, so BOTH
 * need `site`. This is the flow that produced the live data bug: the
 * mint step sent it and the confirm step didn't, so an image uploaded
 * to a US event was written to ce_cf_events_media tagged blog_id 3
 * (UK). Step 3 is the one that writes the region, and nothing errored.
 *
 * Why a separate helper rather than two mutation hooks chained from
 * the panel: this needs to talk to a third-party URL (step 2) with
 * different fetch semantics - no auth header (Cloudflare rejects
 * extra headers on a direct-creator POST), no JSON content type, and
 * the response is parsed but mostly ignored. Easier to wrap as one
 * Promise than to compose three useMutations and juggle their state.
 */

import { apiGet, apiPost } from "./apiClient";
import { isVideoFile } from "./editorImage";
import {
  friendlyCloudflareUploadError,
  shrinkImage,
  withUploadSlot,
} from "./prepareImageUpload";
import type { SiteKey } from "./apiTypes";

/**
 * Which slot the image fills. `ticket_logo` is the logo printed on
 * the event's tickets, set from the Tickets step.
 */
export type EventMediaGroup = "cover" | "gallery" | "ticket_logo";

/** What the editor sends/stores. Videos (gallery only) go to Cloudflare
 *  Stream instead of Images - same mint → direct POST → confirm flow,
 *  different Cloudflare product (2026-11-04). */
export type EventMediaType = "image" | "video";

/** Largest clip the browser will send. Mirrors the server's default
 *  (Stream's basic direct upload caps at 200 MB); the mint response
 *  carries the authoritative value. */
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

interface MintResponse {
  success: true;
  media_id: string;
  upload_url: string;
  media_type?: EventMediaType;
  max_bytes?: number;
  max_seconds?: number;
}

export interface ConfirmedImage {
  id: string;
  url: string;
  media_group: EventMediaGroup;
  width: number;
  height: number;
  /** Absent on older backends = image. */
  type?: EventMediaType;
  /** Stream player URL (videos only). */
  playback_url?: string;
  /** Stream has finished encoding (videos only). */
  ready?: boolean;
}

/** GET /event-video-status - is a gallery clip playable yet? */
export interface VideoStatusResponse {
  success: true;
  ready: boolean;
  image: ConfirmedImage;
}

export async function fetchEventVideoStatus(args: {
  eid: string;
  site: SiteKey;
  mediaId: string;
}): Promise<VideoStatusResponse> {
  const params = new URLSearchParams({ eid: args.eid, media_id: args.mediaId });
  return apiGet<VideoStatusResponse>(
    `/event-video-status?${params.toString()}`,
    {
      site: args.site,
    },
  );
}

interface ConfirmResponse {
  success: true;
  image: ConfirmedImage;
}

interface ConfirmBody {
  media_id: string;
  media_group: EventMediaGroup;
  media_type: EventMediaType;
  width: number;
  height: number;
  mime_type: string;
}

interface MintBody {
  media_group: EventMediaGroup;
  media_type: EventMediaType;
}

export interface UploadEventImageArgs {
  /** Encrypted event id from state.encryptedId. */
  eid: string;
  /** Region the eid belongs to. Required: the confirm step writes it to
   *  the DB, so getting it wrong mislabels the row permanently. */
  site: SiteKey;
  file: File;
  mediaGroup: EventMediaGroup;
  signal?: AbortSignal;
}

export async function uploadEventImage(
  args: UploadEventImageArgs,
): Promise<ConfirmedImage> {
  const { eid, site, file: original, mediaGroup, signal } = args;

  // Shrink the photo and wait for an upload slot BEFORE minting: a
  // direct-upload URL is single-use and short-lived, so mint it right
  // before the bytes go. See prepareImageUpload.ts for why both exist.
  const mediaType: EventMediaType = isVideoFile(original) ? "video" : "image";
  if (mediaType === "video" && mediaGroup !== "gallery") {
    throw new Error("Videos can only be added to the gallery.");
  }
  if (mediaType === "video" && original.size > MAX_VIDEO_BYTES) {
    throw new Error(
      `Videos must be under ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB.`,
    );
  }

  return withUploadSlot(async () => {
    // Videos are sent as picked - re-encoding in the browser is not an
    // option, and Stream transcodes them anyway.
    const file = mediaType === "video" ? original : await shrinkImage(original);
    if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");

    // Step 1 - mint.
    const mint = await apiPost<MintResponse, MintBody>(
      `/event-image-upload-url?eid=${encodeURIComponent(eid)}`,
      { media_group: mediaGroup, media_type: mediaType },
      { site },
    );

    if (
      mediaType === "video" &&
      typeof mint.max_bytes === "number" &&
      file.size > mint.max_bytes
    ) {
      throw new Error(
        `Videos must be under ${Math.round(mint.max_bytes / 1024 / 1024)} MB.`,
      );
    }

    if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");

    // Step 2 - direct multipart POST to Cloudflare. The upload_url is
    // one-time-use and pre-authorised; do NOT add Authorization or
    // X-WP-Token headers, Cloudflare rejects them.
    const form = new FormData();
    form.append("file", file);

    const cfRes = await fetch(mint.upload_url, {
      method: "POST",
      body: form,
      signal,
    });

    if (!cfRes.ok) {
      // Cloudflare returns its own JSON on failure with a useful
      // `errors[].message`. We surface that rather than the bland
      // status code so the panel can show something actionable.
      let message = `Cloudflare upload failed (HTTP ${cfRes.status})`;
      try {
        const cfBody = await cfRes.json();
        if (cfBody?.errors?.[0]?.message)
          message = String(cfBody.errors[0].message);
        else if (cfBody?.error) message = String(cfBody.error);
      } catch {
        // Cloudflare returned non-JSON; stick with the generic message.
      }
      throw new Error(friendlyCloudflareUploadError(message));
    }

    // Step 3 - confirm + insert. We read dimensions client-side so the
    // DB row carries them straight away; if dimensions fail (CORS or
    // an exotic format), we send zeros and the server stores nulls.
    const dims = await (
      mediaType === "video"
        ? readVideoDimensions(file)
        : readImageDimensions(file)
    ).catch(() => ({
      width: 0,
      height: 0,
    }));

    // The region goes up here too - this call writes the blog_id.
    const confirm = await apiPost<ConfirmResponse, ConfirmBody>(
      `/event-image-confirm?eid=${encodeURIComponent(eid)}`,
      {
        media_id: mint.media_id,
        media_group: mediaGroup,
        media_type: mediaType,
        width: dims.width,
        height: dims.height,
        mime_type:
          file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
      },
      { site },
    );

    return confirm.image;
  });
}

/** Frame size of a video File, from its metadata (no decode of the
 *  whole clip). Sets the slide's aspect ratio on the public page. */
async function readVideoDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const dims = { width: video.videoWidth, height: video.videoHeight };
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      resolve(dims);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read video dimensions"));
    };
    video.src = url;
  });
}

/** Read intrinsic pixel dimensions from a File. Uses createImageBitmap
 *  where available (Safari 15+, all other modern browsers) and falls
 *  back to an Image() element. Closes the bitmap promptly so it
 *  doesn't sit in memory until GC. */
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
