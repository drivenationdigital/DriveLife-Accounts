"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";

/**
 * Email marketing settings - the organiser's Brevo or Mailchimp link and
 * the list new checkout contacts are added to.
 *
 *   GET  /marketing-settings              → settings (no key, just a hint)
 *   POST /marketing-settings/connect      → verify an API key and store it
 *   POST /marketing-settings/lists        → the lists on the connected account
 *   POST /marketing-settings/save         → choose the list
 *   POST /marketing-settings/disconnect   → forget everything
 *
 * The API key is write-only across this boundary: the read endpoint
 * returns connectedness plus the last four characters, never the value.
 * Buyers who tick "Keep me updated about future events from this event
 * organiser" at checkout land on the chosen list (see
 * cc_marketing_after_order in the WordPress theme).
 */

export type MarketingProvider = "brevo" | "mailchimp";

export const MARKETING_PROVIDER_LABELS: Record<MarketingProvider, string> = {
  brevo: "Brevo",
  mailchimp: "Mailchimp",
};

export interface MarketingSettings {
  provider: MarketingProvider | null;
  provider_label: string;
  connected: boolean;
  account_name: string;
  /** "...abcd" - the last four characters of the stored key, or "". */
  api_key_hint: string;
  /** Chosen list/audience id, "" when none has been picked yet. */
  list_id: string;
  list_name: string;
  connected_at: string;
}

export interface MarketingList {
  id: string;
  name: string;
  /** Subscriber / member count, for the dropdown label. */
  contacts: number;
}

export interface MarketingSettingsResponse {
  status: "success";
  settings: MarketingSettings;
}

export interface MarketingConnectResponse extends MarketingSettingsResponse {
  lists: MarketingList[];
  /** Set when the key verified but the list fetch failed. */
  lists_error: string | null;
}

export interface MarketingListsResponse {
  status: "success";
  lists: MarketingList[];
}

const QUERY_KEY = ["marketing-settings"] as const;

export function useMarketingSettings() {
  return useQuery<MarketingSettingsResponse, Error>({
    queryKey: QUERY_KEY,
    queryFn: () => apiGet<MarketingSettingsResponse>("/marketing-settings"),
    staleTime: 30_000,
  });
}

/**
 * Verify and store an API key. The server checks it against the
 * provider before storing, so a rejected promise carries the provider's
 * own reason - show its message rather than a generic failure.
 */
export function useConnectMarketing() {
  const qc = useQueryClient();
  return useMutation<
    MarketingConnectResponse,
    Error,
    { provider: MarketingProvider; api_key: string }
  >({
    mutationFn: (body) =>
      apiPost<MarketingConnectResponse, typeof body>(
        "/marketing-settings/connect",
        body,
      ),
    onSuccess: (data) => {
      qc.setQueryData<MarketingSettingsResponse>(QUERY_KEY, {
        status: "success",
        settings: data.settings,
      });
    },
  });
}

/** Fetch the lists on the connected account. A mutation rather than a
 *  query so the card decides when to hit the provider's API. */
export function useMarketingLists() {
  return useMutation<MarketingListsResponse, Error, void>({
    mutationFn: () =>
      apiPost<MarketingListsResponse, Record<string, never>>(
        "/marketing-settings/lists",
        {},
      ),
  });
}

export function useSaveMarketingList() {
  const qc = useQueryClient();
  return useMutation<
    MarketingSettingsResponse,
    Error,
    { list_id: string; list_name: string }
  >({
    mutationFn: (body) =>
      apiPost<MarketingSettingsResponse, typeof body>(
        "/marketing-settings/save",
        body,
      ),
    onSuccess: (data) => {
      qc.setQueryData<MarketingSettingsResponse>(QUERY_KEY, data);
    },
  });
}

export function useDisconnectMarketing() {
  const qc = useQueryClient();
  return useMutation<MarketingSettingsResponse, Error, void>({
    mutationFn: () =>
      apiPost<MarketingSettingsResponse, Record<string, never>>(
        "/marketing-settings/disconnect",
        {},
      ),
    onSuccess: (data) => {
      qc.setQueryData<MarketingSettingsResponse>(QUERY_KEY, data);
    },
  });
}
