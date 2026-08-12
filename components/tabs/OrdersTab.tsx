"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventData } from "@/context/EventContext";
import { currency, statusPillClass } from "@/lib/utils";
import type { Region } from "@/lib/regions";
import { useExportOrders } from "@/lib/ordersExport";
import {
  useResendOrder,
  useCancelOrder,
  orderTicketsUrl,
} from "@/lib/orderActions";
import { orderDetailPath } from "@/lib/siteRoutes";
import { useRefundOrder } from "@/lib/refundOrder";
import { useAction } from "@/context/ActionContext";
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
  SearchIcon,
  MoreHorizontalIcon,
} from "@/components/ui/Icons";
import { Pagination } from "@/components/ui/Pagination";
import { clickableRow } from "@/components/ui/clickableRow";

const PER_PAGE = 50;

/**
 * Debounce a value: returns `value` only after it's been stable for
 * `delay` ms. The effect only updates this hook's own debounced copy
 * (syncing to a timer), which is a legitimate effect - not a
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
    setPage(1);
  }, [debouncedSearch]);

  // ── Server-side fetch (search + pagination handled by the API) ──
  const { data, isLoading, isFetching, isPlaceholderData } = useEventOrders({
    eid: event.encryptedId,
    // region.key rather than the raw `site` string, which is "" when
    // the API echoed no site block. resolveRegion has already applied
    // the UK fallback here, so this is always a concrete region.
    site: event.region.key,
    page,
    perPage: PER_PAGE,
    search: debouncedSearch,
  });

  // Map raw API orders to the row shape the table renders (same mapper
  // the event context uses, so the columns line up exactly).
  // Wrapped rather than passed bare: .map hands the index as the
  // second argument, which would land in mapOrder's `region` slot.
  const orders = useMemo(
    () => (data?.orders ?? []).map((o) => mapOrder(o, event.region)),
    [data, event.region],
  );

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
  const runAction = useAction();
  const handleExport = () =>
    runAction({
      loadingLabel: "Preparing your CSV...",
      successTitle: "Orders exported",
      successMessage: "The CSV has been downloaded.",
      errorTitle: "Export failed",
      run: () =>
        exportOrders.mutateAsync({
          eid: event.encryptedId,
          search: debouncedSearch.trim() || undefined,
        }),
    });

  // ── Row actions ─────────────────────────────────────────────────
  const resend = useResendOrder();
  const cancelOrder = useCancelOrder();
  const refund = useRefundOrder();

  const handleResend = (oid: string) =>
    runAction({
      confirm: {
        title: "Resend the confirmation email?",
        message:
          "The customer will get a fresh copy of their confirmation and tickets at the email address on the order.",
        confirmLabel: "Send email",
        cancelLabel: "Cancel",
      },
      loadingLabel: "Sending confirmation email...",
      successTitle: "Confirmation email sent",
      successMessage: "The customer has been sent their tickets again.",
      errorTitle: "Couldn't send the email",
      run: () => resend.mutateAsync({ oid }),
    });

  const handleCancelOrder = (oid: string) =>
    runAction({
      confirm: {
        title: "Cancel this order?",
        message:
          "The order will be cancelled and the customer's tickets voided. This can't be undone from here.",
        confirmLabel: "Cancel order",
        cancelLabel: "Keep order",
        danger: true,
      },
      loadingLabel: "Cancelling order...",
      successTitle: "Order cancelled",
      successMessage: "The customer's tickets have been voided.",
      errorTitle: "Couldn't cancel the order",
      run: () => cancelOrder.mutateAsync({ oid }),
    });

  const handleRefund = (oid: string, amount: number) =>
    runAction({
      confirm: {
        title: "Refund this order?",
        message: `${currency(
          amount,
          event.region,
        )} will be refunded to the customer via Stripe. This can't be undone.`,
        confirmLabel: "Refund",
        cancelLabel: "Keep order",
        danger: true,
      },
      loadingLabel: "Issuing refund...",
      successTitle: "Refund issued",
      successMessage: `${currency(amount, event.region)} is on its way back to the customer.`,
      errorTitle: "Refund failed",
      run: () => refund.mutateAsync({ oid }),
    });

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
    event.region,
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
            <DownloadIcon /> Export CSV
          </button>
          {/* Manual orders - endpoint not built yet. */}
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
              <tr
                key={o.id}
                {...clickableRow(
                  () => router.push(orderDetailPath(o.encryptedId, event.region.key)),
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
                <td className="amount">{currency(o.amount, event.region)}</td>
                <td>
                  <span
                    className={`pill ${statusPillClass(o.status)}`}
                    style={pillStyle(o.status)}
                  >
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
                        onClick={() => router.push(orderDetailPath(o.encryptedId, event.region.key))}
                      >
                        View &amp; edit
                      </DropdownItem>
                      <DropdownItem onClick={() => handleResend(o.encryptedId)}>
                        Resend confirmation
                      </DropdownItem>
                      <DropdownItem
                        onClick={() =>
                          window.open(
                            orderTicketsUrl(o.encryptedId),
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        Download tickets
                      </DropdownItem>
                      <DropdownSeparator />
                      {o.amount > 0 && (
                        <DropdownItem
                          danger
                          disabled={
                            o.status === "cancelled" || o.status === "refunded"
                          }
                          onClick={() => handleRefund(o.encryptedId, o.amount)}
                        >
                          Refund
                        </DropdownItem>
                      )}
                      <DropdownItem
                        danger
                        disabled={
                          o.status === "cancelled" || o.status === "refunded"
                        }
                        onClick={() => handleCancelOrder(o.encryptedId)}
                      >
                        Cancel order
                      </DropdownItem>
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

/**
 * Inline colour override for the status pill. Cancelled + refunded read
 * as red; everything else falls through to the existing `pill` CSS
 * class. Inline so it works even where the stylesheet lacks a variant.
 */
function pillStyle(status: string): React.CSSProperties | undefined {
  if (status === "cancelled" || status === "refunded") {
    return {
      background: "#fbe3e3",
      color: "#b3261e",
    };
  }
  return undefined;
}

function buildSubtitle(
  pagination: { page: number; perPage: number; total: number },
  netSales: number,
  isFirstLoad: boolean,
  fallbackLength: number,
  isSearching: boolean,
  region: Region,
): string {
  if (isFirstLoad) {
    return fallbackLength > 0
      ? `Loading orders · ${currency(netSales, region)} net sales`
      : `Loading orders…`;
  }

  const { page, perPage, total } = pagination;
  if (total === 0) {
    return isSearching ? "No matching orders" : "No orders yet";
  }
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);
  const scope = isSearching ? " matching" : "";
  return `Showing ${first}-${last} of ${total}${scope} · ${currency(netSales, region)} net sales`;
}
