/**
 * Orders CSV export.
 *
 *   POST /event/orders-export { eid, search? }
 *     → { filename, csv } - ALL orders for the event (search-filtered
 *       if a term is given), which we turn into a file download client-
 *       side. The endpoint returns the CSV as a string to avoid WP's
 *       REST serializer mangling a raw file response.
 */

import { useMutation } from "@tanstack/react-query";
import { apiPost } from "./apiClient";
import { downloadCsv } from "./csvDownload";

interface OrdersExportResponse {
  success: true;
  filename: string;
  csv: string;
  count: number;
}

interface ExportVars {
  eid: string;
  search?: string;
}

/**
 * Export all orders for an event to CSV. On success, immediately kicks
 * off the file download.
 */
export function useExportOrders() {
  return useMutation<OrdersExportResponse, Error, ExportVars>({
    mutationFn: (body) =>
      apiPost<OrdersExportResponse, ExportVars>("/event/orders-export", body),
    onSuccess: (data) => {
      if (data?.csv) {
        downloadCsv(data.filename || "orders.csv", data.csv);
      }
    },
  });
}
