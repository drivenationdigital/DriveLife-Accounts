"use client";

import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  LinkIcon,
} from "@/components/ui/Icons";
import { applyFormUrl, type ApplyFormKind } from "@/lib/applyFormUrl";

/**
 * Compact "public application form" link bar for the Show Cars, Clubs
 * and Traders tabs on the event view.
 *
 * The dashboard cousin of the editor's ApplicationLinksCard: same
 * public URLs, but rendered with the dashboard's own section/button
 * styling (this layout doesn't load Font Awesome or editor.css, so
 * neither the fa-* icons nor .link-row exist here - inline SVG icons
 * and inline styles instead).
 *
 * Built on the current origin so the link is right in every
 * environment (staging URLs on staging, live on live) - unlike the
 * editor card's hardcoded live host.
 */
export function ApplicationLinkBar({
  kind,
  eid,
  title,
}: {
  /** "show-car" | "car-club" | "trader" - the form kind. */
  kind: ApplyFormKind;
  /** Encrypted event id. */
  eid: string;
  /** e.g. "Show car application form". */
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  // apply.carevents.com short form in production, current-origin
  // /apply path elsewhere - see lib/applyFormUrl.ts.
  const url = applyFormUrl(kind, eid);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked - the visible link can still be selected.
    }
  };

  return (
    <div className="section" style={{ marginBottom: 16 }}>
      <div
        className="section-body"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "12px 16px",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "var(--gold-soft, #f2ead8)",
            color: "var(--gold-deep, #8a6d3f)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LinkIcon />
        </span>
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mono"
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--gold-deep, #8a6d3f)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textDecoration: "none",
            }}
          >
            {url}
          </a>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={copy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          >
            <ExternalLinkIcon /> Open
          </button>
        </div>
      </div>
    </div>
  );
}
