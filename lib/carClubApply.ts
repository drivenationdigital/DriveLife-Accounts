/**
 * Public car club application - types + hooks.
 *
 * Backs /apply/car-club/[eventEid]. Mirrors lib/showCarApply.ts but
 * for clubs: a single application track per event (no per-category
 * dropdown), a club-shaped payload, and a capacity summary instead
 * of per-category availability.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import type { EventSite } from "./apiTypes";

export interface CarClubPublicResponse {
  event_id: number;
  event_title: string;
  /** The blog this event lives on, and therefore the currency and date
   *  order the page should use. Optional because the public endpoints
   *  don't echo one yet - until they do, `regionFromSite(undefined)`
   *  resolves to the API's own default region, which is what the page
   *  showed before. Nothing here needs changing when it lands. */
  site?: EventSite;
  event_location?: string;
  event_info?: string;
  car_clubs_enabled: boolean;
  require_ticket?: boolean;
  ticket_cost?: number | null;
  applications_open?: string;  // "YYYY-MM-DD" or ""
  applications_close?: string; // same
  max?: number | null;
  confirmed?: number;
  remaining?: number | null;
  is_full?: boolean;
}

export interface CarClubApplicationBody {
  eventEid: string;
  clubName: string;
  clubWebsite: string;
  clubInstagram: string;
  clubTiktok: string;
  contactName: string;
  email: string;
  contactPhone: string;
  memberCount: string; // kept as string in the form; server coerces to int
  notes: string;
}

export interface CarClubApplicationResponse {
  success: true;
  application_id: number;
}

/**
 * Fetch event title + club capacity. `enabled` is gated by !!eventEid
 * so the query stays idle until the route param resolves.
 */
export function useCarClubPublic(eventEid: string) {
  return useQuery<CarClubPublicResponse, Error>({
    queryKey: ["car-clubs-public", eventEid],
    queryFn: () =>
      apiGet<CarClubPublicResponse>(
        `/event-car-clubs-public?eid=${encodeURIComponent(eventEid)}`,
      ),
    enabled: !!eventEid,
    staleTime: 30_000,
  });
}

/**
 * Submit the club application. On success the caller swaps to a
 * "thanks" panel; on error it surfaces `error.message` inline.
 */
export function useSubmitCarClubApplication() {
  return useMutation<CarClubApplicationResponse, Error, CarClubApplicationBody>({
    mutationFn: (body) =>
      apiPost<CarClubApplicationResponse, CarClubApplicationBody>(
        "/event-car-club-apply",
        body,
      ),
  });
}

/**
 * True when today is within the open/close window (or no window is
 * set). The server validates this on submit too - this just lets the
 * page show a "closed" notice instead of letting the user fill the
 * whole form first.
 */
export function isCarClubOpenToday(data: CarClubPublicResponse): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (data.applications_open && today < data.applications_open) return false;
  if (data.applications_close && today > data.applications_close) return false;
  return true;
}
