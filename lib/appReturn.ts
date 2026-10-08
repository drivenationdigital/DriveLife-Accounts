/**
 * Knowing we are inside the mobile app's web container, and how to get back.
 *
 * The app opens dashboard pages in a WebView with `?complete=drivelife://…`.
 * The middleware moves that into a cookie on arrival and strips it from the
 * URL, so one signal survives every navigation afterwards — the editor
 * rewrites its own query as the user moves between steps, and a marker that
 * only lasted until the first tab change would be no marker at all.
 *
 * A cookie rather than sessionStorage because the LAYOUT needs it too, and
 * that is a server component: it cannot read browser storage, but it can read
 * a cookie. One mechanism for both sides beats two that can disagree.
 *
 * Not HttpOnly — client components read it to point their links home, the
 * same trade the auth cookie already makes.
 */

export const APP_RETURN_COOKIE = "dl_app_return";

/** Only ever the app's own scheme — see the middleware for why. */
function isAppLink(value: string): boolean {
  return /^drivelife:\/\//i.test(value.trim());
}

/**
 * Where to send the user back to, or null for an ordinary browser visit.
 *
 * Client-side. The server equivalent is reading [APP_RETURN_COOKIE] from
 * `cookies()`, which the dashboard layout does to decide whether to render
 * its own header and sidebar at all.
 */
export function appReturnUrl(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${APP_RETURN_COOKIE}=`));

  if (!match) return null;

  const value = decodeURIComponent(match.slice(APP_RETURN_COOKIE.length + 1));

  return isAppLink(value) ? value : null;
}

/** True when this page is being shown inside the app. */
export function inAppContainer(): boolean {
  return appReturnUrl() !== null;
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
