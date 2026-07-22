/**
 * My Venues — paginated fetch for the dashboard "My Venues" tab.
 *
 * Venues where I'm an owner or follower, sorted owner → follower
 * (GET /my-venues?page=1). Badge shows "Unpublished" for drafts,
 * otherwise my role (Owner / Following).
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiGet } from "./apiClient";

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
