/**
 * Signed-out account routes: register, and the forgot-password request.
 *
 *   POST /next-dash-register         create an account, signed straight in
 *   POST /next-dash-forgot-password  request a reset link
 *
 * Sign-in itself lives in AuthContext, since it also has to write the
 * token cookie and seed the user into context.
 *
 * Neither takes a `site` param: WordPress keeps users in one global
 * table, so accounts are network-wide. (Capabilities are per-blog, but
 * registration joins the user to every region server-side.)
 *
 * ── The 200-with-success:false convention ──────────────────────────
 *
 * These routes answer HTTP 200 with `{ success: false, code, message }`
 * for expected failures - a taken email, a short password - rather than
 * a 4xx WP_Error. A rejected signup is a normal outcome of a signup
 * form, not a broken request.
 *
 * That means `apiPost` resolves rather than throwing, so **checking for
 * a thrown ApiError is not enough**: callers have to branch on
 * `success` too, or a rejected registration reads as a successful one.
 * The discriminated unions below make that a type error rather than a
 * silent bug.
 *
 * Only these routes use the convention; the rest of the API still
 * returns WP_Error, so existing dashboard error handling is unaffected.
 */

import { useMutation } from "@tanstack/react-query";
import { apiPost } from "./apiClient";
import type { AuthUser } from "./apiTypes";

/** Mirrors DL_ACCOUNTS_MIN_PASSWORD server-side. */
export const MIN_PASSWORD_LENGTH = 8;

/** Failure envelope shared by the signed-out routes. */
export interface AccountErrorResponse {
  success: false;
  /** Machine-readable reason - see RegisterErrorCode. */
  code: string;
  /** Ready to display; the server writes the user-facing wording. */
  message: string;
}

/**
 * Codes /next-dash-register can return. Each names the field at fault
 * so the form can attach the message to the right input instead of
 * showing one banner for everything.
 */
export type RegisterErrorCode =
  | "missing_fields"
  | "invalid_email"
  | "email_exists"
  | "weak_password"
  | "registration_failed";

export interface RegisterParams {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface RegisterSuccess {
  success: true;
  /** Same envelope as /next-dash-login, so the client can seed the
   *  session without a second sign-in round trip. */
  token: string;
  expires_at: number;
  user: AuthUser;
  /** False today - no email confirmation step. Kept in the contract so
   *  adding one later doesn't change the response shape. */
  requires_verification: boolean;
  /** blog id → site key for the regions the account was joined to.
   *  Diagnostic; the UI doesn't branch on it. */
  sites?: Record<string, string>;
}

export type RegisterResponse = RegisterSuccess | AccountErrorResponse;

/**
 * Create an account.
 *
 * `skipAuthRedirect` because a failure here must surface on the form -
 * without it the client's 401 handler could bounce a signed-out user to
 * /login mid-signup.
 */
export function useRegister() {
  return useMutation<RegisterResponse, Error, RegisterParams>({
    mutationFn: (body) =>
      apiPost<RegisterResponse, RegisterParams>(
        "/next-dash-register",
        body,
        { skipAuthRedirect: true },
      ),
  });
}

export interface ForgotPasswordParams {
  email: string;
}

/**
 * Always `success: true`, whether or not the address is registered -
 * the endpoint deliberately doesn't reveal which emails have accounts,
 * so there is no failure branch to handle.
 */
export interface ForgotPasswordResponse {
  success: true;
  message?: string;
}

export function useRequestPasswordReset() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordParams>({
    mutationFn: (body) =>
      apiPost<ForgotPasswordResponse, ForgotPasswordParams>(
        "/next-dash-forgot-password",
        body,
        { skipAuthRedirect: true },
      ),
  });
}

/**
 * Which input a register failure belongs to, or null for a
 * form-level message.
 *
 * Unknown codes fall through to the banner rather than being dropped -
 * a new server-side code should still show its message somewhere.
 */
export function registerErrorField(
  code: string,
): "email" | "password" | null {
  switch (code) {
    case "invalid_email":
    case "email_exists":
      return "email";
    case "weak_password":
      return "password";
    default:
      return null;
  }
}
