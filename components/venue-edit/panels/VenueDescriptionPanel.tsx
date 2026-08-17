"use client";

import { useVenueEdit } from "@/context/VenueEditContext";
import { EditorTextarea } from "@/components/event-create/EditorTextarea";
import { FieldLabel } from "../shared";

/** Step 3 - the venue's description (WYSIWYG). */
export function VenueDescriptionPanel() {
  const { venue, set } = useVenueEdit();
  return (
    <div className="mb-8">
      <FieldLabel>Tell us more about your venue</FieldLabel>
      <EditorTextarea
        value={venue.description}
        onChange={(value) => set("description", value)}
        placeholder="Describe the venue, facilities, parking, what makes it special…"
      />
    </div>
  );
}
