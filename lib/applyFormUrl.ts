"use client";

/**
 * Public application-form URL for an event, on the right domain for
 * the environment.
 *
 * In production the forms have a vanity alias - apply.carevents.com -
 * served by this same app via a host-aware rewrite in middleware.ts
 * (apply.carevents.com/<kind>/<eid> → /apply/<kind>/<eid>), so links
 * shown to organisers should use the short form. Anywhere else
 * (staging, local dev) there is no vanity DNS, so fall back to the
 * current origin's real /apply path - a link that actually works
 * beats a pretty one that 404s.
 *
 * Client-only ("use client" + window): every caller renders links in
 * the browser.
 */

export type ApplyFormKind = "show-car" | "car-club" | "trader";

const APPLY_VANITY_ORIGIN = "https://apply.carevents.com";

export function applyFormUrl(kind: ApplyFormKind, eid: string): string {
  const host =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const onProductionDomain =
    host === "carevents.com" || host.endsWith(".carevents.com");
  if (onProductionDomain) {
    return `${APPLY_VANITY_ORIGIN}/${kind}/${encodeURIComponent(eid)}`;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/apply/${kind}/${encodeURIComponent(eid)}`;
}
