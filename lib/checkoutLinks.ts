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

/**
 * An event id with its region in front: 'us<eid>' for the US, bare for the UK.
 *
 * Load-bearing, not cosmetic. Post ids are only unique within a blog and the
 * encrypted id carries no blog, so a US event's link without this resolves
 * against the UK blog and sells a DIFFERENT event - with no error anywhere,
 * because nothing can tell the two ids apart.
 *
 * In the id rather than beside it as `?site=`, so the region survives a
 * vanity-host rewrite, an iframe src and a pasted link alike - there is no
 * second parameter to be dropped. Bare means UK, which is what every link
 * ever issued already is, so none of them change.
 */
function siteEid(eid: string, site?: string | null): string {
  const prefix =
    String(site ?? "").trim().toLowerCase() === "us" ? "us" : "";
  return `${prefix}${eid}`;
}

/** The buyer-facing checkout page for an event. */
export function checkoutDirectUrl(eid: string, site?: string | null): string {
  const id = encodeURIComponent(siteEid(eid, site));

  if (onProductionDomain()) {
    return `${CHECKOUT_VANITY_ORIGIN}/${id}`;
  }
  return `${currentOrigin()}/get-tickets/${id}`;
}

/** The frameable checkout, for an <iframe> on the organiser's own site. */
export function checkoutEmbedSrc(eid: string, site?: string | null): string {
  const origin = onProductionDomain() ? ACCOUNT_ORIGIN : currentOrigin();
  return `${origin}/embed/checkout/${encodeURIComponent(siteEid(eid, site))}`;
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
