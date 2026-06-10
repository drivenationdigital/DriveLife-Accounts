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
 * Why a separate helper rather than two mutation hooks chained from
 * the panel: this needs to talk to a third-party URL (step 2) with
 * different fetch semantics — no auth header (Cloudflare rejects
 * extra headers on a direct-creator POST), no JSON content type, and
 * the response is parsed but mostly ignored. Easier to wrap as one
 * Promise than to compose three useMutations and juggle their state.
 */

import { apiPost } from "./apiClient";

interface MintResponse {
  success: true;
  media_id: string;
  upload_url: string;
}

export interface ConfirmedImage {
  id: string;
  url: string;
  media_group: "cover" | "gallery";
  width: number;
  height: number;
}

interface ConfirmResponse {
  success: true;
  image: ConfirmedImage;
}

interface ConfirmBody {
  media_id: string;
  media_group: "cover" | "gallery";
  width: number;
  height: number;
  mime_type: string;
}

interface MintBody {
  media_group: "cover" | "gallery";
}

export interface UploadEventImageArgs {
  /** Encrypted event id from state.encryptedId. */
  eid: string;
  file: File;
  mediaGroup: "cover" | "gallery";
  signal?: AbortSignal;
}

export async function uploadEventImage(
  args: UploadEventImageArgs,
): Promise<ConfirmedImage> {
  const { eid, file, mediaGroup, signal } = args;

  // Step 1 — mint.
  const mint = await apiPost<MintResponse, MintBody>(
    `/event-image-upload-url?eid=${encodeURIComponent(eid)}`,
    { media_group: mediaGroup },
  );

  if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");

  // Step 2 — direct multipart POST to Cloudflare. The upload_url is
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
      if (cfBody?.errors?.[0]?.message) message = String(cfBody.errors[0].message);
      else if (cfBody?.error) message = String(cfBody.error);
    } catch {
      // Cloudflare returned non-JSON; stick with the generic message.
    }
    throw new Error(message);
  }

  // Step 3 — confirm + insert. We read dimensions client-side so the
  // DB row carries them straight away; if dimensions fail (CORS or
  // an exotic format), we send zeros and the server stores nulls.
  const dims = await readImageDimensions(file).catch(() => ({ width: 0, height: 0 }));

  const confirm = await apiPost<ConfirmResponse, ConfirmBody>(
    `/event-image-confirm?eid=${encodeURIComponent(eid)}`,
    {
      media_id: mint.media_id,
      media_group: mediaGroup,
      width: dims.width,
      height: dims.height,
      mime_type: file.type || "image/jpeg",
    },
  );

  return confirm.image;
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
