"use client";

import { useState } from "react";
import { CardGridSkeleton } from "@/components/ui/CardGridSkeleton";
import Link from "next/link";
import { useMyTickets, type TicketScope, type MyTicket } from "@/lib/myTickets";

export default function MyTicketsPage() {
  const [scope, setScope] = useState<TicketScope>("active");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, isPlaceholderData } = useMyTickets(
    scope,
    page,
  );

  const switchScope = (next: TicketScope) => {
    if (next === scope) return;
    setScope(next);
    setPage(1);
  };

  const counts = data?.counts;
  const tickets = data?.tickets ?? [];
  const pagination = data?.pagination;

  return (
    <div className="my-tickets">
      <header className="mt-header">
        <h1 className="mt-title">My Tickets</h1>
      </header>

      {/* Active / Past tabs */}
      <div className="mt-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "active"}
          className={`mt-tab${scope === "active" ? " active" : ""}`}
          onClick={() => switchScope("active")}
        >
          Active Tickets
          {counts ? (
            <span className="mt-tab-count">{counts.active}</span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "past"}
          className={`mt-tab${scope === "past" ? " active" : ""}`}
          onClick={() => switchScope("past")}
        >
          Past Tickets
          {counts ? <span className="mt-tab-count">{counts.past}</span> : null}
        </button>
      </div>

      {error && (
        <div className="mt-state error">
          Couldn’t load your tickets. {error.message}
        </div>
      )}

      {isLoading && !data && (
        <CardGridSkeleton variant="ticket" count={4} minCardWidth={520} />
      )}

      {!isLoading && tickets.length === 0 && !error && (
        <div className="mt-state">
          {scope === "active"
            ? "You have no active tickets."
            : "You have no past tickets."}
        </div>
      )}

      {tickets.length > 0 && (
        <div
          className="mt-grid"
          style={{ opacity: isPlaceholderData ? 0.6 : 1 }}
        >
          {tickets.map((t) => (
            <TicketCard key={t.order_id} ticket={t} />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="mt-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            disabled={page <= 1 || isPlaceholderData}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <span className="mt-page-indicator">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            disabled={!pagination.has_more || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: MyTicket }) {
  return (
    <div className="mt-card">
      {ticket.event_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ticket.event_image}
          alt={ticket.event_title}
          className="mt-card-img"
        />
      ) : (
        <div className="mt-card-img mt-card-img-empty" aria-hidden />
      )}

      <div className="mt-card-body">
        <h3 className="mt-card-title">{ticket.event_title}</h3>
        <p className="mt-card-date">{ticket.date_label}</p>

        <div className="mt-card-stats">
          <div className="mt-stat">
            <div className="mt-stat-value">{ticket.quantity}</div>
            <div className="mt-stat-label">
              Ticket{ticket.quantity === 1 ? "" : "s"}
            </div>
          </div>
          <div className="mt-stat">
            <div className="mt-stat-value">{ticket.value_label}</div>
            <div className="mt-stat-label">Value</div>
          </div>
        </div>

        <Link href={`/orders/${ticket.encrypted_id}`} className="mt-view-btn">
          View Tickets
        </Link>
      </div>
    </div>
  );
}
