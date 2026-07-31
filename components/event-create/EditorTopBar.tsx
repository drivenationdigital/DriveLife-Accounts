"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEventCreate } from "@/context/EventCreateContext";
import { useEditorSave } from "@/lib/useEditorSave";

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
  const router = useRouter();
  const { run, phase, isSaving } = useEditorSave();

  // The topbar's rocket is an explicit "go live" — it publishes
  // regardless of the panel selection, except when the user has set up
  // a schedule (in which case we honour it and save as scheduled).
  const onPublish = async () => {
    if (isSaving) return;
    try {
      const res = await run({
        overrideStatus:
          state.status === "scheduled" ? "scheduled" : "published",
      });
      // Drafts stay in the editor; anything live/scheduled goes to the
      // event view. (post_status from the API: publish | future | draft.)
      if (res.post_status !== "draft") {
        router.push(`/events/${res.encrypted_id}`);
      }
    } catch {
      // Error surfaces via `phase` on the status pill below.
    }
  };

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
          <span className="hidden sm:inline text-sm font-medium">
            Dashboard
          </span>
        </Link>

        {/* Vertical divider — only visible on tablets where both the back
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

        {/* Spacer for desktop — pushes actions to the right edge. */}
        <div className="hidden lg:block flex-1" />

        {/* Save status pill — md+ only (mobile keeps the bar uncluttered).
            Reflects the shared save mutation state. */}
        <SaveStatusPill phase={phase} />

        {/* Preview button — sm+ (no value squeezing it onto a phone).
            Only shown once the event is saved and has a post id; opens
            the WP preview URL. */}
        {state.postId && (
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
        )}

        {/* Publish — primary CTA. Label hides on phones, icon stays. */}
        <button
          type="button"
          onClick={onPublish}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <i
            className={`text-xs ${
              isSaving ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-rocket"
            }`}
            aria-hidden
          />
          <span className="hidden sm:inline">
            {isSaving ? "Publishing…" : "Publish"}
          </span>
        </button>
      </div>
    </header>
  );
}

/**
 * Live save indicator. Mirrors the four phases of the shared save
 * mutation. Idle (before the first save) reads "Not saved yet" so the
 * pill never claims a state that isn't true.
 */
function SaveStatusPill({
  phase,
}: {
  phase: "idle" | "saving" | "saved" | "error";
}) {
  const config = {
    idle: { dot: "bg-ink-300", label: "Not saved yet", pulse: false },
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
