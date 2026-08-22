import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";

/**
 * Routes that should render without a valid token. Everything else redirects
 * to /login. Keep this list tight - this is an admin dashboard, public
 * surface should be minimal.
 */
const PUBLIC_PATHS = [
  "/login",
  // The two other signed-out entry points. Both are reached from the
  // sign-in page by someone who by definition has no token, so gating
  // them would bounce straight back to /login and make them unreachable.
  "/register",
  "/forgot-password",
  // Embeddable forms are anonymous and framed by third-party sites. The auth
  // cookie is SameSite=Lax so it never arrives in a cross-site iframe anyway -
  // gating these would 302 to /login, which sends frame-ancestors 'none'.
  "/embed",
  // Public application forms, linked directly from event pages and
  // organiser-shared URLs - applicants have no account.
  "/apply",
  // Public ticket checkout - buyers are anonymous.
  "/get-tickets",
];

/** Signed-out pages that make no sense once you have a token - all of
 *  them bounce an authenticated user to the dashboard. */
const SIGNED_OUT_ONLY = ["/login", "/register", "/forgot-password"];

/**
 * checkout.carevents.com is a vanity alias for the ticket checkout,
 * served by THIS app (the domain is pointed at the same application) -
 * see resolveHost() + the block in middleware(). On that host,
 * checkout.carevents.com/<eventEid> rewrites internally to
 * /get-tickets/<eventEid>, so buyers get a clean payments-branded URL.
 *
 * Matched by prefix so a staging checkout subdomain behaves the same.
 */
const CHECKOUT_HOST_PREFIX = "checkout.";

/**
 * apply.carevents.com is the same idea for the public application
 * forms: apply.carevents.com/<kind>/<eventEid> rewrites internally to
 * /apply/<kind>/<eventEid>. Only the three real form kinds are
 * rewritten - anything else on that host belongs to the account app.
 */
const APPLY_HOST_PREFIX = "apply.";
const APPLY_KINDS = new Set(["show-car", "car-club", "trader"]);

/** Where non-checkout paths on the checkout host are sent - they
 *  belong to the account app's own domain. */
const ACCOUNT_ORIGIN = "https://account.carevents.com";

/** Where a bare visit to the checkout domain lands: there is no event
 *  to show, so hand over to the main site rather than a 404. */
const MAIN_SITE = "https://www.carevents.com";

/**
 * Top-level segments that are real routes in this app. On the checkout
 * host these are NOT event ids and must not be rewritten under
 * /get-tickets - they redirect to the account domain instead.
 */
const RESERVED_SEGMENTS = new Set([
  "login",
  "register",
  "forgot-password",
  "events",
  "clubs",
  "venues",
  "club",
  "venue",
  "create",
  "account",
  "settings",
  "my-tickets",
  "notifications",
  "saved-events",
  "gallery-upload",
  "orders",
  "apply",
  "embed",
  "get-tickets",
]);

/**
 * The externally-visible host. Apache fronts this app via a
 * mod_rewrite [P] proxy, which (without ProxyPreserveHost) replaces
 * Host with localhost:<port> and records the original hostname in
 * X-Forwarded-Host - so that header wins when present.
 */
function resolveHost(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  // X-Forwarded-Host can be a comma-joined chain; the first entry is
  // the client-facing one.
  return (raw.split(",")[0] ?? "").trim().toLowerCase();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next internals and static files through untouched.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const host = resolveHost(request);

  // ── apply.carevents.com: vanity host for the application forms ───
  if (host.startsWith(APPLY_HOST_PREFIX)) {
    // No form named → nothing to show; hand over to the main site.
    if (pathname === "/") {
      return NextResponse.redirect(`${MAIN_SITE}/`);
    }

    // Already-prefixed paths work on this host too.
    if (pathname === "/apply" || pathname.startsWith("/apply/")) {
      return NextResponse.next();
    }

    // /<kind>/<eventEid> → /apply/<kind>/<eventEid>. Query params
    // (?theme=dark) ride along on the cloned URL.
    const form = pathname.match(/^\/([^/]+)\/([^/]+)\/?$/);
    if (form && APPLY_KINDS.has(form[1].toLowerCase())) {
      const url = request.nextUrl.clone();
      url.pathname = `/apply/${form[1].toLowerCase()}/${form[2]}`;
      return NextResponse.rewrite(url);
    }

    // Everything else is account-app territory.
    return NextResponse.redirect(
      `${ACCOUNT_ORIGIN}${pathname}${request.nextUrl.search}`,
    );
  }

  // ── checkout.carevents.com: vanity host for the ticket checkout ──
  if (host.startsWith(CHECKOUT_HOST_PREFIX)) {
    // No event in the URL → nothing to sell; hand over to the site.
    if (pathname === "/") {
      return NextResponse.redirect(`${MAIN_SITE}/`);
    }

    // Already-prefixed checkout paths work as-is on this host too.
    if (pathname === "/get-tickets" || pathname.startsWith("/get-tickets/")) {
      return NextResponse.next();
    }

    // /<eventEid> → /get-tickets/<eventEid>, provided the segment
    // isn't one of the app's real routes.
    const single = pathname.match(/^\/([^/]+)$/);
    if (single && !RESERVED_SEGMENTS.has(single[1].toLowerCase())) {
      const url = request.nextUrl.clone();
      url.pathname = `/get-tickets/${single[1]}`;
      return NextResponse.rewrite(url);
    }

    // Everything else is account-app territory - send it to the
    // domain it belongs on, preserving path + query.
    return NextResponse.redirect(
      `${ACCOUNT_ORIGIN}${pathname}${request.nextUrl.search}`,
    );
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Unauthenticated user trying to reach a protected page → /login
  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to reach a signed-out page → bounce to root.
  if (token && SIGNED_OUT_ONLY.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every request except Next internals. We still do the fine-grained
  // filtering inside the function above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
