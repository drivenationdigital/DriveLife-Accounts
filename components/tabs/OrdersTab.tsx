"use client";

import { useEventData } from "@/context/EventContext";
import { currency, statusPillClass } from "@/lib/utils";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/Dropdown";
import {
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
} from "@/components/ui/Icons";

export function OrdersTab() {
  const { orders, kpis } = useEventData();

  // Heuristic: if we have fewer orders in context than the KPI total, the
  // Orders tab's lazy fetch is still in flight.
  const isLoadingMore = kpis.totalOrders > orders.length;

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">All Orders</div>
          <div className="section-subtitle">
            Showing {orders.length} of {kpis.totalOrders} ·{" "}
            {currency(kpis.netSales)} net sales
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-secondary">
            <DownloadIcon /> Export CSV
          </button>
          <button type="button" className="btn btn-primary">
            <PlusIcon /> Add Manual Order
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          <SearchIcon />
          <input type="text" placeholder="Search orders, customers..." />
        </div>
        <button type="button" className="filter-btn">
          Ticket type: All
        </button>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
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
                <td style={{ width: 44, textAlign: "right" }}>
                  <Dropdown className="row-action">
                    <DropdownTrigger
                      className="row-action-btn"
                      ariaLabel="Order actions"
                    >
                      <MoreHorizontalIcon />
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem>View order</DropdownItem>
                      <DropdownItem>Resend confirmation</DropdownItem>
                      <DropdownItem>Download tickets</DropdownItem>
                      <DropdownItem>Edit order</DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem danger>Refund</DropdownItem>
                      <DropdownItem danger>Delete order</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoadingMore && (
          <div
            style={{
              padding: "14px 24px",
              color: "var(--muted)",
              fontSize: 13,
              textAlign: "center",
              borderTop: "1px solid var(--border)",
            }}
          >
            Loading more orders…
          </div>
        )}
      </div>
    </div>
  );
}
