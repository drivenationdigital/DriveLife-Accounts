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
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days, matches WP TTL

/**
 * Scope auth cookies to the parent domain so www.carevents.com (the WP site)
 * can see the session too — its mu-plugin bridge turns the token into a native
 * WP login. Empty string on localhost/previews keeps them host-only there.
 */
function cookieDomain(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  return host === "carevents.com" || host.endsWith(".carevents.com")
    ? "; Domain=.carevents.com"
    : "";
}

/** Legacy host-only cookies (pre domain-scoping) must die on write/clear,
 *  or the browser keeps two cookies with the same name. */
function expireHostOnly(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

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
  const domain = cookieDomain();
  if (domain) expireHostOnly(AUTH_COOKIE_NAME);
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    token,
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${domain}`;
}

export function clearTokenClient() {
  if (typeof document === "undefined") return;
  const domain = cookieDomain();
  for (const name of [AUTH_COOKIE_NAME, AUTH_USER_COOKIE_NAME]) {
    expireHostOnly(name);
    if (domain) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domain}`;
    }
  }
}

/** Store a JSON-serialisable user object so we can hydrate UI before /me returns. */
export function writeUserClient(user: unknown, expiresAt?: number) {
  if (typeof document === "undefined") return;
  const maxAge = expiresAt
    ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
    : COOKIE_MAX_AGE_SECONDS;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const domain = cookieDomain();
  if (domain) expireHostOnly(AUTH_USER_COOKIE_NAME);
  const encoded = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${AUTH_USER_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${domain}`;
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
