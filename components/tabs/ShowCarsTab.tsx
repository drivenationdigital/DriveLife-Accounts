"use client";

import { useEventData } from "@/context/EventContext";
import { TicketRow } from "@/components/cards/TicketRow";
import { KpiCard } from "@/components/cards/KpiCard";
import { ShowCarCard } from "@/components/cards/ShowCarCard";
import { DownloadIcon } from "@/components/ui/Icons";
import { ComingSoonBanner } from "@/components/ui/ComingSoonBanner";
import type { CategoryStat } from "@/context/types";

/**
 * Show Cars tab.
 *
 * The view-side surface for show car tickets and (eventually)
 * applications. Today the data flows like this:
 *
 *   - showCarTickets — populated from sales.show_car_tickets on the
 *     /event response (BE filters tickets where show_car_ticket=1
 *     into a separate array). This is the source of truth for
 *     whether show cars are "set up" on the event.
 *
 *   - showCars / categoryStats — applications submitted against
 *     those tickets. The application moderation flow isn't wired
 *     server-side yet, so these stay empty most of the time. When
 *     they do arrive, the existing applications UI (pending /
 *     awaiting payment / confirmed / rejected) renders below the
 *     tickets breakdown.
 *
 * Empty state rules:
 *
 *   - No show car tickets → "Show cars not enabled for this event"
 *     (the organiser hasn't created any show car ticket types).
 *   - Tickets but no applications yet → just the tickets breakdown.
 *   - Both → tickets breakdown on top, applications below.
 */
export function ShowCarsTab() {
  const { showCarTickets, showCars, categoryStats } = useEventData();

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

  const totalConfirmed = categoryStats.reduce((n, s) => n + s.confirmed, 0);
  const totalCapacity = categoryStats.reduce((n, s) => n + s.capacity, 0);
  const totalPct =
    totalCapacity > 0 ? Math.round((totalConfirmed / totalCapacity) * 100) : 0;

  // Have show car tickets but no applications yet — render just the
  // tickets breakdown. Applications UI shows when data arrives.
  const hasApplications = showCars.length > 0 || totalCapacity > 0;

  return (
    <>
      {/* Show car tickets breakdown — same row shape as the regular
          tickets breakdown on the Overview tab, so the visual
          language matches. */}
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Show Car Tickets</div>
          </div>
          <a href="#" className="section-link">
            Manage tickets →
          </a>
        </div>
        <div className="section-body flush">
          {showCarTickets.map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      </div>

      {hasApplications && (
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

          {/* Category breakdown */}
          {categoryStats.length > 0 && (
            <div className="section">
              <div className="section-header">
                <div>
                  <div className="section-title">
                    Confirmed Spaces by Category
                  </div>
                  <div className="section-subtitle">
                    {totalConfirmed} of {totalCapacity} spaces filled across{" "}
                    {categoryStats.length} categories
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
                    {categoryStats.map((s) => (
                      <CategoryRow key={s.category} stat={s} />
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

          <CarSection
            title="Pending Show Cars"
            dot="dot-pending"
            subtitle={`${pending.length} applications awaiting review`}
            cars={pending}
            variant="pending"
          />

          <CarSection
            title="Awaiting Payment"
            dot="dot-approved"
            subtitle={`${awaitingPayment.length} applications approved — waiting for payment`}
            cars={awaitingPayment}
            variant="managed"
          />

          <CarSection
            title="Confirmed Show Cars"
            dot="dot-confirmed"
            subtitle={`${confirmed.length} applications paid and confirmed for event`}
            cars={confirmed}
            variant="managed"
            action={
              <button type="button" className="btn btn-secondary">
                <DownloadIcon /> Export
              </button>
            }
          />

          <CarSection
            title="Rejected Show Cars"
            dot="dot-rejected"
            subtitle={`${rejected.length} applications rejected`}
            cars={rejected}
            variant="managed"
            action={
              <a href="#" className="section-link">
                View all {rejected.length} →
              </a>
            }
          />
        </>
      )}
    </>
  );
}

function CategoryRow({ stat }: { stat: CategoryStat }) {
  const pct = Math.round((stat.confirmed / stat.capacity) * 100);
  const label = stat.category.charAt(0).toUpperCase() + stat.category.slice(1);
  return (
    <tr>
      <td>
        <span className={`category-tag ${stat.category}`}>{label}</span>
      </td>
      <td className="num">{stat.confirmed}</td>
      <td className="num muted">{stat.capacity}</td>
      <td>
        <div className="util-cell">
          <div className="util-bar">
            <div
              className={`util-bar-fill ${stat.category}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="util-pct">{pct}%</span>
        </div>
      </td>
    </tr>
  );
}

interface CarSectionProps {
  title: string;
  dot: string;
  subtitle: string;
  cars: ReturnType<typeof useEventData>["showCars"];
  variant: "pending" | "managed";
  action?: React.ReactNode;
}

function CarSection({
  title,
  dot,
  subtitle,
  cars,
  variant,
  action,
}: CarSectionProps) {
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div
            className="section-title"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span className={`showcars-dot ${dot}`} />
            {title}
          </div>
          <div className="section-subtitle">{subtitle}</div>
        </div>
        {action}
      </div>
      <div className="section-body">
        <div className="showcars-section-grid">
          {cars.map((car) => (
            <ShowCarCard key={car.id} car={car} actions={variant} />
          ))}
        </div>
      </div>
    </div>
  );
}
