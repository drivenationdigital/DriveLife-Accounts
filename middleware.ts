import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookies";
import {
  APP_MANAGER_HOME,
  APP_MODE_COOKIE,
  APP_MODE_MANAGER,
  APP_RETURN_COOKIE,
  APP_SPLASH_COOKIE,
  SESSION_EXPIRED_PATH,
  isAppLink,
} from "@/lib/appReturn";

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
  // Host-side resize helper loaded by third-party pages that embed us.
  "/embed.js",
  // Public application forms, linked directly from event pages and
  // organiser-shared URLs - applicants have no account.
  "/apply",
  // Public ticket checkout - buyers are anonymous.
  "/get-tickets",
  // Public landing pages that create the account as part of the flow
  // (/join/traders: sign up, list a business, pay for the directory).
  "/join",
  // Where an Event Manager session (see below) lands once its token has
  // died. Reached precisely when there is no token, so it cannot be gated.
  SESSION_EXPIRED_PATH,
];

/**
 * The Event Manager: the mobile app opens /events inside its web container
 * and lets the user move around - the list, an event's overview, the
 * editor - with the app's own header as the only way out. The dashboard's
 * header and sidebar are not rendered in there, so every other page would
 * be a dead end; and the brief for the container is that the dashboard's
 * main menu is NOT on offer. So while the mode cookie is set, anything
 * outside this list is sent back to the list.
 *
 * Matched by exact path or by prefix with a trailing slash, like
 * PUBLIC_PATHS. "/orders/" (an order opened from an event's Orders tab) is
 * part of managing that event; "/orders" (the list) is not, so the prefix
 * form only.
 */
const MANAGER_PATHS = [
  // The list, an event's overview (/events/<ref>), the editor
  // (/events/create, /events/new).
  APP_MANAGER_HOME,
  // Reached from the Orders / Tickets tabs of an event.
  "/orders/",
  SESSION_EXPIRED_PATH,
  // Public pages the overview can open (box-office checkout, the
  // application forms). Not menu items; refusing them would break those
  // buttons for no gain.
  "/get-tickets",
  "/apply",
  "/embed",
  "/embed.js",
];

function inManagerFlow(pathname: string): boolean {
  return MANAGER_PATHS.some(
    (p) =>
      pathname === p ||
      (p.endsWith("/") ? pathname.startsWith(p) : pathname.startsWith(`${p}/`)),
  );
}

/** How long the Event Manager mode outlives its token. Long enough that an
 *  expired token is still met by the in-container "session expired" screen
 *  rather than the browser's login page. */
const MANAGER_MODE_MAX_AGE = 60 * 60 * 12;

/** The splash is for the page the handoff lands on; after that it must
 *  not come back, however the cookie is left behind. */
const SPLASH_MAX_AGE = 120;

/** When the handoff token carries no readable expiry. Matches what
 *  app/v1/dashboard-session issues by default. */
const HANDOFF_FALLBACK_LIFETIME = 15 * 60;

/**
 * Seconds until a dashboard JWT expires, read from its `exp` claim, so the
 * cookie that carries it lives exactly as long as the token does.
 *
 * NOT a verification - the signature is not checked here, and need not be:
 * every API call verifies the token server-side. A forged `exp` only buys a
 * cookie holding a token the API refuses. Falls back to the handoff's
 * default life when the claim is missing or unreadable, and is clamped so a
 * bad clock cannot produce a zero-life or year-long cookie.
 */
