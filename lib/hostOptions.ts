/**
 * Event host options - the "Hosted by" dropdown source.
 *
 *   GET /host-options → Me + clubs I admin + venues I own
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./apiClient";

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
 * The things the user can host an event as. Always includes "Me" first;
 * the dropdown hides itself when that's the only option.
 */
export function useHostOptions() {
  return useQuery<HostOptionsResponse, Error>({
    queryKey: ["host-options"],
    queryFn: () => apiGet<HostOptionsResponse>("/host-options"),
    staleTime: 5 * 60_000,
  });
}
