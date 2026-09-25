"use client";

import { useEventData } from "@/context/EventContext";
import { useAction } from "@/context/ActionContext";
import { DownloadIcon } from "@/components/ui/Icons";
import { ComingSoonBanner } from "@/components/ui/ComingSoonBanner";
import {
  ApplicationsSkeleton,
  ApplicationsError,
} from "@/components/tabs/ApplicationsSkeleton";
import { useEventAttendees, useExportAttendees } from "@/lib/eventAttendees";
import { formatRegionDate } from "@/lib/regions";

/**
 * Attending tab - everyone who has said they're coming to a free event
 * that asks attendees to register: the event page's "I'm attending"
 * button (name + optional vehicle) and the registration checkout.
 * Exportable as CSV.
 */
export function AttendingTab() {
  const { event } = useEventData();
  const eid = event.encryptedId;

  const { data, isLoading, error, refetch, isFetching } = useEventAttendees(
    eid,
    event.site,
  );
  const attendees = data?.attendees ?? [];

  const exportAttendees = useExportAttendees();
  const runAction = useAction();
  const handleExport = () =>
    runAction({
      loadingLabel: "Preparing your CSV...",
      successTitle: "Attendees exported",
      successMessage: "The CSV has been downloaded.",
      errorTitle: "Export failed",
      run: () => exportAttendees.mutateAsync({ eid, site: event.site }),
    });

  if (isLoading) {
    return (
      <ApplicationsSkeleton variant="table" rows={5} label="Loading attendees" />
    );
  }

  if (error && attendees.length === 0) {
    return (
      <ApplicationsError
        message={(error as Error)?.message}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  }

  if (attendees.length === 0) {
    return (
      <ComingSoonBanner
        title="No one has registered yet"
        message="People who click “I'm attending” on your event page, or register through the checkout, will appear here."
      />
    );
  }

  const count = attendees.length;
  const publicCount = attendees.filter((a) => a.is_public).length;

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Attending</div>
          <div className="section-subtitle">
            {count} {count === 1 ? "person" : "people"} registered
            {publicCount !== count && ` · ${publicCount} shown on the event page`}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleExport}
          disabled={exportAttendees.isPending}
        >
          <DownloadIcon /> Export CSV
        </button>
      </div>

      <div className="section-body flush">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Vehicle</th>
              <th>Registered via</th>
              <th>Public</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((a) => {
              const vehicle =
                [a.vehicle_make, a.vehicle_model].filter(Boolean).join(" ") ||
                a.vehicle ||
                "-";
              return (
                <tr key={a.id}>
                  <td>
                    <strong>{a.full_name || "Unnamed"}</strong>
                  </td>
                  <td>
                    {a.email ? (
                      <a href={`mailto:${a.email}`}>{a.email}</a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{vehicle}</td>
                  <td>
                    {a.source === "order"
                      ? "Checkout registration"
                      : "I'm attending button"}
                  </td>
                  <td>{a.is_public ? "Yes" : "No"}</td>
                  <td>
                    {a.registered_at
                      ? formatRegionDate(a.registered_at, event.region)
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
