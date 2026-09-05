"use client";

import { useState } from "react";

import {
  type Ticket,
  type TicketId,
  type TicketQuestion,
} from "@/context/EventCreateContext";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { generateSecretCode } from "@/lib/generateSecretCode";
import { makeLocalId } from "@/lib/makeLocalId";
import { useEventRegion } from "@/lib/useEventSteps";

import { EditorDrawer } from "./EditorDrawer";
import { FullScreenDatePicker } from "./FullScreenDatePicker";

/**
 * Ticket add/edit drawer.
 *
 * State seeding pattern:
 *   - All form fields are seeded via `useState(() => …)` from the
 *     `editing` prop at mount time. No `useEffect` re-syncs state.
 *   - The parent (TicketsPanel) passes a `key` that changes per open
 *     so this component fully unmounts/remounts each time, giving
 *     fresh initial values without effect-driven cascades.
 *
 * The two date fields share a single `FullScreenDatePicker`,
 * switched via the same `pickerTarget` discriminated union pattern
 * used in DatesPanel.
 */
type DateTarget = "saleStart" | "saleEnd";

/**
 * Initial value for the quantity input: how many are still AVAILABLE,
 * which is the stored `stock` as-is - ticketing decrements it on each
 * sale. Empty string when the ticket is unlimited (NaN) or brand new.
 *
 * Clamped at 0 so a negative column value (possible after a manual
 * stock reduction below what had already sold) shows 0 rather than a
 * negative figure.
 */
function seedQuantity(editing: Ticket | null): string {
  if (!editing || !Number.isFinite(editing.quantity)) return "";
  return String(Math.max(0, editing.quantity));
}

