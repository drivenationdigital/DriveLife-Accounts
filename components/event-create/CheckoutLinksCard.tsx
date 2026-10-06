"use client";

import { useState } from "react";

import { withApplyTheme, type ApplyTheme } from "@/lib/applyTheme";
import {
  checkoutDirectUrl,
  checkoutEmbedSrc,
  embedSnippet,
} from "@/lib/checkoutLinks";

/**
 * "Link or embed checkout" card at the bottom of the CarEvents
 * Ticketing section of the Tickets step - the checkout counterpart of
 * ApplicationLinksCard.
 *
 *   1. Direct URL - the buyer-facing checkout (checkout.carevents.com
 *      in production) with a Copy button.
 *   2. Embed - an iframe of the frameable /embed/checkout route plus
 *      the embed.js helper that sizes it to its content.
 *
 * Both follow the colour-scheme toggle, like the application card.
 * Without a saved event there is no id to link to, so the card says so
 * instead of showing a broken URL.
 */
export function CheckoutLinksCard({
  eid,
  site,
}: {
  eid: string | null | undefined;
  /** The event's blog, so the link resolves against the right one. */
  site?: string | null;
}) {
  const [theme, setTheme] = useState<ApplyTheme>("light");
  const [copiedKey, setCopiedKey] = useState<"url" | "embed" | null>(null);

  const copy = async (text: string, key: "url" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // Clipboard blocked - the text is still selectable by hand.
    }
  };

  const header = (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center flex-shrink-0">
        <i className="fa-solid fa-link text-gold-600" aria-hidden />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink-900">
          Link or embed checkout
        </h3>
        <p className="text-xs text-ink-500 mt-0.5">
          Send buyers straight to your checkout, or sell tickets from your
          own website.
        </p>
      </div>
    </div>
  );

  if (!eid) {
    return (
      <div className="app-links-card mb-4">
        {header}
        <p className="text-xs text-ink-500">
          Save the event to get your checkout link and embed code.
        </p>
      </div>
    );
  }

  const directUrl = withApplyTheme(checkoutDirectUrl(eid, site), theme);
  const snippet = embedSnippet(
    withApplyTheme(checkoutEmbedSrc(eid, site), theme),
    "Buy tickets",
    900,
  );

  return (
    <div className="app-links-card mb-4">
      {header}

      <div className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
            Colour scheme
          </label>
          <div className="seg w-full" role="group">
            <button
              type="button"
              className={`seg-btn ${theme === "light" ? "is-active" : ""}`}
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={`seg-btn ${theme === "dark" ? "is-active" : ""}`}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
          <p className="text-xs text-ink-500 mt-2">
            Match the site you&apos;re embedding into. Both links below
            update.
          </p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
            Checkout link
          </label>
          <div className="link-row">
            <span className="link-icon">
              <i className="fa-solid fa-globe text-xs" aria-hidden />
            </span>
            <a
              className="link-value"
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {directUrl}
            </a>
            <button
              type="button"
              onClick={() => copy(directUrl, "url")}
              className={`copy-btn ${copiedKey === "url" ? "is-copied" : ""}`}
            >
              <i className="fa-regular fa-copy" aria-hidden />
              {copiedKey === "url" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
            Embed code
          </label>
          <div className="embed-block">
            <button
              type="button"
              onClick={() => copy(snippet, "embed")}
              className={`copy-btn ${copiedKey === "embed" ? "is-copied" : ""}`}
            >
              <i className="fa-regular fa-copy" aria-hidden />
              {copiedKey === "embed" ? "Copied" : "Copy"}
            </button>
            <pre>{snippet}</pre>
          </div>
          <p className="text-xs text-ink-500 mt-2">
            The embedded checkout sizes itself to fit and takes card, Apple
            Pay and Google Pay payments in place. Buyers paying through
            Mollie are taken to Mollie&apos;s page and returned to your
            checkout page to finish.
          </p>
        </div>
      </div>
    </div>
  );
}
