"use client";

import { useState } from "react";

import {
  type ShowCarCategory,
  type ShowCarCategoryId,
} from "@/context/EventCreateContext";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { generateSecretCode } from "@/lib/generateSecretCode";
import { makeLocalId } from "@/lib/makeLocalId";
import { useEventRegion } from "@/lib/useEventSteps";

import { EditorDrawer } from "./EditorDrawer";
import { FullScreenDatePicker } from "./FullScreenDatePicker";
import { SecretCodeField } from "./TicketDrawer";

/**
 * Show-car category add/edit drawer.
 *
 * State seeding pattern: `useState(() => editing?.x ?? default)` -
 * parent (ShowCarsPanel) re-keys this component on each open so the
 * initial values are fresh per open. No useEffect re-syncing.
 *
 * Form sections:
 *   1. Name + description
 *   2. Application window (open/close dates)
 *   3. Spaces available
 *   4. Require ticket toggle + cost field (only shown when on)
 */
type DateTarget = "open" | "close";

export function ShowCarCategoryDrawer({
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
  editing: ShowCarCategory | null;
  onClose: () => void;
  onSave: (category: ShowCarCategory) => void;
  onRemove: (id: ShowCarCategoryId) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  errorMessage?: string | null;
}) {
  // Drives the cost field's currency symbol and the date fields' order.
  const region = useEventRegion();
  const [name, setName] = useState(() => editing?.name ?? "");
  const [description, setDescription] = useState(
    () => editing?.description ?? "",
  );
  const [applicationsOpen, setApplicationsOpen] = useState<string | null>(
    () => editing?.applicationsOpen ?? null,
  );
  const [applicationsClose, setApplicationsClose] = useState<string | null>(
    () => editing?.applicationsClose ?? null,
  );
  const [spaces, setSpaces] = useState(() =>
    editing && Number.isFinite(editing.spacesAvailable)
      ? String(editing.spacesAvailable)
      : "",
  );
  const [requireTicket, setRequireTicket] = useState(
    () => editing?.requireTicket ?? false,
  );
  const [ticketCost, setTicketCost] = useState(() =>
    editing && Number.isFinite(editing.ticketCost)
      ? String(editing.ticketCost)
      : "",
  );
  // Per-category secret code. Still needed - it builds the ticket
  // link approved applicants receive - but it's an implementation
  // detail the organiser never has to think about, so it's no longer
  // shown. Generated once for new categories; existing categories
  // keep whatever they were saved with.
  const [secretCode] = useState(
    () => editing?.secretCode ?? generateSecretCode(),
  );

  const [pickerTarget, setPickerTarget] = useState<DateTarget | null>(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = editing?.id ?? (makeLocalId("scc") as ShowCarCategoryId);
    // Safety net: if the user cleared the code, regenerate before
    // save so the row isn't persisted with an empty secret_code (the
    // server would auto-generate one anyway, but we'd lose the
    // ability to show the user what was saved on the next render).
    const finalCode = secretCode.trim() || generateSecretCode();
    onSave({
      id,
      name: trimmed,
      description: description.trim(),
      applicationsOpen,
      applicationsClose,
      // Allow blank → unset (NaN). The renderer's Number.isFinite
      // checks pick this up.
      spacesAvailable: spaces ? Math.max(1, parseInt(spaces, 10)) : NaN,
      requireTicket,
      ticketCost:
        requireTicket && ticketCost ? Math.max(0, parseFloat(ticketCost)) : NaN,
      secretCode: finalCode,
    });
    // No onClose() here - the caller drives the drawer's open state
    // around the async save, so the drawer stays open on error and
    // closes only when the panel sees a successful mutation.
  };

  const renderDateField = (target: DateTarget, value: string | null) => (
    <button
      type="button"
      className={`date-field ${value ? "" : "is-empty"}`}
      onClick={() => setPickerTarget(target)}
    >
      <i className="fa-regular fa-calendar df-icon" aria-hidden />
      <span className="df-display">
        {value ? formatEditorDate(value, region) : "Select date"}
      </span>
      <i className="fa-solid fa-chevron-down df-chev" aria-hidden />
    </button>
  );

  return (
    <>
      <EditorDrawer
        open={open}
        onClose={onClose}
        eyebrow="Show cars"
        title={editing ? "Edit category" : "Add category"}
        footer={
          <div className="flex flex-col gap-2 w-full">
            {errorMessage && (
              <p className="text-xs text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting}
                className="flex-1 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim() || isSaving || isDeleting}
                className="flex-1 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition inline-flex items-center justify-center gap-2"
              >
                {isSaving && (
                  <i
                    className="fa-solid fa-spinner fa-spin text-xs"
                    aria-hidden
                  />
                )}
                {isSaving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Save category"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => onRemove(editing.id)}
                  disabled={isSaving || isDeleting}
                  aria-label="Delete category"
                  className="ml-1 w-11 h-11 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center shrink-0"
                >
                  <i
                    className={
                      isDeleting
                        ? "fa-solid fa-spinner fa-spin text-sm"
                        : "fa-solid fa-trash text-sm"
                    }
                    aria-hidden
                  />
                </button>
              )}
            </div>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Category name <span className="text-gold-600">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Concours - Classic & Heritage"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Description
          </label>
          <textarea
            rows={2}
            className="textarea"
            placeholder="What kind of cars fit in this category?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pt-3 border-t border-ink-200">
          <p className="text-sm font-semibold text-ink-900 mb-3">
            Application window
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Opens
              </label>
              {renderDateField("open", applicationsOpen)}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Closes
              </label>
              {renderDateField("close", applicationsClose)}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-ink-200">
          <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
            Spaces available
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className="input"
            placeholder="e.g. 20"
            value={spaces}
            onChange={(e) => setSpaces(e.target.value)}
          />
        </div>

        <div className="pt-3 border-t border-ink-200">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-ink-900">
                Require ticket purchase after acceptance
              </p>
              <p className="text-xs text-ink-500 mt-0.5">
                Accepted applicants will need a ticket to secure their spot
              </p>
            </div>
            <span className="switch">
              <input
                type="checkbox"
                checked={requireTicket}
                onChange={(e) => setRequireTicket(e.target.checked)}
              />
              <span className="slider" />
            </span>
          </label>
          {requireTicket && (
            <div className="mt-4 pt-4 border-t border-ink-200">
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Ticket cost ({region.currencySymbol})
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                className="input"
                placeholder="0.00"
                value={ticketCost}
                onChange={(e) => setTicketCost(e.target.value)}
              />
            </div>
          )}
        </div>

      </EditorDrawer>

      <FullScreenDatePicker
        open={pickerTarget !== null}
        title={
          pickerTarget === "open" ? "Applications open" : "Applications close"
        }
        value={
          pickerTarget === "open"
            ? applicationsOpen
            : pickerTarget === "close"
              ? applicationsClose
              : null
        }
        onClose={() => setPickerTarget(null)}
        onChange={(next) => {
          if (pickerTarget === "open") {
            setApplicationsOpen(next);
            // Pre-fill an empty close date with the open date; a value
            // the user already picked is never overwritten.
            if (next && !applicationsClose) setApplicationsClose(next);
          } else if (pickerTarget === "close") setApplicationsClose(next);
        }}
      />
    </>
  );
}
