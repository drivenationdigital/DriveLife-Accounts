/**
 * My Clubs — paginated fetch for the dashboard "My Clubs" tab.
 *
 * Clubs where I'm owner / admin / member, sorted owner → admin →
 * member (GET /my-clubs?page=1). Badge shows "Unpublished" for drafts,
 * otherwise my role.
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiGet } from "./apiClient";

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
  pagination: MyClubsPagination;
}

export function useMyClubs(page: number, perPage = 12) {
  return useQuery<MyClubsResponse, Error>({
    queryKey: ["my-clubs", page, perPage],
    queryFn: () =>
      apiGet<MyClubsResponse>(`/my-clubs?page=${page}&per_page=${perPage}`),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
