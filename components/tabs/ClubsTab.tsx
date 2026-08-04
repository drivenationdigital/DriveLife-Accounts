"use client";

import { useEventData } from "@/context/EventContext";
import { KpiCard } from "@/components/cards/KpiCard";
import { ClubTable } from "@/components/tables/ClubTable";
import { ComingSoonBanner } from "@/components/ui/ComingSoonBanner";
import { DownloadIcon } from "@/components/ui/Icons";
import { useClubApplications } from "@/lib/clubApplications";
import { useExportApplications } from "@/lib/exportApplications";
import { useAction } from "@/context/ActionContext";
import type { Club } from "@/context/types";

/**
 * Clubs tab - car club applications, one section card per status
 * (Pending / Approved / Rejected), each holding a table.
 *
 * Reads from the dedicated useClubApplications query so the list
 * refreshes on tab focus + after approve/reject. Approve/reject open
 * the detail modal, which owns the mutation.
 */
export function ClubsTab() {
  const { event } = useEventData();
  const eid = event.encryptedId;
  const { data, isLoading, error } = useClubApplications(eid);

  const exportApps = useExportApplications();
  const runAction = useAction();
  const handleExport = () => {
    if (exportApps.isPending) return;
    return runAction({
      loadingLabel: "Preparing your CSV...",
      successTitle: "Applications exported",
      successMessage: "The CSV has been downloaded.",
      errorTitle: "Export failed",
      run: () => exportApps.mutateAsync({ eid, type: "car_club" }),
    });
  };
  const clubs = data?.clubs ?? [];
  const sales = data?.sales;

  if (!isLoading && !error && clubs.length === 0) {
    return (
      <ComingSoonBanner
        title="No club applications yet"
        message="Applications will appear here as car clubs apply through your event's club application link."
      />
    );
  }

  const pending = clubs.filter((c) => c.status === "pending");
  // Server maps confirmed clubs (DB 'confirmed') → FE 'approved'.
  const confirmed = clubs.filter((c) => c.status === "approved");
  const rejected = clubs.filter((c) => c.status === "rejected");

  // Attending members comes from the server: real tickets sold for
  // paid events, or confirmed slots for free events. NOT a sum of
  // applied member counts (which would include pending + over-count).
  const attendingMembers = sales?.attending ?? 0;

  // Total Club Sales = actual tickets sold × price (real purchases),
  // from the ticket's stock_sold - not a function of confirmed
  // member counts.
  const salesTotal = sales?.total ?? 0;

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Total Clubs" value={clubs.length} />
        <KpiCard
          label="Total Club Sales"
          value={
            <>
              <span className="currency">£</span>
              {salesTotal.toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </>
          }
        />
        <KpiCard label="Attending Members" value={attendingMembers} />
      </div>

      {pending.length > 0 && (
        <ClubSection
          title="Pending Club Applications"
          subtitle={`${pending.length} awaiting review`}
          clubs={pending}
          spacesMode="requested"
        />
      )}

      {confirmed.length > 0 && (
        <ClubSection
          title="Approved Clubs"
          subtitle={`${confirmed.length} confirmed for event`}
          clubs={confirmed}
          spacesMode="sold"
          onExport={handleExport}
          exporting={exportApps.isPending}
        />
      )}

      {rejected.length > 0 && (
        <ClubSection
          title="Rejected Clubs"
          subtitle={`${rejected.length} ${rejected.length === 1 ? "application" : "applications"} rejected`}
          clubs={rejected}
          spacesMode="requested"
        />
      )}
    </>
  );
}

/**
 * One status group as its own section card. Approved is the only
 * group that carries the export button - it's the list that becomes a
 * gate list on the day.
 */
function ClubSection({
  title,
  subtitle,
  clubs,
  spacesMode,
  onExport,
  exporting,
}: {
  title: string;
  subtitle: string;
  clubs: Club[];
  spacesMode: "requested" | "sold";
  onExport?: () => void;
  exporting?: boolean;
}) {
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">{title}</div>
          <div className="section-subtitle">{subtitle}</div>
        </div>
        {onExport && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onExport}
            disabled={exporting}
          >
            <DownloadIcon />
            Export
          </button>
        )}
      </div>
      <div className="section-body flush">
        <ClubTable clubs={clubs} spacesMode={spacesMode} />
      </div>
    </div>
  );
}
