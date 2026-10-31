/**
 * Knowing we are inside the mobile app's web container, and how to get back.
 *
 * The app opens dashboard pages in a WebView after trading its own token for
 * a dashboard one (`?dl_s=…`, see the middleware). Two flows share that
 * handoff:
 *
 *  - ONE PAGE FOR ONE JOB — the editor for one event, one event's overview —
 *    with `?complete=drivelife://…` so the page can hand control straight
 *    back when the job is done. The original flow. The middleware moves the
 *    return link into [APP_RETURN_COOKIE] and that cookie alone marks it.
 *
 *  - THE EVENT MANAGER — the app opens /events and the user moves around
 *    inside the dashboard: list → an event's overview → the editor and back,
 *    with the app's own header as the only way out. The middleware marks it
 *    with [APP_MODE_COOKIE] = "manager" when a handoff lands on /events (or
 *    carries `dl_mode=manager`), and the middleware then refuses every path
 *    outside that flow.
 *
 * The difference matters for every "back" link. In the single-page flow back
 * means the app; in the Event Manager it means the previous dashboard screen,
 * which is still there to go back to. Both flows hide the dashboard's own
 * header, sidebar and the exits to the dashboard home.
 *
 * Cookies rather than sessionStorage because the LAYOUTS need this too, and
 * those are server components: they cannot read browser storage, but they
 * can read a cookie. One mechanism for both sides beats two that can
 * disagree. Not HttpOnly — client components read them to point their links
 * the right way, the same trade the auth cookie already makes.
 */

export const APP_RETURN_COOKIE = "dl_app_return";

/** Which flow this container session is. Only ever [APP_MODE_MANAGER]. */
export const APP_MODE_COOKIE = "dl_app_mode";
export const APP_MODE_MANAGER = "manager";

/**
 * Set alongside the mode cookie on an Event Manager handoff. The dashboard
 * layout renders the full-screen splash while it is present and the splash
 * clears it once it has run. Short-lived on the server side too, so a stale
 * copy can never bring the splash back on a later page.
 */
export const APP_SPLASH_COOKIE = "dl_app_splash";

/** The Event Manager's entry screen. */
export const APP_MANAGER_HOME = "/events";

/** Where an expired Event Manager session lands (see the middleware). */
export const SESSION_EXPIRED_PATH = "/session-expired";

export interface AppContainer {
  /** The page is being shown inside the app, in either flow. */
  inApp: boolean;
  /** The Event Manager flow: in-dashboard navigation is wanted. */
  manager: boolean;
  /** The drivelife:// link back to the app, when the app gave one. */
  returnUrl: string | null;
}

/** Only ever the app's own scheme — see the middleware for why. */
export function isAppLink(value: string): boolean {
  return /^drivelife:\/\//i.test(value.trim());
}

/**
 * The container state, read from a cookie getter.
 *
 * Shared by the server layouts (`(name) => cookieStore.get(name)?.value`)
 * and the client (`document.cookie`), so the two sides cannot disagree
 * about what "in the app" means.
 */
export function appContainerFromCookies(
  get: (name: string) => string | null | undefined,
): AppContainer {
  const rawReturn = (get(APP_RETURN_COOKIE) ?? "").trim();
  const returnUrl = rawReturn && isAppLink(rawReturn) ? rawReturn : null;
  const manager = get(APP_MODE_COOKIE) === APP_MODE_MANAGER;

  return { inApp: returnUrl !== null || manager, manager, returnUrl };
}

function readCookieClient(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
}

/** Client-side container state. Server components read the cookies
 *  through [appContainerFromCookies] instead. */
export function appContainerClient(): AppContainer {
  return appContainerFromCookies(readCookieClient);
}

/**
 * Where to send the user back to, or null for an ordinary browser visit.
 *
 * Client-side. The server equivalent is reading [APP_RETURN_COOKIE] from
 * `cookies()`, which the layouts do to decide whether to render the
 * dashboard's own header and sidebar at all.
 */
export function appReturnUrl(): string | null {
  return appContainerClient().returnUrl;
}

/** True when this page is being shown inside the app, in either flow. */
export function inAppContainer(): boolean {
  return appContainerClient().inApp;
}

/** True in the Event Manager flow, where the dashboard's own screens are
 *  the way back and the app is only reached through its own header. */
export function inEventManager(): boolean {
  return appContainerClient().manager;
}

/**
 * A link that hands control back to the app.
 *
 * `dl-view=1` and friends are read by the app's WebPageScreen, which closes
 * the screen and acts on the parameter — so "View" can open the native event
 * page rather than a browser, and "Back to Events" can return to the app's
 * own list instead of the dashboard's.
 */
export function appAction(action: string): string {
  const base = appReturnUrl();
  if (!base) return "";

  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${action}`;
}

/**
 * Deals with an expired session inside the container, if we are in one.
 *
 * Returns true when it took over, so the caller can stop.
 *
 * A 401 inside the container used to navigate to /login, which is the worst
 * available answer: the login page carries "Register" and "Forgot password"
 * links, so a stale token turned a one-job webview into an open door onto
 * the rest of the site. And signing in there would not help anyway -- the
 * session belongs to the app, which minted the token this page arrived
 * with, so the only thing that can refresh it is the app.
 *
 * With a return link the app is told (`dl-signin=1`) and can re-open the
 * page with a fresh token. The Event Manager may arrive without one; then
 * the dashboard shows its own "session expired" screen, which says to come
 * back in from the app, instead of /login.
 */
export function returnToAppForSignIn(): boolean {
  const back = appAction("dl-signin=1");

  if (back) {
    if (typeof window !== "undefined") {
      // A real navigation: the WebView intercepts the scheme, closes the
      // screen and hands control back. Unknown parameters are ignored by the
      // app, so this behaves as a plain close until it chooses to act on one.
      window.location.href = back;
    }
    return true;
  }

  if (inEventManager()) {
    if (typeof window !== "undefined") {
      window.location.href = SESSION_EXPIRED_PATH;
    }
    return true;
  }

  return false;
}
