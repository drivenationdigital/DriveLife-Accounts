/**
 * Saved Events (favourites) — paginated fetch for the dashboard tab.
 *
 * Server splits upcoming vs past and paginates each scope separately
 * (GET /saved-events?scope=upcoming&page=1). Returns EventRecord[] so
 * the tab reuses the same EventCard as My Events + the dashboard.
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiGet } from "./apiClient";
import type { EventRecord } from "./apiTypes";

export type SavedEventScope = "upcoming" | "past";

export interface SavedEventsPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface SavedEventsResponse {
  success: true;
  scope: SavedEventScope;
  events: EventRecord[];
  counts: { upcoming: number; past: number };
  pagination: SavedEventsPagination;
}

export function useSavedEvents(
  scope: SavedEventScope,
  page: number,
  perPage = 12,
) {
  return useQuery<SavedEventsResponse, Error>({
    queryKey: ["saved-events", scope, page, perPage],
    queryFn: () =>
      apiGet<SavedEventsResponse>(
        `/saved-events?scope=${scope}&page=${page}&per_page=${perPage}`,
      ),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
