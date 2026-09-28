/**
 * Cloudflare Images direct-creator-upload for business images (logo,
 * cover, gallery). Same three-step flow as `lib/uploadEventImage.ts`,
 * against the business routes:
 *
 *   1. POST /business-image-upload-url?bid= { media_group }
 *   2. multipart POST the file straight to Cloudflare's upload_url
 *   3. POST /business-image-confirm?bid= { media_id, media_group, … }
 *
 * Both dl-accounts calls carry `site` - the confirm step writes the
 * blog_id, so a missing region would mislabel the row.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiPost } from "./apiClient";
import type { SiteKey } from "./apiTypes";

export type BusinessMediaGroup = "logo" | "cover" | "gallery";

interface MintResponse {
  success: true;
  media_id: string;
  upload_url: string;
}

export interface ConfirmedBusinessImage {
  id: string;
  url: string;
  media_group: BusinessMediaGroup;
  width: number;
  height: number;
}

interface ConfirmResponse {
  success: true;
  image: ConfirmedBusinessImage;
}

export interface UploadBusinessImageArgs {
  /** Encrypted business id. */
  bid: string;
  site: SiteKey;
  file: File;
  mediaGroup: BusinessMediaGroup;
  signal?: AbortSignal;
}

export async function uploadBusinessImage(
  args: UploadBusinessImageArgs,
): Promise<ConfirmedBusinessImage> {
  const { bid, site, file, mediaGroup, signal } = args;

  const mint = await apiPost<MintResponse, { media_group: BusinessMediaGroup }>(
    `/business-image-upload-url?bid=${encodeURIComponent(bid)}`,
    { media_group: mediaGroup },
    { site },
  );

  if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");

  // One-time, pre-authorised URL - no auth headers (Cloudflare rejects
  // them on a direct-creator POST).
  const form = new FormData();
  form.append("file", file);
  const cfRes = await fetch(mint.upload_url, { method: "POST", body: form, signal });

  if (!cfRes.ok) {
    let message = `Cloudflare upload failed (HTTP ${cfRes.status})`;
    try {
      const cfBody = await cfRes.json();
      if (cfBody?.errors?.[0]?.message) message = String(cfBody.errors[0].message);
      else if (cfBody?.error) message = String(cfBody.error);
    } catch {
      // non-JSON body; keep the generic message
    }
    throw new Error(message);
  }

  const dims = await readImageDimensions(file).catch(() => ({ width: 0, height: 0 }));

  const confirm = await apiPost<
    ConfirmResponse,
    {
      media_id: string;
      media_group: BusinessMediaGroup;
      width: number;
      height: number;
      mime_type: string;
    }
  >(
    `/business-image-confirm?bid=${encodeURIComponent(bid)}`,
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

export function useUploadBusinessImage() {
  const qc = useQueryClient();
  return useMutation<ConfirmedBusinessImage, Error, UploadBusinessImageArgs>({
    mutationFn: (args) => uploadBusinessImage(args),
    onSuccess: (_data, { bid }) => {
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
      qc.invalidateQueries({ queryKey: ["business-edit", bid] });
    },
  });
}

export function useRemoveBusinessImage() {
  const qc = useQueryClient();
  return useMutation<
    { success: true },
    Error,
    { bid: string; site: SiteKey; mediaId: string }
  >({
    mutationFn: ({ bid, site, mediaId }) => {
      const params = new URLSearchParams({ bid, media_id: mediaId });
      return apiDelete<{ success: true }>(`/business-image?${params.toString()}`, {
        site,
      });
    },
    onSuccess: (_data, { bid }) => {
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
      qc.invalidateQueries({ queryKey: ["business-edit", bid] });
    },
  });
}
