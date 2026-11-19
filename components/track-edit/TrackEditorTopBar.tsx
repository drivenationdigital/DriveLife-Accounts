"use client";

import Link from "next/link";

import {
  useTrackEdit,
  type TrackSavePhase,
} from "@/context/TrackEditContext";
import { resolveRegion } from "@/lib/regions";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { useTrackStepNav, trackSaveCta } from "./shared";

/**
 * Sticky topbar for the track editor. Same height, same back link, same
 * right-aligned primary CTA as the event and club editors.
 *
 * Mobile/tablet: shows the track title (the desktop sidebar, which also
 * shows it, is hidden at those breakpoints). Desktop (lg+): the title is
 * in the sidebar and a flexible spacer pins the actions right.
 *
 * The save button does what the Publish step's status says and its
 * label says which: "Publish" (with the rocket) only for the click that
 * takes the track live, "Save as draft" when a live track is being
 * pulled back, plain "Save" otherwise.
 *
 * Saving with a required field empty jumps back to the step that holds
 * it, so the revealed error is actually on screen.
 */
export function TrackEditorTopBar() {
  const { track, liveStatus, isDirty, save, phase, isSaving } = useTrackEdit();
  const { goToStep } = useTrackStepNav();
  const region = resolveRegion(track.site);
  const cta = trackSaveCta(track.status, liveStatus);

  const onSave = async () => {
    if (isSaving) return;
    const jumpTo = await save();
    if (jumpTo) goToStep(jumpTo);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-200">
      <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
        <Link
          href="/tracks"
          className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition"
        >
          <i className="fa-solid fa-arrow-left text-sm" aria-hidden />
          <span className="hidden sm:inline text-sm font-medium">Tracks</span>
        </Link>

        <div
          className="h-6 w-px bg-ink-200 hidden sm:block lg:hidden"
          aria-hidden
        />

        <div className="flex-1 min-w-0 lg:hidden">
          <p className="text-[11px] uppercase tracking-widest text-ink-400 font-semibold hidden sm:block">
            Edit track
          </p>
          <h1 className="text-sm sm:text-base font-semibold truncate text-ink-900">
            {track.title || "Untitled track"}
          </h1>
        </div>

        <div className="hidden lg:block flex-1" />

        {/* Region, read-only - a track lives on one site. A marker, not
            a control; same pill as the event editor. */}
        <span
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ink-600"
          title={`This track is listed in ${region.label}. This can't be changed.`}
        >
          <CountryFlag country={region.country} label={region.label} />
          {region.abbr}
        </span>

        <SaveStatusPill phase={phase} isDirty={isDirty} />

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <i
            className={`text-xs ${
              isSaving ? "fa-solid fa-spinner fa-spin" : cta.icon
            }`}
            aria-hidden
          />
          {/* Label shows on all breakpoints - a bare icon on phones read
              as ambiguous, and every variant is short enough to fit. */}
          <span>{isSaving ? cta.busyLabel : cta.label}</span>
        </button>
      </div>
    </header>
  );
}

/**
 * Live save indicator. Same phases as the club editor's pill - an
 * idle-but-dirty track reads "Unsaved changes" rather than the event
 * editor's "Not saved yet", because a track being edited already exists.
 */
function SaveStatusPill({
  phase,
  isDirty,
}: {
  phase: TrackSavePhase;
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
