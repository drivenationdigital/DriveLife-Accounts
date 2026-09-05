"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useOrderDetail, type OrderDetailItem } from "@/lib/orderDetail";
import {
  useUpdateLineItemMeta,
  useResendOrder,
  useCancelOrder,
  orderTicketsUrl,
} from "@/lib/orderActions";
import {
  formatRegionDateString,
  formatRegionMoneyString,
  formatRegionTime,
  regionFromSite,
  resolveRegion,
  type Region,
} from "@/lib/regions";
import { eventDetailPath } from "@/lib/siteRoutes";
import { parseRef } from "@/lib/siteRef";
import { useAction } from "@/context/ActionContext";

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
  const searchParams = useSearchParams();
  const router = useRouter();

  // The route param is a ref - "uk{oid}". Orders are WooCommerce posts,
  // so an encrypted order id repeats across blogs exactly as an eid
  // does, and this page has no event in scope to infer a region from -
  // it has to travel with the link.
  const { id: oid, site: refSite } = parseRef(params?.oid);

  // `?site=` is honoured as a fallback for links minted before refs.
  // The response's own site block wins over both when the API starts
  // sending one.
  const site = refSite ?? searchParams.get("site");
  const { data: order, isLoading, error } = useOrderDetail(oid, site);
  const region = order?.site ? regionFromSite(order.site) : resolveRegion(site);

  // Where the back link goes: the event the user came from, carried on
  // the link as `from` (see orderDetailPath) and itself a ref. Absent
  // when the order was opened from somewhere with no event in scope -
  // My Tickets, or a pasted URL - and then the dashboard root is the
  // honest fallback. Parsed and re-minted rather than passed through
  // verbatim so the back link is built the one way every other event
  // link is.
  const from = parseRef(searchParams.get("from"));
  // `back` is the list's query string at the moment the order was
  // opened (tab, search, page - see lib/listState). Re-attached so the
  // user lands on the same filtered page they left. Accepted only when
  // it looks like a plain query string, so a tampered link can't turn
  // the back button into a redirect.
  const backQuery = searchParams.get("back") ?? "";
  const backSafe = /^\?[A-Za-z0-9=&%._~+-]*$/.test(backQuery) ? backQuery : "";
  const backHref = from.id
    ? eventDetailPath(from.id, from.site ?? site) + backSafe
    : "/";

  const resend = useResendOrder();
  const cancelOrder = useCancelOrder();
  const runAction = useAction();

  const handleResend = () => {
    if (!oid || resend.isPending) return;
    return runAction({
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
  };

  const handleCancel = () => {
    if (!oid) return;
    return runAction({
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
  };

  // Event name for the header. Event data lives per line item; an order
  // is almost always for one event, but the model doesn't guarantee it -
  // show the single name when they all match, otherwise a neutral label.
  const eventNames = order
    ? Array.from(new Set(order.items.map((i) => i.event_name).filter(Boolean)))
    : [];
  const eventHeading =
    eventNames.length === 1 ? eventNames[0] : "Multiple events";

  return (
    <div className="order-view">
      {/* Returns to the event view the user opened this order from,
          rather than router.back(). History-back would follow whatever
          the browser happened to have - a refresh, a pasted link or a
          redirect all break it - where the `from` eid is the event we
          know they came from. */}
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="order-back"
      >
        ‹ Back to Dashboard
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
            <div className="order-title">
              <div className="order-title-id">Order #{order.id}</div>
              <div className="order-title-event">{eventHeading}</div>
            </div>
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
                href={oid ? orderTicketsUrl(oid) : order.download_all_url}
                target="_blank"
                rel="noreferrer"
                className="order-btn order-btn-dark"
              >
                Download all
              </a>
              {/* Resend/Cancel only make sense while the event is still
                  to come - hide them once it's finished. Download stays
                  available so past tickets remain retrievable. */}
              {order.can_resend && (
                <button
                  type="button"
                  className="order-btn order-btn-gold"
                  onClick={handleResend}
                  disabled={resend.isPending}
                >
                  Resend Tickets
                </button>
              )}
              {order.can_cancel && (
                <button
                  type="button"
                  className="order-btn order-btn-gold-outline"
                  onClick={handleCancel}
                  disabled={cancelOrder.isPending}
                >
                  Cancel
                </button>
              )}
            </div>
            {order.is_expired && (
              <p className="order-expired-note mt-2">
                This event has ended - tickets can no longer be resent or
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
                region={region}
                oid={oid}
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
                      {/* Server-rendered money - re-symbolled into the
                          order's region. A row that isn't an amount
                          (a payment method, say) passes through. */}
                      <td>{formatRegionMoneyString(t.value, region)}</td>
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
  region,
  oid,
  orderId,
  transactionId,
}: {
  item: OrderDetailItem;
  region: Region;
  oid: string;
  orderId: number;
  transactionId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: item.meta.full_name ?? "",
    phone: item.meta.phone ?? "",
    car_make: item.meta.car_make ?? "",
    car_model: item.meta.car_model ?? "",
    car_reg: item.meta.car_reg ?? "",
    car_club: item.meta.car_club ?? "",
  });
  const updateMeta = useUpdateLineItemMeta();
  const runAction = useAction();

  const startEdit = () => {
    // Seed the form from current values each time editing opens.
    setForm({
      full_name: item.meta.full_name ?? "",
      phone: item.meta.phone ?? "",
      car_make: item.meta.car_make ?? "",
      car_model: item.meta.car_model ?? "",
      car_reg: item.meta.car_reg ?? "",
      car_club: item.meta.car_club ?? "",
    });
    setEditing(true);
  };

  // No "Are you sure?" here - the Save button in an open edit form is
  // already the deliberate step, and the change is reversible. The
  // loader and confirmation notification still apply.
  const save = async () => {
    const res = await runAction({
      loadingLabel: "Saving ticket details...",
      successTitle: "Ticket details updated",
      errorTitle: "Couldn't save the ticket details",
      run: () =>
        updateMeta.mutateAsync({
          oid,
          line_id: item.line_id,
          meta: { full_name: form.full_name, phone: form.phone },
          car_details: {
            car_make: form.car_make,
            car_model: form.car_model,
            car_reg: form.car_reg,
            car_club: form.car_club,
          },
        }),
    });
    if (res) setEditing(false);
  };

  const field = (key: keyof typeof form, placeholder: string) => (
    <input
      type="text"
      value={form[key]}
      placeholder={placeholder}
      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      style={metaInputStyle}
    />
  );
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
        <hr style={hrStyle} />
        <p className="ticket-event" style={{ lineHeight: 1.9, margin: 0 }}>
          <strong>{item.event_title}</strong>
          <br />
          {/* Both arrive pre-rendered. A machine-readable date is
              re-ordered for the region; one the server already wrote
              out in words is left alone rather than mis-parsed. */}
          <b>Event Date:</b> {formatRegionDateString(item.event_date, region) || "-"}
          <br />
          <b>Event Time:</b> {formatRegionTime(item.event_time, region) || "-"}
        </p>

        {editing ? (
          <div className="ticket-meta-edit" style={{ margin: "12px 0" }}>
            {field("full_name", "Meta name")}
            {field("phone", "Meta phone")}
            {field("car_make", "Car make")}
            {field("car_model", "Car model")}
            {field("car_reg", "Car reg")}
            {field("car_club", "Car club")}
            {updateMeta.isError && (
              <p
                style={{
                  color: "var(--danger, #c0492f)",
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                {updateMeta.error instanceof Error
                  ? updateMeta.error.message
                  : "Couldn't save."}
              </p>
            )}
          </div>
        ) : (
          hasMeta && (
            <div className="ticket-meta" style={{ lineHeight: 1.9 }}>
              {metaRows.map(([label, value]) =>
                value ? (
                  <p key={label} style={{ margin: "2px 0" }}>
                    <b>{label}:</b> {value}
                  </p>
                ) : null,
              )}
            </div>
          )
        )}

        {!editing && (item.custom_answers?.length ?? 0) > 0 && (
          <div
            className="ticket-meta ticket-answers"
            style={{ lineHeight: 1.7, marginTop: 8 }}
          >
            <p style={{ margin: "2px 0 4px" }}>
              <b>Additional info:</b>
            </p>
            {(item.custom_answers ?? []).map((qa, i) => (
              <p key={i} style={{ margin: "2px 0 6px" }}>
                <span style={{ color: "var(--muted, #6b675f)", fontSize: 13 }}>
                  {qa.q}
                </span>
                <br />
                {qa.a}
              </p>
            ))}
          </div>
        )}

        <hr style={hrStyle} />
        <div className="ticket-product" style={{ lineHeight: 1.9 }}>
          <strong>1 × {item.product_title}</strong>
          <br />
          <b>Order</b>: #{orderId}
          <br />
          <b>Transaction ID</b>: #{transactionId}
        </div>

        <div
          className="ticket-price"
          style={{ lineHeight: 1.8, marginTop: 14 }}
        >
          {item.price.has_discount ? (
            <>
              <strong>
                Ticket Price:{" "}
                {formatRegionMoneyString(item.price.subtotal, region)}
              </strong>
              <br />
              <strong>
                Total paid: {formatRegionMoneyString(item.price.total, region)}{" "}
                (-{formatRegionMoneyString(item.price.discount, region)})
              </strong>
            </>
          ) : (
            <strong>
              Ticket Price: {formatRegionMoneyString(item.price.total, region)}
            </strong>
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

        {editing ? (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={save}
              disabled={updateMeta.isPending}
              style={ticketSaveStyle}
            >
              {updateMeta.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={updateMeta.isPending}
              style={ticketCancelStyle}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={startEdit} style={ticketEditStyle}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Ticket card styles - inline so the card keeps its white panel and
// two-column (details | QR) layout even when the global order-* CSS
// isn't loaded. Class names stay for when the stylesheet is present.
// ============================================================

const ticketCardStyle: React.CSSProperties = {
  display: "flex",
  gap: 32,
  flexWrap: "wrap",
  alignItems: "flex-start",
  background: "#fff",
  border: "1px solid #ecebe6",
  borderRadius: 12,
  padding: 28,
  marginBottom: 20,
  boxShadow: "0 1px 3px rgba(31,29,24,.05)",
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #ecebe6",
  margin: "16px 0",
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

const ticketEditStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 140,
  marginTop: 8,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 700,
  color: "#fff",
  background: "var(--gold-deep, #bd7420)",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const ticketSaveStyle: React.CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 700,
  color: "#fff",
  background: "var(--gold-deep, #bd7420)",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const ticketCancelStyle: React.CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink, #1f1d18)",
  background: "#fff",
  border: "1px solid #ecebe6",
  borderRadius: 8,
  cursor: "pointer",
};

const metaInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  marginBottom: 8,
  fontSize: 14,
  border: "1px solid #ecebe6",
  borderRadius: 8,
  background: "var(--ink-50, #faf9f7)",
  boxSizing: "border-box",
};

// ============================================================
// Loading skeleton - mirrors the real order layout (header card,
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

      {/* Header card: title + order id, then status pill, customer,
          action buttons */}
      <div style={skelCard}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            paddingBottom: 16,
            marginBottom: 16,
            borderBottom: "1px solid #ecebe6",
          }}
        >
          <Bar w={90} h={13} />
          <Bar w={200} h={18} />
        </div>
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
