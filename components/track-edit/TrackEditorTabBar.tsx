"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useTrackEdit } from "@/context/TrackEditContext";
import {
  TRACK_EDIT_STEPS,
  DEFAULT_TRACK_STEP,
  type TrackEditStepKey,
} from "@/lib/trackEditSteps";

/**
 * Mobile / tablet horizontal tab bar - visible below lg. Sticky directly
 * beneath the topbar (top-14 on phones / top-16 on tablets matches the
 * topbar's height breakpoint).
 *
 * Auto-scrolls the active tab into view when it changes, and gates
 * forward jumps on the current step validating - same rule as the
 * sidebar and the Continue button.
 */
export function TrackEditorTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { validateStep } = useTrackEdit();

  const activeStep =
    (searchParams.get("step") as TrackEditStepKey | null) ?? DEFAULT_TRACK_STEP;
  const activeIndex = TRACK_EDIT_STEPS.findIndex((s) => s.key === activeStep);

  const goToStep = (key: TrackEditStepKey, targetIndex: number) => {
    if (targetIndex > activeIndex && !validateStep(activeStep)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector<HTMLElement>(
      `[data-step="${activeStep}"]`,
    );
    activeEl?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeStep]);

  return (
    <nav className="lg:hidden sticky top-14 sm:top-16 z-30 bg-white border-b border-ink-200">
      <div className="max-w-6xl mx-auto px-2 sm:px-6">
        <div
          ref={containerRef}
          className="no-scrollbar overflow-x-auto flex items-center"
          role="tablist"
          aria-label="Track editor sections"
        >
          {TRACK_EDIT_STEPS.map((step, i) => {
            const isActive = step.key === activeStep;
            const classes = [
              "tab",
              "flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium hover:text-ink-900 transition",
              isActive ? "is-active" : "text-ink-500",
            ].join(" ");
            return (
              <button
                key={step.key}
                type="button"
                className={classes}
                data-step={step.key}
                onClick={() => goToStep(step.key, i)}
                role="tab"
                aria-selected={isActive}
              >
                <span className="tab-num">
                  <span className="num-text">{step.number}</span>
                </span>
                {step.mobileLabel}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