function tokenLifetime(token: string): number {
  try {
    const payload = token.split(".")[1] ?? "";
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = Number(JSON.parse(json)?.exp);
    if (!Number.isFinite(exp)) return HANDOFF_FALLBACK_LIFETIME;
    const remaining = Math.floor(exp - Date.now() / 1000);
    return Math.min(Math.max(remaining, 60), 60 * 60 * 24 * 30);
  } catch {
    return HANDOFF_FALLBACK_LIFETIME;
  }
}

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
  "tracks",
  "club",
  "venue",
  "track",
  "businesses",
  "business",
  "organiser-resources",
  "join",
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
  "session-expired",
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
  //
  // /.well-known is matched by PATH, not by extension: the files in it
  // deliberately have none. Apple Pay domain verification fetches
  // /.well-known/apple-developer-merchantid-domain-association, and
  // without this it was answered with a 307 to /login - which reads as
  // a 404 from the verifier's side and fails the check. The same
  // applies to ACME/Let's Encrypt renewals and any other well-known
  // probe, none of which can carry a session.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known/") ||
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

  // ── Session handoff from the mobile app ────────────────────────────
  //
  // The app runs on a different JWT system to this dashboard - different
  // secret, different claims - so it cannot simply pass its own token along.
  // It trades it for a short-lived dashboard token (app/v1/dashboard-session)
  // and arrives here with it on the URL.
  //
  // Taken BEFORE the auth gate below, or the request would be bounced to
  // /login while carrying a perfectly good session.
  //
  // Redirected immediately to the same URL without it, which is the whole
  // point: a token on a URL is a token in the address bar, the share sheet,
  // the browser history and the server's access log. After this hop the only
  // copy is a cookie.
  const handoff = request.nextUrl.searchParams.get("dl_s");

  if (handoff) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("dl_s");

    // Where the app wants the user sent when they are finished. Moved out of
    // the URL into a cookie for the same reason as the token: it has to
    // survive every navigation inside the dashboard, and the editor rewrites
    // its own query as the user moves between steps.
    //
    // This doubles as the "we are inside the app" flag — only the app sends a
    // handoff — which is what lets the layout drop the dashboard's own header
    // and sidebar. One signal, read server-side by the layout and client-side
    // by the links that have to point home.
    const complete = request.nextUrl.searchParams.get("complete") ?? "";
    clean.searchParams.delete("complete");

    // Which flow this is (see lib/appReturn.ts). Landing on the events list
    // IS the Event Manager - that is its entry route and nothing in the
    // single-page flow opens the list - and `dl_mode=manager` lets the app
    // ask for it explicitly on any other allowed page.
    const modeParam = request.nextUrl.searchParams.get("dl_mode");
    clean.searchParams.delete("dl_mode");
    const manager =
      modeParam === APP_MODE_MANAGER ||
      clean.pathname === APP_MANAGER_HOME ||
      clean.pathname === `${APP_MANAGER_HOME}/`;

    const response = NextResponse.redirect(clean);
    const secure = request.nextUrl.protocol === "https:";

    // Each handoff defines the session completely: whatever an earlier one
    // left in the cookie jar is overwritten or removed, never inherited.
    // A `complete` from last week's single-page handoff must not turn
    // today's Event Manager "back" links into exits.
    //
    // Max-Age=0 AND an epoch Expires: browsers honour either, but some
    // clients (curl's jar among them) keep a Max-Age=0 cookie written in the
    // same second, and the explicit past date leaves no room for that.
    const expire = (name: string) =>
      response.cookies.set({
        name,
        value: "",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });

    // Only ever the app's own scheme. This value ends up in an href on a page
    // the user is signed into, so an open list would turn the dashboard into
    // a redirector.
    if (isAppLink(complete)) {
      response.cookies.set({
        name: APP_RETURN_COOKIE,
        value: complete,
        path: "/",
        sameSite: "lax",
        secure,
        // Read by client components, so not HttpOnly — same reasoning as the
        // auth cookie beside it.
        httpOnly: false,
        maxAge: 60 * 60 * 8,
      });
    } else {
      expire(APP_RETURN_COOKIE);
    }

    if (manager) {
      response.cookies.set({
        name: APP_MODE_COOKIE,
        value: APP_MODE_MANAGER,
        path: "/",
        sameSite: "lax",
        secure,
        httpOnly: false,
        maxAge: MANAGER_MODE_MAX_AGE,
      });
      // The "Loading CarEvents.com Event Manager" screen, rendered by the
      // dashboard layout on the page this redirect lands on. The layout
      // clears the cookie once the splash has run.
      response.cookies.set({
        name: APP_SPLASH_COOKIE,
        value: "1",
        path: "/",
        sameSite: "lax",
        secure,
        httpOnly: false,
        maxAge: SPLASH_MAX_AGE,
      });
    } else {
      expire(APP_MODE_COOKIE);
      expire(APP_SPLASH_COOKIE);
    }

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: handoff,
      path: "/",
      sameSite: "lax",
      secure,
      // Readable by JS on purpose, matching how this cookie is already set
      // and read (see lib/authCookies.ts) - the dashboard attaches it to
      // X-WP-Token on every API call, so an HttpOnly cookie would sign the
      // user in and then let them do nothing.
      httpOnly: false,
      // The cookie lives exactly as long as the token says it does (fifteen
      // minutes for a single-page handoff, longer for an Event Manager
      // session - app/v1/dashboard-session?scope=manager), so a dead token
      // does not linger as a session that looks alive.
      maxAge: tokenLifetime(handoff),
    });

    return response;
  }

  // ── Event Manager: only its own screens ────────────────────────────
  //
  // Set by the handoff above. Everything the dashboard's menu would offer
  // is refused here, server-side, so no link, deep link or typed URL can
  // reach it from inside the container - the pages hide their exits too,
  // but a hidden link is not a closed door.
  const managerMode =
    request.cookies.get(APP_MODE_COOKIE)?.value === APP_MODE_MANAGER;

  if (managerMode && !inManagerFlow(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = APP_MANAGER_HOME;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Unauthenticated user trying to reach a protected page → /login
  if (!token && !isPublic) {
    const url = request.nextUrl.clone();

    // Inside the Event Manager the token can only have come from the app,
    // and only the app can mint another - so a login form is the wrong
    // answer, and one with Register / Forgot-password links on it is an
    // open door out of the container besides. A screen that says to come
    // back in from the app instead.
    if (managerMode) {
      url.pathname = SESSION_EXPIRED_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }

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
