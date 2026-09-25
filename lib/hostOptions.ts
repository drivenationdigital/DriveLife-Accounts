/**
 * Event host options - the "Hosted by" dropdown source.
 *
 *   GET /host-options → Me + clubs I admin + venues I own
 *
 * Clubs and venues are per-blog, so the answer differs by region: a
 * club the user admins in the UK doesn't exist on the US site, and its
 * id there is either nothing or an unrelated post. The region is
 * therefore part of the request and part of the cache key.
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./apiClient";
import type { SiteKey } from "./apiTypes";
import { isRegionKey, type RegionKey } from "./regions";

export type HostType = "me" | "club" | "venue";

export interface HostOption {
  type: HostType;
  /** null for "me"; the club/venue id otherwise. */
  id: number | null;
  name: string;
  role: string;
  /** The region the club/venue lives on. Only present on the
   *  all-regions response; null for "me". */
  site?: string | null;
}

interface HostOptionsResponse {
  success: true;
  options: HostOption[];
  /** All-regions response only: where a new event should start for
   *  this user - the region holding most of their clubs and venues,
   *  else their latest event's, else the one they signed up on. null
   *  when the API has nothing to go on. */
  suggested_site?: string | null;
}

/**
 * The things the user can host an event as, on a given region. Always
 * includes "Me" first; the dropdown hides itself when that's the only
 * option.
 *
 * `site` is in the cache key, so switching country on the create screen
 * refetches rather than showing the previous region's clubs.
 */
export function useHostOptions(site: SiteKey) {
  return useQuery<HostOptionsResponse, Error>({
    queryKey: ["host-options", { site }],
    queryFn: () => apiGet<HostOptionsResponse>("/host-options", { site }),
    enabled: Boolean(site),
    staleTime: 5 * 60_000,
  });
}

/**
 * Clubs and venues on EVERY region, each tagged with its `site`, plus
 * the region to start a new event on. The create screen uses this so a
 * US organiser sees their US venue without first knowing to switch the
 * country picker - picking the venue switches it for them.
 *
 * Always refetched on mount: a venue created moments earlier in the
 * same session must show up here.
 */
export function useAllHostOptions() {
  return useQuery<HostOptionsResponse, Error>({
    queryKey: ["host-options", { scope: "all" }],
    queryFn: () => apiGet<HostOptionsResponse>("/host-options?scope=all"),
    staleTime: 0,
  });
}

/** The API's suggested starting region, or null until it answers. */
export function useSuggestedSite(): RegionKey | null {
  const { data } = useAllHostOptions();
  const key = data?.suggested_site;
  return isRegionKey(key) ? key : null;
}
