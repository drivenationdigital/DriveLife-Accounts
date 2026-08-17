"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useClubEdit } from "@/context/ClubEditContext";
import {
  CLUB_EDIT_STEPS,
  CLUB_EDIT_STEP_COUNT,
  DEFAULT_CLUB_STEP,
  type ClubEditStepKey,
} from "@/lib/clubEditSteps";

/**
 * Desktop sidebar - visible at lg+ only. Same structure and the same
 * `.side-tab` styling as the event editor's EditorSidebar.
 *
 * Step navigation is URL-driven (`?step=profile`) so individual steps are
 * deep-linkable and browser back/forward moves between them.
 *
 * Unlike the event editor, completeness here is real rather than a
 * placeholder: a step counts as complete once the user has moved past it,
 * which is the same signal the old numbered wizard used for its ticks.
 */
export function ClubEditorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { club } = useClubEdit();

  const activeStep =
    (searchParams.get("step") as ClubEditStepKey | null) ?? DEFAULT_CLUB_STEP;

  const goToStep = (key: ClubEditStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeIndex = CLUB_EDIT_STEPS.findIndex((s) => s.key === activeStep);
  const activeStepNumber = activeIndex >= 0 ? activeIndex + 1 : 1;
  const progressPct = (activeStepNumber / CLUB_EDIT_STEP_COUNT) * 100;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white">
      {/* Club title block - desktop only, because the topbar already
          shows the title on smaller breakpoints. */}
      <div className="px-6 pt-6 pb-5 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-1.5">
          Editing club
        </p>
        <h2 className="font-display text-xl text-ink-900 leading-snug">
          {club.title || "Untitled club"}
        </h2>
        <p className="text-xs text-ink-500 mt-2 flex items-center gap-1.5">
          <i
            className="fa-solid fa-users text-gold-600 text-[10px]"
            aria-hidden
          />
          {club.locationType === "2"
            ? club.location || "Local/Regional club"
            : "National club"}
        </p>
      </div>

      {/* Step navigation - vertical list. */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Club editor sections"
      >
        <ul className="space-y-0.5">
          {CLUB_EDIT_STEPS.map((step, i) => {
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
                  onClick={() => goToStep(step.key)}
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
            {activeStepNumber} / {CLUB_EDIT_STEP_COUNT}
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
