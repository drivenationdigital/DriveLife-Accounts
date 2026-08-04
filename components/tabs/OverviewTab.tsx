/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEventData } from "@/context/EventContext";
import { useUI } from "@/context/UIContext";
import { currency, statusPillClass } from "@/lib/utils";
import { KpiCard } from "@/components/cards/KpiCard";
import { TicketRow } from "@/components/cards/TicketRow";
import { AppCard } from "@/components/cards/AppCard";
import { ShowCarTable } from "@/components/tables/ShowCarTable";
import { ClubTable } from "@/components/tables/ClubTable";
import { CarIcon, UsersIcon, ChevRightIcon } from "@/components/ui/Icons";
import { clickableRow } from "@/components/ui/clickableRow";
import { useRouter } from "next/navigation";

export function OverviewTab() {
  const {
    kpis,
    tickets,
    orders,
    showCars,
    clubs,
    traders,
    features,
  } = useEventData();
  const { setActiveTab } = useUI();
  const router = useRouter();

  const recentOrders = orders.slice(0, 5);
  const pendingShowCars = showCars.filter((s) => s.status === "pending");
  const pendingClubs = clubs.filter((c) => c.status === "pending");
  const pendingTraders = traders.filter((t) => t.status === "pending");

  // Needs Attention counts come from the API feature counts (the
  // showCars/club/traders arrays aren't loaded on the overview, so
  // filtering them would always read 0). counts.pending is the real
  // awaiting-review number - counts.applied is a legacy bucket.
  const showCarPending = features.show_cars.enabled
    ? features.show_cars.counts.pending
    : 0;
  const clubPending = features.car_clubs.enabled
    ? features.car_clubs.counts.pending
    : 0;
  const traderPending = features.traders.enabled
    ? features.traders.counts.pending
    : 0;

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
              {kpis.netSales.toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
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
            {/* <a href="#" className="section-link">
              Manage tickets →
            </a> */}
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

            {totalPending == 0 ? (
              <div className="section-body">
                <div
                  className="attention-empty"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    padding: "32px 24px",
                  }}
                >
                  <div
                    className="attention-empty-icon"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "var(--success-soft, #e9f2e6)",
                      color: "var(--success, #3b6d11)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div
                    className="attention-empty-title"
                    style={{ fontWeight: 700, color: "var(--ink, #1f1d18)", marginBottom: 4 }}
                  >
                    You're all caught up
                  </div>
                  <div
                    className="attention-empty-meta"
                    style={{
                      fontSize: 13,
                      color: "var(--muted, #8a877e)",
                      maxWidth: 240,
                      lineHeight: 1.5,
                    }}
                  >
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
                <tr
                  key={o.id}
                  {...clickableRow(
                    () => router.push(`/orders/${o.encryptedId}`),
                    { label: `Open order #${o.id}` },
                  )}
                >
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
          <div className="section-body flush">
            <ShowCarTable cars={pendingShowCars} />
          </div>
        </div>
      )}

      {/* Pending clubs - table, matching the Clubs tab */}
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
          <div className="section-body flush">
            <ClubTable clubs={pendingClubs} spacesMode="requested" />
          </div>
        </div>
      )}

      {/* Pending traders - still cards; the trader tab hasn't moved to
          tables, so keeping the card grid here keeps the two in step. */}
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
    </>
  );
}
