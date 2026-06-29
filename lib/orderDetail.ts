/**
 * Individual order detail — fetch + types.
 *
 * Wraps GET /order?oid=ENC. The legacy PHP returned rendered HTML; this
 * returns structured fields the order page composes natively.
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./apiClient";

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
  /** "{orderId}-{lineId}" — the ticket number shown in the header. */
  ticket_number: string;
  product_title: string;
  event_id: number;
  event_title: string;
  event_date: string;
  event_time: string;
  meta: OrderDetailMeta;
  /** Base64 JPEG (no data: prefix). */
  qr_code: string;
  transaction_id: string;
  price: {
    total: string; // formatted "£55.00"
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
  status: string;
  status_label: string;
  transaction_id: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  can_cancel: boolean;
  items: OrderDetailItem[];
  totals: OrderDetailTotal[];
  download_all_url: string;
}

export interface OrderDetailResponse {
  success: true;
  order: OrderDetail;
}

export function useOrderDetail(oid: string | undefined) {
  return useQuery<OrderDetailResponse, Error, OrderDetail>({
    queryKey: ["order-detail", oid],
    queryFn: () =>
      apiGet<OrderDetailResponse>(`/order?oid=${encodeURIComponent(oid ?? "")}`),
    enabled: !!oid,
    staleTime: 30_000,
    select: (data) => data.order,
  });
}
