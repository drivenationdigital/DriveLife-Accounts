"use client";

import { useState } from "react";

import {
  type SectionId,
  type TicketSection,
} from "@/context/EventCreateContext";
import { generateSecretCode } from "@/lib/generateSecretCode";
import { makeLocalId } from "@/lib/makeLocalId";

import { EditorDrawer } from "./EditorDrawer";
import { SecretCodeField } from "./TicketDrawer";

/**
 * Modal for adding or editing a ticket section.
 *
 * State seeding pattern:
 *   - `useState(initialiser)` reads `editing` once at mount time.
 *     There is NO `useEffect` re-syncing state from props.
 *   - The parent component (TicketsPanel) ensures the drawer is
 *     fully unmounted between opens by passing a stable `key` that
 *     changes whenever the open target changes - see the
 *     `key={…}` on this component in TicketsPanel.tsx.
 *
 * This avoids the "Calling setState synchronously within an effect
 * can trigger cascading renders" lint error that the previous
 * `useEffect(() => setName(editing?.name))` shape produced.
 */
export function SectionDrawer({
  open,
  editing,
  onClose,
  onSave,
  onRemove,
  isSaving = false,
  isDeleting = false,
  errorMessage = null,
}: {
  open: boolean;
  editing: TicketSection | null;
  onClose: () => void;
  onSave: (section: TicketSection) => void;
  onRemove: (id: SectionId) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  errorMessage?: string | null;
}) {
  // Read `editing` once - initialiser runs at mount; the parent
  // remounts us on each open so this is fresh every time.
  const [name, setName] = useState(() => editing?.name ?? "");
  const [isSecret, setIsSecret] = useState(() => editing?.isSecret ?? false);
  const [secretCode, setSecretCode] = useState(() => editing?.secretCode ?? "");

  // Auto-fill a code when the toggle flips to ON for the first time
  // (won't overwrite a code already typed or loaded).
  const handleToggleSecret = (next: boolean) => {
    setIsSecret(next);
    if (next && !secretCode.trim()) {
      setSecretCode(generateSecretCode());
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = editing?.id ?? (makeLocalId("sec") as SectionId);

    // Same safety net as TicketDrawer - never persist isSecret=true
    // with an empty code; the section would be uncrackable.
    let finalCode = secretCode.trim();
    if (isSecret && !finalCode) {
      finalCode = generateSecretCode();
      setSecretCode(finalCode);
    }

    onSave({
      kind: "section",
      id,
      name: trimmed,
      isSecret,
      secretCode: finalCode,
      encryptedTicketID: editing?.encryptedTicketID, // preserve existing code if present; sections don't have their own encryptedTicketID so this is always null but good to be explicit
    });
    // Caller drives close around the async save; see TicketDrawer for
    // the same pattern.
  };

  return (
    <EditorDrawer
      open={open}
      onClose={onClose}
      eyebrow="Ticket section"
      title={editing ? "Edit section" : "Add ticket section"}
      footer={
        <div className="flex flex-col gap-2 w-full">
          {errorMessage && (
            <p className="text-xs text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || isSaving || isDeleting}
              className="px-6 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition inline-flex items-center gap-2"
            >
              {isSaving && (
                <i
                  className="fa-solid fa-spinner fa-spin text-xs"
                  aria-hidden
                />
              )}
              {isSaving ? "Saving…" : "Save section"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => onRemove(editing.id)}
                disabled={isSaving || isDeleting}
                className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {isDeleting ? (
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden />
                ) : (
                  <i className="fa-solid fa-xmark" aria-hidden />
                )}
                {isDeleting ? "Removing…" : "Remove section"}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div>
        <label
          htmlFor="sec-name"
          className="block text-sm font-semibold text-ink-900 mb-2"
        >
          <i
            className="fa-regular fa-rectangle-list mr-1.5 text-ink-500"
            aria-hidden
          />
          Ticket section name <span className="text-gold-600">*</span>
        </label>
        <input
          id="sec-name"
          type="text"
          className="input"
          placeholder="Section name e.g. Early bird"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <label className="cb-label items-start">
        <input
          type="checkbox"
          checked={isSecret}
          onChange={(e) => handleToggleSecret(e.target.checked)}
        />
        <span className="cb-box mt-0.5" />
        <span className="cb-text">
          <span className="block">Secret ticket section</span>
          <span className="block text-xs text-ink-500 font-normal mt-0.5">
            This ticket section will only be visible to you and/or users who
            have a secret code
          </span>
        </span>
      </label>

      {isSecret && (
        <SecretCodeField
          value={secretCode}
          onChange={setSecretCode}
          onRegenerate={() => setSecretCode(generateSecretCode())}
          idPrefix="sec"
        />
      )}
    </EditorDrawer>
  );
}
