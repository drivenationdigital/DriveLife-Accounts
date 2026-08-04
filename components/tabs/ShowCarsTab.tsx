"use client";

import { useEventData } from "@/context/EventContext";
import { KpiCard } from "@/components/cards/KpiCard";
import { ShowCarTable } from "@/components/tables/ShowCarTable";
import { DownloadIcon } from "@/components/ui/Icons";
import { ComingSoonBanner } from "@/components/ui/ComingSoonBanner";
import { useShowCarApplications } from "@/lib/showCarApplications";
import { useExportApplications } from "@/lib/exportApplications";
import { useAction } from "@/context/ActionContext";
import type { ShowCar, Ticket } from "@/context/types";

/**
 * Show Cars tab.
 *
 * Flow modelled here:
 *
 *   1. User submits application      → status: "pending"
 *   2. Admin approves                 → status: "awaiting-payment"
 *      (system emails the user a ticket-purchase invite)
 *   3. User buys ticket               → status: "confirmed"
 *   4. Admin rejects (any time)       → status: "rejected"
 *
 * UI structure mirrors the agreed mockup:
 *
 *   - KPI strip across the top - Pending Review, Awaiting Payment,
 *     Confirmed. Rejected doesn't get a KPI because it's not a target
 *     metric.
 *   - One section card per status group (Pending / Awaiting Payment /
 *     Confirmed / Rejected), each holding a table of applications.
 *     A group only renders when it has rows - the KPI strip already
 *     carries the zero counts.
 *   - "Confirmed Spaces by Category" table showing utilisation per
 *     show car category (only rendered when there are show car
 *     tickets).
 *
 * Empty states:
 *
 *   - No show car tickets defined on the event → the whole tab
 *     collapses to a "not enabled" banner. The organiser hasn't
 *     created any show car categories in the editor yet.
 *   - Tickets exist but no applications submitted → KPIs + category
 *     table render; the applications card shows a "no applications
 *     yet" inline message.
 */
