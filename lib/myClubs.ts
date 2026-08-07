/**
 * My Clubs - paginated fetch for the dashboard "My Clubs" tab.
 *
 * Clubs where I'm owner / admin / member, sorted owner → admin →
 * member (GET /my-clubs?page=1). Badge shows "Unpublished" for drafts,
 * otherwise my role.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiGet, apiDelete } from "./apiClient";
import type { EventSite, SiteKey } from "./apiTypes";

export type ClubRole = "owner" | "admin" | "member";

export interface MyClub {
  id: number;
  encrypted_id: string;
  title: string;
  cover_image: string | null;
  logo: string | null;
  member_count: number;
  category: string;
  role: ClubRole;
  role_label: string;
  post_status: string;
  is_published: boolean;
  badge: string; // "Unpublished" | "Owner" | "Admin" | "Member"
  permalink: string;
  /** Which country site this club belongs to. Optional for
   *  back-compat with pre-multisite deployments. */
  site?: EventSite;
}

export interface MyClubsPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface MyClubsResponse {
  success: true;
  clubs: MyClub[];
  /** Every region in scope for this response. */
  sites?: EventSite[];
  pagination: MyClubsPagination;
}

/**
 * `site` here is a FILTER, not an identifier - unlike the detail
 * routes. Omitting it merges every region the user has clubs on, which
 * is what the account view wants; pass a key only for an explicit
 * region filter.
 */
export function useMyClubs(page: number, perPage = 12, site?: SiteKey) {
  return useQuery<MyClubsResponse, Error>({
    queryKey: ["my-clubs", page, perPage, { site }],
    queryFn: () =>
      apiGet<MyClubsResponse>(
        `/my-clubs?page=${page}&per_page=${perPage}` +
          (site ? `&site=${encodeURIComponent(site)}` : ""),
      ),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ─── Delete ───────────────────────────────────────────────────────────

export interface DeleteClubResponse {
  success: true;
  club_id: number;
  deleted: true;
}

/**
 * Delete (trash) a club. Owner-only server-side. Invalidates the clubs
 * list so the card disappears, and drops any cached edit query.
 */
export function useDeleteClub() {
  const qc = useQueryClient();
  return useMutation<DeleteClubResponse, Error, { cid: string; site?: SiteKey }>({
    // `site` is not optional in spirit: cids repeat across regions, so
    // omitting it on a US club resolves the same id on the UK blog -
    // and this is a delete.
    mutationFn: ({ cid, site }) =>
      apiDelete<DeleteClubResponse>(
        `/club-delete?cid=${encodeURIComponent(cid)}` +
          (site ? `&site=${encodeURIComponent(site)}` : ""),
      ),
    onSuccess: (_d, { cid }) => {
      qc.invalidateQueries({ queryKey: ["my-clubs"] });
      qc.removeQueries({ queryKey: ["club-edit", cid] });
    },
  });
}
