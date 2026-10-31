"use client";

import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";

import { APP_SPLASH_COOKIE } from "@/lib/appReturn";

/**
 * Full-screen "Loading CarEvents.com Event Manager" screen.
 *
 * Shown on the page the mobile app's Event Manager handoff lands on (see
 * the middleware and lib/appReturn.ts). The dashboard layout renders this
 * only while the splash cookie is present, server-side, so the overlay is
 * part of the first HTML: the user sees the logo and the line of text, not
 * the events list assembling itself behind a WebView with no address bar.
 *
 * This component decides when to take it down:
 *
 *   - never before MIN_MS from navigation start - "a few seconds", so it
 *     reads as a deliberate welcome rather than a flicker;
 *   - not until the window's `load` event has fired;
 *   - not while any React Query request is in flight, so the list's data
 *     (not just its scripts) has arrived;
 *   - and in any case no later than MAX_MS, so a stalled request cannot
 *     leave the user looking at a logo for ever.
 *
 * On the way out it clears the cookie, so a later server render of the
 * layout (a reload, a full navigation) does not bring the splash back.
 * The middleware gives the cookie a short life as well, in case this
 * never runs.
 *
 * Distinct from the `?loading=1` splash in the root layout (#ce-splash),
 * which is switched on by a URL flag for third-party embeds and carries no
 * text. This one is cookie-driven and server-rendered, and lives in the
 * dashboard layout because that is the only place it is wanted.
 */
const MIN_MS = 3000;
const MAX_MS = 15000;
const FADE_MS = 450;

type Phase = "on" | "out" | "gone";

export function AppSplash() {
  const fetching = useIsFetching();
  const [phase, setPhase] = useState<Phase>("on");

  useEffect(() => {
    if (phase !== "on") return;

    const finish = () => {
      setPhase("out");
      window.setTimeout(() => setPhase("gone"), FADE_MS);
      document.cookie = `${APP_SPLASH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
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
    timers.push(
      window.setTimeout(finish, Math.max(0, MAX_MS - performance.now())),
    );

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
  }, [fetching, phase]);

  if (phase === "gone") return null;

  return (
    <div
      id="ce-app-splash"
      role="status"
      aria-live="polite"
      data-out={phase === "out" ? "" : undefined}
    >
      {/* Plain <img>: the SVG has its own <style> block, which must not
          be inlined (see components/layout/Logo.tsx). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="logo-mark"
        alt="CarEvents"
        width={187}
        height={159}
        src="/logo-icon-1.svg"
      />
      <p className="ce-app-splash-text">Loading CarEvents.com Event Manager</p>
      <div className="ce-app-splash-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
