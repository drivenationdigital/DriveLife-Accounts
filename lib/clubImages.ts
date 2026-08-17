/**
 * Club images - upload / remove.
 *
 *   POST   /wp-json/app/v1/club/{encryptedClubId}/upload-image
 *   DELETE /wp-json/app/v1/club/{encryptedClubId}/remove-image
 *
 * Wraps the existing chunked Cloudflare endpoint the app uses. Three
 * constraints drive the implementation:
 *
 *   1. The server appends chunks (FILE_APPEND) to a temp file keyed by
 *      `file_name`, so chunks MUST be sent sequentially - order is the
 *      file - and never in parallel.
 *   2. `file_name` must be unique per upload. A collision (two uploads
 *      named logo.png) or a stale temp file from a failed upload would
 *      append onto existing bytes and corrupt the image. We mint a
 *      unique name per upload.
 *   3. We slice the BINARY and base64 each chunk separately. Splitting
 *      one long base64 string at arbitrary offsets wouldn't decode
 *      per-chunk (base64 decodes in 4-char groups).
 *
 * Owner-only server-side: club admins get a 403.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readTokenClient } from "./authCookies";

const DL_ACCOUNTS_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://www.carevents.com/uk/wp-json/dl-accounts/v1";
const WP_JSON_ROOT = DL_ACCOUNTS_BASE.replace(/\/dl-accounts\/v1\/?$/, "");
const APP_V1 = `${WP_JSON_ROOT}/app/v1`;

/** Binary bytes per chunk (~512KB → ~683KB once base64-encoded). */
const CHUNK_BYTES = 512 * 1024;

export type ClubMediaGroup = "logo" | "cover";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = readTokenClient();
  if (token) {
    // app/v1 reads Authorization: Bearer; dl-accounts reads X-WP-Token.
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-WP-Token"] = token;
  }
  return headers;
}

/** Read a Blob as a bare base64 string (data: prefix stripped). */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Couldn't read the image file."));
    reader.readAsDataURL(blob);
  });
}

/** Unique temp name so concurrent/failed uploads can't collide. */
function uniqueFileName(original: string): string {
  const ext = (original.split(".").pop() || "jpg").toLowerCase();
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${rand}.${ext}`;
}

export interface UploadClubImageVars {
  /** Encrypted club id (as used in the edit route). */
  clubId: string;
  file: File;
  mediaGroup: ClubMediaGroup;
  /** 0-100 progress callback. */
  onProgress?: (percent: number) => void;
}

export interface UploadClubImageResponse {
  success: boolean;
  message: string;
}

/**
 * Upload a club logo/cover. Sends the file as sequential base64 chunks;
 * the server assembles them and pushes to Cloudflare on the last one,
 * replacing any existing image for that media group.
 */
export function useUploadClubImage() {
  const qc = useQueryClient();

  return useMutation<UploadClubImageResponse, Error, UploadClubImageVars>({
    mutationFn: async ({ clubId, file, mediaGroup, onProgress }) => {
      const url = `${APP_V1}/club/${encodeURIComponent(clubId)}/upload-image`;
      const fileName = uniqueFileName(file.name);
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_BYTES));

      let last: UploadClubImageResponse | null = null;

      // Sequential - the server appends, so order matters.
      for (let index = 0; index < totalChunks; index++) {
        const start = index * CHUNK_BYTES;
        const slice = file.slice(start, start + CHUNK_BYTES);
        const chunkData = await blobToBase64(slice);

        const res = await fetch(url, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            media_group: mediaGroup,
            file_name: fileName,
            chunk_index: index,
            total_chunks: totalChunks,
            chunk_data: chunkData,
          }),
        });

        let payload: UploadClubImageResponse | null = null;
        try {
          payload = (await res.json()) as UploadClubImageResponse;
        } catch {
          payload = null;
        }

        if (!res.ok || !payload?.success) {
          throw new Error(
            payload?.message ??
              `Upload failed on chunk ${index + 1} of ${totalChunks}.`,
          );
        }

        last = payload;
        onProgress?.(Math.round(((index + 1) / totalChunks) * 100));
      }

      return last ?? { success: true, message: "Uploaded." };
    },
    onSuccess: (_d, vars) => {
      // Re-read the club so the saved Cloudflare URL replaces the local
      // object-URL preview.
      qc.invalidateQueries({ queryKey: ["club-edit", vars.clubId] });
      qc.invalidateQueries({ queryKey: ["my-clubs"] });
    },
  });
}

export interface RemoveClubImageVars {
  clubId: string;
  mediaGroup: ClubMediaGroup;
}

/** Remove the club's logo or cover image. */
export function useRemoveClubImage() {
  const qc = useQueryClient();

  return useMutation<UploadClubImageResponse, Error, RemoveClubImageVars>({
    mutationFn: async ({ clubId, mediaGroup }) => {
      const res = await fetch(
        `${APP_V1}/club/${encodeURIComponent(clubId)}/remove-image`,
        {
          method: "DELETE",
          headers: authHeaders(),
          body: JSON.stringify({ media_group: mediaGroup }),
        },
      );

      let payload: UploadClubImageResponse | null = null;
      try {
        payload = (await res.json()) as UploadClubImageResponse;
      } catch {
        payload = null;
      }

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message ?? "Couldn't remove the image.");
      }
      return payload;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["club-edit", vars.clubId] });
      qc.invalidateQueries({ queryKey: ["my-clubs"] });
    },
  });
}
