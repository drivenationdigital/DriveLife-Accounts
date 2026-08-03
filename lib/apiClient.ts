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
      console.error("[apiClient] fetch failed for", url, err);
    }
    throw new ApiError(
      "Couldn't reach the server. This usually means a network problem or a CORS-blocked response - check the browser console and Network tab for details.",
      0,
      null,
    );
  }
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
// Public API
// ============================================================

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  opts: { skipAuthRedirect?: boolean } = {},
): Promise<TResponse> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await safeFetch(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body ?? {}),
  });

  const parsed = await safeParseJson(res);

  if (res.status === 401 && !opts.skipAuthRedirect) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(parsed, res.status),
      res.status,
      parsed,
    );
  }

  return parsed as TResponse;
}

export async function apiGet<TResponse>(
  path: string,
  opts: { skipAuthRedirect?: boolean } = {},
): Promise<TResponse> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await safeFetch(url, { method: "GET", headers: buildHeaders() });

  const parsed = await safeParseJson(res);

  if (res.status === 401 && !opts.skipAuthRedirect) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(parsed, res.status),
      res.status,
      parsed,
    );
  }

  return parsed as TResponse;
}

/**
 * DELETE request. Same auth + error handling as apiGet/apiPost; no
 * body (DELETE bodies are technically allowed but inconsistently
 * supported across servers/proxies, so all our DELETE endpoints
 * expect their parameters in the URL).
 */
export async function apiDelete<TResponse>(
  path: string,
  opts: { skipAuthRedirect?: boolean } = {},
): Promise<TResponse> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await safeFetch(url, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  const parsed = await safeParseJson(res);

  if (res.status === 401 && !opts.skipAuthRedirect) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(parsed, res.status),
      res.status,
      parsed,
    );
  }

  return parsed as TResponse;
}
