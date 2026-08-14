/**
 * Event tickets for the Tickets tab.
 *
 *   GET /event/tickets?eid=ENC&site=uk&limit=25&offset=0&search=
 *
 * One row per ticket SOLD, not per order - a two-ticket order produces
 * two rows. Separate from `/event/orders`: that endpoint also returns
 * an `attendees` array, but it's derived from whichever page of ORDERS
 * was requested, so it can't drive an independently paginated table.
 *
 * Search and pagination are both server-side, and search runs over the
 * whole set before slicing - so a match on page nine is found from page
 * one. It matches case-insensitively on ticket id, order id, buyer
 * name/email/phone, ticket name, car make/model/reg and car club.
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiGet } from "./apiClient";
import type { ApiAttendee, EventSite } from "./apiTypes";

export interface EventTicketsResponse {
  success: true;
  /** The region the event resolved on. Authoritative for currency -
   *  `line_total` is an unformatted number and a US event returns USD. */
  site?: EventSite;
  tickets: ApiAttendee[];
  /** Count AFTER search is applied, so it drives the pager correctly. */
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
  search?: string;
}

export interface UseEventTicketsArgs {
  eid: string;
  /**
   * Multisite blog key. Send it: post ids repeat across regions, so
   * this is part of the event's identity rather than a filter, and
   * omitting it resolves against the UK blog - silently returning
   * another region's data for a US event.
   */
  site?: string;
  page: number;
  perPage?: number;
  search?: string;
}

export function useEventTickets({
  eid,
  site,
  page,
  perPage = 50,
  search = "",
}: UseEventTicketsArgs) {
  const trimmed = search.trim();
  const offset = (Math.max(1, page) - 1) * perPage;

  return useQuery<EventTicketsResponse, Error>({
    // Filters in the key → changing search/page re-runs the query.
    queryKey: ["event-tickets", eid, site, page, perPage, trimmed],
    queryFn: () => {
      const params = new URLSearchParams({
        eid,
        limit: String(perPage),
        offset: String(offset),
      });
      if (trimmed) params.set("search", trimmed);
      return apiGet<EventTicketsResponse>(
        `/event/tickets?${params.toString()}`,
        { site: site || undefined },
      );
    },
    enabled: Boolean(eid),
    // Keeps the previous page on screen while the next loads, so the
    // table dims rather than collapsing to an empty state.
    placeholderData: keepPreviousData,
  });
}
