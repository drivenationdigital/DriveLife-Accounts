/**
 * Dashboard "My Events" summary - pinned + upcoming events I organise,
 * capped at 5 (pinned first). Returns EventRecord[] so the dashboard
 * reuses the same EventCard as the My Events tab.
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./apiClient";
import type { EventRecord } from "./apiTypes";

export interface MyEventsSummaryResponse {
  success: true;
  events: EventRecord[];
  total_owned: number;
  limit: number;
}

export function useMyEventsSummary() {
  return useQuery<MyEventsSummaryResponse, Error>({
    queryKey: ["my-events-summary"],
    queryFn: () => apiGet<MyEventsSummaryResponse>("/my-events-summary"),
    staleTime: 60_000,
  });
}
