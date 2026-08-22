"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Client API for the Next.js ticket checkout.
 *
 * Everything goes through our own /api/checkout proxy route (same
 * origin, so no CORS and no auth cookie involvement - buyers are
 * anonymous). The proxy speaks to the legacy PHP ticketing backend;
 * see app/api/checkout/route.ts for why direct calls aren't possible.
 * Deliberately NOT lib/apiClient.ts: that wrapper is for the
 * dl-accounts WP REST namespace and its envelope/auth semantics.
 */

export class CheckoutError extends Error {
  extra: Record<string, unknown>;
  constructor(message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.extra = extra;
  }
}

async function checkoutAction<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new CheckoutError(
      "Couldn't reach the ticketing service. Please check your connection and try again.",
    );
  }
  const data = (await res.json().catch(() => null)) as
    | ({ status?: string; message?: string } & Record<string, unknown>)
    | null;
  if (!data) {
    throw new CheckoutError("Unexpected response from the ticketing service.");
  }
  if (data.status === "error") {
    const { status: _s, message, ...extra } = data;
    throw new CheckoutError(message || "Something went wrong.", extra);
  }
  return data as T;
}

// ── Types ────────────────────────────────────────────────────────────

export interface CheckoutTicketFlags {
  contactDetails: boolean;
  carDetails: boolean;
  concours: boolean;
  attendance: boolean;
  carClub: boolean;
  vehiclePhoto: boolean;
  collectionDelivery: boolean;
}

export interface CheckoutTicket {
  id: number;
  /** Encrypted ticket id - the currency of the PHP cart API. */
  pid: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  maxQuantity: number;
  isSection: boolean;
  soldOut: boolean;
  /** ISO date when a not-yet-on-sale ticket goes live, else null. */
  earlyLiveDate: string | null;
  secretMatched: boolean;
  flags: CheckoutTicketFlags;
  collectionInformation: string;
}

export interface CheckoutEvent {
  id: number;
  eid: string;
  title: string;
  permalink: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  tickets_logo: string | null;
  /** "1" = free registration-only event (no tickets/payment). */
  ticket_type: string;
  max_items_per_order: number;
  newsletter_label: string;
  terms_html: string;
  site_terms_html: string;
  company_name: string;
  /** Region key, resolvable with resolveRegion() from lib/regions. */
  site: "uk" | "us";
  currency: string;
}

export interface CheckoutInfo {
  event: CheckoutEvent;
  /** 1.2 when the organiser displays VAT-inclusive prices, else 1. */
  display_vat_multiplier: number;
  stripe: { publishable_key: string; account: string | null };
}

export interface CartLine {
  ticket_id: string;
  event_id: string;
  qty: number;
  meta: Record<string, string>[];
}

export type CartData = Record<string, CartLine>;

export interface CouponRow {
  ID: string | number;
  coupon_code: string;
  discount_amount: string | number;
  discount_type: "percentage" | "fixed";
  allowed_products: string | null;
}

export interface CartTotals {
  subtotal: number;
  total: number;
  vat: number;
  coupons: {
    discount: number;
    discounted_items: Record<string, number>;
    coupons: Record<string, CouponRow>;
    invalid_coupons: Record<string, string>;
  } | null;
  fees: { amount: number; name: string } | null;
}

// ── Queries ──────────────────────────────────────────────────────────

export function useCheckoutInfo(eventEid: string) {
  return useQuery<CheckoutInfo, Error>({
    queryKey: ["checkout-info", eventEid],
    queryFn: () => checkoutAction<CheckoutInfo>("info", { eventEid }),
    enabled: !!eventEid,
    staleTime: 60_000,
  });
}

export function useCheckoutTickets(
  eventEid: string,
  cartToken: string | null,
  secretCode: string,
  coupon: string,
  cname: string,
) {
  return useQuery<{ tickets: CheckoutTicket[] }, Error>({
    queryKey: ["checkout-tickets", eventEid, secretCode, coupon, cname],
    queryFn: () =>
      checkoutAction<{ tickets: CheckoutTicket[] }>("tickets", {
        eventEid,
        cartToken: cartToken ?? "",
        code: secretCode,
        coupon,
        cname,
      }),
    enabled: !!eventEid,
    staleTime: 30_000,
  });
}

// ── Cart operations ──────────────────────────────────────────────────

export function createCart(eventEid: string) {
  return checkoutAction<{ cartToken: string }>("createCart", { eventEid });
}

export function verifyCart(cartToken: string) {
  return checkoutAction<{ valid: boolean }>("verifyCart", { cartToken });
}

export interface AddToBasketResult {
  status: "success" | "maxqty";
  added_tickets?: CartData;
  auto_apply_coupon_message?: string;
  max_qty?: number;
  current_qty?: number;
}

export function addToBasket(
  eventEid: string,
  cartToken: string,
  items: { pid: string; qty: number }[],
  coupon: string,
) {
  return checkoutAction<AddToBasketResult>("addToBasket", {
    eventEid,
    cartToken,
    items,
    coupon,
  });
}

