"use client";

import { useTrackEdit } from "@/context/TrackEditContext";
import { adjacentTrackSteps } from "@/lib/trackEditSteps";
import { useTrackStepNav, trackSaveCta } from "./shared";

/**
 * Mobile-only sticky bottom CTA bar (hidden at sm+). Matches the event
 * and club editors: Back (flex-1, secondary) and Continue (flex-[2],
 * primary) so the forward action dominates without losing the back
 * affordance.
 *
 * The padding-bottom calc with safe-area-inset keeps the buttons clear of
 * the iOS home indicator.
 *
 * On the last step Continue becomes the save action - the same save the
 * topbar fires, through the same shared mutation, and worded for what
 * the tap will do (Publish track / Save draft / Save).
 */
export function TrackEditorBottomBar() {
  const { track, liveStatus, isSaving, save, validateStep } = useTrackEdit();
  const { activeStep, goToStep } = useTrackStepNav();
  const { prev, next } = adjacentTrackSteps(activeStep);
  const cta = trackSaveCta(track.status, liveStatus);

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
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden />{" "}
              {cta.busyLabel}
            </>
          ) : (
            <>
              <i className={`${cta.icon} text-xs`} aria-hidden />{" "}
              {cta.longLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
}
