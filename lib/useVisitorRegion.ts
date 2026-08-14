"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_REGION_KEY, type RegionKey } from "./regions";
import { detectVisitorRegion } from "./visitorRegion";

/** Never fires - the guess can't change within a page load. */
function subscribe(): () => void {
  return () => {};
}

/**
 * Cached so `getSnapshot` returns a referentially stable value. React
 * calls it on every render and loops forever if the result changes.
 */
let cached: RegionKey | null = null;
function clientSnapshot(): RegionKey {
  if (cached === null) cached = detectVisitorRegion();
  return cached;
}

function serverSnapshot(): RegionKey {
  return DEFAULT_REGION_KEY;
}

/**
 * The visitor's likely region, safe to use during SSR.
 *
 * `useSyncExternalStore` rather than an effect: detection reads
 * `Intl` and `navigator`, which don't exist on the server, so a naive
 * read would render one href in the SSR HTML and a different one on
 * hydration - a mismatch React warns about and, worse, a link whose
 * destination silently changes under the cursor.
 *
 * This renders the default server-side, hydrates with that same value,
 * then re-renders once with the detected one. No mismatch, no effect,
 * no setState-in-effect.
 */
export function useVisitorRegion(): RegionKey {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
