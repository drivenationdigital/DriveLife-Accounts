"use client";

import { useTrackEdit } from "@/context/TrackEditContext";
import { EditorTextarea } from "@/components/event-create/EditorTextarea";
import { FieldLabel } from "../shared";

/** Step 3 - the track's description (WYSIWYG). */
export function TrackDescriptionPanel() {
  const { track, set } = useTrackEdit();
  return (
    <div className="mb-8">
      <FieldLabel>Tell us more about the track</FieldLabel>
      <EditorTextarea
        value={track.description}
        onChange={(value) => set("description", value)}
        placeholder="Describe the circuit, its layouts, facilities, paddock, spectator areas…"
      />
    </div>
  );
}
