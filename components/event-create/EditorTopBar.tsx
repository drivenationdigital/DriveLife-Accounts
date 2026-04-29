"use client";

import Link from "next/link";

import { useEventCreate } from "@/context/EventCreateContext";

/**
 * Sticky topbar for the event editor.
 *
 * Mobile/tablet: shows the event title in the header (since the desktop
 * sidebar — which also shows the title — is hidden on those breakpoints).
 *
 * Desktop (lg+): the title is in the sidebar; the header keeps a flexible
 * spacer so the action buttons stay right-aligned.
 *
 * "Saved" pill is hardcoded for now. Once we wire up the create-event
 * mutation, it'll reflect actual save state (idle / saving / saved /
 * error). The DOM stays the same — only the icon + label change.
 */
export function EditorTopBar() {
  const { state } = useEventCreate();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-200">
      <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
        {/* Back to dashboard.
            Uses Next's Link so navigation stays client-side and the auth
            token cookie is preserved naturally (no full reload). */}
        <Link
          href="/"
          className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition"
        >
          <i className="fa-solid fa-arrow-left text-sm" aria-hidden />
          <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
        </Link>

        {/* Vertical divider — only visible on tablets where both the back
            link and the title are showing. Hidden on lg+ since the title
            moves into the sidebar. */}
        <div className="h-6 w-px bg-ink-200 hidden sm:block lg:hidden" aria-hidden />

        {/* Title block (mobile/tablet only). On phones we drop the
            "Edit event" eyebrow to save vertical space. */}
        <div className="flex-1 min-w-0 lg:hidden">
          <p className="text-[11px] uppercase tracking-widest text-ink-400 font-semibold hidden sm:block">
            Edit event
          </p>
          <h1 className="text-sm sm:text-base font-semibold truncate text-ink-900">
            {state.title}
          </h1>
        </div>

        {/* Spacer for desktop — pushes actions to the right edge. */}
        <div className="hidden lg:block flex-1" />

        {/* Save status pill — md+ only (mobile keeps the bar uncluttered). */}
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-ink-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
          Saved
        </span>

        {/* Preview button — sm+ (no value squeezing it onto a phone). */}
        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ink-900 hover:bg-black rounded-lg transition"
        >
          <i className="fa-regular fa-eye" aria-hidden />
          Preview
        </button>

        {/* Publish — primary CTA. Label hides on phones, icon stays. */}
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition shadow-sm"
        >
          <i className="fa-solid fa-rocket text-xs" aria-hidden />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>
    </header>
  );
}
