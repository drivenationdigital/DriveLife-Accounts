/**
 * Public trader application — types + hooks.
 *
 * Backs /apply/trader/[eventEid]. Mirrors lib/showCarApply.ts: a
 * category dropdown + business/contact fields, posting to
 * /event-trader-apply. Free-only for now (categories may report a
 * price for when paid trader categories are switched on).
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";

export interface TraderPublicCategory {
  encrypted_id: string;
  name: string;
  description: string;
  icon: string;
  /** 'online' = pay at checkout via ticket; 'in_person' = invoice /
   *  bank transfer / pay on the day. Never free. */
  payment_mode: "online" | "in_person";
  ticket_cost: number;
  spaces_remaining: number | null;
  is_full: boolean;
  applications_open: string; // "YYYY-MM-DD" or ""
  applications_close: string;
}

export interface TraderPublicResponse {
  event_id: number;
  event_title: string;
  traders_enabled: boolean;
  categories?: TraderPublicCategory[];
}

export interface TraderApplicationBody {
  eventEid: string;
  categoryEid: string;
  businessName: string;
  description: string;
  pitchSize: string;
  powerRequired: boolean;
  powerDetails: string;
  website: string;
  instagram: string;
  tiktok: string;
  contactName: string;
  email: string;
  contactPhone: string;
  notes: string;
}

export interface TraderApplicationResponse {
  success: true;
  application_id: number;
}

export function useTraderPublic(eventEid: string) {
  return useQuery<TraderPublicResponse, Error>({
    queryKey: ["traders-public", eventEid],
    queryFn: () =>
      apiGet<TraderPublicResponse>(
        `/event-traders-public?eid=${encodeURIComponent(eventEid)}`,
      ),
    enabled: !!eventEid,
    staleTime: 30_000,
  });
}

export function useSubmitTraderApplication() {
  return useMutation<TraderApplicationResponse, Error, TraderApplicationBody>({
    mutationFn: (body) =>
      apiPost<TraderApplicationResponse, TraderApplicationBody>(
        "/event-trader-apply",
        body,
      ),
  });
}

/** Today is within the category's window (or no window set). */
export function isTraderCategoryOpenToday(c: TraderPublicCategory): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (c.applications_open && today < c.applications_open) return false;
  if (c.applications_close && today > c.applications_close) return false;
  return true;
}

/** "£25 · in person · 3 left" style suffix for the dropdown label. */
export function traderCategoryAvailabilityLabel(
  c: TraderPublicCategory,
): string {
  const bits: string[] = [];
  if (c.ticket_cost > 0) {
    bits.push(`£${c.ticket_cost.toFixed(2)}`);
  }
  if (c.payment_mode === "in_person") {
    bits.push("pay in person");
  }
  if (c.spaces_remaining !== null) {
    bits.push(c.is_full ? "full" : `${c.spaces_remaining} left`);
  }
  return bits.length ? ` · ${bits.join(" · ")}` : "";
}
