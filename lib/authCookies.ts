/**
 * Cookie helpers for the admin dashboard auth token.
 *
 * The token lives in a regular (JS-readable) cookie so:
 *   - Next.js middleware can read it server-side to gate routes
 *   - The client can attach it to `X-WP-Token` on every API call
 *
 * Not HTTP-only by design - we need client JS access. Keep an eye on XSS.
 */

export const AUTH_COOKIE_NAME = "next_dash_token";
export const AUTH_USER_COOKIE_NAME = "next_dash_user";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days, matches WP TTL

// ─── Client-side (browser) ────────────────────────────────────────────

export function readTokenClient(): string | null {
  if (typeof document === "undefined") return null;
  return readCookie(document.cookie, AUTH_COOKIE_NAME);
}

export function writeTokenClient(token: string, expiresAt?: number) {
  if (typeof document === "undefined") return;
  const maxAge = expiresAt
    ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
    : COOKIE_MAX_AGE_SECONDS;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearTokenClient() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${AUTH_USER_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Store a JSON-serialisable user object so we can hydrate UI before /me returns. */
export function writeUserClient(user: unknown, expiresAt?: number) {
  if (typeof document === "undefined") return;
  const maxAge = expiresAt
    ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
    : COOKIE_MAX_AGE_SECONDS;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encoded = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${AUTH_USER_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function readUserClient<T = unknown>(): T | null {
  if (typeof document === "undefined") return null;
  const raw = readCookie(document.cookie, AUTH_USER_COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return null;
  }
}

// ─── Utility ───────────────────────────────────────────────────────────

function readCookie(cookieString: string, name: string): string | null {
  const prefix = `${name}=`;
  for (const part of cookieString.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}
