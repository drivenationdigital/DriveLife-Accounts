/**
 * Per-row trader category mutations.
 *
 *   useSaveTraderCategory()   - create OR update a category. New-vs-
 *                               existing detected by id pattern (local
 *                               "tc-…" ids → create; server ids →
 *                               update with tcid).
 *   useDeleteTraderCategory() - delete a category + its ticket.
 *
 * Mirrors lib/showCarMutations.ts. Trader categories are stored as
 * hidden trader_ticket=1 tickets; each carries an icon and a payment
 * mode ('online' | 'in_person'). Both hooks invalidate
 * ["event-edit", eid] on success.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "./apiClient";
import type {
  TraderCategory,
  TraderCategoryId,
} from "@/context/EventCreateContext";

// ============================================================
// Body / response types
// ============================================================

export interface ApiTraderSaveBody {
  name: string;
  icon: string;
  info: string;
  applicationsOpen: string | null;
  applicationsClose: string | null;
  /** null → unlimited (server stores null in the stock column). */
  spacesAvailable: number | null;
  /** 'online' = ticket at checkout; 'in_person' = invoice/bank
   *  transfer. Never free. */
  paymentMode: "online" | "in_person";
  /** Pitch fee. NaN in the editor → null here. Recorded for both
   *  modes. */
  ticketCost: number | null;
  /** Per-category secret code. Empty allowed - server auto-generates
   *  so a category never persists without one. */
  secretCode: string;
}

export interface ApiTraderSaveResponse {
  success: true;
  /** The category row id (ce_event_trader_categories). The FE stores
   *  this as TraderCategory.id and sends it back as tcid on edit. */
  category_id: number;
  /** The associated ticket id - only for online categories, else
   *  null. */
  ticket_id: number | null;
  encrypted_id: string;
}

// ============================================================
// Editor → body
// ============================================================

export function mapTraderCategoryToBody(c: TraderCategory): ApiTraderSaveBody {
  return {
    name: c.name,
    icon: c.icon,
    info: c.info,
    applicationsOpen: c.applicationsOpen,
    applicationsClose: c.applicationsClose,
    spacesAvailable: Number.isFinite(c.spacesAvailable)
      ? c.spacesAvailable
      : null,
    paymentMode: c.paymentMode,
    ticketCost: Number.isFinite(c.ticketCost) ? c.ticketCost : null,
    secretCode: c.secretCode ?? "",
  };
}

// ============================================================
// Local- vs server-id detection
// ============================================================

const LOCAL_ID_PATTERN = /^tc-[A-Za-z0-9]{8}$/;

export function isLocalTraderId(id: string): boolean {
  return LOCAL_ID_PATTERN.test(id);
}

// ============================================================
// Hooks
// ============================================================

export function useSaveTraderCategory() {
  const qc = useQueryClient();
  return useMutation<
    ApiTraderSaveResponse,
    Error,
    { eid: string; id: TraderCategoryId; body: ApiTraderSaveBody }
  >({
    mutationFn: ({ eid, id, body }) => {
      const params = new URLSearchParams({ eid });
      if (!isLocalTraderId(id)) {
        params.set("tcid", id);
      }
      return apiPost<ApiTraderSaveResponse, ApiTraderSaveBody>(
        `/event-trader?${params.toString()}`,
        body,
      );
    },
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}

export function useDeleteTraderCategory() {
  const qc = useQueryClient();
  return useMutation<
    { success: true },
    Error,
    { eid: string; id: TraderCategoryId }
  >({
    mutationFn: ({ eid, id }) => {
      const params = new URLSearchParams({ eid, tcid: id });
      return apiDelete<{ success: true }>(`/event-trader?${params.toString()}`);
    },
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}
