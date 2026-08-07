/**
 * Club edit - API.
 *
 *   GET  /club-edit?cid=ENC   → load the record + category options
 *   POST /club-update         → save (partial-safe: only sent keys write)
 *
 * The response/payload types live in clubEditTypes so the wizard's
 * context can hydrate and build payloads without any remapping.
 *
 * Note: the query hook is `useClubEditQuery` - `useClubEdit` is the
 * context hook that exposes the in-memory record.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import type { ClubEditResponse, ClubUpdateBody } from "./clubEditTypes";
import type { SiteKey } from "./apiTypes";

export interface ClubUpdateResponse {
  success: true;
  club_id: number;
  encrypted_id: string;
  status: "publish" | "draft";
  permalink: string;
  share_url: string;
}

/**
 * Load a club for editing. Skipped until a cid is available.
 *
 * `site` is the multisite blog the club lives on. Encrypted ids are
 * only unique within a site, so a cid on its own is ambiguous once
 * /my-clubs merges both regions - the same rule as events. Omitting it
 * falls back to the API default, which keeps older links working.
 *
 * It sits in a trailing options object in the key so existing prefix
 * invalidations (["club-edit", cid]) keep matching both regions.
 */
export function useClubEditQuery(cid: string, site: SiteKey) {
  return useQuery<ClubEditResponse, Error>({
    queryKey: ["club-edit", cid, { site }],
    queryFn: () =>
      apiGet<ClubEditResponse>(`/club-edit?cid=${encodeURIComponent(cid)}`, {
        site,
      }),
    enabled: Boolean(cid),
    // The wizard holds its own working copy once hydrated, so don't
    // refetch underneath the user mid-edit.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** Save the club. Invalidates the loaded record + the clubs list. */
export function useUpdateClub() {
  const qc = useQueryClient();
  return useMutation<ClubUpdateResponse, Error, ClubUpdateBody>({
    // `site` is carried on the body type for the editor's convenience,
    // but goes to the client as an option so the guard sees it.
    mutationFn: ({ site, ...body }) =>
      apiPost<ClubUpdateResponse, Omit<ClubUpdateBody, "site">>(
        "/club-update",
        body,
        { site },
      ),
    onSuccess: (_data, body) => {
      qc.invalidateQueries({ queryKey: ["club-edit", body.cid] });
      qc.invalidateQueries({ queryKey: ["my-clubs"] });
    },
  });
}

// ─── Create ───────────────────────────────────────────────────────────

export interface CreateClubBody {
  post_title: string;
  /** '1' = private (approval needed), '2' = public. */
  club_type: "1" | "2";
}

export interface CreateClubResponse {
  success: true;
  club_id: number;
  /** Use this in the edit route: /club/{encrypted_id}/edit */
  encrypted_id: string;
  status: "draft";
  club_type: "1" | "2";
}

/**
 * Create a draft club from the "Get Started" step. Returns the
 * encrypted id so the caller can forward to the edit wizard.
 */
export function useCreateClub() {
  const qc = useQueryClient();
  return useMutation<
    CreateClubResponse,
    Error,
    CreateClubBody & { site: SiteKey }
  >({
    // Which blog the club is created on - fixed from here on, same as
    // events.
    mutationFn: ({ site, ...body }) =>
      apiPost<CreateClubResponse, CreateClubBody>("/club-create", body, {
        site,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-clubs"] });
    },
  });
}
