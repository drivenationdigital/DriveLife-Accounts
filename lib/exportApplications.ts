/**
 * Applications CSV export (car clubs / traders / show cars).
 *
 *   POST /event-applications-export { eid, type }
 *     → { filename, csv } — all applications of that type for the event,
 *       turned into a file download client-side.
 */

import { useMutation } from "@tanstack/react-query";
import { apiPost } from "./apiClient";

export type ApplicationExportType = "car_club" | "trader" | "show_car";

interface ApplicationsExportResponse {
  success: true;
  filename: string;
  csv: string;
  count: number;
}

interface ExportVars {
  eid: string;
  type: ApplicationExportType;
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
 * Export an event's applications of a given type to CSV. On success,
 * immediately kicks off the file download.
 */
export function useExportApplications() {
  return useMutation<ApplicationsExportResponse, Error, ExportVars>({
    mutationFn: (body) =>
      apiPost<ApplicationsExportResponse, ExportVars>(
        "/event-applications-export",
        body,
      ),
    onSuccess: (data) => {
      if (data?.csv) {
        downloadCsv(data.filename || "applications.csv", data.csv);
      }
    },
  });
}
