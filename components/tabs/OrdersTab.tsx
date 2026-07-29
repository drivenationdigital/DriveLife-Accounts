"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventData } from "@/context/EventContext";
import { currency, statusPillClass } from "@/lib/utils";
import { useExportOrders } from "@/lib/ordersExport";
import { useEventOrders } from "@/lib/eventOrders";
import { mapOrder } from "@/lib/eventMapper";
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

const PER_PAGE = 50;

/**
 * Debounce a value: returns `value` only after it's been stable for
 * `delay` ms. The effect only updates this hook's own debounced copy
 * (syncing to a timer), which is a legitimate effect — not a
 * setState-in-effect chain driving unrelated state.
 */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function OrdersTab() {
  const { event, kpis } = useEventData();
  const router = useRouter();

  // ── Filters + page (local state; drive a server-side query) ─────
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);

  // Debounce typing before it hits the network.
  const debouncedSearch = useDebounced(search, 350);

  // Any new search term resets to page 1.
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [debouncedSearch]);

  // ── Server-side fetch (search + pagination handled by the API) ──
  const { data, isLoading, isFetching, isPlaceholderData } = useEventOrders({
    eid: event.encryptedId,
    page,
    perPage: PER_PAGE,
    search: debouncedSearch,
  });

  // Map raw API orders to the row shape the table renders (same mapper
  // the event context uses, so the columns line up exactly).
  const orders = useMemo(() => (data?.orders ?? []).map(mapOrder), [data]);

  // Status dropdown options, from the statuses present on this page.
  const statusOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const o of orders) if (o.status) seen.add(o.status);
    return Array.from(seen);
  }, [orders]);

  // Status is refined client-side over the fetched page (the endpoint
  // paginates + searches, but doesn't filter by status).
  const rows = useMemo(
    () =>
      orderStatus === "all"
        ? orders
        : orders.filter((o) => o.status === orderStatus),
    [orders, orderStatus],
  );

  const total = data?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const isFirstLoad = isLoading && !data;

  // ── Export (all orders, honouring the active search) ────────────
  const exportOrders = useExportOrders();
  const handleExport = () => {
    if (exportOrders.isPending) return;
    exportOrders.mutate({
      eid: event.encryptedId,
      search: debouncedSearch.trim() || undefined,
    });
  };

  const goToPage = (next: number) => {
    setPage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const subtitle = buildSubtitle(
    { page, perPage: PER_PAGE, total },
    kpis.netSales,
    isFirstLoad,
    orders.length,
    debouncedSearch.trim() !== "",
  );

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">All Orders</div>
          <div className="section-subtitle">{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={exportOrders.isPending}
          >
            <DownloadIcon />{" "}
            {exportOrders.isPending ? "Exporting…" : "Export CSV"}
          </button>
          {/* Manual orders — endpoint not built yet. */}
          {/* <button type="button" className="btn btn-primary">
            <PlusIcon /> Add Manual Order
          </button> */}
        </div>
      </div>

      <div className="filters">
        <div className="search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Order-status dropdown (paid / free / refunded / cancelled…) */}
        <Dropdown>
          <DropdownTrigger className="filter-btn" ariaLabel="Filter by status">
            Status: {orderStatus === "all" ? "All" : labelFor(orderStatus)}
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem onClick={() => setOrderStatus("all")}>
              All
            </DropdownItem>
            {statusOptions.map((s) => (
              <DropdownItem key={s} onClick={() => setOrderStatus(s)}>
                {labelFor(s)}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="section-body flush">
        <table
          className="table"
          style={{
            opacity:
              isFirstLoad || (isFetching && isPlaceholderData) ? 0.55 : 1,
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
            {rows.map((o) => (
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
                      <DropdownItem
                        onClick={() => router.push(`/orders/${o.encryptedId}`)}
                      >
                        View order
                      </DropdownItem>
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

            {rows.length === 0 && !isFirstLoad && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "32px 16px",
                    color: "var(--muted)",
                    fontSize: "13px",
                  }}
                >
                  {debouncedSearch.trim() || orderStatus !== "all"
                    ? "No orders match your search."
                    : "No orders yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        )}
      </div>
    </div>
  );
}

/** Capitalise an order status for display ("paid" → "Paid"). */
function labelFor(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function buildSubtitle(
  pagination: { page: number; perPage: number; total: number },
  netSales: number,
  isFirstLoad: boolean,
  fallbackLength: number,
  isSearching: boolean,
): string {
  if (isFirstLoad) {
    return fallbackLength > 0
      ? `Loading orders · ${currency(netSales)} net sales`
      : `Loading orders…`;
  }

  const { page, perPage, total } = pagination;
  if (total === 0) {
    return isSearching ? "No matching orders" : "No orders yet";
  }
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);
  const scope = isSearching ? " matching" : "";
  return `Showing ${first}-${last} of ${total}${scope} · ${currency(netSales)} net sales`;
}
