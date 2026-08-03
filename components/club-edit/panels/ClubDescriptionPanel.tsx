"use client";

import { useClubEdit } from "@/context/ClubEditContext";
import { EditorTextarea } from "@/components/event-create/EditorTextarea";
import { FieldLabel } from "../shared";

/** Step 3 - the club's description (WYSIWYG). */
export function ClubDescriptionPanel() {
  const { club, setField } = useClubEdit();
  return (
    <div className="mb-8">
      <FieldLabel>Tell us more about your club</FieldLabel>
      <EditorTextarea
        value={club.description}
        onChange={(value) => setField("description", value)}
        placeholder="What the club is about, who it's for, how you meet…"
      />
    </div>
  );
}
