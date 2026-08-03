/**
 * Per-row show car category mutations.
 *
 *   useSaveShowCarCategory()   - create OR update a category.
 *                                Hook detects new-vs-existing by the
 *                                id pattern (local "scc-…" ids → POST
 *                                without sccid; server post ids → POST
 *                                with sccid).
 *   useDeleteShowCarCategory() - delete a category (and its underlying
 *                                ticket).
 *
 * No reorder hook - show car categories don't carry a display_order
 * column server-side, so the panel's REORDER_SHOW_CAR_CATEGORIES
 * dispatch is local-only.
 *
 * Both hooks invalidate ["event-edit", eid] on success. Hydration of
 * existing show car rows isn't wired yet - that needs the GET
 * /event-edit response to start filtering is_show_car_ticket=1 rows
 * out of the regular ticket list and surfacing them as a separate
 * show_car_categories array. Until then refresh-then-edit on an
 * existing category won't pre-populate the drawer.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "./apiClient";
import type {
  ShowCarCategory,
  ShowCarCategoryId,
} from "@/context/EventCreateContext";

// ============================================================
// Body / response types
// ============================================================

export interface ApiShowCarSaveBody {
  name: string;
  description: string;
  applicationsOpen: string | null;
  applicationsClose: string | null;
  /** null → unlimited (server stores null in the stock column). */
  spacesAvailable: number | null;
  requireTicket: boolean;
  /** Only used when requireTicket=true. Editor stores NaN when the
   *  cost field is empty; we send null in that case. */
  ticketCost: number | null;
  /** Per-category secret code. Server stamps this onto the
   *  underlying ticket so the public ticket URL is unique to this
   *  category. Empty string is allowed - server auto-generates one
   *  when missing so categories never end up without a code. */
  secretCode: string;
}

export interface ApiShowCarSaveResponse {
  success: true;
  ticket_id: number;
  encrypted_id: string;
}

// ============================================================
// Editor → body
// ============================================================

export function mapShowCarCategoryToBody(
  c: ShowCarCategory,
): ApiShowCarSaveBody {
  return {
    name: c.name,
    description: c.description,
    applicationsOpen: c.applicationsOpen,
    applicationsClose: c.applicationsClose,
    spacesAvailable: Number.isFinite(c.spacesAvailable)
      ? c.spacesAvailable
      : null,
    requireTicket: c.requireTicket,
    ticketCost:
      c.requireTicket && Number.isFinite(c.ticketCost) ? c.ticketCost : null,
    secretCode: c.secretCode ?? "",
  };
}

// ============================================================
// Local- vs server-id detection
// ============================================================

const LOCAL_ID_PATTERN = /^scc-[A-Za-z0-9]{8}$/;

export function isLocalShowCarId(id: string): boolean {
  return LOCAL_ID_PATTERN.test(id);
}

// ============================================================
// Hooks
// ============================================================

export function useSaveShowCarCategory() {
  const qc = useQueryClient();
  return useMutation<
    ApiShowCarSaveResponse,
    Error,
    { eid: string; id: ShowCarCategoryId; body: ApiShowCarSaveBody }
  >({
    mutationFn: ({ eid, id, body }) => {
      const params = new URLSearchParams({ eid });
      if (!isLocalShowCarId(id)) {
        params.set("sccid", id);
      }
      return apiPost<ApiShowCarSaveResponse, ApiShowCarSaveBody>(
        `/event-show-car?${params.toString()}`,
        body,
      );
    },
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}

export function useDeleteShowCarCategory() {
  const qc = useQueryClient();
  return useMutation<
    { success: true },
    Error,
    { eid: string; id: ShowCarCategoryId }
  >({
    mutationFn: ({ eid, id }) => {
      const params = new URLSearchParams({ eid, sccid: id });
      return apiDelete<{ success: true }>(
        `/event-show-car?${params.toString()}`,
      );
    },
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}
