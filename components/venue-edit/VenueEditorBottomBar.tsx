"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useVenueEdit } from "@/context/VenueEditContext";
import {
  adjacentVenueSteps,
  DEFAULT_VENUE_STEP,
  type VenueEditStepKey,
} from "@/lib/venueEditSteps";

/**
 * Mobile-only sticky bottom CTA bar (hidden at sm+). Matches the event
 * and club editors: Back (flex-1, secondary) and Continue (flex-[2],
 * primary) so the forward action dominates without losing the back
 * affordance.
 *
 * The padding-bottom calc with safe-area-inset keeps the buttons clear of
 * the iOS home indicator.
 *
 * On the last step Continue becomes Update Venue - the same save the
 * topbar fires, through the same shared mutation.
 */
export function VenueEditorBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDirty, isSaving, save, validateStep } = useVenueEdit();

  const activeStep =
    (searchParams.get("step") as VenueEditStepKey | null) ?? DEFAULT_VENUE_STEP;
  const { prev, next } = adjacentVenueSteps(activeStep);

  const goToStep = (key: VenueEditStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    // Land on the header of the next step, not mid-form.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onContinue = () => {
    if (!next) return;
    // Invalid fields reveal their errors and hold the user in place.
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
              <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden />{" "}
              Saving…
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk text-xs" aria-hidden />{" "}
              Update Venue
            </>
          )}
        </button>
      )}
    </div>
  );
}
