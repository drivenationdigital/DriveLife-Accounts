"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useEventCreate } from "@/context/EventCreateContext";
import { useEditorSave, saveLabelForStatus } from "@/lib/useEditorSave";
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
  const { state } = useEventCreate();
  const { run, isSaving } = useEditorSave();

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

  // On the last step there's no "next" — the primary button becomes the
  // save/publish action instead of dead-ending as a disabled Continue.
  const onSave = async () => {
    if (isSaving) return;
    try {
      const res = await run();
      if (res.post_status !== "draft") {
        router.push(`/events/${res.encrypted_id}`);
      }
    } catch {
      // The PublishPanel surfaces the error message; here we just
      // re-enable the button (isSaving flips back via the mutation).
    }
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
      {next ? (
        <button
          type="button"
          className="flex-[2] px-4 py-3 text-sm font-semibold text-white bg-gold-500 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
          onClick={() => goToStep(next)}
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          className="flex-[2] px-4 py-3 text-sm font-semibold text-white bg-gold-500 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden />{" "}
              Saving…
            </>
          ) : (
            <>
              <i className="fa-solid fa-rocket text-xs" aria-hidden />{" "}
              {saveLabelForStatus(state.status)}
            </>
          )}
        </button>
      )}
    </div>
  );
}
