import { readTokenClient, clearTokenClient } from "./authCookies";
import { decodeEntitiesDeep } from "./decodeEntities";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://www.carevents.com/uk/wp-json/dl-accounts/v1";

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = readTokenClient();
  if (token) headers["X-WP-Token"] = token;
  return headers;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * When a request comes back 401, the token is stale/invalid - clear it and
 * bounce to /login. Exposed as a callable so the auth context can override
 * it (e.g. to prevent redirects during the login POST itself).
 */
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler = () => {
  clearTokenClient();
  if (typeof window !== "undefined") {
    const here = window.location.pathname + window.location.search;
    const returnTo =
      here && here !== "/login" ? `?returnTo=${encodeURIComponent(here)}` : "";
    window.location.href = `/login${returnTo}`;
  }
};

export function setUnauthorizedHandler(fn: UnauthorizedHandler) {
  unauthorizedHandler = fn;
}

// ============================================================
// Internals
// ============================================================

/**
 * Wraps `fetch` and translates its raw TypeError("Failed to fetch") into
 * an ApiError with status 0 and a message that actually says what went
 * wrong. fetch() throws TypeError when the response never reaches JS -
 * the typical causes are network failure, DNS, mixed content, or (most
 * commonly here) a CORS-blocked response that the browser refused to
 * expose. In all those cases the server's body, if it sent one, is
 * unreachable, so we surface the layer at fault rather than letting the
 * cryptic browser message leak through.
 *
 * The original error is logged to console so debugging in DevTools still
 * shows the real fetch failure with full stack.
 */
async function safeFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (typeof console !== "undefined") {
      console.error(
        "[apiClient] fetch failed for",
        url,
        err,
        "- usually a network problem or a CORS-blocked response; see the Network tab.",
      );
    }
    throw new ApiError(
      "Couldn't reach the server. Please check your internet connection and try again.",
      0,
      null,
    );
  }
}

// ============================================================
// Response envelope
// ============================================================

/**
 * Every request opts into WP REST's `_envelope` mode: the response
 * leaves the server as HTTP 200 with the real status inside the JSON
 * body ({ body, status, headers }).
 *
 * This is not cosmetic. The hosting proxy in front of WordPress strips
 * `Access-Control-Allow-Origin` from non-2xx responses, so every REST
 * error (a wrong-password 401, an expired-token 401, a 404) was
 * CORS-blocked in the browser and surfaced as a fake "network error" -
 * and the 401 auto-logout could never fire. Enveloped responses are
 * always 200 on the wire, so they keep their CORS headers and the real
 * status is read from the body instead.
 */
function withEnvelope(url: string): string {
  return url.includes("?") ? `${url}&_envelope=1` : `${url}?_envelope=1`;
}

/**
 * The effective { payload, status } of a response, whether or not the
 * server enveloped it. Falls back to the raw response status so a
 * non-enveloped reply (e.g. an error emitted before the REST server
 * dispatched) still behaves like before.
 */
function unwrapEnvelope(
  parsed: unknown,
  res: Response,
): { payload: unknown; status: number } {
  if (
    parsed &&
    typeof parsed === "object" &&
    "body" in parsed &&
    "status" in parsed &&
    typeof (parsed as { status: unknown }).status === "number"
  ) {
    const env = parsed as { body: unknown; status: number };
    return { payload: env.body, status: env.status };
  }
  return { payload: parsed, status: res.status };
}

/** Try to read JSON. Non-JSON responses (e.g. a PHP fatal that emitted
 *  HTML before the body) leave parsed as null and the caller falls back
 *  to a status-based message. */
async function safeParseJson(res: Response): Promise<unknown> {
  try {
    // WP escapes free text (titles, names, descriptions) on the way
    // out, so "Mark's Event" arrives as "Mark&#8217;s Event". Decode
    // once here rather than in every mapper and component.
    return decodeEntitiesDeep(await res.json());
  } catch {
    return null;
  }
}

/**
 * Pull the most useful error message out of a WP REST response body.
 * WP_Error from a route callback comes back as:
 *   { code, message, data: { status } }
 * Some legacy handlers nest the message under `data.message` instead,
 * and a bare `error` string also turns up in older endpoints - we
 * check all three before falling back to a status-only message.
 */
function extractErrorMessage(parsed: unknown, status: number): string {
  if (parsed && typeof parsed === "object") {
    const p = parsed as {
      message?: unknown;
      error?: unknown;
      data?: { message?: unknown };
    };
    if (typeof p.message === "string" && p.message.trim()) return p.message;
    if (typeof p.data?.message === "string" && p.data.message.trim()) {
      return p.data.message;
    }
    if (typeof p.error === "string" && p.error.trim()) return p.error;
  }
  return `Request failed with status ${status}`;
}

// ============================================================
// Region (`site`)
// ============================================================

/**
 * The multisite blog a request addresses. Validated server-side -
 * anything other than these two is a 400, so a typo surfaces at once
 * rather than silently resolving to UK.
 */
export type ApiSite = "uk" | "us";

/**
 * Routes where `site` is part of the record's IDENTITY, not a filter.
 *
 * Each of these takes an eid / cid / vid, and post ids are only unique
 * within a site. With `site` absent the API defaults to UK: a request
 * for a US event decodes the eid to post 4821 and looks it up on blog
 * 3. Usually that 404s - but if the organiser also owns a UK record
 * with the same post id, the API returns (or writes) THAT one, with no
 * error at any layer.
 *
 * This has already caused a live data bug: an image uploaded to a US
 * event was written to the DB tagged as UK, because the confirm step of
 * the three-call upload flow didn't send `site` while the mint step
 * did. Nothing errored, and nothing could have.
 *
 * That's why the rule lives here rather than at each call site - a
 * per-call convention is exactly what failed. Deliberately NOT
 * including the list-style routes (`/organiser-events`, `/my-clubs`,
 * `/my-venues`): there `site` narrows the results, and omitting it to
 * merge both regions is the account view's correct default.
 */
