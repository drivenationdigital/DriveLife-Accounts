/**
 * My Tickets — paginated fetch for the dashboard "My Tickets" tab.
 *
 * Server splits active vs past and paginates each scope separately
 * (GET /my-tickets?scope=active&page=1). Each ticket links to the
 * order detail page (/orders/[encrypted_id]).
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiGet } from "./apiClient";

export type TicketScope = "active" | "past";

export interface MyTicket {
  order_id: number;
  encrypted_id: string;
  event_id: number;
  event_title: string;
  event_image: string;
  date_label: string;
  quantity: number;
  value: number;
  value_label: string;
}

export interface MyTicketsPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface MyTicketsResponse {
  success: true;
  scope: TicketScope;
  tickets: MyTicket[];
  counts: { active: number; past: number };
  pagination: MyTicketsPagination;
}

export function useMyTickets(
  scope: TicketScope,
  page: number,
  perPage = 12,
) {
  return useQuery<MyTicketsResponse, Error>({
    queryKey: ["my-tickets", scope, page, perPage],
    queryFn: () =>
      apiGet<MyTicketsResponse>(
        `/my-tickets?scope=${scope}&page=${page}&per_page=${perPage}`,
      ),
    // Keep the previous page visible while the next loads (no flash).
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
