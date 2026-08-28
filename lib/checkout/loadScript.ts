"use client";

/**
 * Load a third-party <script> once per URL and resolve when it is
 * ready.
 *
 * The PayPal and Square SDKs are both loaded this way rather than with
 * next/script: the checkout only needs them when a buyer actually
 * selects that method, and each one's URL is built from the event
 * organiser's own credentials, so it isn't known at render time of the
 * page shell. Loading them eagerly would also mean every ticket page
 * pulling two payment SDKs it will usually never use.
 *
 * Keyed by URL, so switching between payment tabs (or remounting after
 * a failed payment) reuses the tag already in the document instead of
 * appending another. A rejected load is dropped from the cache so the
 * next attempt genuinely retries rather than replaying the failure.
 */

const pending = new Map<string, Promise<void>>();

export function loadScript(url: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadScript called during SSR"));
  }

  const cached = pending.get(url);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-checkout-sdk="${CSS.escape(url)}"]`,
    );
    if (existing) {
      // A previous mount already finished with this exact URL - the
      // SDK global is on window and there is nothing to wait for.
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.dataset.checkoutSdk = url;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      // Name the script. onerror gives us no reason - the browser
      // keeps that to itself - but the URL at least says WHICH SDK
      // failed, and the Network tab then gives the why
      // (ERR_BLOCKED_BY_CLIENT for an extension, a CSP violation, a
      // DNS failure). "Failed to load payment SDK" alone sent us
      // hunting through config that was never the problem.
      console.error(`[checkout] SDK failed to load: ${url}`);
      reject(new Error(`Couldn't load ${new URL(url).hostname}`));
    };
    document.head.appendChild(script);
  });

  promise.catch(() => pending.delete(url));
  pending.set(url, promise);
  return promise;
}
