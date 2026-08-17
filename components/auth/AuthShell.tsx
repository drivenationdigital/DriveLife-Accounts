"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { careventsHomeUrl } from "@/lib/eventPageUrl";
import { REGIONS } from "@/lib/regions";
import { useVisitorRegion } from "@/lib/useVisitorRegion";
import { ChevLeftIcon } from "@/components/ui/Icons";

/**
 * Shared chrome for the signed-out pages: sign in, register, forgot
 * password.
 *
 * Centres a single card under the CarEvents wordmark. Extracted rather
 * than repeated three times so the three pages can't drift apart - they
 * are the first thing a user sees and a mismatch between them reads as
 * a broken or spoofed page.
 *
 * The wordmark links home rather than being inert: on the sign-in page
 * it's the only way back out to the site.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered outside the card, e.g. the "create an account" panel. */
  footer?: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <Link href="/" className="auth-logo" aria-label="CarEvents">
          {/* Plain <img> for the same reason as components/layout/Logo:
              the asset carries its own <style> block, so inlining it
              would leak generic class names into the page. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo2-2.svg" alt="CarEvents" width={538} height={95} />
        </Link>

        <div className="section auth-card">
          <div className="section-header auth-card-header">
            <div className="w-full">
              <div className="section-title auth-title">{title}</div>
              {subtitle && <div className="section-subtitle">{subtitle}</div>}
            </div>
          </div>
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}

/**
 * The secondary panel under the card - "New here? Create an account",
 * "Already have an account? Sign in". A bordered block rather than a
 * bare link so the alternative path is as findable as the form itself.
 */
export function AuthAltPanel({
  prompt,
  actionLabel,
  href,
}: {
  prompt: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="auth-alt">
      <span className="auth-alt-prompt">{prompt}</span>
      <Link href={href} className="btn btn-secondary auth-alt-btn">
        {actionLabel}
      </Link>
    </div>
  );
}

/**
 * "Back to CarEvents.com" - the way out of the signed-out pages.
 *
 * A plain `<a>`, not a Next `Link`: it leaves the app entirely, so it
 * should be a real navigation rather than something Next tries to route
 * internally.
 *
 * The destination follows the visitor's likely region, same as the
 * dashboard sidebar - see lib/visitorRegion.ts. Nobody is signed in
 * here, so a browser guess is the only signal there is.
 */
export function AuthBackToSite() {
  const region = useVisitorRegion();
  return (
    <div className="auth-back">
      <a href={careventsHomeUrl(REGIONS[region])}>
        <ChevLeftIcon aria-hidden />
        Back to CarEvents.com
      </a>
    </div>
  );
}