export function reserveTickets(cartToken: string) {
  return checkoutAction<{ reservations: Record<string, string> }>("reserve", {
    cartToken,
  });
}

export function updateTicketMeta(
  cartToken: string,
  ticketId: string,
  field: string,
  value: string,
  metaIndex: number,
) {
  return checkoutAction("updateMeta", {
    cartToken,
    ticketId,
    field,
    value,
    metaIndex,
  });
}

export function removeCartUnit(
  cartToken: string,
  ticketId: string,
  metaIndex: number,
) {
  return checkoutAction<{
    cart_data?: CartData;
    cart_empty?: boolean;
  }>("removeUnit", { cartToken, ticketId, metaIndex });
}

export function saveBillingFields(
  cartToken: string,
  fields: Record<string, string>,
) {
  return checkoutAction("saveBilling", { cartToken, fields });
}

export function saveAttendeeFields(
  cartToken: string,
  fields: Record<string, string>,
) {
  return checkoutAction("saveAttendee", { cartToken, fields });
}

export function fetchTotals(cartToken: string) {
  return checkoutAction<{ totals: CartTotals }>("totals", { cartToken });
}

export function applyCoupon(
  cartToken: string,
  code: string,
  opts: { preCheckout?: boolean; eventEid?: string; email?: string } = {},
) {
  return checkoutAction<{ coupon?: CouponRow; message?: string }>(
    "applyCoupon",
    {
      cartToken,
      code,
      preCheckout: !!opts.preCheckout,
      eventEid: opts.eventEid ?? "",
      email: opts.email ?? "",
    },
  );
}

export function removeCoupon(cartToken: string, code: string) {
  return checkoutAction("removeCoupon", { cartToken, code });
}

export function checkSecretCode(
  cartToken: string,
  code: string,
  eventEid: string,
) {
  return checkoutAction("checkSecret", { cartToken, code, eventEid });
}

export function createPaymentIntent(
  cartToken: string,
  eventEid: string,
  site: string,
) {
  return checkoutAction<{ clientSecret: string; total: number }>(
    "createIntent",
    { cartToken, eventEid, site },
  );
}

export interface SaveOrderResult {
  status: string;
  order_id?: string;
  order_number?: string | null;
  is_update?: boolean;
}

export function saveOrder(
  cartToken: string,
  eventEid: string,
  paymentIntentId: string,
  paymentStatus: string,
  form: Record<string, string>,
  opts: { boxOffice?: boolean } = {},
) {
  return checkoutAction<SaveOrderResult>("saveOrder", {
    cartToken,
    eventEid,
    paymentIntentId,
    paymentStatus,
    form,
    // Asks the proxy to attach the dashboard session token so the
    // backend can authorise a no-payment (box office) completion.
    boxOffice: !!opts.boxOffice,
  });
}

/**
 * Upload a vehicle photo for a ticket unit to Cloudflare Images.
 *
 * Same two-step flow as the show-car apply form (lib/showCarApply.ts):
 * mint a one-time direct-upload URL (via our proxy, which calls the
 * checkout's ungated mint endpoint), POST the file straight to
 * Cloudflare, and return the public delivery URL. That URL is then
 * stored in the cart's per-unit meta as `vehicle_photo`.
 */
export async function uploadVehiclePhoto(
  eventEid: string,
  file: File,
): Promise<string> {
  const mint = await checkoutAction<{ upload_url: string; media_id: string }>(
    "mintPhotoUpload",
    { eventEid },
  );

  const form = new FormData();
  form.append("file", file);

  const cfRes = await fetch(mint.upload_url, { method: "POST", body: form });
  if (!cfRes.ok) {
    let message = `Photo upload failed (HTTP ${cfRes.status})`;
    try {
      const cfBody = await cfRes.json();
      if (cfBody?.errors?.[0]?.message)
        message = String(cfBody.errors[0].message);
    } catch {
      // keep the generic message
    }
    throw new CheckoutError(message);
  }

  // CF returns one URL per configured variant in no guaranteed order -
  // pick "public" explicitly (same lesson as the show-car uploader,
  // where variants[0] was sometimes the blurred one).
  const cfBody = (await cfRes.json()) as { result?: { variants?: unknown } };
  const variants = (
    Array.isArray(cfBody?.result?.variants) ? cfBody.result.variants : []
  ).filter((v): v is string => typeof v === "string");
  if (variants.length === 0) {
    throw new CheckoutError("Upload succeeded but no image URL was returned.");
  }
  return (
    variants.find((v) => v.endsWith("/public")) ??
    variants.find((v) => !v.endsWith("/blurred")) ??
    variants[0]
  );
}

export function registerForEvent(
  cartToken: string,
  eventEid: string,
  form: Record<string, string>,
) {
  return checkoutAction<{ redirect?: string }>("register", {
    cartToken,
    eventEid,
    form,
  });
}

export function clearCartData(cartToken: string) {
  return checkoutAction("clearCart", { cartToken });
}
