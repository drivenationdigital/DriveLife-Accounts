import type { Ticket } from "@/context/types";

export function TicketRow({ ticket }: { ticket: Ticket }) {
  const pct = Math.round((ticket.sold / ticket.capacity) * 100);
  const isSoldOut = ticket.status === "soldout";

  return (
    <div className="ticket-row">
      <div>
        <div className="ticket-name">{ticket.name}</div>
        <div className="ticket-bar-wrap">
          <div
            className="ticket-bar"
            style={{
              width: `${pct}%`,
              background: isSoldOut ? "var(--muted-2)" : undefined,
            }}
          />
        </div>
      </div>
      <div className="ticket-qty">
        {ticket.sold} <span className="cap">/ {ticket.capacity}</span>
      </div>
      <span className={`ticket-status ${ticket.status === "soldout" ? "soldout" : "active"}`}>
        {ticket.status === "soldout" ? "Sold out" : "Active"}
      </span>
    </div>
  );
}
