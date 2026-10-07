"use client";

/**
 * Getting back to the mobile app from a page it opened in a web container.
 *
 * The app opens the editor in an in-app browser with `?complete=drivelife://…`.
 * That browser has no "done" of its own worth using — on iOS the only way out
 * is Safari's own chrome, which leaves the buyer looking at a web page with no
 * obvious way home — so the page has to offer the way back itself.
 *
 * Remembered in sessionStorage rather than read fresh each time: the editor
 * rewrites its own query string as the user moves between steps, and a return
 * link that survives only until the first tab change is no return link at all.
 * sessionStorage and not localStorage, because this belongs to one trip
 * through one editor, not to the browser for ever.
 */

const KEY = "dl_app_return";

/**
 * Only ever the app's own scheme.
 *
 * This value ends up in an href on a page the user is signed into, so an open
 * list would make the dashboard a redirector: `?complete=https://…` on a link
 * sent to an organiser would carry them straight out of a session they trust.
 * The app has exactly one scheme and it is not a user-supplied one.
 */
function isAppLink(value: string): boolean {
  return /^drivelife:\/\//i.test(value.trim());
}

/** Reads `?complete=` once and remembers it for the rest of the visit. */
export function captureAppReturn(
  search: URLSearchParams | null | undefined,
): void {
  const raw = (search?.get("complete") ?? "").trim();
  if (!raw || !isAppLink(raw)) return;

  try {
    sessionStorage.setItem(KEY, raw);
  } catch {
    // Private mode, or storage disabled. The link simply will not show —
    // which is the right failure: a dead "Done" button is worse than none.
  }
}

/** Where to send the user back to, or null when this is an ordinary visit. */
export function appReturnUrl(): string | null {
  try {
    const stored = sessionStorage.getItem(KEY);
    return stored && isAppLink(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Forgets the return link. For a sign-out, where it no longer applies. */
export function clearAppReturn(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored means nothing to clear.
  }
}
