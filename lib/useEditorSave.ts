"use client";

import {
  useEventCreate,
  type EventCreateState,
} from "@/context/EventCreateContext";
import { useSaveEvent } from "@/lib/eventMutations";
import type { ApiEventUpdateResponse } from "@/lib/eventSaveMapper";

/**
 * Shared save controller for the editor chrome.
 *
 * The editor has three controls that all "save" — the topbar Publish
 * button, the mobile bottombar's last-step CTA, and the PublishPanel's
 * big button. Routing them all through this one hook means they share a
 * single mutation (so the "Saved" pill, spinners, and error state stay
 * in sync no matter which control fired) and the create-or-update logic
 * lives in exactly one place (useSaveEvent).
 *
 * `run()` saves with whatever status the user picked in the Publish
 * panel. `run({ overrideStatus })` forces a status first — e.g. the
 * topbar's rocket button publishes regardless of the panel selection —
 * and keeps the panel radio in sync so the UI reflects what was saved.
 */
export type EditorSavePhase = "idle" | "saving" | "saved" | "error";

type RunOptions = {
  overrideStatus?: EventCreateState["status"];
};

export function useEditorSave() {
  const { state, dispatch } = useEventCreate();
  const mutation = useSaveEvent();

  const run = (opts: RunOptions = {}): Promise<ApiEventUpdateResponse> => {
    const { overrideStatus } = opts;

    // Sync the panel radio when a control forces a status, so the UI
    // matches what we're about to persist.
    if (overrideStatus && overrideStatus !== state.status) {
      dispatch({ type: "SET_FIELD", key: "status", value: overrideStatus });
    }

    // Build the payload from a copy with the override already applied —
    // don't rely on the dispatch above, which only lands on the next
    // render (the mapper would otherwise read the stale status).
    const effective: EventCreateState = overrideStatus
      ? { ...state, status: overrideStatus }
      : state;

    return mutation.mutateAsync(effective);
  };

  const phase: EditorSavePhase = mutation.isPending
    ? "saving"
    : mutation.isError
      ? "error"
      : mutation.isSuccess
        ? "saved"
        : "idle";

  return {
    run,
    phase,
    isSaving: mutation.isPending,
    error: mutation.error as Error | null,
    reset: mutation.reset,
  };
}

/** Button label for a given status — shared by the bottombar + panel
 *  so the wording stays consistent. */
export function saveLabelForStatus(status: EventCreateState["status"]): string {
  if (status === "draft") return "Save draft";
  if (status === "scheduled") return "Schedule event";
  return "Publish event";
}
