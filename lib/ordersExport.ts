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

/** Trigger a browser download of a CSV string. */
function downloadCsv(filename: string, csv: string) {
  // Prepend a BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
