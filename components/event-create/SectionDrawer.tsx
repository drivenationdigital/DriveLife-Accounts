"use client";

import { useState } from "react";

import {
  type SectionId,
  type TicketSection,
} from "@/context/EventCreateContext";
import { makeLocalId } from "@/lib/makeLocalId";

import { EditorDrawer } from "./EditorDrawer";

/**
 * Modal for adding or editing a ticket section.
 *
 * State seeding pattern:
 *   - `useState(initialiser)` reads `editing` once at mount time.
 *     There is NO `useEffect` re-syncing state from props.
 *   - The parent component (TicketsPanel) ensures the drawer is
 *     fully unmounted between opens by passing a stable `key` that
 *     changes whenever the open target changes — see the
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
}: {
  open: boolean;
  editing: TicketSection | null;
  onClose: () => void;
  onSave: (section: TicketSection) => void;
  onRemove: (id: SectionId) => void;
}) {
  // Read `editing` once — initialiser runs at mount; the parent
  // remounts us on each open so this is fresh every time.
  const [name, setName] = useState(() => editing?.name ?? "");
  const [isSecret, setIsSecret] = useState(() => editing?.isSecret ?? false);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = editing?.id ?? (makeLocalId("sec") as SectionId);
    onSave({ kind: "section", id, name: trimmed, isSecret });
    onClose();
  };

  return (
    <EditorDrawer
      open={open}
      onClose={onClose}
      eyebrow="Ticket section"
      title={editing ? "Edit section" : "Add ticket section"}
      footer={
        <>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
          >
            Save section
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                onRemove(editing.id);
                onClose();
              }}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-900 transition"
            >
              <i className="fa-solid fa-xmark" aria-hidden />
              Remove section
            </button>
          )}
        </>
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
          onChange={(e) => setIsSecret(e.target.checked)}
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
    </EditorDrawer>
  );
}
