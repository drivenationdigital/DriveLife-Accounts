/**
 * Event community gallery - bulk upload (photographer web uploader).
 *
 * Three-step direct-to-Cloudflare flow (browser → CF, never through
 * our PHP for the image bytes):
 *
 *   1. POST /event-community-gallery/create-upload → { upload_url, image_id }
 *   2. POST {upload_url}  (multipart "file")       → uploads to Cloudflare
 *   3. POST /event-community-gallery/register      → registers media_ids
 *
 * These live on the app/v2 namespace (not dl-accounts/v1), so we build
 * the URLs off the wp-json root and reuse the dashboard JWT via the
 * same X-WP-Token header the rest of the app uses.
 */

import { readTokenClient } from "./authCookies";

// Derive the wp-json root from the dl-accounts base so both namespaces
// stay on the same host/env without a second env var.
const DL_ACCOUNTS_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://www.carevents.com/uk/wp-json/dl-accounts/v1";
const WP_JSON_ROOT = DL_ACCOUNTS_BASE.replace(/\/dl-accounts\/v1\/?$/, "");
const APP_V2 = `${WP_JSON_ROOT}/app/v2`;

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = readTokenClient();
  console.log(
    "[gallery] token present?",
    !!token,
    token ? token.slice(0, 12) + "…" : "(none)",
  );
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
/**
 * The gallery route param is a raw numeric event id (matching the
 * Flutter client's int.parse) - NOT the encrypted id the dashboard
 * uses elsewhere. Coerce to a number so the WP handler receives an
 * int; fall back to the raw string if it somehow isn't numeric.
 */
function toEventId(eventId: string): number | string {
  const n = Number(eventId);
  return Number.isFinite(n) && eventId.trim() !== "" ? n : eventId;
}

export interface CreateUploadResponse {
  upload_url: string;
  image_id: string;
}

export interface RegisterResponse {
  success: boolean;
  registered: string[];
  count: number;
}

/** Per-file upload status for the UI. */
export type UploadItemStatus =
  | "queued"
  | "uploading"
  | "uploaded"
  | "registering"
  | "done"
  | "error";

export interface UploadItem {
  id: string; // local id (crypto.randomUUID)
  file: File;
  previewUrl: string; // object URL for the thumbnail
  status: UploadItemStatus;
  imageId?: string; // Cloudflare image id once uploaded
  error?: string;
}

/** Step 1: mint a Cloudflare direct-upload URL. */
async function createUpload(eventId: string): Promise<CreateUploadResponse> {
  const res = await fetch(`${APP_V2}/event-community-gallery/create-upload`, {
    method: "POST",
    headers: authHeaders(),
    // event_id sent numeric to match the WP handler (Flutter uses
    // int.parse). Falls back to the raw value if it isn't numeric.
    body: JSON.stringify({ event_id: toEventId(eventId) }),
  });
  if (!res.ok) {
    throw new Error(`Couldn't get an upload URL (${res.status})`);
  }
  const data = (await res.json()) as CreateUploadResponse;
  if (!data.upload_url || !data.image_id) {
    throw new Error("Upload URL response was malformed.");
  }
  return data;
}

/** Step 2: upload the file straight to Cloudflare (multipart). */
async function uploadToCloudflare(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const form = new FormData();
  form.append("file", file, file.name);
  // No auth header - the CF direct-upload URL is pre-signed.
  const res = await fetch(uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`Cloudflare upload failed (${res.status})`);
  }
}

/** Step 3: register the uploaded Cloudflare ids against the event. */
export async function registerGalleryImages(
  eventId: string,
  mediaIds: string[],
): Promise<RegisterResponse> {
  const res = await fetch(`${APP_V2}/event-community-gallery/register`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ event_id: toEventId(eventId), media_ids: mediaIds }),
  });
  if (!res.ok) {
    throw new Error(`Couldn't register uploaded images (${res.status})`);
  }
  return (await res.json()) as RegisterResponse;
}

/**
 * Upload a single file end-to-end (steps 1 + 2), returning its
 * Cloudflare image id. Registration is batched separately by the
 * caller so all ids register in one request.
 */
export async function uploadSingle(
  eventId: string,
  file: File,
): Promise<string> {
  const { upload_url, image_id } = await createUpload(eventId);
  await uploadToCloudflare(upload_url, file);
  return image_id;
}
