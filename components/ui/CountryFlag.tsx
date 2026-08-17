"use client";

import { useId } from "react";

/**
 * Inline SVG country flags.
 *
 * Deliberately not emoji flags (🇬🇧) - Windows has no flag glyphs, so
 * those render as bare "GB" letters for a good chunk of our users.
 * Unknown codes fall back to a plain code chip, so adding a new
 * multisite country doesn't break the UI before the flag is drawn.
 */

interface Props {
  /** ISO 3166-1 alpha-2, e.g. "GB". Case-insensitive. */
  country: string;
  /** Tooltip / screen-reader label, e.g. "United Kingdom". */
  label?: string;
  className?: string;
}

export function CountryFlag({ country, label, className }: Props) {
  const code = (country ?? "").toUpperCase();
  const title = label || code;

  let flag;
  if (code === "GB") flag = <UnionJack />;
  else if (code === "US") flag = <StarsAndStripes />;
  else flag = <CodeChip code={code} />;

  return (
    <span
      className={`country-flag ${className ?? ""}`}
      role="img"
      aria-label={title}
      title={title}
    >
      {flag}
    </span>
  );
}

// ─── Flags ────────────────────────────────────────────────────────────

function UnionJack() {
  // Two clip paths are needed: one to keep the diagonals inside the
  // rect, one to offset the red diagonals into the correct quadrants.
  // ids must be unique per instance or the first one wins document-wide.
  const uid = useId();
  const box = `clip-box-${uid}`;
  const diag = `clip-diag-${uid}`;
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" focusable="false">
      <clipPath id={box}>
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id={diag}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath={`url(#${box})`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath={`url(#${diag})`}
          stroke="#c8102e"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  );
}

function StarsAndStripes() {
  const stripe = 30 / 13;
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" focusable="false">
      <rect width="60" height="30" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect
          key={i}
          y={i * stripe}
          width="60"
          height={stripe}
          fill="#b31942"
        />
      ))}
      <rect width="24" height={stripe * 7} fill="#0a3161" />
      {/* Stars are suggested rather than counted - the badge renders at
          ~20px wide, where 50 accurate stars turn into mush. */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={3.4 + col * 4.4}
            cy={2.6 + row * 3.4 + (col % 2 ? 1.7 : 0)}
            r="1"
            fill="#fff"
          />
        ))
      )}
    </svg>
  );
}

function CodeChip({ code }: { code: string }) {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" focusable="false">
      <rect width="60" height="30" rx="3" fill="var(--bg-2)" />
      <text
        x="30"
        y="21"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="var(--ink-3)"
      >
        {code || "?"}
      </text>
    </svg>
  );
}
