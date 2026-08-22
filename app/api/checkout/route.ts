import { NextRequest, NextResponse } from "next/server";
import { ccDecrypt, ccEncrypt } from "@/lib/checkout/crypt";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";

/**
 * Server-side proxy between the Next.js checkout UI and the legacy
 * PHP ticketing backend (get-tickets/embed.php, create.php and
 * admin-ajax.php on the WordPress side).
 *
 * A proxy rather than direct browser calls because the PHP endpoints
 * send no CORS headers, reply text/html with hand-rolled json_encode
 * bodies (sometimes zero-length), and load_event_tickets returns a
 * positional array whose useful payload is raw DB rows. This layer
 * turns all of that into uniform `{ status, ... }` JSON and keeps the
 * quirks out of the client. All money logic (totals, fees, coupons,
 * Stripe intents, order rows) stays in the proven PHP code - nothing
 * here computes a price.
 *
 * The /uk prefix on CHECKOUT_WP_BASE is load-bearing: WordPress
 * multisite resolves the blog (and therefore currency + Stripe keys)
 * from the request path.
 */

const WP_BASE = (
  process.env.CHECKOUT_WP_BASE ?? "https://staging.carevents.com/uk"
).replace(/\/$/, "");

const EMBED_URL = `${WP_BASE}/get-tickets/embed.php`;
const CREATE_URL = `${WP_BASE}/get-tickets/create.php`;
const INFO_URL = `${WP_BASE}/get-tickets/next-checkout-info.php`;
const PHOTO_URL = `${WP_BASE}/get-tickets/next-photo-upload.php`;
const AJAX_URL = `${WP_BASE}/wp-admin/admin-ajax.php`;

class UpstreamError extends Error {}

/**
 * POST form-encoded fields to a PHP endpoint and parse the JSON it
 * echoes. Empty bodies and non-JSON output become typed errors
 * instead of client-side "Unexpected end of JSON input".
 */
async function phpPost(
  url: string,
  fields: Record<string, string>,
): Promise<unknown> {
  const body = new URLSearchParams(fields);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const text = (await res.text()).trim();
  if (!res.ok) {
    throw new UpstreamError(`Ticketing service error (HTTP ${res.status})`);
  }
  if (!text) {
    throw new UpstreamError("EMPTY_RESPONSE");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new UpstreamError(
      `Unexpected response from ticketing service: ${text.slice(0, 160)}`,
    );
  }
}

function err(message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ status: "error", message, ...extra });
}

function ok(payload: Record<string, unknown> = {}) {
  return NextResponse.json({ status: "success", ...payload });
}

/** Truthy for the DB's mix of "1"/1/"yes" flag encodings. */
function flag(v: unknown): boolean {
  return v === 1 || v === "1" || v === "yes" || v === true;
}

type RawRow = Record<string, unknown>;

const str = (v: unknown): string => (v == null ? "" : String(v));
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Normalise one carevents_tickets JOIN carevents_ticket_meta row into
 * the shape the UI consumes. Mirrors the rendering rules of
 * embed.php's load_event_tickets HTML branch: max quantity =
 * (max_tickets || stock) clamped by limit_per_order, sold out when
 * reservation-adjusted stock <= 0, "early" when ticket_date_start is
 * in the future.
 */
function normaliseTicket(row: RawRow) {
  const id = num(row.ticket_id);
  const stock = num(row.stock);
  let maxQuantity = num(row.max_tickets) || stock;
  const limitPerOrder = num(row.limit_per_order);
  if (limitPerOrder > 0 && limitPerOrder < maxQuantity) {
    maxQuantity = limitPerOrder;
  }

  let earlyLiveDate: string | null = null;
  const startRaw = str(row.ticket_date_start);
  if (startRaw) {
    const start = new Date(startRaw.replace(" ", "T"));
    if (!Number.isNaN(start.getTime()) && start.getTime() > Date.now()) {
      earlyLiveDate = start.toISOString();
    }
  }

  return {
    id,
    pid: ccEncrypt(String(id)),
    name: str(row.name),
    description: str(row.description),
    price: num(row.price),
    stock,
    maxQuantity: Math.max(0, maxQuantity),
    isSection: num(row.ticket_section) === 1,
    soldOut: stock <= 0,
    earlyLiveDate,
    hidden: flag(row.hidden_ticket),
    secretCodeTicket: flag(row.secret_code_ticket),
    secretMatched: flag(row.secret),
    flags: {
      contactDetails: flag(row.contact_details_required),
      carDetails: flag(row.car_details_required),
      concours: flag(row.concours),
      attendance: flag(row.request_attendance_details),
      carClub: flag(row.request_car_club),
      vehiclePhoto: flag(row.request_vehicle_photo),
      collectionDelivery: flag(row.collection_delivery),
    },
    collectionInformation: str(row.collection_information),
  };
}

