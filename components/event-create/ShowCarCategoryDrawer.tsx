"use client";

import { useState } from "react";

import {
  type ShowCarCategory,
  type ShowCarCategoryId,
} from "@/context/EventCreateContext";
import { attendanceOptionsForDays } from "@/lib/attendanceOptions";
import { formatEditorShortDate } from "@/lib/formatEditorDate";
import { generateSecretCode } from "@/lib/generateSecretCode";
import { makeLocalId } from "@/lib/makeLocalId";
import { isBelowMinimumAmount, minimumPriceMessage } from "@/lib/ticketPrice";
import { useEventRegion } from "@/lib/useEventSteps";

import { EditorDrawer } from "./EditorDrawer";
import { FullScreenDatePicker } from "./FullScreenDatePicker";
import { SecretCodeField } from "./TicketDrawer";

/**
 * Show-car category add/edit drawer.
 *
 * State seeding pattern: `useState(() => seed?.x ?? default)` -
 * parent (ShowCarsPanel) re-keys this component on each open so the
 * initial values are fresh per open. No useEffect re-syncing.
 *
 * Form sections:
 *   1. Name + description
 *   2. Application window (open/close dates)
 *   3. Spaces available
 *   4. Require ticket toggle + cost field (only shown when on)
 *   5. Price by attendance (multi-day events only): a day or all days,
 *      each option switched on/off with its own price
 */
type DateTarget = "open" | "close";

