"use client";

import { useRouter } from "next/navigation";
import { useEventCreate } from "@/context/EventCreateContext";
import { eventDetailPath } from "@/lib/siteRoutes";
import { useSaveEvent } from "@/lib/eventMutations";
import { canSaveDates } from "@/lib/eventSaveMapper";
import { ApiError } from "@/lib/apiClient";

/**
 * Minimal Save wiring for the editor. Pulls the full editor state from
 * EventCreateContext, runs it through useSaveEvent (which creates the
 * server draft if needed, then updates), and on success navigates to
 * the event view.
 *
 * Adapt to your own toast / bottom-bar - this is the smallest thing
 * that exercises the whole path. Drop it into the editor's
 * bottombar/topbar, or lift the hook usage into whatever Save control
 * already exists.
 */
export function SaveEventButton({
  label = "Save event",
}: {
  label?: string;
}) {
  const router = useRouter();
  const { state } = useEventCreate();
  const save = useSaveEvent();

  const recurringBlocked = !canSaveDates(state);

  const handleSave = () => {
    if (save.isPending) return;
    save.mutate(state, {
      onSuccess: (data) => {
        // The view page keys off the encrypted id (the `[id]` segment
        // is really the eid). Send the user there after a save.
        router.push(eventDetailPath(data.encrypted_id, state.site));
      },
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {recurringBlocked && (
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
          Recurring schedules are saved separately - date changes won’t
          be included.
        </span>
      )}

      {save.isError && (
        <span style={{ fontSize: 12.5, color: "var(--danger)" }}>
          {save.error instanceof ApiError
            ? save.error.message
            : "Couldn’t save. Please try again."}
        </span>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSave}
        disabled={save.isPending}
      >
        {save.isPending ? "Saving…" : label}
      </button>
    </div>
  );
}
