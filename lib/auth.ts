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
import { ApiError, apiPost } from "./apiClient";
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

// ============================================================
// Sign-in failures
// ============================================================

/**
 * Whether sign-in may say WHICH half of the credentials was wrong.
 *
 * Telling an anonymous visitor "no account with that email" turns the
 * form into a user-enumeration oracle: someone can walk a list of
 * addresses and learn which are registered here. That is a real
 * trade-off rather than a bug in either direction, so it's a single
 * switch instead of an assumption spread across the mapping below.
 *
 * With it false, a wrong email and a wrong password give the same
 * message, and only the failures that leak nothing (empty field, rate
 * limit, disabled account) stay specific.
 */
export const REVEAL_WHICH_CREDENTIAL_FAILED = true;

/** A sign-in failure, ready to render. `field` names the input to
 *  attach it to, or null for the form-level banner - same shape the
 *  register form already uses. */
export interface LoginFailure {
  field: "email" | "password" | null;
  message: string;
  /** The server's code, or "" when the failure wasn't one (network,
   *  unparseable body). Kept for logging, not for display. */
  code: string;
}

const GENERIC_CREDENTIALS: LoginFailure = {
  field: null,
  code: "invalid_credentials",
  message: "Incorrect username or password",
};

/**
 * Message + field for a sign-in error code.
 *
 * Covers WordPress's own `wp_authenticate` codes (`invalid_username`,
 * `incorrect_password`, and friends), since /next-dash-login passes
 * credentials through it, plus the field-named codes this API uses on
 * its other account routes.
 *
 * Returns null for anything unrecognised so the caller can fall back to
 * the server's own message - WP writes user-facing copy into WP_Error,
 * and showing it beats replacing a specific reason with a vague one.
 */
function knownLoginFailure(code: string): LoginFailure | null {
  switch (code) {
    // ---- Nothing typed. Safe to be specific: an empty field leaks
    // nothing about who has an account.
    case "empty_username":
    case "empty_email":
      return {
        field: "email",
        code,
        message: "Enter your email address or username.",
      };
    case "empty_password":
      return { field: "password", code, message: "Enter your password." };
    case "missing_fields":
      return {
        field: null,
        code,
        message: "Enter your email and password.",
      };

    // ---- No such account. This is the enumeration-sensitive half.
    case "invalid_username":
    case "invalid_email":
    case "invalid_user":
      return REVEAL_WHICH_CREDENTIAL_FAILED
        ? {
            field: "email",
            code,
            message: "We couldn't find an account with those details.",
          }
        : { ...GENERIC_CREDENTIALS, code };

    // ---- Account exists, password wrong. Same sensitivity: confirming
    // this confirms the account exists.
    case "incorrect_password":
      return REVEAL_WHICH_CREDENTIAL_FAILED
        ? {
            field: "password",
            code,
            message: "That password isn't right. Try again or reset it.",
          }
        : { ...GENERIC_CREDENTIALS, code };

    case "invalid_credentials":
    case "authentication_failed":
    case "jwt_auth_failed":
      return { ...GENERIC_CREDENTIALS, code };

    // ---- Account exists and the password is right, but sign-in is
    // refused. Never generic: the user cannot fix these by retyping,
    // and a credentials message would send them round in circles.
    case "account_disabled":
    case "user_disabled":
    case "account_suspended":
      return {
        field: null,
        code,
        message:
          "This account has been disabled. Contact support if you think that's wrong.",
      };
    case "account_pending":
    case "email_not_verified":
      return {
        field: null,
        code,
        message:
          "This account hasn't been verified yet. Check your inbox for the confirmation email.",
      };
    case "too_many_retries":
    case "too_many_attempts":
    case "rate_limited":
      return {
        field: null,
        code,
        message:
          "Too many sign-in attempts. Wait a few minutes and try again.",
      };

    default:
      return null;
  }
}

/**
 * Turn whatever sign-in threw into something worth showing.
 *
 * Order matters: a recognised code wins, then the server's own message,
 * then a status-shaped fallback. The old behaviour - collapsing every
 * ApiError into "Invalid email or password" - told a user whose account
 * was locked, or whose request never left the building, to go and check
 * their typing.
 */
export function loginFailureFrom(err: unknown): LoginFailure {
  if (!(err instanceof ApiError)) {
    return {
      field: null,
      code: "",
      message: "Something went wrong. Please try again.",
    };
  }

  // status 0 is apiClient's marker for "the response never reached JS"
  // - network down, DNS, or CORS. Its message already says so, and it
  // is emphatically not a credentials problem.
  if (err.status === 0) {
    return { field: null, code: "", message: err.message };
  }

  const code = extractErrorCode(err.body);
  const known = code ? knownLoginFailure(code) : null;
  if (known) return known;

  // Unrecognised code: prefer the server's wording over ours - WP puts
  // user-facing copy in WP_Error, and a specific reason beats a vague
  // one. Two things are NOT server wording and must not reach the user:
  // apiClient's own "Request failed with status N" placeholder, which
  // it synthesises when the body carried no message at all, and a raw
  // fatal or HTML error page.
  const isPlaceholder = /^Request failed with status \d+$/.test(err.message);
  if (
    err.message &&
    !isPlaceholder &&
    err.message.length <= 200 &&
    !/[<>{}]/.test(err.message)
  ) {
    return { field: null, code, message: err.message };
  }

  if (err.status === 429) {
    return {
      field: null,
      code,
      message: "Too many sign-in attempts. Wait a few minutes and try again.",
    };
  }
  if (err.status >= 500) {
    return {
      field: null,
      code,
      message: "Sign-in is temporarily unavailable. Please try again shortly.",
    };
  }
  return { ...GENERIC_CREDENTIALS, code };
}

/** Pull `code` out of a WP_Error body. Also checks `data.code`, which
 *  is where some older handlers on this API put it. */
function extractErrorCode(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const b = body as { code?: unknown; data?: { code?: unknown } };
  if (typeof b.code === "string" && b.code) return b.code;
  if (typeof b.data?.code === "string" && b.data.code) return b.data.code;
  return "";
}
