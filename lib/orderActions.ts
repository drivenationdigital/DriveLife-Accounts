/**
 * Order row actions — resend / cancel / update customer.
 *
 *   POST /order/resend           { oid }
 *   POST /order/cancel           { oid }
 *   POST /order/update-customer  { oid, customer }
 *
 * "Download tickets" is not here — it's a direct link to the carevents
 * PDF endpoint; see orderTicketsUrl().
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "./apiClient";

interface OkResponse {
  success: true;
  message: string;
}

export interface OrderCustomer {
  billing_first_name?: string;
  billing_last_name?: string;
  billing_email?: string;
  billing_phone?: string;
  billing_address_1?: string;
  billing_address_2?: string;
  billing_city?: string;
  billing_postcode?: string;
  billing_country?: string;
}

/** Re-send the order confirmation / tickets email. */
export function useResendOrder() {
  return useMutation<OkResponse, Error, { oid: string }>({
    mutationFn: (body) =>
      apiPost<OkResponse, { oid: string }>("/order/resend", body),
  });
}

/** Cancel the order (soft — via cc_cancel_order). */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation<OkResponse, Error, { oid: string }>({
    mutationFn: (body) =>
      apiPost<OkResponse, { oid: string }>("/order/cancel", body),
    onSuccess: async (_d, { oid }) => {
      await qc.invalidateQueries({
        queryKey: ["event-orders"],
        refetchType: "active",
      });
      await qc.invalidateQueries({ queryKey: ["order-detail", oid] });
    },
  });
}

/** Edit the order's billing/customer details. */
export function useUpdateOrderCustomer() {
  const qc = useQueryClient();
  return useMutation<
    OkResponse,
    Error,
    { oid: string; customer: OrderCustomer }
  >({
    mutationFn: (body) =>
      apiPost<OkResponse, { oid: string; customer: OrderCustomer }>(
        "/order/update-customer",
        body,
      ),
    onSuccess: (_d, { oid }) => {
      qc.invalidateQueries({ queryKey: ["event-orders"] });
      qc.invalidateQueries({ queryKey: ["order-detail", oid] });
    },
  });
}

export interface LineItemMeta {
  full_name?: string;
  phone?: string;
}
export interface LineItemCarDetails {
  car_make?: string;
  car_model?: string;
  car_reg?: string;
  car_club?: string;
}

/**
 * Edit a single ticket's meta on an order (attendee name/phone + car
 * details). Backs cc_update_order_line_item_meta.
 */
export function useUpdateLineItemMeta() {
  const qc = useQueryClient();
  return useMutation<
    OkResponse,
    Error,
    {
      oid: string;
      line_id: string;
      meta?: LineItemMeta;
      car_details?: LineItemCarDetails;
    }
  >({
    mutationFn: (body) =>
      apiPost<OkResponse, typeof body>("/order/line-item-meta", body),
    onSuccess: (_d, { oid }) => {
      qc.invalidateQueries({ queryKey: ["order-detail", oid] });
    },
  });
}

/**
 * Public carevents URL that renders/downloads an order's tickets as a
 * PDF. Matches the legacy "/controller/download?order=<enc>" link.
 * Uses NEXT_PUBLIC_CAREVENTS_URL when set, else the live carevents/uk
 * base (so it never falls back to a relative Next.js path, which 404s).
 */
export function orderTicketsUrl(encryptedOrderId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_CAREVENTS_URL || "https://www.carevents.com"
  ).replace(/\/$/, "");
  return `${base}/controller/download?order=${encodeURIComponent(
    encryptedOrderId,
  )}`;
}
