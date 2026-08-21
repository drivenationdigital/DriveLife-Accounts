"use client";

/**
 * Shallow navigation for the editor's step tabs.
 *
 * Switching steps only changes the `?step=` search param, and every
 * panel is a client component already in the bundle - nothing
 * server-side reads the param. `router.push` still round-trips to the
 * server for a fresh RSC payload before the new panel renders, which
 * on a slow connection showed up as a dead delay between clicking a
 * tab and anything happening, with no feedback at all.
 *
 * `window.history.pushState` is the App Router's supported shallow
 * alternative: Next keeps `usePathname` / `useSearchParams` in sync
 * with it, so the panel switch happens synchronously in the same
 * frame. Back/forward still work - popstate re-syncs the hooks the
 * same way.
 *
 * Only for same-page step changes. Navigation to a different route
 * must keep using router.push, which is what actually loads the
 * destination page.
 */
export function pushStepUrl(url: string): void {
  window.history.pushState(null, "", url);
}
