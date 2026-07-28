/**
 * My Venues — paginated fetch for the dashboard "My Venues" tab.
 *
 * Venues where I'm an owner or follower, sorted owner → follower
 * (GET /my-venues?page=1). Badge shows "Unpublished" for drafts,
 * otherwise my role (Owner / Following).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "./apiClient";
import { readTokenClient } from "./authCookies";

export type VenueRole = "owner" | "follower";

export interface MyVenue {
  id: number;
  encrypted_id: string;
  title: string;
  cover_image: string | null;
  logo: string | null;
  location: string;
  role: VenueRole;
  role_label: string;
  post_status: string;
  is_published: boolean;
  badge: string; // "Unpublished" | "Owner" | "Following"
  permalink: string;
}

export interface MyVenuesPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface MyVenuesResponse {
  success: true;
  venues: MyVenue[];
  pagination: MyVenuesPagination;
}

export function useMyVenues(page: number, perPage = 12) {
  return useQuery<MyVenuesResponse, Error>({
    queryKey: ["my-venues", page, perPage],
    queryFn: () =>
      apiGet<MyVenuesResponse>(`/my-venues?page=${page}&per_page=${perPage}`),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ─── Create ───────────────────────────────────────────────────────────

export interface CreateVenueBody {
  post_title: string;
}

export interface CreateVenueResponse {
  success: true;
  venue_id: number;
  /** Use in the edit route: /venue/{encrypted_id}/edit */
  encrypted_id: string;
  status: "draft";
}

/**
 * Create a draft venue from the "name your venue" step. Returns the
 * encrypted id so the caller can forward to the edit wizard.
 */
export function useCreateVenue() {
  const qc = useQueryClient();
  return useMutation<CreateVenueResponse, Error, CreateVenueBody>({
    mutationFn: (body) =>
      apiPost<CreateVenueResponse, CreateVenueBody>("/venue-create", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-venues"] });
    },
  });
}

// ─── Edit (load + save) ───────────────────────────────────────────────

export interface VenueImage {
  id: number | null;
  url: string;
}

/** The editable venue record (matches the wizard's fields). */
export interface VenueEditData {
  id: number;
  encrypted_id: string;
  title: string;
  location: string;
  latitude: string;
  longitude: string;
  logo: VenueImage | null;
  coverImage: VenueImage | null;
  email: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  description: string;
  status: "publish" | "draft";
}

export interface VenueEditResponse {
  success: true;
  venue: VenueEditData;
}

/** POST body — ACF-named, partial-safe (only sent keys are written). */
export interface VenueUpdateBody {
  vid: string;
  post_title?: string;
  venue_location?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  venue_email?: string;
  venue_phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  post_status?: "publish" | "draft";
}

export interface VenueUpdateResponse {
  success: true;
  venue_id: number;
  encrypted_id: string;
  status: "publish" | "draft";
  permalink: string;
}

/** Load a venue for editing. Skipped until a vid is available. */
export function useVenueEditQuery(vid: string) {
  return useQuery<VenueEditResponse, Error>({
    queryKey: ["venue-edit", vid],
    queryFn: () =>
      apiGet<VenueEditResponse>(`/venue-edit?vid=${encodeURIComponent(vid)}`),
    enabled: Boolean(vid),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** Save a venue. Invalidates the loaded record + the venues list. */
export function useUpdateVenue() {
  const qc = useQueryClient();
  return useMutation<VenueUpdateResponse, Error, VenueUpdateBody>({
    mutationFn: (body) =>
      apiPost<VenueUpdateResponse, VenueUpdateBody>("/venue-update", body),
    onSuccess: (_d, body) => {
      qc.invalidateQueries({ queryKey: ["venue-edit", body.vid] });
      qc.invalidateQueries({ queryKey: ["my-venues"] });
    },
  });
}

// ─── Images (upload / remove) ─────────────────────────────────────────
//
// Uses the app's chunked Cloudflare endpoints. Differences from the club
// image flow worth noting:
//   - Routes are on app/v2 and take the RAW venue id in the body
//     (venue_id), not an encrypted id in the path.
//   - Same sequential-chunk + unique-filename constraints as clubs
//     (server appends to a temp file keyed by file_name).

const WP_JSON_ROOT_V = (
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://www.carevents.com/uk/wp-json/dl-accounts/v1"
).replace(/\/dl-accounts\/v1\/?$/, "");
const APP_V2 = `${WP_JSON_ROOT_V}/app/v2`;

const VENUE_CHUNK_BYTES = 512 * 1024;

export type VenueMediaGroup = "logo" | "cover";

function venueAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Imported lazily to avoid a circular import at module load.
  const token = readTokenClient();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-WP-Token"] = token;
  }
  return headers;
}

function venueBlobToBase64(blob: Blob): Promise<string> {
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

function venueUniqueFileName(original: string): string {
  const ext = (original.split(".").pop() || "jpg").toLowerCase();
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${rand}.${ext}`;
}

export interface UploadVenueImageVars {
  /** RAW venue id (VenueEditData.id), not the encrypted one. */
  venueId: number;
  /** Encrypted id — used only to invalidate the edit query. */
  encryptedId: string;
  file: File;
  mediaGroup: VenueMediaGroup;
  onProgress?: (percent: number) => void;
}

export interface VenueImageResponse {
  success: boolean;
  message: string;
}

export function useUploadVenueImage() {
  const qc = useQueryClient();
  return useMutation<VenueImageResponse, Error, UploadVenueImageVars>({
    mutationFn: async ({ venueId, file, mediaGroup, onProgress }) => {
      const url = `${APP_V2}/update-venue-images-cloudflare`;
      const fileName = venueUniqueFileName(file.name);
      const totalChunks = Math.max(1, Math.ceil(file.size / VENUE_CHUNK_BYTES));
      let last: VenueImageResponse | null = null;

      for (let index = 0; index < totalChunks; index++) {
        const start = index * VENUE_CHUNK_BYTES;
        const slice = file.slice(start, start + VENUE_CHUNK_BYTES);
        const chunkData = await venueBlobToBase64(slice);

        const res = await fetch(url, {
          method: "POST",
          headers: venueAuthHeaders(),
          body: JSON.stringify({
            venue_id: venueId,
            media_group: mediaGroup,
            file_name: fileName,
            chunk_index: index,
            total_chunks: totalChunks,
            chunk_data: chunkData,
          }),
        });

        let payload: VenueImageResponse | null = null;
        try {
          payload = (await res.json()) as VenueImageResponse;
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
      qc.invalidateQueries({ queryKey: ["venue-edit", vars.encryptedId] });
      qc.invalidateQueries({ queryKey: ["my-venues"] });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────

export interface DeleteVenueResponse {
  success: true;
  venue_id: number;
  deleted: true;
}

/**
 * Delete (trash) a venue. Owner-only server-side. Invalidates the
 * venues list so the card disappears.
 */
export function useDeleteVenue() {
  const qc = useQueryClient();
  return useMutation<DeleteVenueResponse, Error, { vid: string }>({
    mutationFn: ({ vid }) =>
      apiDelete<DeleteVenueResponse>(
        `/venue-delete?vid=${encodeURIComponent(vid)}`,
      ),
    onSuccess: (_d, { vid }) => {
      qc.invalidateQueries({ queryKey: ["my-venues"] });
      qc.removeQueries({ queryKey: ["venue-edit", vid] });
    },
  });
}
