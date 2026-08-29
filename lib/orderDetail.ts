/**
 * Individual order detail - fetch + types.
 *
 * Wraps GET /order?oid=ENC. The legacy PHP returned rendered HTML; this
 * returns structured fields the order page composes natively.
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./apiClient";
import type { EventSite } from "./apiTypes";

export interface OrderDetailMeta {
  full_name?: string;
  phone?: string;
  car_make?: string;
  car_model?: string;
  car_reg?: string;
  car_club?: string;
}

export interface OrderDetailItem {
  line_id: string;
  /** "{orderId}-{lineId}" - the ticket number shown in the header. */
  ticket_number: string;
  product_title: string;
  event_id: number;
  /** NB: this is the TICKET name, not the event title (backend naming). */
  event_title: string;
  /** The actual event post title. */
  event_name: string;
  event_date: string;
  event_time: string;
  /** Y-m-d of the event's last day; "" when unknown. */
  event_end_date: string;
  /** This ticket's event has already finished. */
  is_expired: boolean;
  meta: OrderDetailMeta;
  /** Base64 JPEG (no data: prefix). */
  qr_code: string;
  transaction_id: string;
  /** Money as the server rendered it - "£55.00". WooCommerce formats
   *  these against whichever blog answered, so the page re-renders them
   *  in the order's own region rather than trusting the symbol. */
  price: {
    total: string;
    subtotal: string | null; // present only when discounted
    discount: string | null;
    has_discount: boolean;
  };
  download_url: string;
}

export interface OrderDetailTotal {
  label: string;
  value: string;
}

export interface OrderDetail {
  id: number;
  encrypted_id: string;
  /** The blog this order lives on. Optional: the endpoint doesn't send
   *  one yet, so the page falls back to the `?site=` its link carried.
   *  When the API starts echoing it, it wins - a response that knows
   *  its own region beats a URL param that could be stale or absent. */
  site?: EventSite;
  status: string;
  status_label: string;
  transaction_id: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  /** Every dated ticket's event has finished. */
  is_expired: boolean;
  can_cancel: boolean;
  can_resend: boolean;
  items: OrderDetailItem[];
  totals: OrderDetailTotal[];
  download_all_url: string;
}

export interface OrderDetailResponse {
  success: true;
  order: OrderDetail;
}

/**
 * @param site the order's region, from the `?site=` on the page URL.
 *   Forwarded so the API resolves the encrypted id against the right
 *   blog - order ids repeat across sites exactly as event ids do, and
 *   an omitted site resolves against the default one. Omitted from the
 *   query key's identity it is not: two blogs can hand back different
 *   orders for the same oid, so the cache has to keep them apart.
 */
export function useOrderDetail(oid: string | undefined, site?: string | null) {
  return useQuery<OrderDetailResponse, Error, OrderDetail>({
    queryKey: ["order-detail", oid, site ?? null],
    queryFn: () =>
      apiGet<OrderDetailResponse>(
        `/order?oid=${encodeURIComponent(oid ?? "")}`,
        site ? { site } : {},
      ),
    enabled: !!oid,
    staleTime: 30_000,
    select: (data) => data.order,
  });
}
