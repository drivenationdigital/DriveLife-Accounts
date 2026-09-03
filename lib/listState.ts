"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps a list's filter, page and scroll position across a round trip
 * to a detail page.
 *
 * The event dashboard tabs used to hold their search/page in component
 * state only, so opening an order and coming back - browser back or the
 * order page's "Back to Dashboard" - remounted the tab with a blank
 * filter on page 1 at the top of the page. Now:
 *
 *  - filter/page/tab live in the URL's query (written shallowly with
 *    history.replaceState, so no navigation and no server round trip);
 *    the browser's back entry therefore carries them, and a tab reads
 *    its initial state from them on mount;
 *  - the order link carries the query as `back=` so the order page's
 *    back button can return to the same URL;
 *  - the scroll offset is parked in sessionStorage keyed by the list
 *    URL when a row is opened, and re-applied once the rows are back.
 */

/**
 * Merge `updates` into the current URL's query without navigating.
 * Empty/null values remove the key. No-op when nothing changes.
 *
 * `history.replaceState` is the App Router's supported shallow update:
 * `useSearchParams` re-syncs from it, same as lib/stepNav.ts relies on.
 */
export function replaceQuery(
  updates: Record<string, string | number | null | undefined>,
): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  const next = url.pathname + url.search + url.hash;
  const current =
    window.location.pathname + window.location.search + window.location.hash;
  if (next !== current) {
    window.history.replaceState(null, "", next);
  }
}

/** The current query string ("?a=1" or ""), for `orderDetailPath`'s
 *  `returnQuery` so the detail page can send the user back here. */
export function currentQuery(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}

/** Page number from a query value: a positive integer, else 1. */
export function pageFromQuery(raw: string | null | undefined): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

const SCROLL_KEY = "ce:list-scroll";

// Path is decoded so the same page keyed from a router.push (encoded
// ref) and from a rebuilt back link compares equal.
function listKey(): string {
  return decodeURIComponent(window.location.pathname) + window.location.search;
}

/** Call just before navigating from a list row to its detail page. */
export function rememberListPosition(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SCROLL_KEY,
      JSON.stringify({ key: listKey(), y: window.scrollY }),
    );
  } catch {
    // Storage unavailable (private mode, quota) - just land at the top.
  }
}

function takeListPosition(): number | null {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { key?: string; y?: number };
    if (parsed.key !== listKey()) return null;
    sessionStorage.removeItem(SCROLL_KEY);
    return typeof parsed.y === "number" ? parsed.y : null;
  } catch {
    return null;
  }
}

/**
 * Re-apply a remembered scroll offset once the list has its rows
 * (`ready`), so the page is tall enough to scroll to. Runs at most once
 * per mount; the offset is only honoured for the URL it was saved on.
 */
export function useRestoreListPosition(ready: boolean): void {
  const done = useRef(false);
  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    const y = takeListPosition();
    if (y === null || y <= 0) return;
    // Two frames: let the rows lay out before scrolling to them.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    });
  }, [ready]);
}
