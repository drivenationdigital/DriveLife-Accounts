"use client";

import { useEventData } from "@/context/EventContext";
import { KpiCard } from "@/components/cards/KpiCard";
import { ShowCarCard } from "@/components/cards/ShowCarCard";
import { DownloadIcon } from "@/components/ui/Icons";
import { ComingSoonBanner } from "@/components/ui/ComingSoonBanner";
import { useShowCarApplications } from "@/lib/showCarApplications";
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
 *   - KPI strip across the top — Pending Review, Awaiting Payment,
 *     Confirmed. Rejected doesn't get a KPI because it's not a target
 *     metric.
 *   - "Confirmed Spaces by Category" table showing utilisation per
 *     show car category (only rendered when categoryStats has rows).
 *   - One "Show Car Applications" card containing all four status
 *     groups as nested subsections. Each subsection only renders when
 *     it has rows — the KPI strip already carries the zero counts.
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
  // Applications live on a dedicated query — see useShowCarApplications.
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

  // Capacity table comes from the show car tickets directly — each
  // ticket is a category, capacity = stock, confirmed = sold. Single
  // source of truth, no separate categoryStats array to keep in sync.
  const totalConfirmed = showCarTickets.reduce((n, t) => n + t.sold, 0);
  const totalCapacity = showCarTickets.reduce((n, t) => n + t.capacity, 0);
  const totalPct =
    totalCapacity > 0 ? Math.round((totalConfirmed / totalCapacity) * 100) : 0;

  // Render groups in workflow order: applications enter at "Pending
  // Review", move to "Awaiting Payment" on approval, then "Confirmed"
  // after payment; rejection branches off at any point.
  const groups: Array<{
    key: ShowCar["status"];
    title: string;
    dot: string;
    variant: "pending" | "managed";
    cars: ShowCar[];
  }> = [
    {
      key: "pending",
      title: "Pending Review",
      dot: "dot-pending",
      variant: "pending",
      cars: pending,
    },
    {
      key: "awaiting-payment",
      title: "Awaiting Payment",
      dot: "dot-approved",
      variant: "managed",
      cars: awaitingPayment,
    },
    {
      key: "confirmed",
      title: "Confirmed",
      dot: "dot-confirmed",
      variant: "managed",
      cars: confirmed,
    },
    {
      key: "rejected",
      title: "Rejected",
      dot: "dot-rejected",
      variant: "managed",
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

      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Show Car Applications</div>
            <div className="section-subtitle">
              Approve or reject applications, grouped by status
            </div>
          </div>
          {showCars.length > 0 && (
            <button type="button" className="btn btn-secondary">
              <DownloadIcon /> Export
            </button>
          )}
        </div>
        <div className="section-body">
          {showCars.length === 0 ? (
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
          ) : (
            populated.map((g, idx) => (
              <ApplicationGroup
                key={g.key}
                title={g.title}
                dot={g.dot}
                cars={g.cars}
                variant={g.variant}
                isFirst={idx === 0}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function CategoryRow({ ticket }: { ticket: Ticket }) {
  // Guard against 0 capacity so empty categories read 0% rather than
  // NaN%, and so the progress bar fill width collapses cleanly.
  const pct =
    ticket.capacity > 0 ? Math.round((ticket.sold / ticket.capacity) * 100) : 0;
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

/**
 * One status block inside the Show Car Applications card. Renders a
 * dot + title + count pill header, then the application cards grid.
 * Subsequent groups get a top border so they read as siblings rather
 * than stacked cards — `isFirst` controls that.
 */
function ApplicationGroup({
  title,
  dot,
  cars,
  variant,
  isFirst,
}: {
  title: string;
  dot: string;
  cars: ShowCar[];
  variant: "pending" | "managed";
  isFirst: boolean;
}) {
  return (
    <div
      style={{
        paddingTop: isFirst ? 0 : 20,
        marginTop: isFirst ? 0 : 20,
        borderTop: isFirst ? undefined : "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <span className={`showcars-dot ${dot}`} />
        <h4
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          {title}
        </h4>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            background: "var(--card-soft, rgba(0,0,0,0.05))",
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 500,
          }}
        >
          {cars.length} {cars.length === 1 ? "application" : "applications"}
        </span>
      </div>
      <div className="showcars-section-grid">
        {cars.map((car) => (
          <ShowCarCard key={car.id} car={car} actions={variant} />
        ))}
      </div>
    </div>
  );
}
