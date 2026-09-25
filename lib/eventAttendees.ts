/**
 * Attendees for the event view (Attending tab).
 *
 *   GET  /event-attendees?eid&site          → the list
 *   POST /event-attendees-export {eid}      → { filename, csv }
 *
 * Rows come from carevents_event_attendees: free-registration checkouts
 * (source "order") and the event page's "I'm attending" button (source
 * "attending"). Dedicated query so the tab refreshes on focus, same as
 * the application tabs.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import { downloadCsv } from "./csvDownload";

export interface ApiAttendeeRecord {
  id: number;
  full_name: string;
  /** Combined "Make Model" string (what the public attendee list shows). */
  vehicle: string;
  vehicle_make: string;
  vehicle_model: string;
  email: string;
  /** Opted to appear on the event page's attendee list. */
  is_public: boolean;
  source: "order" | "attending";
  order_id: number | null;
  /** ISO 8601, null for rows written before the timestamp existed. */
  registered_at: string | null;
}

export interface EventAttendeesResponse {
  success: true;
  event_id: number;
  attendees: ApiAttendeeRecord[];
  total: number;
}

export function useEventAttendees(eid: string | undefined, site: string) {
  return useQuery<EventAttendeesResponse, Error>({
    queryKey: ["event-attendees", eid, site],
    queryFn: () =>
      apiGet<EventAttendeesResponse>(
        `/event-attendees?eid=${encodeURIComponent(eid ?? "")}`,
        { site: site || undefined },
      ),
    enabled: !!eid,
    staleTime: 30_000,
  });
}

interface AttendeesExportResponse {
  success: true;
  filename: string;
  csv: string;
  count: number;
}

/** Export the event's attendees to CSV; downloads on success. */
export function useExportAttendees() {
  return useMutation<AttendeesExportResponse, Error, { eid: string; site: string }>({
    mutationFn: ({ eid, site }) =>
      apiPost<AttendeesExportResponse, { eid: string }>(
        "/event-attendees-export",
        { eid },
        { site: site || undefined },
      ),
    onSuccess: (data) => {
      if (data?.csv) {
        downloadCsv(data.filename || "attendees.csv", data.csv);
      }
    },
  });
}