export const SITE_REQUIRED_ROUTES: ReadonlySet<string> = new Set([
  "/event",
  "/event/show-cars",
  "/event/car-clubs",
  "/event-edit",
  "/event-update",
  "/event-ticket",
  "/event-ticket-reorder",
  "/events",
  "/event-categories",
  "/event-image-upload-url",
  "/event-image-confirm",
  "/event-image",
  "/event-clone",
  "/event-cancel",
  "/event-delete",
  "/pin-event",
  "/club-create",
  "/club-edit",
  "/club-update",
  "/club-delete",
  "/venue-create",
  "/venue-edit",
  "/venue-update",
  "/venue-delete",
]);

export interface RequestOptions {
  skipAuthRedirect?: boolean;
  /**
   * Region this request addresses. Required on SITE_REQUIRED_ROUTES;
   * accepted (and forwarded) on any route that takes it as a filter.
   */
  site?: string;
}

/** Path without its query string, normalised to a leading slash. */
function routeKey(path: string): string {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.split("?")[0]!;
}

/**
 * Guard for the bug class above.
 *
 * This throws rather than warning, in every environment. A thrown error
 * is a visibly broken feature; the alternative is a request that
 * succeeds against the wrong region's record, which is silent data
 * corruption nobody finds until much later. The backend cannot flag
 * this for us - an omitted `site` is a valid request - so the client is
 * the only place it can be caught.
 */
function assertSite(path: string, site: string | undefined): void {
  const route = routeKey(path);
  if (site !== undefined && site !== "uk" && site !== "us") {
    throw new ApiError(
      `[apiClient] "${route}" got site="${site}"; expected "uk" or "us".`,
      0,
      null,
    );
  }
  if (SITE_REQUIRED_ROUTES.has(route) && !site) {
    console.log(route);
    
    throw new ApiError(
      `[apiClient] "${route}" requires a site ("uk" | "us"). ` +
        `Without it the API resolves the id against the UK blog and may ` +
        `read or write a different region's record without erroring.`,
      0,
      null,
    );
  }
}

/** Append `site` to a URL's query string, for GET and DELETE. */
function withSiteParam(path: string, site: string | undefined): string {
  if (!site) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}site=${encodeURIComponent(site)}`;
}

// ============================================================
// Public API
// ============================================================

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  opts: RequestOptions = {},
): Promise<TResponse> {
  assertSite(path, opts.site);
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await safeFetch(withEnvelope(url), {
    method: "POST",
    headers: buildHeaders(),
    // `site` rides in the body for POST/PUT. Merged here rather than by
    // the caller so no call site can forget it.
    body: JSON.stringify(
      opts.site ? { ...(body ?? {}), site: opts.site } : (body ?? {}),
    ),
  });

  const parsed = await safeParseJson(res);
  const { payload, status } = unwrapEnvelope(parsed, res);

  if (status === 401 && !opts.skipAuthRedirect) {
    unauthorizedHandler();
  }

  if (status < 200 || status >= 300) {
    throw new ApiError(extractErrorMessage(payload, status), status, payload);
  }

  return payload as TResponse;
}

export async function apiGet<TResponse>(
  path: string,
  opts: RequestOptions = {},
): Promise<TResponse> {
  assertSite(path, opts.site);
  // GET has no body, so `site` goes in the query string.
  const withSite = withSiteParam(path, opts.site);
  const url = `${API_BASE}${withSite.startsWith("/") ? withSite : `/${withSite}`}`;
  const res = await safeFetch(withEnvelope(url), {
    method: "GET",
    headers: buildHeaders(),
  });

  const parsed = await safeParseJson(res);
  const { payload, status } = unwrapEnvelope(parsed, res);

  if (status === 401 && !opts.skipAuthRedirect) {
    unauthorizedHandler();
  }

  if (status < 200 || status >= 300) {
    throw new ApiError(extractErrorMessage(payload, status), status, payload);
  }

  return payload as TResponse;
}

/**
 * DELETE request. Same auth + error handling as apiGet/apiPost; no
 * body (DELETE bodies are technically allowed but inconsistently
 * supported across servers/proxies, so all our DELETE endpoints
 * expect their parameters in the URL).
 */
export async function apiDelete<TResponse>(
  path: string,
  opts: RequestOptions = {},
): Promise<TResponse> {
  assertSite(path, opts.site);
  // Our DELETE routes take everything in the URL - see the note above.
  const withSite = withSiteParam(path, opts.site);
  const url = `${API_BASE}${withSite.startsWith("/") ? withSite : `/${withSite}`}`;
  const res = await safeFetch(withEnvelope(url), {
    method: "DELETE",
    headers: buildHeaders(),
  });

  const parsed = await safeParseJson(res);
  const { payload, status } = unwrapEnvelope(parsed, res);

  if (status === 401 && !opts.skipAuthRedirect) {
    unauthorizedHandler();
  }

  if (status < 200 || status >= 300) {
    throw new ApiError(extractErrorMessage(payload, status), status, payload);
  }

  return payload as TResponse;
}
