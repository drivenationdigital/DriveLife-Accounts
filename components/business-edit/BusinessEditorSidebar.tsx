"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useBusinessEdit } from "@/context/BusinessEditContext";
import {
  BUSINESS_EDIT_STEPS,
  BUSINESS_EDIT_STEP_COUNT,
  DEFAULT_BUSINESS_STEP,
  type BusinessEditStepKey,
} from "@/lib/businessEditSteps";

/**
 * Desktop sidebar - visible at lg+ only. Same `.side-tab` structure as
 * the event, club and venue editors. Forward jumps are gated on the
 * current step validating, matching the Continue button.
 */
export function BusinessEditorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { business, validateStep } = useBusinessEdit();

  const activeStep =
    (searchParams.get("step") as BusinessEditStepKey | null) ??
    DEFAULT_BUSINESS_STEP;
  const activeIndex = BUSINESS_EDIT_STEPS.findIndex((s) => s.key === activeStep);

  const goToStep = (key: BusinessEditStepKey, targetIndex: number) => {
    if (targetIndex > activeIndex && !validateStep(activeStep)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeStepNumber = activeIndex >= 0 ? activeIndex + 1 : 1;
  const progressPct = (activeStepNumber / BUSINESS_EDIT_STEP_COUNT) * 100;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white">
      <div className="px-6 pt-6 pb-5 border-b border-ink-200">
        <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-1.5">
          Editing business
        </p>
        <h2 className="font-display text-xl text-ink-900 leading-snug">
          {business.title || "Untitled business"}
        </h2>
        <p className="text-xs text-ink-500 mt-2 flex items-center gap-1.5">
          <i
            className="fa-solid fa-location-dot text-gold-600 text-[10px]"
            aria-hidden
          />
          <span className="truncate">
            {business.address || "No address set"}
          </span>
        </p>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-4"
        aria-label="Business editor sections"
      >
        <ul className="space-y-0.5">
          {BUSINESS_EDIT_STEPS.map((step, i) => {
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

      <div className="px-6 py-4 border-t border-ink-200 bg-ink-50">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-ink-700">Progress</span>
          <span className="text-ink-500">
            {activeStepNumber} / {BUSINESS_EDIT_STEP_COUNT}
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
