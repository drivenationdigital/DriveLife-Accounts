"use client";

import { useEffect, useRef } from "react";
import { useIsFetching } from "@tanstack/react-query";

/**
 * Full-screen white loading screen for `?loading=1`.
 *
 * Used when parts of the dashboard are embedded in third-party apps: the
 * host opens a dashboard URL with `loading=1` and the user sees a pulsing
 * CarEvents logo instead of the page assembling itself.
 *
 * The overlay itself is server-rendered first in <body> (#ce-splash)
 * and switched on by the inline script right after it, BEFORE the rest
 * of the page is parsed, so there is no flash of the page. This
 * component only decides when to take it down again:
 *
 *   - never before the minimum display time (2s from navigation start);
 *   - not until the window's `load` event has fired;
 *   - not while any React Query request is in flight, so the page's own
 *     data (not just its scripts) has arrived;
 *   - and in any case no later than MAX_MS, so a stalled request cannot
 *     leave the user looking at a logo for ever.
 *
 * `loading=1` is left on the URL; the inline script only reads it once
 * per full page load, so in-app navigation never re-triggers it.
 *
 * The state lives in attributes on the overlay element (data-on /
 * data-out) rather than on <html>, which React 19 wipes on hydration.
 */
const MIN_MS = 2000;
const MAX_MS = 20000;
const FADE_MS = 450;

export function LoadingSplash() {
  const fetching = useIsFetching();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const el = document.getElementById("ce-splash");
    if (!el || !el.hasAttribute("data-on")) {
      done.current = true;
      return;
    }

    const finish = () => {
      if (done.current) return;
      done.current = true;
      // data-out fades it; data-on keeps it displayed until the
      // transition has run, then both go.
      el.setAttribute("data-out", "");
      window.setTimeout(() => {
        el.removeAttribute("data-out");
        el.removeAttribute("data-on");
      }, FADE_MS);
    };

    const ready = () =>
      document.readyState === "complete" &&
      performance.now() >= MIN_MS &&
      fetching === 0;

    if (ready()) {
      finish();
      return;
    }

    const timers: number[] = [];
    // Re-check once the minimum time has passed (the other conditions
    // may already be true by then), and give up waiting at MAX_MS.
    timers.push(
      window.setTimeout(
        () => {
          if (ready()) finish();
        },
        Math.max(0, MIN_MS - performance.now()) + 20,
      ),
    );
    timers.push(window.setTimeout(finish, Math.max(0, MAX_MS - performance.now())));

    const onLoad = () => {
      if (ready()) finish();
    };
    window.addEventListener("load", onLoad);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("load", onLoad);
    };
    // Re-evaluated whenever the in-flight query count changes - that is
    // the signal that the page's data has finished arriving.
  }, [fetching]);

  return null;
}
