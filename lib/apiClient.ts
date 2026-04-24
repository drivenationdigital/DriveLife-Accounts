import { readTokenClient, clearTokenClient } from "./authCookies";

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
    public body: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * When a request comes back 401, the token is stale/invalid — clear it and
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

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  opts: { skipAuthRedirect?: boolean } = {}
): Promise<TResponse> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body ?? {}),
  });

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // Non-JSON response — leave parsed as null.
  }

  if (res.status === 401 && !opts.skipAuthRedirect) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    const message =
      (parsed as { message?: string } | null)?.message ??
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as TResponse;
}

export async function apiGet<TResponse>(
  path: string,
  opts: { skipAuthRedirect?: boolean } = {}
): Promise<TResponse> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { method: "GET", headers: buildHeaders() });

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {}

  if (res.status === 401 && !opts.skipAuthRedirect) {
    unauthorizedHandler();
  }

  if (!res.ok) {
    const message =
      (parsed as { message?: string } | null)?.message ??
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as TResponse;
}
