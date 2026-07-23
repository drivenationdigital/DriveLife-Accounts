/**
 * Club edit — API.
 *
 *   GET  /club-edit?cid=ENC   → load the record + category options
 *   POST /club-update         → save (partial-safe: only sent keys write)
 *
 * The response/payload types live in clubEditTypes so the wizard's
 * context can hydrate and build payloads without any remapping.
 *
 * Note: the query hook is `useClubEditQuery` — `useClubEdit` is the
 * context hook that exposes the in-memory record.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import type { ClubEditResponse, ClubUpdateBody } from "./clubEditTypes";

export interface ClubUpdateResponse {
  success: true;
  club_id: number;
  encrypted_id: string;
  status: "publish" | "draft";
  permalink: string;
  share_url: string;
}

/** Load a club for editing. Skipped until a cid is available. */
export function useClubEditQuery(cid: string) {
  return useQuery<ClubEditResponse, Error>({
    queryKey: ["club-edit", cid],
    queryFn: () =>
      apiGet<ClubEditResponse>(`/club-edit?cid=${encodeURIComponent(cid)}`),
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
    mutationFn: (body) =>
      apiPost<ClubUpdateResponse, ClubUpdateBody>("/club-update", body),
    onSuccess: (_data, body) => {
      qc.invalidateQueries({ queryKey: ["club-edit", body.cid] });
      qc.invalidateQueries({ queryKey: ["my-clubs"] });
    },
  });
}
