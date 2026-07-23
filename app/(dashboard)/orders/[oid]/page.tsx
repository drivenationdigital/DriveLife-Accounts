"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrderDetail, type OrderDetailItem } from "@/lib/orderDetail";

// Status → pill colour. Kept local so the page doesn't depend on a
// shared helper; tweak to match your palette.
function statusPill(status: string): { bg: string; fg: string } {
  switch (status.toLowerCase()) {
    case "completed":
    case "paid":
      return {
        bg: "var(--gold-soft, #f3e4cf)",
        fg: "var(--gold-deep, #bd7420)",
      };
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

      {isLoading && <OrderSkeleton />}

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
              {/* Resend/Cancel only make sense while the event is still
                  to come — hide them once it's finished. Download stays
                  available so past tickets remain retrievable. */}
              {order.can_resend && (
                <button type="button" className="order-btn order-btn-gold">
                  Resend Tickets
                </button>
              )}
              {order.can_cancel && (
                <button
                  type="button"
                  className="order-btn order-btn-gold-outline"
                >
                  Cancel
                </button>
              )}
            </div>
            {order.is_expired && (
              <p className="order-expired-note">
                This event has ended — tickets can no longer be resent or
                cancelled.
              </p>
            )}
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
    <div className="ticket-card" style={ticketCardStyle}>
      <div className="ticket-card-main" style={ticketMainStyle}>
        <h2 className="ticket-card-title" style={ticketTitleStyle}>
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

      <div className="ticket-card-side" style={ticketSideStyle}>
        {item.qr_code && (
          <img
            className="ticket-qr"
            style={ticketQrStyle}
            src={`data:image/jpeg;base64,${item.qr_code}`}
            alt={`QR code for ticket ${item.ticket_number}`}
          />
        )}
        <a
          href={item.download_url}
          target="_blank"
          rel="noreferrer"
          className="ticket-download"
          style={ticketDownloadStyle}
        >
          Download ticket
        </a>
      </div>
    </div>
  );
}

// ============================================================
// Ticket card styles — inline so the card keeps its white panel and
// two-column (details | QR) layout even when the global order-* CSS
// isn't loaded. Class names stay for when the stylesheet is present.
// ============================================================

const ticketCardStyle: React.CSSProperties = {
  display: "flex",
  gap: 24,
  flexWrap: "wrap",
  alignItems: "flex-start",
  background: "#fff",
  border: "1px solid #ecebe6",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(31,29,24,.05)",
};

const ticketMainStyle: React.CSSProperties = {
  flex: "1 1 260px",
  minWidth: 0,
};

const ticketTitleStyle: React.CSSProperties = {
  fontSize: 19,
  fontWeight: 800,
  margin: "0 0 4px",
  color: "var(--ink, #1f1d18)",
};

const ticketSideStyle: React.CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
};

const ticketQrStyle: React.CSSProperties = {
  width: 140,
  height: 140,
  display: "block",
};

const ticketDownloadStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 140,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--gold-deep, #bd7420)",
  border: "1px solid #ecebe6",
  borderRadius: 8,
  textDecoration: "none",
  textAlign: "center",
};

// ============================================================
// Loading skeleton — mirrors the real order layout (header card,
// ticket cards with QR block, totals) so the page doesn't jump when
// data lands. Fully inline-styled + self-contained shimmer keyframes,
// so it renders correctly with or without the order-* CSS.
// ============================================================

function OrderSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <style>{`
        @keyframes orderSkeletonShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <span className="sr-only" style={srOnly}>
        Loading order…
      </span>

      {/* Header card: status pill, customer, action buttons */}
      <div style={skelCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Bar w={110} h={26} r={999} />
          <Bar w={120} h={16} />
          <Bar w={170} h={14} />
        </div>
        <div
          style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}
        >
          <Bar w={140} h={42} r={10} />
          <Bar w={160} h={42} r={10} />
          <Bar w={100} h={42} r={10} />
        </div>
      </div>

      {/* Two ticket cards */}
      {[0, 1].map((i) => (
        <div key={i} style={{ ...skelCard, marginTop: 16 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <Bar w="55%" h={20} />
              <div
                style={{ height: 1, background: "#ecebe6", margin: "16px 0" }}
              />
              <Bar w="70%" h={14} />
              <Bar w="45%" h={14} mt={10} />
              <Bar w="50%" h={14} mt={10} />
              <div
                style={{ height: 1, background: "#ecebe6", margin: "16px 0" }}
              />
              <Bar w="60%" h={14} />
              <Bar w="35%" h={14} mt={10} />
              <Bar w="40%" h={14} mt={10} />
              <Bar w="30%" h={16} mt={16} />
            </div>
            <div style={{ flex: "0 0 auto", textAlign: "center" }}>
              <Bar w={140} h={140} r={8} />
              <Bar w={140} h={38} r={8} mt={12} />
            </div>
          </div>
        </div>
      ))}

      {/* Totals card */}
      <div style={{ ...skelCard, marginTop: 16 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 24,
              marginTop: i === 0 ? 0 : 14,
            }}
          >
            <Bar w={110} h={14} />
            <Bar w={70} h={14} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A single shimmering placeholder bar. */
function Bar({
  w,
  h,
  r = 6,
  mt = 0,
}: {
  w: number | string;
  h: number;
  r?: number;
  mt?: number;
}) {
  return (
    <div
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: h,
        borderRadius: r,
        marginTop: mt,
        background:
          "linear-gradient(90deg, #f2f1ec 25%, #e7e6e0 50%, #f2f1ec 75%)",
        backgroundSize: "200% 100%",
        animation: "orderSkeletonShimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

const skelCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ecebe6",
  borderRadius: 12,
  padding: 20,
};

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};
