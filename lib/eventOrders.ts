/**
 * Event orders for the Orders tab.
 *
 * Dedicated query (not useEventData().orders) so the list can be
 * searched + filtered from local component state without touching the
 * URL or the shared event context. Because the filters are part of the
 * queryKey, changing any of them re-runs the fetch automatically - no
 * effects, no setState-in-effect, no URL round-trip.
 *
 * Backs POST /event/orders, which already accepts { eid, limit, offset,
 * search }. Ticket-type filtering is applied client-side over the
 * returned page's attendees (the endpoint paginates orders, and one
 * order can span ticket types).
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiPost } from "./apiClient";

export interface OrderBuyer {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface OrderCar {
  make: string | null;
  model: string | null;
  reg: string | null;
}

export interface EventOrder {
  id: number;
  encrypted_id: string;
  date_created: string | null;
  buyer: OrderBuyer;
  quantity: number;
  total_amount: number;
  status: string;
  processing_fees: number;
  payment_method: string;
  marketing_opt_in: boolean;
  marketing_source: string | null;
  cars: OrderCar[];
}

export interface EventAttendee {
  ticket_id: number | null;
  order_id: number;
  buyer: OrderBuyer;
  ticket_name: string;
  line_total: number;
  car: OrderCar;
  car_club: string | null;
}

interface OrdersResponse {
  success: true;
  orders: EventOrder[];
  attendees: EventAttendee[];
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
  search?: string;
}

export interface UseEventOrdersArgs {
  eid: string;
  /** Multisite blog key the event lives on - see EventDetail.site.
   *  Omitted falls back to the API's default site. */
  site?: string;
  page: number;
  perPage?: number;
  search?: string;
}

export function useEventOrders({
  eid,
  site,
  page,
  perPage = 50,
  search = "",
}: UseEventOrdersArgs) {
  const trimmed = search.trim();
  return useQuery<OrdersResponse, Error>({
    // Filters in the key → changing search/page re-runs the query.
    queryKey: ["event-orders", eid, site, page, perPage, trimmed],
    queryFn: () =>
      apiPost<OrdersResponse, Record<string, unknown>>("/event/orders", {
        eid,
        site: site || undefined,
        limit: perPage,
        offset: (Math.max(1, page) - 1) * perPage,
        search: trimmed || undefined,
      }),
    enabled: Boolean(eid),
    placeholderData: keepPreviousData,
  });
}

/**
 * Distinct ticket names present across the loaded page's attendees -
 * used to populate the "Ticket type" filter dropdown. (Purely from the
 * data already returned; no extra request.)
 */
export function ticketTypesFromAttendees(
  attendees: EventAttendee[] | undefined,
): string[] {
  if (!attendees?.length) return [];
  const seen = new Set<string>();
  for (const a of attendees) {
    const name = a.ticket_name?.trim();
    if (name) seen.add(name);
  }
  return Array.from(seen).sort();
}
