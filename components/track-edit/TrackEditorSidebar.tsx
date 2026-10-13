"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useTrackEdit } from "@/context/TrackEditContext";
import {
  TRACK_EDIT_STEPS,
  TRACK_EDIT_STEP_COUNT,
  DEFAULT_TRACK_STEP,
  type TrackEditStepKey,
} from "@/lib/trackEditSteps";

/**
 * Desktop sidebar - visible at lg+ only. Same structure and the same
 * `.side-tab` styling as the event and club editors.
 *
 * Step navigation is URL-driven (`?step=profile`) so individual steps are
 * deep-linkable and browser back/forward moves between them.
 *
 * Jumping backwards is always allowed; jumping forwards past a step with
 * invalid fields is not, matching the Continue button's gating. Skipping
 * ahead from the sidebar would otherwise be a way around validation.
 */
export function TrackEditorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { track, validateStep } = useTrackEdit();

  const activeStep =
    (searchParams.get("step") as TrackEditStepKey | null) ?? DEFAULT_TRACK_STEP;
  const activeIndex = TRACK_EDIT_STEPS.findIndex((s) => s.key === activeStep);

  const goToStep = (key: TrackEditStepKey, targetIndex: number) => {
    // Moving forward re-checks the step we're leaving.
    if (targetIndex > activeIndex && !validateStep(activeStep)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeStepNumber = activeIndex >= 0 ? activeIndex + 1 : 1;
  const progressPct = (activeStepNumber / TRACK_EDIT_STEP_COUNT) * 100;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white">
      {/* Track title block - desktop only, because the topbar already
          shows the title on smaller breakpoints. */}
      <div className="px-6 pt-6 pb-5 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-1.5">
          Editing track
        </p>
        <h2 className="font-display text-xl text-ink-900 leading-snug">
          {track.title || "Untitled track"}
        </h2>
        <p className="text-xs text-ink-500 mt-2 flex items-center gap-1.5">
          <i
            className="fa-solid fa-location-dot text-gold-600 text-[10px]"
            aria-hidden
          />
          <span className="truncate">
            {track.location || "No location set"}
          </span>
        </p>
      </div>

      {/* Step navigation - vertical list. */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Track editor sections"
      >
        <ul className="space-y-0.5">
          {TRACK_EDIT_STEPS.map((step, i) => {
            const isActive = step.key === activeStep;
            const isComplete = i < activeIndex;
            const classes = [
              "side-tab",
              isActive && "is-active",
              isComplete && "is-complete",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <li key={step.key}>
                <button
                  type="button"
                  className={classes}
                  onClick={() => goToStep(step.key, i)}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span className="side-num">
                    <span className="num-text">{step.number}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="side-tab-label block">{step.label}</span>
                    <span className="side-tab-sub block">{step.sublabel}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Progress footer. */}
      <div className="px-6 py-4 border-t border-ink-200 bg-ink-50">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-ink-700">Progress</span>
          <span className="text-ink-500">
            {activeStepNumber} / {TRACK_EDIT_STEP_COUNT}
          </span>
        </div>
        <div className="h-1.5 bg-ink-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
