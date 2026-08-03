/**
 * Per-row ticket mutations for the editor.
 *
 * Three hooks:
 *   useSaveTicketRow()    - create OR update a single ticket / section.
 *                            Hook detects new-vs-existing by the id
 *                            shape (local makeLocalId ids look like
 *                            "tkt-deadbeef"; server make_crypt ids
 *                            don't). New rows POST without a tid;
 *                            existing rows POST with tid in the query.
 *   useDeleteTicketRow()  - delete a single ticket / section.
 *   useReorderTicketRows()- writes display_order on every ticket in
 *                            the given order.
 *
 * On success each invalidates the /event-edit cache so a later
 * re-entry to the editor pulls fresh state. The editor session itself
 * keeps using its local reducer state - the HYDRATE guard in the
 * editor page prevents the cache invalidation from clobbering edits
 * mid-session.
 *
 * Tickets are saved with `product_status='draft'` server-side. They
 * flip to active when the event itself is published (publish step of
 * /event-update calls cc_publish_event_tickets).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "./apiClient";
import type {
  Ticket,
  TicketSection,
  TicketId,
  SectionId,
} from "@/context/EventCreateContext";

// ============================================================
// Body / response types
// ============================================================

/** Flat body shape - `kind` discriminates ticket vs section. The
 *  ticket-only fields are optional; the PHP build_*_args ignores any
 *  key that doesn't apply to the chosen kind. */
export interface ApiTicketSaveBody {
  kind: "ticket" | "section";
  name: string;
  isSecret: boolean;

  // ticket-only
  additionalInfo?: string;
  price?: number;
  quantity?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  limitPerOrder?: number | null;
  requireCarDetails?: boolean;
  requireCarClubName?: boolean;
  individualAttendeeDetails?: boolean;
  requestVehiclePhoto?: boolean;

  // section-only - optional code for gating a secret section. The
  // editor's TicketSection type doesn't carry this yet; leave it
  // unset and sections will be flagged secret but not coded.
  secretCode?: string;
}

export interface ApiTicketSaveResponse {
  success: true;
  ticket_id: number;
  encrypted_id: string;
  kind: "ticket" | "section";
}

export interface ApiTicketReorderResponse {
  success: true;
  reordered: number;
}

// ============================================================
// Editor → body mappers
// ============================================================

export function mapTicketToBody(t: Ticket): ApiTicketSaveBody {
  return {
    kind: "ticket",
    name: t.name,
    isSecret: t.isSecret,
    additionalInfo: t.additionalInfo,
    price: Number.isFinite(t.price) ? t.price : 0,
    quantity: Number.isFinite(t.quantity) ? t.quantity : null,
    saleStart: t.saleStart,
    saleEnd: t.saleEnd,
    limitPerOrder: Number.isFinite(t.limitPerOrder) ? t.limitPerOrder : null,
    requireCarDetails: t.requireCarDetails,
    requireCarClubName: t.requireCarClubName,
    individualAttendeeDetails: t.individualAttendeeDetails,
    requestVehiclePhoto: t.requestVehiclePhoto,
    // Only send the code when isSecret; otherwise leave it off so the
    // server doesn't clobber an existing stored code on an unrelated
    // update. (The PHP write-side always sets `secret_code=''` when
    // `secret_code_ticket=0`, so wiping is intentional on de-secret.)
    ...(t.isSecret && t.secretCode ? { secretCode: t.secretCode } : {}),
  };
}

export function mapSectionToBody(s: TicketSection): ApiTicketSaveBody {
  return {
    kind: "section",
    name: s.name,
    isSecret: s.isSecret,
    ...(s.isSecret && s.secretCode ? { secretCode: s.secretCode } : {}),
  };
}

// ============================================================
// Local- vs server-id detection
// ============================================================

const LOCAL_ID_PATTERN = /^(tkt|sec)-[A-Za-z0-9]{8}$/;

/** True if the id was minted by makeLocalId() and hasn't been
 *  persisted yet. Anything else is treated as a server make_crypt id. */
export function isLocalTicketId(id: string): boolean {
  return LOCAL_ID_PATTERN.test(id);
}

// ============================================================
// Hooks
// ============================================================

export function useSaveTicketRow() {
  const qc = useQueryClient();
  return useMutation<
    ApiTicketSaveResponse,
    Error,
    { eid: string; id: TicketId | SectionId; body: ApiTicketSaveBody }
  >({
    mutationFn: ({ eid, id, body }) => {
      const params = new URLSearchParams({ eid });
      // Existing rows include tid for an update; new rows omit it so
      // the endpoint takes the create path.
      if (!isLocalTicketId(id)) {
        params.set("tid", id);
      }
      return apiPost<ApiTicketSaveResponse, ApiTicketSaveBody>(
        `/event-ticket?${params.toString()}`,
        body,
      );
    },
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}

export function useDeleteTicketRow() {
  const qc = useQueryClient();
  return useMutation<
    { success: true },
    Error,
    { eid: string; id: TicketId | SectionId }
  >({
    mutationFn: ({ eid, id }) => {
      const params = new URLSearchParams({ eid, tid: id });
      return apiDelete<{ success: true }>(`/event-ticket?${params.toString()}`);
    },
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}

export function useReorderTicketRows() {
  const qc = useQueryClient();
  return useMutation<
    ApiTicketReorderResponse,
    Error,
    { eid: string; ids: string[] }
  >({
    mutationFn: ({ eid, ids }) =>
      apiPost<ApiTicketReorderResponse, { ids: string[] }>(
        `/event-ticket-reorder?eid=${encodeURIComponent(eid)}`,
        { ids },
      ),
    onSuccess: (_data, { eid }) => {
      qc.invalidateQueries({ queryKey: ["event-edit", eid] });
    },
  });
}
