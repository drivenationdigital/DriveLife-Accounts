"use client";

import { useSyncExternalStore } from "react";

import { appContainerClient, type AppContainer } from "./appReturn";

/**
 * The container state for client components that RENDER differently
 * inside the app — a back link that points at a different place, a
 * button that only exists in one flow.
 *
 * Why a hook and not a bare `appContainerClient()` call in render: the
 * cookies do not exist during server rendering, so a plain read gives
 * the server one answer and the client another, and React hydrates the
 * server's markup with the client's props without reconciling the two.
 * An attribute that differs (an href, say) can then stay the server's
 * value for as long as nothing else re-renders the element.
 *
 * useSyncExternalStore is built for exactly this: it renders with the
 * server snapshot during hydration, then re-renders with the client's
 * if it differs, so the first paint is consistent and the correction is
 * a real update rather than a mismatch.
 *
 * Components whose markup is the same in both flows and only need
 * hiding should keep using the CSS off `data-app-container` /
 * `data-app-mode` instead, which is right on the very first paint.
 */

const SERVER_SNAPSHOT: AppContainer = {
  inApp: false,
  manager: false,
  returnUrl: null,
};

// Cookies only change on a full navigation here (the middleware sets
// them on the handoff redirect), so there is nothing to subscribe to.
const subscribe = () => () => {};

// useSyncExternalStore needs the same object back while nothing has
// changed, or it re-renders for ever. Keyed on the raw cookie string.
let cacheKey: string | null = null;
let cached: AppContainer = SERVER_SNAPSHOT;

function getSnapshot(): AppContainer {
  const key = typeof document === "undefined" ? "" : document.cookie;
  if (key !== cacheKey) {
    cacheKey = key;
    cached = appContainerClient();
  }
  return cached;
}

export function useAppContainer(): AppContainer {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
