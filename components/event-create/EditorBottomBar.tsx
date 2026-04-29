"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  adjacentSteps,
  DEFAULT_STEP,
  type EventCreateStepKey,
} from "@/lib/eventCreateSteps";

/**
 * Mobile-only sticky bottom CTA bar (sm: hidden on tablet+).
 *
 * Two actions — Back (smaller, secondary) and Continue (larger,
 * primary). Continue is a flex-[2] vs Back's flex-1 so it visually
 * dominates without crowding the back affordance.
 *
 * The `padding-bottom` calc with safe-area-inset keeps the buttons
 * clear of the iOS home indicator.
 *
 * On the first step Back is disabled (no prev). On the last step
 * Continue becomes Publish (label change), but for now the button
 * disables — Publish will get its own logic when we wire mutations.
 */
export function EditorBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeStep =
    (searchParams.get("step") as EventCreateStepKey | null) ?? DEFAULT_STEP;
  const { prev, next } = adjacentSteps(activeStep);

  const goToStep = (key: EventCreateStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    // After navigating, scroll to top of the panel so the user sees the
    // header of the next step rather than landing mid-form.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-ink-200 px-4 py-3 flex items-center gap-2"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        className="flex-1 px-4 py-3 text-sm font-semibold text-ink-700 bg-ink-100 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-40"
        onClick={() => prev && goToStep(prev)}
        disabled={!prev}
      >
        <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back
      </button>
      <button
        type="button"
        className="flex-[2] px-4 py-3 text-sm font-semibold text-white bg-gold-500 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
        onClick={() => next && goToStep(next)}
        disabled={!next}
      >
        Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
      </button>
    </div>
  );
}
