"use client";

import { useEventSteps } from "@/lib/useEventSteps";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useEventCreate } from "@/context/EventCreateContext";
import {
  DEFAULT_STEP,
  type EventCreateStepKey,
} from "@/lib/eventCreateSteps";

/**
 * Desktop sidebar - visible at lg+ only.
 *
 * Step navigation is URL-driven (`?step=basics`) so individual steps
 * are deep-linkable, share-able, and browser back/forward navigates
 * between them. Clicking a step pushes the new search param without
 * scrolling (Next.js router handles this).
 *
 * The "complete" indicator state is not yet wired up - placeholder is
 * `false` everywhere. Once we have validation per step, we'll derive
 * completeness from the form state. The CSS already supports it
 * (`.side-tab.is-complete` swaps the number for a checkmark).
 *
 * Progress footer shows visited-step count. For now it just shows
 * `1 / 10` since we don't track visits yet - to be extended.
 */
export function EditorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useEventCreate();

  const activeStep =
    (searchParams.get("step") as EventCreateStepKey | null) ?? DEFAULT_STEP;

  const goToStep = (key: EventCreateStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Steps come from the hook rather than the module constant: a
  // listing-only region has no ticketing steps, so both the list and
  // the "N / M" progress count are shorter there.
  const { steps, stepCount } = useEventSteps();

  // Progress display - for now, just the active step's number. Will be
  // replaced by completed-step count once validation lands.
  const activeStepNumber =
    steps.find((s) => s.key === activeStep)?.number ?? 1;
  const progressPct = (activeStepNumber / stepCount) * 100;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white">
      {/* Event title block - desktop only because the topbar already
          shows the title on smaller breakpoints. */}
      <div className="px-6 pt-6 pb-5 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-1.5">
          Editing event
        </p>
        <h2 className="font-display text-xl text-ink-900 leading-snug">
          {state.title}
        </h2>
      </div>

      {/* Step navigation - vertical list. */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Event editor sections"
      >
        <ul className="space-y-0.5">
          {steps.map((step) => {
            const isActive = step.key === activeStep;
            // Completeness placeholder - always false until validation wired up.
            const isComplete = false;
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
            {activeStepNumber} / {stepCount}
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
