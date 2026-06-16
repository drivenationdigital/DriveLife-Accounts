"use client";

import { useState } from "react";

/**
 * "Application links" card used at the bottom of the Show Cars,
 * Car Clubs and Traders panels.
 *
 * Two pieces:
 *   1. Direct URL — read-only input + Copy button.
 *   2. Embed — preformatted iframe snippet + Copy button.
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
  /** "show-cars" | "car-clubs" | "traders" — the segment after /apply/. */
  applicationKind: string;
  /** Event slug — used in both the direct URL and the iframe src. */
  slug: string;
  /** Title attribute on the embed iframe (also used as the H3 hint
   *  for screen readers). E.g. "Show car applications". */
  iframeTitle: string;
}) {
  const directUrl = `https://www.account.drive-life.com/apply/${applicationKind}/${slug}`;
  const embedSrc = `https://www.account.drive-life.com/embed/${applicationKind}/${slug}`;
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
      // Clipboard write blocked (e.g. iOS without HTTPS) — silently
      // ignore; the user can still select & copy by hand.
    }
  };

  return (
    <div className="app-links-card mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-link text-gold-600" aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink-900">
            Application links
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Share directly or embed on your own website.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
            Direct URL
          </label>
          <div className="link-row">
            <span className="link-icon">
              <i className="fa-solid fa-globe text-xs" aria-hidden />
            </span>
            <input type="text" readOnly value={directUrl} />
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
  );
}
