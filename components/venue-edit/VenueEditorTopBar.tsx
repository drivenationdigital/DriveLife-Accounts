"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  useVenueEdit,
  type VenueSavePhase,
} from "@/context/VenueEditContext";
import type { VenueEditStepKey } from "@/lib/venueEditSteps";

/**
 * Sticky topbar for the venue editor. Same height, same back link, same
 * right-aligned primary CTA as the event and club editors.
 *
 * Mobile/tablet: shows the venue title (the desktop sidebar, which also
 * shows it, is hidden at those breakpoints). Desktop (lg+): the title is
 * in the sidebar and a flexible spacer pins the actions right.
 *
 * Saving with a required field empty jumps back to the step that holds
 * it, so the revealed error is actually on screen.
 */
export function VenueEditorTopBar() {
  const { venue, isDirty, save, phase, isSaving } = useVenueEdit();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSave = async () => {
    const jumpTo = await save();
    if (jumpTo) goToStep(jumpTo);
  };

  const goToStep = (key: VenueEditStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-200">
      <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
        <Link
          href="/venues"
          className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition"
        >
          <i className="fa-solid fa-arrow-left text-sm" aria-hidden />
          <span className="hidden sm:inline text-sm font-medium">Venues</span>
        </Link>

        <div
          className="h-6 w-px bg-ink-200 hidden sm:block lg:hidden"
          aria-hidden
        />

        <div className="flex-1 min-w-0 lg:hidden">
          <p className="text-[11px] uppercase tracking-widest text-ink-400 font-semibold hidden sm:block">
            Edit venue
          </p>
          <h1 className="text-sm sm:text-base font-semibold truncate text-ink-900">
            {venue.title || "Untitled venue"}
          </h1>
        </div>

        <div className="hidden lg:block flex-1" />

        <SaveStatusPill phase={phase} isDirty={isDirty} />

        <button
          type="button"
          onClick={onSave}
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
            {isSaving ? "Saving…" : "Update Venue"}
          </span>
        </button>
      </div>
    </header>
  );
}

/**
 * Live save indicator. Same phases as the club editor's pill - an
 * idle-but-dirty venue reads "Unsaved changes" rather than the event
 * editor's "Not saved yet", because a venue being edited already exists.
 */
function SaveStatusPill({
  phase,
  isDirty,
}: {
  phase: VenueSavePhase;
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