export function ShowCarCategoryDrawer({
  open,
  editing,
  template = null,
  onClose,
  onSave,
  onRemove,
  isSaving = false,
  isDeleting = false,
  errorMessage = null,
  eventDays = [],
}: {
  open: boolean;
  editing: ShowCarCategory | null;
  /** "Duplicate": a category to pre-fill a NEW one from. Only read
   *  when `editing` is null - the form opens as "Add category" and
   *  saves as a brand-new row with its own secret code. */
  template?: ShowCarCategory | null;
  onClose: () => void;
  onSave: (category: ShowCarCategory) => void;
  onRemove: (id: ShowCarCategoryId) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  errorMessage?: string | null;
  /** The days the event runs on ("YYYY-MM-DD"); fewer than two hides
   *  the price-by-attendance section. */
  eventDays?: string[];
}) {
  // Drives the cost field's currency symbol and the date fields' order.
  const region = useEventRegion();
  // What the form starts from: the category being edited, else the one
  // being duplicated. `editing` alone still decides what makes a row
  // an existing one (its id, its secret code, the Remove button).
  const seed = editing ?? template;
  // Attendance options (multi-day events): one per day plus "All days".
  const attendanceDefs = attendanceOptionsForDays(eventDays, region);
  const canPriceByAttendance = attendanceDefs.length > 0;
  const [priceByAttendance, setPriceByAttendance] = useState(
    () => seed?.priceByAttendance ?? false,
  );
  // Per option: offered or not, and its price as typed. A new category
  // offers every option; an existing one offers what it was saved with.
  const [optionDrafts, setOptionDrafts] = useState<
    Record<string, { enabled: boolean; price: string }>
  >(() => {
    const saved = new Map(
      (seed?.attendanceOptions ?? []).map((o) => [o.key, o] as const),
    );
    const out: Record<string, { enabled: boolean; price: string }> = {};
    for (const def of attendanceDefs) {
      const existing = saved.get(def.key);
      out[def.key] = existing
        ? {
            enabled: true,
            price: Number.isFinite(existing.price) ? String(existing.price) : "",
          }
        : { enabled: saved.size === 0, price: "" };
    }
    return out;
  });
  const [name, setName] = useState(() => seed?.name ?? "");
  const [description, setDescription] = useState(
    () => seed?.description ?? "",
  );
  const [applicationsOpen, setApplicationsOpen] = useState<string | null>(
    () => seed?.applicationsOpen ?? null,
  );
  const [applicationsClose, setApplicationsClose] = useState<string | null>(
    () => seed?.applicationsClose ?? null,
  );
  const [spaces, setSpaces] = useState(() =>
    seed && Number.isFinite(seed.spacesAvailable)
      ? String(seed.spacesAvailable)
      : "",
  );
  const [requireTicket, setRequireTicket] = useState(
    () => seed?.requireTicket ?? false,
  );
  const [ticketCost, setTicketCost] = useState(() =>
    seed && Number.isFinite(seed.ticketCost)
      ? String(seed.ticketCost)
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

  const byAttendance = priceByAttendance && canPriceByAttendance;
  const enabledDefs = attendanceDefs.filter(
    (d) => optionDrafts[d.key]?.enabled,
  );
  const optionPriceBad = (key: string) => {
    const draft = optionDrafts[key];
    if (!requireTicket || !draft?.enabled) return false;
    const parsed = parseFloat(draft.price);
    return (
      draft.price.trim() === "" ||
      !Number.isFinite(parsed) ||
      parsed < 0 ||
      isBelowMinimumAmount(parsed)
    );
  };
  const optionsInvalid =
    byAttendance &&
    (enabledDefs.length === 0 || enabledDefs.some((d) => optionPriceBad(d.key)));

  // Free or at least 1.00 - see lib/ticketPrice. With attendance pricing
  // on, the category's own cost field is hidden; the options carry it.
  const costTooLow =
    requireTicket &&
    !byAttendance &&
    isBelowMinimumAmount(parseFloat(ticketCost));

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || costTooLow || optionsInvalid) return;
    const options = byAttendance
      ? enabledDefs.map((d) => ({
          key: d.key,
          label: d.label,
          days: d.days,
          price: requireTicket
            ? Math.max(0, parseFloat(optionDrafts[d.key]?.price ?? ""))
            : NaN,
        }))
      : [];
    const optionPrices = options
      .map((o) => o.price)
      .filter((p) => Number.isFinite(p));
    const lowestOptionPrice =
      optionPrices.length > 0 ? Math.min(...optionPrices) : NaN;
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
      // With attendance pricing the category's badge shows the lowest
      // option price; the options themselves carry the real prices.
      ticketCost: byAttendance
        ? requireTicket
          ? lowestOptionPrice
          : NaN
        : requireTicket && ticketCost
          ? Math.max(0, parseFloat(ticketCost))
          : NaN,
      secretCode: finalCode,
      priceByAttendance: byAttendance,
      attendanceOptions: options,
    });
    // No onClose() here - the caller drives the drawer's open state
    // around the async save, so the drawer stays open on error and
    // closes only when the panel sees a successful mutation.
  };

  const renderDateField = (target: DateTarget, value: string | null) => (
    <button
      type="button"
      // flex-1: the two window fields sit side by side, so each fills
      // its cell and the pair always ends up the same height.
      className={`date-field flex-1 ${value ? "" : "is-empty"}`}
      onClick={() => setPickerTarget(target)}
    >
      <i className="fa-regular fa-calendar df-icon" aria-hidden />
      <span className="df-display">
        {value ? formatEditorShortDate(value, region) : "Select date"}
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
                disabled={
                  !name.trim() ||
                  costTooLow ||
                  optionsInvalid ||
                  isSaving ||
                  isDeleting
                }
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
            <div className="flex flex-col">
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Opens
              </label>
              {renderDateField("open", applicationsOpen)}
            </div>
            <div className="flex flex-col">
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
          {requireTicket && !byAttendance && (
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
              {costTooLow && (
                <p className="mt-1.5 text-xs text-red-600" role="alert">
                  {minimumPriceMessage(region)}
                </p>
              )}
            </div>
          )}
        </div>

        {canPriceByAttendance && (
          <div className="pt-3 border-t border-ink-200">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Price by attendance
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  This event runs over {attendanceDefs.length - 1} days. Let
                  applicants enter for a single day or for all days
                  {requireTicket ? ", each at its own price" : ""}.
                </p>
              </div>
              <span className="switch">
                <input
                  type="checkbox"
                  checked={priceByAttendance}
                  onChange={(e) => setPriceByAttendance(e.target.checked)}
                />
                <span className="slider" />
              </span>
            </label>
            {priceByAttendance && (
              <div className="mt-4 pt-4 border-t border-ink-200 space-y-2">
                {attendanceDefs.map((def) => {
                  const draft = optionDrafts[def.key] ?? {
                    enabled: false,
                    price: "",
                  };
                  const bad = optionPriceBad(def.key);
                  return (
                    <div
                      key={def.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        draft.enabled
                          ? "border-ink-200 bg-white"
                          : "border-ink-100 bg-ink-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-gold-500 shrink-0"
                        checked={draft.enabled}
                        aria-label={`Offer ${def.label}`}
                        onChange={(e) =>
                          setOptionDrafts((d) => ({
                            ...d,
                            [def.key]: { ...draft, enabled: e.target.checked },
                          }))
                        }
                      />
                      <span
                        className={`flex-1 text-sm ${
                          draft.enabled
                            ? "text-ink-900 font-medium"
                            : "text-ink-500"
                        }`}
                      >
                        {def.label}
                      </span>
                      {requireTicket && (
                        <div className="w-32 shrink-0 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">
                            {region.currencySymbol}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            className={`input ${bad ? "border-red-400" : ""}`}
                            style={{ paddingLeft: 28 }}
                            placeholder="0.00"
                            value={draft.price}
                            disabled={!draft.enabled}
                            aria-label={`${def.label} price`}
                            onChange={(e) =>
                              setOptionDrafts((d) => ({
                                ...d,
                                [def.key]: { ...draft, price: e.target.value },
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {enabledDefs.length === 0 && (
                  <p className="text-xs text-red-600" role="alert">
                    Switch on at least one option.
                  </p>
                )}
                {requireTicket &&
                  enabledDefs.some((d) => optionPriceBad(d.key)) && (
                    <p className="text-xs text-red-600" role="alert">
                      Give every option you offer a price.{" "}
                      {minimumPriceMessage(region)}
                    </p>
                  )}
                <p className="text-xs text-ink-500">
                  Each option becomes its own hidden ticket under this
                  category. Spaces available applies per day: a car entered
                  for all days takes one space on every day.
                </p>
              </div>
            )}
          </div>
        )}

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
