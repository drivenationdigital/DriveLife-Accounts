/**
 * Event page analytics - GA4 traffic figures for an event's public
 * listing.
 *
 *   GET /event-analytics?eid=ENC&site=uk
 *
 * Deliberately a separate request from `/event` rather than a block on
 * it. The numbers come from Google's Data API, which means a network
 * round trip outside our control on every call: folding it into the
 * event response would put a third party on the critical path of the
 * whole dashboard, so a GA outage or a tripped quota would take out
 * orders, tickets and applications along with the traffic boxes.
 *
 * Here, the worst case is three cards showing "-".
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet, ApiError } from "./apiClient";

export interface EventAnalytics {
  /** Page views over the trailing 7 days, today included. */
  page_views_7d: number;
  /** Page views for all time. GA4's Data API won't accept a start date
   *  before 2015-08-14, which is earlier than any property's data, so
   *  that stands in for "since the beginning". */
  page_views_lifetime: number;
  /** Distinct users for all time, over the same range. */
  visitors_lifetime: number;
  /** The path measured, e.g. "/uk/events/some-event/". Returned so a
   *  wrong-looking figure can be traced to the page it came from
   *  without guessing how the server built the path. */
  page_path?: string;
  /**
   * False when the server couldn't reach GA4 - unconfigured
   * credentials, a quota trip, an outage.
   *
   * The counts are zero in that case, and they must NOT be rendered.
   * A "0" is a claim that nobody visited the page; the truth is that we
   * don't know. The UI shows dashes instead.
   *
   * Optional so a deployment that predates the flag still reads as
   * available rather than blanking every card.
   */
  available?: boolean;
  /** "not_configured" | "lookup_failed". Diagnostic, not shown. */
  unavailable_reason?: string;
}

export interface EventAnalyticsResponse {
  success: true;
  analytics: EventAnalytics;
}

/**
 * Traffic for one event's listing.
 *
 * `enabled` is gated on the eid so the query stays idle until the event
 * has loaded. Retries are off: a GA failure is usually a credentials or
 * quota problem, and neither is fixed by asking again three times.
 *
 * Cached for five minutes. GA4 doesn't report in real time anyway -
 * today's figures lag by minutes to hours - so a fresher fetch would
 * cost quota to return the same numbers.
 */
export function useEventAnalytics(eid: string | undefined, site?: string) {
  return useQuery<EventAnalyticsResponse, ApiError, EventAnalytics>({
    queryKey: ["event-analytics", eid, site],
    queryFn: () =>
      apiGet<EventAnalyticsResponse>(
        `/event-analytics?eid=${encodeURIComponent(eid ?? "")}`,
        { site: site || undefined },
      ),
    enabled: Boolean(eid),
    staleTime: 5 * 60_000,
    retry: false,
    select: (data) => data.analytics,
  });
}
