"use client";

import { useClubEdit } from "@/context/ClubEditContext";
import { EditorTextarea } from "@/components/event-create/EditorTextarea";
import { FieldLabel } from "../shared";
import { defaultClubTerms } from "@/lib/clubEditTypes";

/**
 * Step 5 — club rules/terms members agree to (WYSIWYG).
 *
 * New clubs are seeded with default terms at load (see the edit page),
 * personalised with the club name. "Restore default terms" regenerates
 * them from the current title if they've been edited or cleared.
 */
export function ClubTermsPanel() {
  const { club, setField } = useClubEdit();

  const isDefault = club.terms.trim() === defaultClubTerms(club.title).trim();

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <FieldLabel hint="Members agree to these when they join.">
          Club terms
        </FieldLabel>
        {!isDefault && (
          <button
            type="button"
            onClick={() => setField("terms", defaultClubTerms(club.title))}
            className="shrink-0 text-xs font-semibold text-gold-600 transition hover:text-gold-700"
          >
            Restore default terms
          </button>
        )}
      </div>
      <EditorTextarea
        value={club.terms}
        onChange={(value) => setField("terms", value)}
        placeholder="Club rules, conduct expectations, membership conditions…"
      />
    </div>
  );
}
