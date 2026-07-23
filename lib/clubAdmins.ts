/**
 * Club administrators — invitations.
 *
 *   POST /wp-json/app/v1/club/{encryptedClubId}/invite-admin
 *
 * Wraps the existing invite endpoint. Note this INVITES rather than
 * adds: it creates an invitation post, notifies the user, and emails
 * them an accept link. They only become a club administrator once they
 * accept, so the UI should show "invited", not "added".
 *
 * Two constraints from the endpoint:
 *   - Owner-only. Club admins can't invite further admins (403).
 *   - It lives on app/v1, which authenticates with the app's token
 *     (ce_verify_user_token), not the dl-accounts dashboard JWT. We
 *     send the dashboard token under both header names so it works
 *     once the server accepts it as a fallback. See notes below.
 */

import { useMutation } from "@tanstack/react-query";
import { readTokenClient } from "./authCookies";

const DL_ACCOUNTS_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://www.carevents.com/uk/wp-json/dl-accounts/v1";
const WP_JSON_ROOT = DL_ACCOUNTS_BASE.replace(/\/dl-accounts\/v1\/?$/, "");
const APP_V1 = `${WP_JSON_ROOT}/app/v1`;

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = readTokenClient();
  if (token) {
    // app/v1 verifies a Bearer token; dl-accounts uses X-WP-Token.
    // Send both so whichever verifier runs finds it.
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-WP-Token"] = token;
  }
  return headers;
}

export interface InviteAdminVars {
  /** Encrypted club id (the one in the edit route). */
  clubId: string;
  email: string;
}

export interface InviteAdminResponse {
  success: boolean;
  message: string;
  data?: {
    invitation_id: string;
    email: string;
    status: "invited";
  };
}

export function useInviteClubAdmin() {
  return useMutation<InviteAdminResponse, Error, InviteAdminVars>({
    mutationFn: async ({ clubId, email }) => {
      const res = await fetch(
        `${APP_V1}/club/${encodeURIComponent(clubId)}/invite-admin`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ email }),
        },
      );

      // The endpoint returns structured errors with useful messages
      // (no user with that email, not the owner, invalid club) — surface
      // them rather than a bare status code.
      let payload: InviteAdminResponse | null = null;
      try {
        payload = (await res.json()) as InviteAdminResponse;
      } catch {
        payload = null;
      }

      if (!res.ok || !payload?.success) {
        throw new Error(
          payload?.message ?? `Couldn't send the invitation (${res.status}).`,
        );
      }
      return payload;
    },
  });
}
