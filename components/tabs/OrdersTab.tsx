"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { Pagination } from "@/components/ui/Pagination";

export function OrdersTab() {
  const { orders, kpis, ordersPagination } = useEventData();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // While the Orders tab's first fetch is in flight, ordersPagination is
  // null and `orders` still holds the 5 recent orders from the overview
  // load. Show a subtle loading state in that case.
  const isFirstLoad = ordersPagination === null;

  const setPage = (next: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next <= 1) {
      params.delete("ordersPage");
    } else {
      params.set("ordersPage", String(next));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const subtitle = buildSubtitle(
    ordersPagination,
    kpis.netSales,
    isFirstLoad,
    orders.length
  );

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">All Orders</div>
          <div className="section-subtitle">{subtitle}</div>
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
        <table
          className="table"
          style={{
            opacity: isFirstLoad ? 0.55 : 1,
            transition: "opacity 120ms",
          }}
        >
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
                      <DropdownItem onClick={()=>{
                        // /orders/{encryptedOrderId}
                        router.push(`/orders/${o.id}`);
                      }}>View order</DropdownItem>
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

        {ordersPagination && (
          <Pagination
            page={ordersPagination.page}
            totalPages={ordersPagination.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

function buildSubtitle(
  pagination: { page: number; perPage: number; total: number } | null,
  netSales: number,
  isFirstLoad: boolean,
  fallbackLength: number
): string {
  if (isFirstLoad) {
    return fallbackLength > 0
      ? `Loading orders · ${currency(netSales)} net sales`
      : `Loading orders…`;
  }
  if (!pagination) return `${currency(netSales)} net sales`;

  const { page, perPage, total } = pagination;
  if (total === 0) return "No orders yet";
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);
  return `Showing ${first}–${last} of ${total} · ${currency(netSales)} net sales`;
}
