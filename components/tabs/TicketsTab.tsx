"use client";

import { useEffect, useMemo, useState } from "react";
import { useEventData } from "@/context/EventContext";
import type { SoldTicket } from "@/context/types";
import { currency } from "@/lib/utils";
import { useEventTickets } from "@/lib/eventTickets";
import { mapSoldTicket } from "@/lib/eventMapper";
import { useExportTickets } from "@/lib/ticketsExport";
import { useAction } from "@/context/ActionContext";
import { DownloadIcon, SearchIcon } from "@/components/ui/Icons";
import { Pagination } from "@/components/ui/Pagination";

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

/**
 * The Tickets tab - one row per ticket sold.
 *
 * Sits alongside Orders rather than inside it because the two count
 * different things: a two-ticket order is one row there and two here.
 * Rows that look identical apart from the ticket id are correct - the
 * underlying table has no quantity column, so buying two of the same
 * ticket genuinely creates two records.
 */
export function TicketsTab() {
  const { event, soldTickets } = useEventData();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce typing before it hits the network.
  const debouncedSearch = useDebounced(search, 350);

  // Any new search term resets to page 1.
  //
  // Adjusted during render rather than in an effect. setState in an
  // effect body queues a second render pass and trips the cascading-
  // renders rule; this is React's documented "adjust state when a value
  // changes" pattern, and the same shape the account page uses to
  // re-seed its fields. React discards the in-progress render and
  // restarts immediately, so page 2 is never painted for a new search.
  const [pagedFor, setPagedFor] = useState(debouncedSearch);
  if (pagedFor !== debouncedSearch) {
    setPagedFor(debouncedSearch);
    setPage(1);
  }

  const { data, isLoading, isFetching, isPlaceholderData } = useEventTickets({
    eid: event.encryptedId,
    // region.key rather than the raw `site` string, which is "" when
    // the API echoed no site block. resolveRegion has already applied
    // the fallback here, so this is always a concrete region.
    site: event.region.key,
    page,
    perPage: PER_PAGE,
    search: debouncedSearch,
  });

  const rows = useMemo<SoldTicket[]>(
    () => (data?.tickets ?? []).map(mapSoldTicket),
    [data],
  );

  const total = data?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const isFirstLoad = isLoading && !data;

  // Until the first response lands, the event's own recent slice gives
  // the header something truthful to say rather than "0 tickets".
  const subtitle = isFirstLoad
    ? soldTickets.length > 0
      ? "Loading tickets..."
      : "Loading..."
    : buildSubtitle(page, PER_PAGE, total, debouncedSearch.trim() !== "");

  // Export ALL tickets, honouring the active search but not the page -
  // the point of an export is the whole set. Goes through the shared
  // action flow, so it gets the full-screen loader and the confirmation
  // notification every other mutating action uses.
  const exportTickets = useExportTickets();
  const runAction = useAction();
  const handleExport = () =>
    runAction({
      loadingLabel: "Preparing your CSV...",
      successTitle: "Tickets exported",
      successMessage: "The CSV has been downloaded.",
      errorTitle: "Export failed",
      run: () =>
        exportTickets.mutateAsync({
          eid: event.encryptedId,
          site: event.region.key,
          search: debouncedSearch.trim() || undefined,
        }),
    });

  const goToPage = (next: number) => {
    setPage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">All Tickets</div>
          <div className="section-subtitle">{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={exportTickets.isPending || total === 0}
          >
            <DownloadIcon /> Export CSV
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search tickets, buyers, cars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="section-body flush">
        {/* Wide table - 9 columns don't fit a phone, so it scrolls
            sideways inside the card rather than forcing the page to. */}
        <div style={{ overflowX: "auto" }}>
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
                <th>Ticket ID</th>
                <th>Buyer</th>
                <th>Phone</th>
                <th>Ticket</th>
                <th>Subtotal</th>
                <th>Car</th>
                <th>Car Club</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="mono order-id">#{t.orderId}</span>
                  </td>
                  <td className="mono">{t.id}</td>
                  {/* Buyer and email share a cell, matching the Orders
                      table's customer column. */}
                  <td>
                    <div className="customer-cell">
                      <div>
                        <div className="customer-name">
                          {t.buyerName || "-"}
                        </div>
                        <div className="customer-email">
                          {t.buyerEmail || "-"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{t.buyerPhone || "-"}</td>
                  <td>{t.ticketName || "-"}</td>
                  <td className="amount">
                    {currency(t.lineTotal, event.region)}
                  </td>
                  <td>{carLabel(t)}</td>
                  <td>{t.carClub || "-"}</td>
                </tr>
              ))}

              {rows.length === 0 && !isFirstLoad && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "32px 16px",
                      color: "var(--muted)",
                      fontSize: "13px",
                    }}
                  >
                    {debouncedSearch.trim()
                      ? "No tickets match your search."
                      : "No tickets sold yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

/**
 * "Ford GT (ABC123)" - or a dash when there's no car at all.
 *
 * Several rows legitimately have none: a spectator ticket carries no
 * vehicle. Built from the parts that are present rather than a fixed
 * template, so a row with a reg but no model doesn't render stray
 * brackets or a leading space.
 */
export function carLabel(t: SoldTicket): string {
  const name = [t.carMake, t.carModel].filter(Boolean).join(" ");
  if (name && t.carReg) return `${name} (${t.carReg})`;
  return name || t.carReg || "-";
}

function buildSubtitle(
  page: number,
  perPage: number,
  total: number,
  isSearching: boolean,
): string {
  if (total === 0) {
    return isSearching ? "No matching tickets" : "No tickets sold yet";
  }
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);
  const scope = isSearching ? " matching" : "";
  return `Showing ${first}-${last} of ${total}${scope} ticket${
    total === 1 ? "" : "s"
  }`;
}
