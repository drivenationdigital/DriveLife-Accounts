"use client";

import Link from "next/link";

import { useClubEdit } from "@/context/ClubEditContext";
import { useClubSave, type ClubSavePhase } from "@/context/ClubSaveContext";

/**
 * Sticky topbar for the club editor. Mirrors EditorTopBar in the event
 * editor — same height, same back link, same right-aligned primary CTA —
 * so moving between the two editors doesn't feel like two apps.
 *
 * Mobile/tablet: shows the club title in the header (the desktop sidebar,
 * which also shows the title, is hidden at those breakpoints).
 *
 * Desktop (lg+): the title lives in the sidebar; the header keeps a
 * flexible spacer so the actions stay pinned right.
 *
 * There's no Preview button (unlike the event editor) — clubs have no
 * public view route yet. When one lands it slots in left of Update Club.
 */
export function ClubEditorTopBar() {
  const { club, isDirty } = useClubEdit();
  const { save, phase, isSaving } = useClubSave();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-200">
      <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
        <Link
          href="/clubs"
          className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition"
        >
          <i className="fa-solid fa-arrow-left text-sm" aria-hidden />
          <span className="hidden sm:inline text-sm font-medium">Clubs</span>
        </Link>

        {/* Divider — only on tablets, where the back link and the title
            are both showing. Hidden at lg+ once the title moves into the
            sidebar. */}
        <div
          className="h-6 w-px bg-ink-200 hidden sm:block lg:hidden"
          aria-hidden
        />

        {/* Title block (mobile/tablet only). Phones drop the eyebrow to
            save vertical space. */}
        <div className="flex-1 min-w-0 lg:hidden">
          <p className="text-[11px] uppercase tracking-widest text-ink-400 font-semibold hidden sm:block">
            Edit club
          </p>
          <h1 className="text-sm sm:text-base font-semibold truncate text-ink-900">
            {club.title || "Untitled club"}
          </h1>
        </div>

        {/* Spacer for desktop — pushes actions to the right edge. */}
        <div className="hidden lg:block flex-1" />

        <SaveStatusPill phase={phase} isDirty={isDirty} />

        <button
          type="button"
          onClick={save}
          disabled={isSaving || !isDirty}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <i
            className={`text-xs ${
              isSaving
                ? "fa-solid fa-spinner fa-spin"
                : "fa-solid fa-floppy-disk"
            }`}
            aria-hidden
          />
          <span className="hidden sm:inline">
            {isSaving ? "Saving…" : "Update Club"}
          </span>
        </button>
      </div>
    </header>
  );
}

/**
 * Live save indicator. Same four phases as the event editor's pill, plus
 * a dirty state — idle-but-dirty reads "Unsaved changes" rather than the
 * event editor's "Not saved yet", because a club being edited always
 * exists already.
 */
function SaveStatusPill({
  phase,
  isDirty,
}: {
  phase: ClubSavePhase;
  isDirty: boolean;
}) {
  const config =
    phase === "idle" && isDirty
      ? { dot: "bg-amber-500", label: "Unsaved changes", pulse: false }
      : {
          idle: { dot: "bg-ink-300", label: "All changes saved", pulse: false },
          saving: { dot: "bg-amber-500", label: "Saving…", pulse: true },
          saved: { dot: "bg-emerald-500", label: "Saved", pulse: false },
          error: { dot: "bg-red-500", label: "Couldn’t save", pulse: false },
        }[phase];

  return (
    <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-ink-500">
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} ${
          config.pulse ? "animate-pulse" : ""
        }`}
        aria-hidden
      />
      {config.label}
    </span>
  );
}