export function ShowCarsTab() {
  const { event, showCarTickets } = useEventData();
  const eid = event.encryptedId;

  const exportApps = useExportApplications();
  const runAction = useAction();
  const handleExport = () => {
    if (exportApps.isPending) return;
    return runAction({
      loadingLabel: "Preparing your CSV...",
      successTitle: "Applications exported",
      successMessage: "The CSV has been downloaded.",
      errorTitle: "Export failed",
      run: () => exportApps.mutateAsync({ eid, type: "show_car" }),
    });
  };
  // Applications live on a dedicated query - see useShowCarApplications.
  // Fall back to [] while loading or on error so the rest of the tab
  // (KPIs, category table, "no applications" empty state) still
  // renders cleanly. Approve / reject are wired inside the detail
  // modal now, not on the cards.
  const { data: showCars = [] } = useShowCarApplications(eid);

  // No show car tickets ⇒ feature isn't set up for this event.
  if (showCarTickets.length === 0) {
    return (
      <ComingSoonBanner
        title="Show cars not enabled for this event"
        message="Create a show car ticket type in the event editor to start accepting applications."
      />
    );
  }

  const pending = showCars.filter((c) => c.status === "pending");
  const awaitingPayment = showCars.filter(
    (c) => c.status === "awaiting-payment",
  );
  const confirmed = showCars.filter((c) => c.status === "confirmed");
  const rejected = showCars.filter((c) => c.status === "rejected");

  // Capacity table comes from the show car tickets directly - each
  // ticket is a category, capacity = stock, confirmed = sold. Single
  // source of truth, no separate categoryStats array to keep in sync.
  const totalConfirmed = showCarTickets.reduce((n, t) => n + t.sold, 0);
  const totalCapacity = showCarTickets.reduce((n, t) => n + t.capacity, 0);
  const totalPct =
    totalCapacity > 0 ? Math.round((totalConfirmed / totalCapacity) * 100) : 0;

  // Render groups in workflow order: applications enter at "Pending
  // Review", move to "Awaiting Payment" on approval, then "Confirmed"
  // after payment; rejection branches off at any point. Each group is
  // its own section card - the statuses are separate concerns for the
  // organiser, so merging them into one box buried the boundaries.
  const groups: Array<{
    key: ShowCar["status"];
    title: string;
    subtitle: string;
    cars: ShowCar[];
    /** Only the confirmed list is worth exporting - it's the one that
     *  becomes a gate list on the day. */
    exportable?: boolean;
  }> = [
    {
      key: "pending",
      title: "Pending Show Cars",
      subtitle: `${pending.length} ${pending.length === 1 ? "application" : "applications"} awaiting review`,
      cars: pending,
    },
    {
      key: "awaiting-payment",
      title: "Awaiting Payment",
      subtitle: `${awaitingPayment.length} approved - waiting for payment`,
      cars: awaitingPayment,
    },
    {
      key: "confirmed",
      title: "Confirmed Show Cars",
      subtitle: `${confirmed.length} paid and confirmed for event`,
      cars: confirmed,
      exportable: true,
    },
    {
      key: "rejected",
      title: "Rejected Show Cars",
      subtitle: `${rejected.length} ${rejected.length === 1 ? "application" : "applications"} rejected`,
      cars: rejected,
    },
  ];

  const populated = groups.filter((g) => g.cars.length > 0);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard
          label="Pending Review"
          value={pending.length}
          valueColor="var(--warn)"
        />
        <KpiCard
          label="Awaiting Payment"
          value={awaitingPayment.length}
          valueColor="var(--gold-deep)"
        />
        <KpiCard
          label="Confirmed"
          value={confirmed.length}
          valueColor="var(--success)"
        />
      </div>

      {showCars.length === 0 ? (
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">Show Car Applications</div>
            </div>
          </div>
          <div className="section-body">
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 14,
              }}
            >
              No applications yet. Applications will appear here as car owners
              submit them.
            </div>
          </div>
        </div>
      ) : (
        populated.map((g) => (
          <div className="section" key={g.key}>
            <div className="section-header">
              <div>
                <div className="section-title">{g.title}</div>
                <div className="section-subtitle">{g.subtitle}</div>
              </div>
              {g.exportable && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExport}
                  disabled={exportApps.isPending}
                >
                  <DownloadIcon /> Export
                </button>
              )}
            </div>
            <div className="section-body flush">
              <ShowCarTable cars={g.cars} />
            </div>
          </div>
        ))
      )}

      {showCarTickets.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">Confirmed Spaces by Category</div>
              <div className="section-subtitle">
                {totalConfirmed} of {totalCapacity} spaces filled across{" "}
                {showCarTickets.length}{" "}
                {showCarTickets.length === 1 ? "category" : "categories"}
              </div>
            </div>
          </div>
          <div className="section-body flush">
            <table className="table category-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Confirmed</th>
                  <th>Capacity</th>
                  <th>Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {showCarTickets.map((t) => (
                  <CategoryRow key={t.id} ticket={t} />
                ))}
                <tr className="total-row">
                  <td>Total</td>
                  <td className="num">{totalConfirmed}</td>
                  <td className="num">{totalCapacity}</td>
                  <td>
                    <div className="util-cell">
                      <div className="util-bar">
                        <div
                          className="util-bar-fill"
                          style={{ width: `${totalPct}%` }}
                        />
                      </div>
                      <span className="util-pct">{totalPct}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </>
  );
}

function CategoryRow({ ticket }: { ticket: Ticket }) {
  // Guard against 0 capacity so empty categories read 0% rather than
  // NaN%, and so the progress bar fill width collapses cleanly.
  const pct =
    ticket.capacity > 0
      ? Math.round((ticket.sold / ticket.capacity) * 100)
      : 0;
  return (
    <tr>
      <td>
        <span className="category-tag">{ticket.name}</span>
      </td>
      <td className="num">{ticket.sold}</td>
      <td className="num muted">{ticket.capacity}</td>
      <td>
        <div className="util-cell">
          <div className="util-bar">
            <div className="util-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="util-pct">{pct}%</span>
        </div>
      </td>
    </tr>
  );
}
