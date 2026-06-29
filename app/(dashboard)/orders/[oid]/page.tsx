"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrderDetail, type OrderDetailItem } from "@/lib/orderDetail";

// Status → pill colour. Kept local so the page doesn't depend on a
// shared helper; tweak to match your palette.
function statusPill(status: string): { bg: string; fg: string } {
  switch (status.toLowerCase()) {
    case "completed":
    case "paid":
      return { bg: "var(--gold-soft, #f3e4cf)", fg: "var(--gold-deep, #bd7420)" };
    case "pending":
      return { bg: "#fdf0d5", fg: "#9a6700" };
    case "cancelled":
    case "refunded":
      return { bg: "#fbe3e3", fg: "#b3261e" };
    default:
      return { bg: "#ecebe6", fg: "#5b574e" };
  }
}

export default function OrderPage() {
  const params = useParams<{ oid: string }>();
  const router = useRouter();
  const oid = params?.oid;

  const { data: order, isLoading, error } = useOrderDetail(oid);

  return (
    <div className="order-view">
      <button
        type="button"
        onClick={() => router.back()}
        className="order-back"
      >
        ‹ View order
      </button>

      {isLoading && <div className="order-loading">Loading order…</div>}

      {error && (
        <div className="order-error">
          Couldn’t load this order. {error.message}
        </div>
      )}

      {order && (
        <>
          {/* Header: status + customer + actions */}
          <div className="order-header">
            <div className="order-header-top">
              <span
                className="order-status-pill"
                style={{
                  background: statusPill(order.status).bg,
                  color: statusPill(order.status).fg,
                }}
              >
                {order.status_label}
              </span>
              <div className="order-customer">
                <div className="order-customer-name">
                  {order.billing.first_name} {order.billing.last_name}{" "}
                  <span className="order-customer-email">
                    ({order.billing.email})
                  </span>
                </div>
              </div>
            </div>

            <div className="order-actions">
              <a
                href={order.download_all_url}
                target="_blank"
                rel="noreferrer"
                className="order-btn order-btn-dark"
              >
                Download all
              </a>
              <button type="button" className="order-btn order-btn-gold">
                Resend Tickets
              </button>
              {order.can_cancel && (
                <button type="button" className="order-btn order-btn-gold-outline">
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Ticket line items */}
          <div className="order-tickets">
            {order.items.map((item) => (
              <TicketCard
                key={item.line_id}
                item={item}
                orderId={order.id}
                transactionId={order.transaction_id}
              />
            ))}
          </div>

          {/* Totals */}
          {order.totals.length > 0 && (
            <div className="order-totals">
              <table>
                <tbody>
                  {order.totals.map((t, i) => (
                    <tr key={i}>
                      <th>{t.label}</th>
                      <td>{t.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TicketCard({
  item,
  orderId,
  transactionId,
}: {
  item: OrderDetailItem;
  orderId: number;
  transactionId: string;
}) {
  const metaRows: Array<[string, string | undefined]> = [
    ["Full Name", item.meta.full_name],
    ["Phone Number", item.meta.phone],
    ["Car Make", item.meta.car_make],
    ["Car Model", item.meta.car_model],
    ["Car Registration", item.meta.car_reg],
    ["Car Club", item.meta.car_club],
  ];
  const hasMeta = metaRows.some(([, v]) => v && v !== "");

  return (
    <div className="ticket-card">
      <div className="ticket-card-main">
        <h2 className="ticket-card-title">
          🎟 Ticket #{item.ticket_number}
        </h2>
        <hr />
        <p className="ticket-event">
          <strong>{item.event_title}</strong>
          <br />
          <b>Event Date:</b> {item.event_date || "—"}
          <br />
          <b>Event Time:</b> {item.event_time || "—"}
        </p>

        {hasMeta && (
          <div className="ticket-meta">
            {metaRows.map(([label, value]) =>
              value ? (
                <p key={label}>
                  <b>{label}:</b> {value}
                </p>
              ) : null,
            )}
          </div>
        )}

        <hr />
        <div className="ticket-product">
          <strong>1 × {item.product_title}</strong>
          <br />
          <b>Order</b>: #{orderId}
          <br />
          <b>Transaction ID</b>: #{transactionId}
        </div>

        <div className="ticket-price">
          {item.price.has_discount ? (
            <>
              <strong>Ticket Price: {item.price.subtotal}</strong>
              <br />
              <strong>
                Total paid: {item.price.total} (-{item.price.discount})
              </strong>
            </>
          ) : (
            <strong>Ticket Price: {item.price.total}</strong>
          )}
        </div>
      </div>

      <div className="ticket-card-side">
        {item.qr_code && (
          <img
            className="ticket-qr"
            src={`data:image/jpeg;base64,${item.qr_code}`}
            alt={`QR code for ticket ${item.ticket_number}`}
          />
        )}
        <a
          href={item.download_url}
          target="_blank"
          rel="noreferrer"
          className="ticket-download"
        >
          Download ticket
        </a>
      </div>
    </div>
  );
}
