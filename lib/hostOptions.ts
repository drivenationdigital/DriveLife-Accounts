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

export type HostType = "me" | "club" | "venue";

export interface HostOption {
  type: HostType;
  /** null for "me"; the club/venue id otherwise. */
  id: number | null;
  name: string;
  role: string;
}

interface HostOptionsResponse {
  success: true;
  options: HostOption[];
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
