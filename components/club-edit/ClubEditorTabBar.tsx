"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  CLUB_EDIT_STEPS,
  DEFAULT_CLUB_STEP,
  type ClubEditStepKey,
} from "@/lib/clubEditSteps";

/**
 * Mobile / tablet horizontal tab bar - visible below lg. Sticky directly
 * beneath the topbar (top-14 on phones / top-16 on tablets matches the
 * topbar's height breakpoint).
 *
 * Auto-scrolls the active tab into view when it changes - without this,
 * advancing past tab 4 or 5 leaves the active tab off-screen after a
 * "Continue" tap.
 */
export function ClubEditorTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const activeStep =
    (searchParams.get("step") as ClubEditStepKey | null) ?? DEFAULT_CLUB_STEP;

  const goToStep = (key: ClubEditStepKey) => {
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
          aria-label="Club editor sections"
        >
          {CLUB_EDIT_STEPS.map((step) => {
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
                onClick={() => goToStep(step.key)}
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
