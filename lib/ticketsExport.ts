/**
 * Tickets CSV export.
 *
 *   POST /event/tickets-export { eid, site, search? }
 *     → { filename, csv, count } - ALL tickets for the event, search-
 *       filtered when a term is given, mirroring /event/orders-export.
 *
 * One row per ticket SOLD, matching the Tickets tab rather than Orders:
 * a two-ticket order exports as two rows.
 *
 * The export deliberately ignores pagination. The point of it is to get
 * the whole set out - exporting only the visible page would be a
 * surprise, and is why `search` is forwarded but `limit`/`offset` are
 * not.
 */

import { useMutation } from "@tanstack/react-query";
import { apiPost } from "./apiClient";
import { downloadCsv } from "./csvDownload";

interface TicketsExportResponse {
  success: true;
  filename: string;
  csv: string;
  count: number;
}

interface ExportVars {
  eid: string;
  /**
   * The event's blog. Sent because the eid alone doesn't identify the
   * event across the multisite - the same id exists on both blogs - so
   * omitting it can export another region's tickets.
   */
  site?: string;
  search?: string;
}

/**
 * Export all tickets for an event to CSV. On success, immediately kicks
 * off the file download.
 */
export function useExportTickets() {
  return useMutation<TicketsExportResponse, Error, ExportVars>({
    mutationFn: ({ eid, site, search }) =>
      apiPost<TicketsExportResponse, { eid: string; search?: string }>(
        "/event/tickets-export",
        { eid, search },
        // apiPost merges `site` into the body for POSTs.
        { site: site || undefined },
      ),
    onSuccess: (data) => {
      if (data?.csv) {
        downloadCsv(data.filename || "tickets.csv", data.csv);
      }
    },
  });
}
