/**
 * My Tracks - data hooks for the Tracks & Circuits section.
 *
 * Mirrors lib/myVenues.ts: tracks where I'm an owner or follower
 * (GET /my-tracks?page=1), create / load / save / delete, plus the track
 * type options for the editor. Images go through lib/uploadTrackImage.ts
 * (Cloudflare direct upload), not through this file.
 *
 * A track belongs to one region. Encrypted ids repeat across regions, so
 * every detail call carries `site` - see the notes on the venue hooks.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "./apiClient";
import type { EventSite, SiteKey } from "./apiTypes";

export type TrackRole = "owner" | "follower";

export interface MyTrack {
  id: number;
  encrypted_id: string;
  title: string;
  cover_image: string | null;
  logo: string | null;
  location: string;
  /** Human labels, e.g. ["Race circuit", "Drag strip"]. */
  track_types: string[];
  role: TrackRole;
  role_label: string;
  post_status: string;
  is_published: boolean;
  badge: string; // "Unpublished" | "Owner" | "Following"
  permalink: string;
  /** Which country site this track belongs to. */
  site?: EventSite;
}

export interface MyTracksPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface MyTracksResponse {
  success: true;
  tracks: MyTrack[];
  sites?: EventSite[];
  pagination: MyTracksPagination;
}

/**
 * `site` here is a FILTER, not an identifier - omitting it merges every
 * region the user has tracks on, which is the account view's default.
 */
export function useMyTracks(page: number, perPage = 12, site?: SiteKey) {
  return useQuery<MyTracksResponse, Error>({
    queryKey: ["my-tracks", page, perPage, { site }],
    queryFn: () =>
      apiGet<MyTracksResponse>(`/my-tracks?page=${page}&per_page=${perPage}`, {
        site,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ─── Options ──────────────────────────────────────────────────────────

export interface TrackTypeOption {
  value: string;
  label: string;
}

interface TrackOptionsResponse {
  success: true;
  types: TrackTypeOption[];
}

/** Track type choices (race circuit, drag strip, …) for the editor. */
export function useTrackOptions() {
  return useQuery<TrackOptionsResponse, Error>({
    queryKey: ["track-options"],
    queryFn: () => apiGet<TrackOptionsResponse>("/track-options"),
    staleTime: 60 * 60_000,
  });
}

// ─── Create ───────────────────────────────────────────────────────────

export interface CreateTrackBody {
  post_title: string;
}

export interface CreateTrackResponse {
  success: true;
  track_id: number;
  /** Use in the edit route: /track/{ref}/edit */
  encrypted_id: string;
  status: "draft";
}

/** Create a draft track from the "name your track" step. */
export function useCreateTrack() {
  const qc = useQueryClient();
  return useMutation<
    CreateTrackResponse,
    Error,
    CreateTrackBody & { site: SiteKey }
  >({
    mutationFn: ({ site, ...body }) =>
      apiPost<CreateTrackResponse, CreateTrackBody>("/track-create", body, {
        site,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tracks"] });
      // The new track is a host option for events straight away.
      qc.invalidateQueries({ queryKey: ["host-options"] });
    },
  });
}

// ─── Edit (load + save) ───────────────────────────────────────────────

export interface TrackImage {
  /** Cloudflare media id for dashboard uploads; null for a wp-admin
   *  image (which can be replaced but not removed from here). */
  id: string | null;
  url: string;
}

/** The editable track record (matches the wizard's fields). */
export interface TrackEditData {
  id: number;
  encrypted_id: string;
  /** Region the tid belongs to - folded in by useTrackEditQuery. */
  site: SiteKey;
  title: string;
  location: string;
  latitude: string;
  longitude: string;
  /** Type VALUES (keys), e.g. ["race_circuit"]. */
  trackTypes: string[];
  trackLength: string;
  noiseLimit: string;
  logo: TrackImage | null;
  coverImage: TrackImage | null;
  email: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  description: string;
  status: "publish" | "draft";
  permalink: string;
}

export interface ApiTrackEditResponse {
  success: true;
  track: Omit<TrackEditData, "site">;
}

export interface TrackEditResponse {
  success: true;
  track: TrackEditData;
}

/** POST body - ACF-named, partial-safe (only sent keys are written). */
export interface TrackUpdateBody {
  tid: string;
  site: SiteKey;
  post_title?: string;
  track_location?: string;
  latitude?: string;
  longitude?: string;
  track_types?: string[];
  track_length?: string;
  noise_limit?: string;
  description?: string;
  track_email?: string;
  track_phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  post_status?: "publish" | "draft";
}

export interface TrackUpdateResponse {
  success: true;
  track_id: number;
  encrypted_id: string;
  status: "publish" | "draft";
  permalink: string;
}

/** Load a track for editing. Skipped until a tid is available. */
export function useTrackEditQuery(tid: string, site: SiteKey) {
  return useQuery<TrackEditResponse, Error>({
    queryKey: ["track-edit", tid, { site }],
    queryFn: async () => {
      const res = await apiGet<ApiTrackEditResponse>(
        `/track-edit?tid=${encodeURIComponent(tid)}`,
        { site },
      );
      return { ...res, track: { ...res.track, site } };
    },
    enabled: Boolean(tid),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** Save a track. Invalidates the loaded record + the tracks list. */
export function useUpdateTrack() {
  const qc = useQueryClient();
  return useMutation<TrackUpdateResponse, Error, TrackUpdateBody>({
    mutationFn: ({ site, ...body }) =>
      apiPost<TrackUpdateResponse, Omit<TrackUpdateBody, "site">>(
        "/track-update",
        body,
        { site },
      ),
    onSuccess: (_d, body) => {
      qc.invalidateQueries({ queryKey: ["track-edit", body.tid] });
      qc.invalidateQueries({ queryKey: ["my-tracks"] });
      qc.invalidateQueries({ queryKey: ["host-options"] });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────

export interface DeleteTrackResponse {
  success: true;
  track_id: number;
  deleted: true;
}

/** Delete (trash) a track. Owner-only server-side. */
export function useDeleteTrack() {
  const qc = useQueryClient();
  return useMutation<DeleteTrackResponse, Error, { tid: string; site: SiteKey }>({
    mutationFn: ({ tid, site }) =>
      apiDelete<DeleteTrackResponse>(
        `/track-delete?tid=${encodeURIComponent(tid)}`,
        { site },
      ),
    onSuccess: (_d, { tid }) => {
      qc.invalidateQueries({ queryKey: ["my-tracks"] });
      qc.invalidateQueries({ queryKey: ["host-options"] });
      qc.removeQueries({ queryKey: ["track-edit", tid] });
    },
  });
}
