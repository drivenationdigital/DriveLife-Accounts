"use client";

/**
 * Public URLs for the ticket checkout and for embedding CarEvents pages,
 * on the right domain for the environment.
 *
 * Production has vanity hosts served by this app (see middleware.ts):
 * checkout.carevents.com/<eid> is the checkout, account.carevents.com
 * hosts the frameable /embed/* routes and the host-side resize helper
 * /embed.js. Anywhere else (staging, local dev) there is no vanity DNS,
 * so links use the current origin's real paths - a link that works beats
 * a pretty one that 404s.
 *
 * Client-only ("use client" + window): every caller renders in the
 * browser.
 */

const CHECKOUT_VANITY_ORIGIN = "https://checkout.carevents.com";
const ACCOUNT_ORIGIN = "https://account.carevents.com";

function onProductionDomain(): boolean {
  const host =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  return host === "carevents.com" || host.endsWith(".carevents.com");
}

function currentOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

/** The buyer-facing checkout page for an event. */
export function checkoutDirectUrl(eid: string): string {
  if (onProductionDomain()) {
    return `${CHECKOUT_VANITY_ORIGIN}/${encodeURIComponent(eid)}`;
  }
  return `${currentOrigin()}/get-tickets/${encodeURIComponent(eid)}`;
}

/** The frameable checkout, for an <iframe> on the organiser's own site. */
export function checkoutEmbedSrc(eid: string): string {
  const origin = onProductionDomain() ? ACCOUNT_ORIGIN : currentOrigin();
  return `${origin}/embed/checkout/${encodeURIComponent(eid)}`;
}

/** The host-side script that sizes CarEvents iframes to their content. */
export function embedScriptSrc(): string {
  const origin = onProductionDomain() ? ACCOUNT_ORIGIN : currentOrigin();
  return `${origin}/embed.js`;
}

/**
 * The snippet an organiser pastes into their site: the iframe plus the
 * resize helper. `allow="payment"` lets Apple Pay / Google Pay run
 * inside the frame; the height is only the initial size, embed.js then
 * keeps it matched to the content.
 */
export function embedSnippet(src: string, title: string, height = 800): string {
  return `<iframe
  src="${src}"
  width="100%"
  height="${height}"
  frameborder="0"
  allow="payment"
  style="border:0;width:100%;"
  title="${title}"></iframe>
<script src="${embedScriptSrc()}" async></script>`;
}