export function TicketDrawer({
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
  editing: Ticket | null;
  onClose: () => void;
  onSave: (ticket: Ticket) => void;
  onRemove: (id: TicketId) => void;
  /** Server save in flight - disable inputs/buttons, label changes. */
  isSaving?: boolean;
  /** Server delete in flight - disable buttons, label changes. */
  isDeleting?: boolean;
  /** Server-side failure to surface inline above the footer. */
  errorMessage?: string | null;
}) {
  // The event's region - drives the price field's currency symbol and
  // the date fields' day/month ordering.
  const region = useEventRegion();
  // Numeric inputs are stored as strings so the user can clear them
  // without React turning empty into NaN. We parse on save.
  const [name, setName] = useState(() => editing?.name ?? "");
  const [additionalInfo, setAdditionalInfo] = useState(
    () => editing?.additionalInfo ?? "",
  );
  // The quantity field is AVAILABLE stock (total minus sold), not the
  // total the API stores. `initialQuantity` keeps the seeded string so
  // handleSave can tell an untouched field from one the user retyped
  // to the same number - see the dirty check there.
  const [quantity, setQuantity] = useState(seedQuantity(editing));
  const [initialQuantity] = useState(seedQuantity(editing));
  const [price, setPrice] = useState(() =>
    editing && Number.isFinite(editing.price) ? String(editing.price) : "",
  );
  const [limitPerOrder, setLimitPerOrder] = useState(() =>
    editing && Number.isFinite(editing.limitPerOrder)
      ? String(editing.limitPerOrder)
      : "",
  );
  const [saleStart, setSaleStart] = useState<string | null>(
    () => editing?.saleStart ?? null,
  );
  const [saleEnd, setSaleEnd] = useState<string | null>(
    () => editing?.saleEnd ?? null,
  );
  const [requireCarDetails, setRequireCarDetails] = useState(
    () => editing?.requireCarDetails ?? false,
  );
  // No longer exposed in the UI, but preserved on save so an existing
  // ticket that already has the flag set keeps it.
  const requireCarClubName = editing?.requireCarClubName ?? false;
  const individualAttendeeDetails = editing?.individualAttendeeDetails ?? false;
  const [requestVehiclePhoto, setRequestVehiclePhoto] = useState(
    () => editing?.requestVehiclePhoto ?? false,
  );
  // "Ask additional questions". The toggle is on when the ticket has
  // any saved question; switching it off keeps the rows in local state
  // (so flipping back restores them) but saves none.
  const [askQuestions, setAskQuestions] = useState(
    () => (editing?.customQuestions?.length ?? 0) > 0,
  );
  const [questions, setQuestions] = useState<TicketQuestion[]>(() =>
    editing?.customQuestions?.length
      ? editing.customQuestions.map((q) => ({ ...q }))
      : [newQuestion()],
  );
  const handleToggleQuestions = (next: boolean) => {
    setAskQuestions(next);
    if (next && questions.length === 0) setQuestions([newQuestion()]);
  };
  const updateQuestion = (id: string, label: string) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, label } : q)));
  const addQuestionAfter = (index: number) =>
    setQuestions((qs) => [
      ...qs.slice(0, index + 1),
      newQuestion(),
      ...qs.slice(index + 1),
    ]);
  const removeQuestion = (id: string) =>
    setQuestions((qs) =>
      qs.length > 1 ? qs.filter((q) => q.id !== id) : [newQuestion()],
    );
  const [isSecret, setIsSecret] = useState(() => editing?.isSecret ?? false);
  const [secretCode, setSecretCode] = useState(() => editing?.secretCode ?? "");

  const [pickerTarget, setPickerTarget] = useState<DateTarget | null>(null);

  // ---- Quantity back-conversion -------------------------------------
  // The field holds what's AVAILABLE; the API wants the TOTAL
  // allocation.
  //
  //   - Untouched  → send the stored total back verbatim. Deriving it
  //     from the field would quietly shrink the allocation by however
  //     many have sold on every save that didn't mean to touch it.
  //   - Edited     → the user is stating a new availability, so the
  //     new total is that figure plus the tickets already sold.
  //   - Cleared    → NaN, which the body mapper sends as null:
  //     unlimited.
  //
  // A new ticket has no sold count, so both branches agree on it.
  // Derived here rather than inside handleSave because the label's
  // dirty marker and the sold-count line under the input read the same
  // values.
  const sold = editing?.quantitySold ?? 0;
  const quantityDirtied = quantity.trim() !== initialQuantity.trim();
  const enteredAvailable = Math.max(0, parseFloat(quantity));
  // What the user typed IS what the server stores: `stock` holds the
  // remaining count now, so there is no total to convert back to. The
  // previous `enteredAvailable + sold` inflated stock by the sold
  // count on every save, including saves that never touched this
  // field.
  const nextQuantity =
    !quantityDirtied && editing
      ? editing.quantity
      : Number.isFinite(enteredAvailable)
        ? enteredAvailable
        : NaN;

  // Auto-fill a code when the user flips the secret toggle ON for the
  // first time. Wrapped so we don't overwrite a code the user already
  // typed (or one loaded from /event-edit on a returning visit).
  const handleToggleSecret = (next: boolean) => {
    setIsSecret(next);
    if (next && !secretCode.trim()) {
      setSecretCode(generateSecretCode());
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = editing?.id ?? (makeLocalId("tkt") as TicketId);

    // Belt-and-braces: if the user managed to save with secret on but
    // an empty code (e.g. cleared the input then hit save), generate
    // one so the server never sees an inconsistent payload - a secret
    // ticket with no code can't be unlocked.
    let finalCode = secretCode.trim();
    if (isSecret && !finalCode) {
      finalCode = generateSecretCode();
      setSecretCode(finalCode);
    }

    const ticket: Ticket = {
      kind: "ticket",
      id,
      name: trimmed,
      additionalInfo: additionalInfo.trim(),
      quantity: nextQuantity,
      quantitySold: sold,
      price: Math.max(0, parseFloat(price)),
      limitPerOrder: parseFloat(limitPerOrder),
      saleStart,
      saleEnd,
      requireCarDetails,
      requireCarClubName,
      individualAttendeeDetails,
      requestVehiclePhoto,
      customQuestions: askQuestions
        ? questions
            .map((q) => ({ id: q.id, label: q.label.trim() }))
            .filter((q) => q.label !== "")
        : [],
      isSecret,
      secretCode: finalCode,
      encryptedTicketID: editing?.encryptedTicketID, // preserve existing code if present; new tickets default to null which the server treats as non-secret
    };
    onSave(ticket);
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
        eyebrow="Ticket"
        title={editing ? "Edit ticket" : "Add ticket"}
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
                    : "Save ticket"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => onRemove(editing.id)}
                  disabled={isSaving || isDeleting}
                  aria-label="Delete ticket"
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
            Ticket name <span className="text-gold-600">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Early Bird Entry"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Additional information
          </label>
          <textarea
            rows={2}
            className="textarea"
            placeholder="What's included? Any special terms?"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              Quantity available
              {/* Marks an unsaved change to the allocation. Changing
                  this is the one edit here that can immediately stop
                  people buying, so it earns a "you changed this" cue
                  the other inputs don't need. A bare asterisk would
                  read as "required" - that's what the gold * on Ticket
                  name above means. */}
              {quantityDirtied && (
                <span
                  className="ml-1.5 align-middle text-[9px] tracking-wider bg-gold-50 text-gold-700 border border-gold-200 px-1.5 py-0.5 rounded"
                  title="Stock changed - not saved yet"
                >
                  Changed
                </span>
              )}
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              placeholder="e.g. 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={0}
            />
            {/* Only for saved tickets: a new one has sold nothing, so
                the line would always read zero. */}
            {editing && (
              <p className="mt-1.5 text-[11px] leading-snug text-ink-500">
                {sold} ticket{sold === 1 ? "" : "s"} sold so far
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              Price ({region.currencySymbol})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              On sale from
            </label>
            {renderDateField("saleStart", saleStart)}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
              On sale until
            </label>
            {renderDateField("saleEnd", saleEnd)}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
            Limit per order
          </label>
          <input
            type="number"
            inputMode="numeric"
            className="input"
            placeholder="e.g. 4"
            value={limitPerOrder}
            onChange={(e) => setLimitPerOrder(e.target.value)}
            min={1}
          />
        </div>

        <div className="pt-3 border-t border-ink-200">
          <p className="text-sm font-semibold text-ink-900 mb-3">
            Extra requirements
          </p>
          <div className="space-y-2">
            <RequirementToggle
              title="Require car details"
              description="Make, model & registration"
              checked={requireCarDetails}
              onChange={setRequireCarDetails}
            />
            <RequirementToggle
              title="Request vehicle photo"
              checked={requestVehiclePhoto}
              onChange={setRequestVehiclePhoto}
            />
            <RequirementToggle
              title="Ask additional questions"
              description="Request custom information"
              checked={askQuestions}
              onChange={handleToggleQuestions}
            />
            {askQuestions && (
              <div className="pl-1 pr-1 pb-1 space-y-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder={`Question ${i + 1}, e.g. Any dietary requirements?`}
                      value={q.label}
                      onChange={(e) => updateQuestion(q.id, e.target.value)}
                      aria-label={`Question ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => addQuestionAfter(i)}
                      aria-label="Add another question"
                      title="Add another question"
                      className="w-9 h-9 shrink-0 rounded-lg border border-ink-200 bg-white text-gold-700 hover:border-gold-500 hover:bg-gold-50 flex items-center justify-center transition"
                    >
                      <i className="fa-solid fa-plus" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      aria-label="Remove question"
                      title="Remove question"
                      className="w-9 h-9 shrink-0 rounded-lg border border-ink-200 bg-white text-ink-400 hover:border-red-300 hover:text-red-600 flex items-center justify-center transition"
                    >
                      <i className="fa-solid fa-xmark" aria-hidden />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-ink-500">
                  Buyers answer these for each ticket at checkout. Answers
                  show on the order, the tickets list and in exports.
                </p>
              </div>
            )}
            <RequirementToggle
              title="Secret ticket"
              description="Only accessible via code"
              checked={isSecret}
              onChange={handleToggleSecret}
            />
            {isSecret && (
              <SecretCodeField
                value={secretCode}
                onChange={setSecretCode}
                onRegenerate={() => setSecretCode(generateSecretCode())}
                idPrefix="tkt"
              />
            )}
          </div>
        </div>
      </EditorDrawer>

      {/* Datepicker shared between both date fields. The drawer's own
          portal stacks z-50; the picker's overlay stacks z-60 so it
          sits above the drawer correctly. */}
      <FullScreenDatePicker
        open={pickerTarget !== null}
        title={pickerTarget === "saleStart" ? "On sale from" : "On sale until"}
        value={
          pickerTarget === "saleStart"
            ? saleStart
            : pickerTarget === "saleEnd"
              ? saleEnd
              : null
        }
        onClose={() => setPickerTarget(null)}
        onChange={(next) => {
          if (pickerTarget === "saleStart") {
            setSaleStart(next);
            // Pre-fill an empty end date with the start date; a value
            // the user already picked is never overwritten.
            if (next && !saleEnd) setSaleEnd(next);
          } else if (pickerTarget === "saleEnd") setSaleEnd(next);
        }}
      />
    </>
  );
}

/** Fresh question row with a stable id (kept across label edits). */
function newQuestion(): TicketQuestion {
  return { id: `q_${Math.random().toString(36).slice(2, 10)}`, label: "" };
}

function RequirementToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 bg-ink-50 rounded-lg cursor-pointer">
      <div>
        <p className="text-sm font-medium text-ink-900">{title}</p>
        {description && <p className="text-xs text-ink-500">{description}</p>}
      </div>
      <span className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider" />
      </span>
    </label>
  );
}

/**
 * Inline secret-code input shown when the "Secret ticket" toggle is
 * on. Uppercases as the user types so the value matches what
 * generateSecretCode produces and what buyers see in print. Used by
 * both the ticket and section drawer flows - kept here rather than
 * in a separate file because it's small and tightly coupled to the
 * drawer styling.
 */
export function SecretCodeField({
  value,
  onChange,
  onRegenerate,
  idPrefix,
}: {
  value: string;
  onChange: (next: string) => void;
  onRegenerate: () => void;
  idPrefix: string;
}) {
  return (
    <div className="mt-1 ml-1 mr-1 p-3 bg-white border border-ink-200 rounded-lg">
      <label
        htmlFor={`${idPrefix}-secret-code`}
        className="block text-xs font-semibold text-ink-700 mb-1.5"
      >
        Secret code
      </label>
      <div className="flex items-stretch gap-2">
        <input
          id={`${idPrefix}-secret-code`}
          type="text"
          className="input flex-1 font-mono uppercase tracking-wider"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="e.g. VIP2026"
          maxLength={32}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={onRegenerate}
          className="px-3 py-2 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-100 rounded-lg transition inline-flex items-center gap-1.5"
          title="Generate a new code"
        >
          <i className="fa-solid fa-arrows-rotate text-xs" aria-hidden />
          New
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-500">
        Buyers enter this code at checkout to unlock.
      </p>
    </div>
  );
}
