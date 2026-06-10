/**
 * Per-row discount mutations for the editor.
 *
 *   useSaveDiscount()   — create OR update a discount. New rows post
 *                          without a `did`; existing rows include it.
 *                          Discriminates by the id pattern (local
 *                          synthetic ids like "dis-abcd1234" vs server
 *                          ids).
 *   useDeleteDiscount() — delete a discount.
 *
 * No reorder hook — coupons don't carry a display_order column on the
 * WP side, so the editor's REORDER_DISCOUNTS dispatch is local-only.
 *
 * Both hooks invalidate the /event-edit cache on success so a later
 * re-entry to the editor pulls fresh state.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "./apiClient";
import type { Discount, DiscountId } from "@/context/EventCreateContext";

// ============================================================
// Body / response types
// ============================================================

export interface ApiDiscountSaveBody {
  code: string;
  kind: "percentage" | "fixed";
  amount: number;
  /** String form of TicketId — the PHP side comma-joins these into
   *  the `allowed_products` column. Empty array means "applies to
   *  every ticket on the event". */
  applicableTicketIds: string[];
  /** ISO yyyy-mm-dd, or null for "no bound on this side". When the
   *  end is null the PHP side defaults it to the event's last date
   *  (legacy parity), so coupons stay valid for the run of the event. */
  availableFrom: string | null;
  availableUntil: string | null;
  /** number → integer limit; null → unlimited. */
  usageLimit: number | null;
  perCustomerLimit: number | null;
  /** Optional cap on basket size for the coupon. The editor doesn't
   *  currently model this; reserved for a future panel. */
  maxProductsPerBasket?: number | null;
}

export interface ApiDiscountSaveResponse {
  success: true;
  coupon_id: number;
  encrypted_id: string;
}

// ============================================================
// Editor → body
// ============================================================

export function mapDiscountToBody(d: Discount): ApiDiscountSaveBody {
  return {
    code: d.code,
    kind: d.kind === "fixed" ? "fixed" : "percentage",
    amount: Number.isFinite(d.amount) ? d.amount : 0,
    applicableTicketIds: d.applicableTicketIds.map((id) => String(id)),
    availableFrom: d.availableFrom,
    availableUntil: d.availableUntil,
    usageLimit: d.usageLimit,
    perCustomerLimit: d.perCustomerLimit,
  };
}

// ============================================================
// Local- vs server-id detection
// ============================================================

const LOCAL_ID_PATTERN = /^disc-[A-Za-z0-9]{8}$/;

export function isLocalDiscountId(id: string): boolean {
  return LOCAL_ID_PATTERN.test(id);
}

// ============================================================
// Hooks
// ============================================================

export function useSaveDiscount() {
  const qc = useQueryClient();
  return useMutation<
    ApiDiscountSaveResponse,
    Error,
    { eid: string; id: DiscountId; body: ApiDiscountSaveBody }
  >({
    mutationFn: ({ eid, id, body }) => {
      const params = new URLSearchParams({ eid });
      if (!isLocalDiscountId(id)) {
        params.set("did", id);
      }
      return apiPost<ApiDiscountSaveResponse, ApiDiscountSaveBody>(
        `/event-discount?${params.toString()}`,
        body,
      );
    },
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}

export function useDeleteDiscount() {
  const qc = useQueryClient();
  return useMutation<{ success: true }, Error, { eid: string; id: DiscountId }>(
    {
      mutationFn: ({ eid, id }) => {
        const params = new URLSearchParams({ eid, did: id });
        return apiDelete<{ success: true }>(
          `/event-discount?${params.toString()}`,
        );
      },
      onSuccess: (_data, { eid }) => {
        qc.invalidateQueries({ queryKey: ["event-edit", eid] });
      },
    },
  );
}
