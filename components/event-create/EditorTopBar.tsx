"use client";

import Link from "next/link";

import { useEventCreate } from "@/context/EventCreateContext";
import { eventDetailPath } from "@/lib/siteRoutes";
import { useEventRegion } from "@/lib/useEventSteps";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { useEditorSave } from "@/lib/useEditorSave";

/**
 * Sticky topbar for the event editor.
 *
 * Mobile/tablet: shows the event title in the header (since the desktop
 * sidebar - which also shows the title - is hidden on those breakpoints).
 *
 * Desktop (lg+): the title is in the sidebar; the header keeps a flexible
 * spacer so the action buttons stay right-aligned.
 *
 * "Saved" pill is hardcoded for now. Once we wire up the create-event
 * mutation, it'll reflect actual save state (idle / saving / saved /
 * error). The DOM stays the same - only the icon + label change.
 */
export function EditorTopBar() {
  const { state } = useEventCreate();
  const { run, phase, isSaving } = useEditorSave();
  const region = useEventRegion();

  // The topbar button does exactly what the Publish panel's radio says
  // - nothing more. It used to force "published" whenever the event
  // wasn't live yet, which made sense for a brand-new event (the radio
  // defaults to Publish now anyway) but trapped an organiser who had
  // taken a live event back to Draft: every later edit could only be
  // saved by publishing again. Now Draft saves a draft, Publish now
  // publishes, Schedule schedules, and the label says which.
  //
  // Saving keeps you in the editor; useEditorSave pops the success
  // toast and refreshes the save-state pill.
  const onSave = async () => {
    if (isSaving) return;
    try {
      await run();
    } catch {
      // Error surfaces via `phase` on the status pill below.
    }
  };

  // What the server holds right now, as opposed to what the radio says.
  const alreadyPublished = state.livePostStatus === "publish";
  const alreadyScheduled = state.livePostStatus === "future";
  const currentlyVisible = alreadyPublished || alreadyScheduled;

  // Whether this click takes the event from not-live to live (or
  // scheduled) - the one-way moment that earns the rocket. Everything
  // else, including unpublishing, is a plain save.
  const willGoLive =
    (state.status === "published" && !alreadyPublished) ||
    (state.status === "scheduled" && !alreadyScheduled);

  // Short enough for the mobile topbar; the Publish panel's big button
  // carries the longer wording. "Save as draft" flags the one case
  // where a save changes visibility: a live or scheduled event being
  // pulled back to draft.
  const ctaLabel =
    state.status === "draft"
      ? currentlyVisible
        ? "Save as draft"
        : "Save"
      : state.status === "scheduled"
        ? alreadyScheduled
          ? "Save"
          : "Schedule"
        : alreadyPublished
          ? "Save"
          : "Publish";
  const busyLabel = willGoLive
    ? state.status === "scheduled"
      ? "Scheduling…"
      : "Publishing…"
    : "Saving…";
  const ctaIcon = willGoLive ? "fa-solid fa-rocket" : "fa-solid fa-floppy-disk";

  // `encryptedId` is set once the event exists server-side. Before that
  // - a brand new event still being drafted - there is no overview page
  // to go back to, so the dashboard stays the destination.
  const backHref = state.encryptedId
    ? eventDetailPath(state.encryptedId, state.site)
    : "/";
  const backLabel = state.encryptedId ? "Event Overview" : "Dashboard";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-200">
      <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
        {/* Back link.
            Goes to the event's own overview - that's where the user came
            from when they hit Edit, so it's what "back" means here.
            Falls back to the dashboard while creating, when there is no
            saved event to return to yet.

            The label follows the destination rather than being fixed:
            an arrow labelled "Dashboard" that lands on the event page
            is worse than no label.

            Uses Next's Link so navigation stays client-side and the auth
            token cookie is preserved naturally (no full reload). */}
        <Link
          href={backHref}
          className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition"
          aria-label={`Back to ${backLabel.toLowerCase()}`}
        >
          <i className="fa-solid fa-arrow-left text-sm" aria-hidden />
          <span className="hidden sm:inline text-sm font-medium">
            {backLabel}
          </span>
        </Link>

        {/* Vertical divider - only visible on tablets where both the back
            link and the title are showing. Hidden on lg+ since the title
            moves into the sidebar. */}
        <div
          className="h-6 w-px bg-ink-200 hidden sm:block lg:hidden"
          aria-hidden
        />

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

        {/* Spacer for desktop - pushes actions to the right edge. */}
        <div className="hidden lg:block flex-1" />

        {/* Region, read-only. Fixed when the event was created - a post
            lives on one blog - so this is a marker, not a control. It
            explains why dates and prices look the way they do, and why
            a listing-only region shows no ticketing steps. */}
        <span
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ink-600"
          title={`This event is listed in ${region.label}. This can't be changed.`}
        >
          <CountryFlag country={region.country} label={region.label} />
          {region.abbr}
        </span>

        {/* Save status pill - md+ only (mobile keeps the bar uncluttered).
            Reflects the shared save mutation state, plus whether edits
            have been made since the last save. */}
        <SaveStatusPill phase={phase} isDirty={state.isDirty} />

        {/* Preview button - sm+ (no value squeezing it onto a phone).
            Only shown once the event is saved and has a post id; opens
            the WP preview URL. */}
        {/* {state.postId && (
          <a
            href={`${
              process.env.NEXT_PUBLIC_CAREVENTS_URL ||
              "https://www.carevents.com/uk"
            }/?post_type=events&p=${state.postId}&preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ink-900 hover:bg-black rounded-lg transition"
          >
            <i className="fa-regular fa-eye" aria-hidden />
            Preview
          </a>
        )} */}

        {/* Save/Publish - primary CTA. Wording and icon follow the
            Publish panel's radio plus what the server currently holds
            (see ctaLabel above). */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <i
            className={`text-xs ${
              isSaving ? "fa-solid fa-spinner fa-spin" : ctaIcon
            }`}
            aria-hidden
          />
          {/* Label shows on all breakpoints - a bare icon on phones
              read as ambiguous, and every variant is short enough to
              fit the mobile topbar. */}
          <span>{isSaving ? busyLabel : ctaLabel}</span>
        </button>
      </div>
    </header>
  );
}

/**
 * Live save indicator. Mirrors the four phases of the shared save
 * mutation. Idle (before the first save) reads "Not saved yet" so the
 * pill never claims a state that isn't true.
 *
 * `isDirty` overrides a stale "Saved": edits made after the last save
 * flip the pill to "Not saved" until the user saves again. Saving and
 * error phases still win - they describe the in-flight/failed save
 * regardless of further edits.
 */
function SaveStatusPill({
  phase,
  isDirty,
}: {
  phase: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
}) {
  const config =
    phase === "saving" || phase === "error"
      ? {
          saving: { dot: "bg-amber-500", label: "Saving…", pulse: true },
          error: { dot: "bg-red-500", label: "Couldn’t save", pulse: false },
        }[phase]
      : isDirty
        ? { dot: "bg-amber-500", label: "Not saved", pulse: false }
        : phase === "saved"
          ? { dot: "bg-emerald-500", label: "Saved", pulse: false }
          : { dot: "bg-ink-300", label: "Not saved yet", pulse: false };

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