type Body = { action?: string } & Record<string, unknown>;

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request body" },
      { status: 400 },
    );
  }

  const s = (key: string): string => str(body[key]);

  try {
    switch (body.action) {
      case "info": {
        const resp = (await phpPost(INFO_URL, {
          event_id: s("eventEid"),
        })) as Record<string, unknown>;
        return NextResponse.json(resp);
      }

      case "tickets": {
        const resp = await phpPost(EMBED_URL, {
          ref: "load_event_tickets",
          cart_token: s("cartToken"),
          eid: s("eventEid"),
          code: s("code") || "false",
          auto_apply_coupon: s("coupon"),
          cname: s("cname") || "false",
        });
        if (Array.isArray(resp) && resp[0] === "success") {
          const rows = Array.isArray(resp[3]) ? (resp[3] as RawRow[]) : [];
          const tickets = rows
            .map(normaliseTicket)
            .filter(
              (t) =>
                t.isSection ||
                (!t.hidden && !t.secretCodeTicket) ||
                t.secretMatched,
            );
          return ok({ tickets });
        }
        const e = resp as { status?: string; message?: string };
        return err(e.message || "Couldn't load tickets for this event.");
      }

      case "mintPhotoUpload": {
        const resp = (await phpPost(PHOTO_URL, {
          event_id: s("eventEid"),
        })) as Record<string, unknown>;
        return NextResponse.json(resp);
      }

      case "createCart": {
        const resp = (await phpPost(AJAX_URL, {
          action: "create_cart_token",
          event_id: s("eventEid"),
        })) as { cart_token?: string; error?: string };
        if (resp.cart_token) return ok({ cartToken: resp.cart_token });
        return err(resp.error || "Failed to create cart");
      }

      case "verifyCart": {
        const resp = (await phpPost(AJAX_URL, {
          action: "verify_cart_token",
          cart_token: s("cartToken"),
        })) as { valid?: boolean };
        return ok({ valid: !!resp.valid });
      }

      case "addToBasket": {
        const items = Array.isArray(body.items)
          ? (body.items as { pid: string; qty: number }[])
          : [];
        // Keys must start with "tickets_info" - that prefix is all the
        // PHP handler checks (the legacy client's broken bracket
        // nesting happened to satisfy it too).
        const fields: Record<string, string> = {
          ref: "ccadd_to_basket",
          cart_token: s("cartToken"),
          eid: s("eventEid"),
        };
        items.forEach((item, i) => {
          fields[`ticket_form[tickets_info_${i}][pid]`] = str(item.pid);
          fields[`ticket_form[tickets_info_${i}][eid]`] = s("eventEid");
          fields[`ticket_form[tickets_info_${i}][qty]`] = String(
            Math.max(0, Math.floor(num(item.qty))),
          );
        });
        if (s("coupon")) fields["ticket_form[auto_apply_coupon]"] = s("coupon");
        const resp = await phpPost(EMBED_URL, fields);
        return NextResponse.json(resp as Record<string, unknown>);
      }

      case "updateMeta": {
        const resp = await phpPost(EMBED_URL, {
          action: "cc_update_ticket_meta_in_cart",
          cart_token: s("cartToken"),
          ticket_id: s("ticketId"),
          field: s("field"),
          meta_value: s("value"),
          meta_index: s("metaIndex"),
        });
        return NextResponse.json(resp as Record<string, unknown>);
      }

      case "removeUnit": {
        const resp = await phpPost(EMBED_URL, {
          action: "cc_remove_ticket_from_cart",
          cart_token: s("cartToken"),
          tid: s("ticketId"),
          meta_index: s("metaIndex"),
        });
        return NextResponse.json(resp as Record<string, unknown>);
      }

      case "saveBilling": {
        const fields = (body.fields ?? {}) as Record<string, unknown>;
        // Sequential on purpose: each call is a read-modify-write of
        // the same cart row's JSON column.
        for (const [name, value] of Object.entries(fields)) {
          await phpPost(EMBED_URL, {
            action: "cc_update_billing_field",
            cart_token: s("cartToken"),
            name,
            value: str(value),
          });
        }
        return ok();
      }

      case "saveAttendee": {
        const fields = (body.fields ?? {}) as Record<string, unknown>;
        for (const [name, value] of Object.entries(fields)) {
          await phpPost(EMBED_URL, {
            action: "cc_update_attendee_field",
            cart_token: s("cartToken"),
            name,
            value: str(value),
          });
        }
        return ok();
      }

      case "reserve": {
        const resp = await phpPost(EMBED_URL, {
          action: "cc_reserve_tickets",
          cart_token: s("cartToken"),
        });
        return NextResponse.json(resp as Record<string, unknown>);
      }

      case "totals": {
        const resp = (await phpPost(AJAX_URL, {
          action: "cc_display_cart_totals_new",
          cart_token: s("cartToken"),
          page: "checkout",
        })) as { totals?: unknown };
        if (!resp.totals) return err("Cart is empty");
        return ok({ totals: resp.totals });
      }

      case "applyCoupon": {
        // In-checkout coupons are limited per-user by email, so the
        // legacy client persists billing_email before applying - keep
        // that ordering.
        if (s("email")) {
          await phpPost(EMBED_URL, {
            action: "cc_update_billing_field",
            cart_token: s("cartToken"),
            name: "billing_email",
            value: s("email"),
          });
        }
        const fields: Record<string, string> = {
          action: "cc_apply_coupon",
          cart_token: s("cartToken"),
          code: s("code"),
        };
        if (body.preCheckout) {
          fields.pre_checkout = "true";
          fields.event_id = s("eventEid");
        }
        const resp = await phpPost(EMBED_URL, fields);
        return NextResponse.json(resp as Record<string, unknown>);
      }

      case "removeCoupon": {
        const resp = await phpPost(EMBED_URL, {
          action: "cc_remove_coupon",
          cart_token: s("cartToken"),
          code: s("code"),
        });
        return NextResponse.json(resp as Record<string, unknown>);
      }

      case "checkSecret": {
        const resp = await phpPost(EMBED_URL, {
          action: "cc_check_secret_code",
          cart_token: s("cartToken"),
          code: s("code"),
          event_id: s("eventEid"),
        });
        return NextResponse.json(resp as Record<string, unknown>);
      }

      case "createIntent": {
        try {
          const resp = (await phpPost(
            `${CREATE_URL}?event_id=${encodeURIComponent(s("eventEid"))}`,
            { cart_token: s("cartToken"), site: s("site") || "uk" },
          )) as Record<string, unknown>;
          if (resp.error) return err(str(resp.error));
          return ok({
            clientSecret: str(resp.clientSecret),
            total: num(resp.total),
          });
        } catch (e) {
          // create.php returns a zero-length body when the cached
          // intent already succeeded - surface that meaningfully.
          if (e instanceof UpstreamError && e.message === "EMPTY_RESPONSE") {
            return err(
              "This cart has already been paid. Please start a new order.",
            );
          }
          throw e;
        }
      }

      case "saveOrder": {
        const form = (body.form ?? {}) as Record<string, unknown>;
        const fields: Record<string, string> = {
          action: "save_checkout_data",
          cart_token: s("cartToken"),
          stripe_payment_intent_id: s("paymentIntentId"),
          payment_status: s("paymentStatus"),
          event_id: s("eventEid"),
          page: "checkout",
          cart_key: "cart",
        };
        // Box-office placement: forward the caller's dashboard session
        // token so the PHP side can verify they organise this event
        // before letting a paid cart complete without payment. Read
        // from the request cookie server-side - never from the JSON
        // body - so the client can't inject an arbitrary token string.
        if (body.boxOffice) {
          const dashToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
          if (!dashToken) {
            return err("Sign in to the dashboard to place box office orders.");
          }
          fields.admin_token = dashToken;
        }
        for (const [name, value] of Object.entries(form)) {
          fields[`form[${name}]`] = str(value);
        }
        const resp = (await phpPost(EMBED_URL, fields)) as Record<
          string,
          unknown
        >;
        if (resp.status === "success" && resp.order_id) {
          const orderNumber = ccDecrypt(str(resp.order_id));
          return NextResponse.json({ ...resp, order_number: orderNumber });
        }
        return NextResponse.json(resp);
      }

      case "register": {
        const form = (body.form ?? {}) as Record<string, unknown>;
        const fields: Record<string, string> = {
          action: "cc_register_for_event",
          cart_token: s("cartToken"),
          event_id: s("eventEid"),
        };
        for (const [name, value] of Object.entries(form)) {
          fields[`form[${name}]`] = str(value);
        }
        const resp = await phpPost(EMBED_URL, fields);
        return NextResponse.json(resp as Record<string, unknown>);
      }

      case "clearCart": {
        const resp = await phpPost(EMBED_URL, {
          action: "cc_clear_cart_data",
          cart_token: s("cartToken"),
        });
        return NextResponse.json(resp as Record<string, unknown>);
      }

      default:
        return NextResponse.json(
          { status: "error", message: `Unknown action: ${str(body.action)}` },
          { status: 400 },
        );
    }
  } catch (e) {
    const message =
      e instanceof UpstreamError && e.message !== "EMPTY_RESPONSE"
        ? e.message
        : "The ticketing service is unavailable. Please try again.";
    return NextResponse.json({ status: "error", message });
  }
}
