/**
 * My Account - API.
 *
 *   GET  /account          → full editable profile
 *   POST /account-update   → save name / town / email / notifications
 *   POST /change-password  → change password (needs current password)
 *
 * The account query is separate from AuthUser/(me): auth stays lean,
 * this carries the richer profile the account page edits.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";

export interface NotificationPrefs {
  events_email: boolean;
  events_push: boolean;
  news_email: boolean;
  news_push: boolean;
}

export interface AccountData {
  id: number;
  username: string;
  profile_image: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nearest_town: string;
  notifications: NotificationPrefs;
}

interface AccountResponse {
  success: true;
  account: AccountData;
}

/** Body for /account-update - all fields optional (partial-safe). */
export interface AccountUpdateBody {
  first_name?: string;
  last_name?: string;
  email?: string;
  /** Must be true for an email change to be written. */
  email_changed?: boolean;
  nearest_town?: string;
  phone?: string;
  notifications?: Partial<NotificationPrefs>;
}

export interface ChangePasswordBody {
  current_password: string;
  new_password: string;
}

/** Load the current user's editable profile. */
export function useAccount() {
  return useQuery<AccountResponse, Error>({
    queryKey: ["account"],
    queryFn: () => apiGet<AccountResponse>("/account"),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** Save profile changes. Returns the fresh profile; updates the cache. */
export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation<AccountResponse, Error, AccountUpdateBody>({
    mutationFn: (body) =>
      apiPost<AccountResponse, AccountUpdateBody>("/account-update", body),
    onSuccess: (data) => {
      qc.setQueryData(["account"], data);
      // display_name may have changed → refresh auth-derived UI.
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export interface ChangePasswordResponse {
  success: true;
  message: string;
}

/** Change password (server verifies the current one). */
export function useChangePassword() {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordBody>({
    mutationFn: (body) =>
      apiPost<ChangePasswordResponse, ChangePasswordBody>(
        "/change-password",
        body,
      ),
  });
}
