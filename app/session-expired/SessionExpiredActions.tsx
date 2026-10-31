"use client";

import { appAction } from "@/lib/appReturn";
import { useAppContainer } from "@/lib/useAppContainer";

/**
 * A "Back to the app" button, when the app left a return link.
 *
 * `dl-signin=1` is what the 401 handler sends in the single-page flow: the
 * app's WebPageScreen closes the screen and can act on the parameter (sign
 * the user back in, re-open the page). Without a return link there is
 * nothing to navigate to, so nothing is rendered and the text above does
 * the talking.
 *
 * Read through useAppContainer rather than appReturnUrl() in render so the
 * server (no cookies) and the client agree on the first paint.
 */
export function SessionExpiredActions() {
  const { returnUrl } = useAppContainer();
  if (!returnUrl) return null;

  return (
    <a href={appAction("dl-signin=1")} className="btn btn-primary">
      Back to the app
    </a>
  );
}
