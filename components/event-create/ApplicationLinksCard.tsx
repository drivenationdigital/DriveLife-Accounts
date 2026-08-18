"use client";

import { useState } from "react";

import { withApplyTheme, type ApplyTheme } from "@/lib/applyTheme";

/**
 * "Application links" card used at the bottom of the Show Cars,
 * Car Clubs and Traders panels.
 *
 * Two pieces:
 *   1. Direct URL - read-only input + Copy button.
 *   2. Embed - preformatted iframe snippet + Copy button.
 *
 * The URLs are passed in as props because each panel uses a
 * different application route (`/apply/show-cars`, `/apply/car-clubs`,
 * `/apply/traders`) and a different `title=` for the iframe.
 *
 * The slug isn't yet derived from the saved event; we accept a
 * `slug` prop so the panels can pass whatever they have available
 * (right now, slugified event title).
 */
export function ApplicationLinksCard({
  applicationKind,
  slug,
  iframeTitle,
}: {
  /** "show-cars" | "car-clubs" | "traders" - the segment after /apply/. */
  applicationKind: string;
  /** Event slug - used in both the direct URL and the iframe src. */
  slug: string;
  /** Title attribute on the embed iframe (also used as the H3 hint
   *  for screen readers). E.g. "Show car applications". */
  iframeTitle: string;
}) {
  // Colour scheme for the public form. Light is the default and is
  // left out of the URL entirely, so an embed copied before this
  // existed keeps working and a light link stays clean.
  const [theme, setTheme] = useState<ApplyTheme>("light");

  // Applied to BOTH links, not just the embed. They point at the same
  // public form, and a toggle that silently changed one of two adjacent
  // URLs would be a trap.
  const directUrl = withApplyTheme(
    `https://account.carevents.com/apply/${applicationKind}/${slug}`,
    theme,
  );
  const embedSrc = withApplyTheme(
    `https://account.carevents.com/embed/${applicationKind}/${slug}`,
    theme,
  );
  const embedSnippet = `<iframe
  src="${embedSrc}"
  width="100%"
  height="800"
  frameborder="0"
  allow="payment"
  title="${iframeTitle}"></iframe>`;

  const [copiedKey, setCopiedKey] = useState<"url" | "embed" | null>(null);

  const copy = async (text: string, key: "url" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // Clipboard write blocked (e.g. iOS without HTTPS) - silently
      // ignore; the user can still select & copy by hand.
    }
  };

  return (
    <>
      {/* Live-status callout. Same colour scheme as the links card
          below - it announces that the public form is already active
          on the event's carevents.com listing, no extra setup needed. */}
      <div className="app-links-card mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-circle-check text-gold-600" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-900">
              Applications are live
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              This form is now enabled on your CarEvents listing for people
              to submit an application.
            </p>
          </div>
        </div>
      </div>

      <div className="app-links-card mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-link text-gold-600" aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink-900">
            Link or embed form
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Share directly or embed on your own website.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Colour scheme. Sits above both fields because it governs
            both - the direct link and the embed open the same form. */}
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
            Application Link
          </label>
          <div className="link-row">
            <span className="link-icon">
              <i className="fa-solid fa-globe text-xs" aria-hidden />
            </span>
            {/* A real link rather than a read-only input - opens the
                public form in a new tab; Copy still sits alongside. */}
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
              onClick={() => copy(embedSnippet, "embed")}
              className={`copy-btn ${copiedKey === "embed" ? "is-copied" : ""}`}
            >
              <i className="fa-regular fa-copy" aria-hidden />
              {copiedKey === "embed" ? "Copied" : "Copy"}
            </button>
            <pre>{embedSnippet}</pre>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
