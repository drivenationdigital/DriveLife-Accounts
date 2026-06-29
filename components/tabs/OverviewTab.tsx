/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEventData } from "@/context/EventContext";
import { useUI } from "@/context/UIContext";
import { currency, statusPillClass } from "@/lib/utils";
import { KpiCard } from "@/components/cards/KpiCard";
import { TicketRow } from "@/components/cards/TicketRow";
import { ShowCarCard } from "@/components/cards/ShowCarCard";
import { AppCard } from "@/components/cards/AppCard";
import { CarIcon, UsersIcon, ChevRightIcon } from "@/components/ui/Icons";

export function OverviewTab() {
  const {
    kpis,
    tickets,
    orders,
    discounts,
    showCars,
    clubs,
    traders,
    features,
  } = useEventData();
  const { setActiveTab } = useUI();

  const recentOrders = orders.slice(0, 5);
  const pendingShowCars = showCars.filter((s) => s.status === "pending");
  const pendingClubs = clubs.filter((c) => c.status === "pending");
  const pendingTraders = traders.filter((t) => t.status === "pending");
  console.log(features);

  // Pending counts drive the Needs Attention box. Use the live
  // filtered lists for all three so the source is consistent (the
  // features.*.counts.applied path and pendingTraders.length used to
  // disagree). A feature only appears as a row when it actually has
  // something pending.
  const showCarPending = features.show_cars.enabled
    ? pendingShowCars.length
    : 0;
  const clubPending = features.car_clubs.enabled ? pendingClubs.length : 0;
  const traderPending = features.traders.enabled ? pendingTraders.length : 0;

  const totalPending = showCarPending + clubPending + traderPending;

  // The box renders whenever any feature is enabled; its *content*
  // switches between the attention rows and the all-caught-up state.
  const anyPendingFeature =
    features.show_cars.enabled ||
    features.car_clubs.enabled ||
    features.traders.enabled;

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Orders"
          value={kpis.totalOrders}
          sub={
            <>
              <b>{kpis.ordersThisWeek}</b> this week
            </>
          }
        />
        <KpiCard
          label="Tickets Sold"
          value={kpis.ticketsSold}
          sub={
            <>
              <b>{kpis.ticketsSoldRecent}</b> in the last 7 days
            </>
          }
        />
        <KpiCard
          label="Net Sales"
          value={
            <>
              <span className="currency">£</span>
              {kpis.netSales.toLocaleString("en-GB")}
              <span style={{ fontSize: 18, fontWeight: 400, opacity: 0.5 }}>
                .00
              </span>
            </>
          }
          sub={
            <>
              <b>{currency(kpis.fees)}</b> in fees
            </>
          }
        />
      </div>

      {/* Tickets breakdown + (optional) Needs Attention */}
      <div className={anyPendingFeature ? "two-col" : ""}>
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">Tickets Breakdown</div>
            </div>
            <a href="#" className="section-link">
              Manage tickets →
            </a>
          </div>
          {/* Header stays fixed; only the rows scroll. ~6 rows then
              scroll (≈76px each). Inline so it overrides the shared
              .section-body rule for this card only. */}
          <div
            className="section-body flush ticket-breakdown-scroll"
            style={{
              maxHeight: 456,
              overflowY: "auto",
              overscrollBehavior: "contain",
            }}
          >
            {tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} />
            ))}
          </div>
        </div>

        {anyPendingFeature && (
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-title">Needs Attention</div>
              </div>
            </div>

            {totalPending === 0 ? (
              // All caught up — a positive empty state rather than a
              // list of zero-count rows.
              <div className="section-body">
                <div className="attention-empty">
                  <div className="attention-empty-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="attention-empty-title">
                    You're all caught up
                  </div>
                  <div className="attention-empty-meta">
                    Nothing to review right now. New applications will show up
                    here.
                  </div>
                </div>
              </div>
            ) : (
              <div className="section-body">
                {showCarPending > 0 && (
                  <div
                    className="approval-row"
                    onClick={() => setActiveTab("showcars")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="approval-icon">
                      <CarIcon />
                    </div>
                    <div className="approval-info">
                      <div className="approval-label">
                        Show Car applications
                      </div>
                      <div className="approval-meta">
                        Awaiting your approval
                      </div>
                    </div>
                    <div className="approval-count">{showCarPending}</div>
                    <span className="approval-arrow">
                      <ChevRightIcon />
                    </span>
                  </div>
                )}

                {clubPending > 0 && (
                  <div
                    className="approval-row"
                    onClick={() => setActiveTab("clubs")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="approval-icon">
                      <UsersIcon />
                    </div>
                    <div className="approval-info">
                      <div className="approval-label">
                        Car Club applications
                      </div>
                      <div className="approval-meta">
                        {clubPending} club{clubPending === 1 ? "" : "s"} pending
                        review
                      </div>
                    </div>
                    <div className="approval-count">{clubPending}</div>
                    <span className="approval-arrow">
                      <ChevRightIcon />
                    </span>
                  </div>
                )}

                {traderPending > 0 && (
                  <div
                    className="approval-row"
                    onClick={() => setActiveTab("traders")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="approval-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                      </svg>
                    </div>
                    <div className="approval-info">
                      <div className="approval-label">Trader applications</div>
                      <div className="approval-meta">
                        {traderPending} application
                        {traderPending === 1 ? "" : "s"} pending
                      </div>
                    </div>
                    <div className="approval-count">{traderPending}</div>
                    <span className="approval-arrow">
                      <ChevRightIcon />
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Recent Orders</div>
          </div>
          <a
            href="#"
            className="section-link"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("orders");
            }}
          >
            View all orders →
          </a>
        </div>
        <div className="section-body flush">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span className="mono order-id">#{o.id}</span>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <div>
                        <div className="customer-name">{o.customerName}</div>
                        <div className="customer-email">{o.customerEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{o.quantity}</td>
                  <td className="amount">{currency(o.amount)}</td>
                  <td>
                    <span className={`pill ${statusPillClass(o.status)}`}>
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "12.5px" }}>
                    {o.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discounts */}
      {discounts.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">Discounts</div>
              <div className="section-subtitle">
                {discounts.length} code{discounts.length === 1 ? "" : "s"}{" "}
                configured
              </div>
            </div>
          </div>
          <div className="section-body flush">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="mono order-id">{d.code}</span>
                    </td>
                    <td className="amount">{d.displayAmount}</td>
                    <td>
                      <span className={`pill ${discountPill(d.activeState)}`}>
                        {d.statusLabel}
                      </span>
                    </td>
                    <td className="mono">
                      {d.usage}
                      <span style={{ color: "var(--muted)" }}>
                        {" "}
                        / {d.maxUsage ?? "∞"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending show cars */}
      {features.show_cars.enabled && pendingShowCars.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">Pending Show Cars</div>
              <div className="section-subtitle">
                {pendingShowCars.length} awaiting approval
              </div>
            </div>
            <a
              href="#"
              className="section-link"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("showcars");
              }}
            >
              Manage →
            </a>
          </div>
          <div className="section-body">
            <div className="showcars-section-grid">
              {pendingShowCars.map((car) => (
                <ShowCarCard key={car.id} car={car} actions="pending" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending clubs / traders */}
      {(features.car_clubs.enabled || features.traders.enabled) &&
        (pendingClubs.length > 0 || pendingTraders.length > 0) && (
          <div
            className={
              features.car_clubs.enabled && features.traders.enabled
                ? "two-col"
                : ""
            }
          >
            {features.car_clubs.enabled && pendingClubs.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div>
                    <div className="section-title">Pending Car Clubs</div>
                    <div className="section-subtitle">
                      {pendingClubs.length} awaiting review
                    </div>
                  </div>
                  <a
                    href="#"
                    className="section-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("clubs");
                    }}
                  >
                    Manage →
                  </a>
                </div>
                <div className="section-body">
                  <div className="app-card-grid">
                    {pendingClubs.map((club) => (
                      <AppCard key={club.id} kind="club" entity={club} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {features.traders.enabled && pendingTraders.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <div>
                    <div className="section-title">Pending Traders</div>
                    <div className="section-subtitle">
                      {pendingTraders.length} awaiting review
                    </div>
                  </div>
                  <a
                    href="#"
                    className="section-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("traders");
                    }}
                  >
                    Manage →
                  </a>
                </div>
                <div className="section-body">
                  <div className="app-card-grid">
                    {pendingTraders.map((trader) => (
                      <AppCard key={trader.id} kind="trader" entity={trader} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </>
  );
}

function discountPill(state: "active" | "upcoming" | "ended"): string {
  switch (state) {
    case "active":
      return "paid";
    case "upcoming":
      return "pending";
    case "ended":
      return "refunded";
  }
}
