"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useBusinessEdit } from "@/context/BusinessEditContext";
import {
  adjacentBusinessSteps,
  DEFAULT_BUSINESS_STEP,
  type BusinessEditStepKey,
} from "@/lib/businessEditSteps";

/** Mobile-only sticky bottom CTA bar (hidden at sm+). */
export function BusinessEditorBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDirty, isSaving, save, validateStep } = useBusinessEdit();

  const activeStep =
    (searchParams.get("step") as BusinessEditStepKey | null) ??
    DEFAULT_BUSINESS_STEP;
  const { prev, next } = adjacentBusinessSteps(activeStep);

  const goToStep = (key: BusinessEditStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onContinue = () => {
    if (!next) return;
    if (!validateStep(activeStep)) return;
    goToStep(next);
  };

  const onSave = async () => {
    const jumpTo = await save();
    if (jumpTo) goToStep(jumpTo);
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
          onClick={onContinue}
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          className="flex-[2] px-4 py-3 text-sm font-semibold text-white bg-gold-500 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={onSave}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden /> Saving…
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk text-xs" aria-hidden /> Update Business
            </>
          )}
        </button>
      )}
    </div>
  );
}
