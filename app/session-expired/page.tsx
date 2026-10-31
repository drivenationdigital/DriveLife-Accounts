import type { Metadata } from "next";

import { SessionExpiredActions } from "./SessionExpiredActions";

export const metadata: Metadata = {
  title: "Session expired - CarEvents.com",
};

/**
 * Where an Event Manager session inside the mobile app lands once its token
 * has died (see the middleware and lib/appReturn.ts).
 *
 * Deliberately NOT the login page. The session belonged to the app, which
 * minted the token the container arrived with, so only the app can issue
 * another - and /login carries Register and Forgot-password links, which
 * would make an expired token a way out of the container. This page says
 * what happened and how to carry on, and nothing else.
 *
 * Outside the (dashboard) route group on purpose: no header, no sidebar,
 * no providers it does not need, and it is reachable with no token at all
 * (it is in the middleware's PUBLIC_PATHS), so it must not assume one.
 */
export default function SessionExpiredPage() {
  return (
    <main className="ce-session-expired">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="logo-mark"
        alt="CarEvents"
        width={187}
        height={159}
        src="/logo-icon-1.svg"
      />
      <h1>Your session has expired</h1>
      <p>
        For your security the Event Manager signs you out after a while.
        Close this screen and open the Event Manager again from the DriveLife
        app to carry on.
      </p>
      <SessionExpiredActions />
    </main>
  );
}
