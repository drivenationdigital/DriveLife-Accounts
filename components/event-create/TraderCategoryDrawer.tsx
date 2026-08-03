"use client";

import { useState } from "react";

import {
  type TraderCategory,
  type TraderCategoryId,
  type TraderIcon,
} from "@/context/EventCreateContext";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { makeLocalId } from "@/lib/makeLocalId";
import { generateSecretCode } from "@/lib/generateSecretCode";

import { EditorDrawer } from "./EditorDrawer";
import { EditorTextarea } from "./EditorTextarea";
import { FullScreenDatePicker } from "./FullScreenDatePicker";

/**
 * Trader category add/edit drawer.
 *
 * Form sections:
 *   1. Name
 *   2. Payment mode (online ticket vs. pay in person) + fee + spaces
 *   3. Application window (open/close dates)
 *   4. Per-category info textarea
 *
 * Payment is never free. 'online' takes payment at checkout via a
 * hidden ticket; 'in_person' is invoice / bank transfer / pay on the
 * day (organiser confirms manually). The fee field applies to both -
 * in_person just collects it offline. A per-category secret code is
 * auto-generated (gates the online ticket link).
 */
type DateTarget = "open" | "close";

export function TraderCategoryDrawer({
  open,
  editing,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  editing: TraderCategory | null;
  onClose: () => void;
  onSave: (category: TraderCategory) => void;
  onRemove: (id: TraderCategoryId) => void;
}) {
  const [name, setName] = useState(() => editing?.name ?? "");
  // Icon is no longer pickable in the UI; existing values are preserved
  // and new categories fall back to the generic default.
  const icon: TraderIcon = editing?.icon ?? "utensils";
  const [paymentMode, setPaymentMode] = useState<"online" | "in_person">(
    () => editing?.paymentMode ?? "online",
  );
  // Cost / spaces are stored as numbers (NaN ⇒ unset). The inputs are
  // strings so an empty field reads back as "" → NaN.
  const [costStr, setCostStr] = useState(() =>
    editing && Number.isFinite(editing.ticketCost)
      ? String(editing.ticketCost)
      : "",
  );
  const [spacesStr, setSpacesStr] = useState(() =>
    editing && Number.isFinite(editing.spacesAvailable)
      ? String(editing.spacesAvailable)
      : "",
  );
  const [applicationsOpen, setApplicationsOpen] = useState<string | null>(
    () => editing?.applicationsOpen ?? null,
  );
  const [applicationsClose, setApplicationsClose] = useState<string | null>(
    () => editing?.applicationsClose ?? null,
  );
  const [info, setInfo] = useState(() => editing?.info ?? "");
  // Auto-generated for new categories so a row never persists without
  // a code (the online ticket link is built from it). Preserved when
  // editing.
  const [secretCode] = useState(
    () => editing?.secretCode ?? generateSecretCode(),
  );
  const [pickerTarget, setPickerTarget] = useState<DateTarget | null>(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = editing?.id ?? (makeLocalId("tc") as TraderCategoryId);
    const cost = costStr.trim() === "" ? NaN : Number(costStr);
    const spaces = spacesStr.trim() === "" ? NaN : Number(spacesStr);
    onSave({
      id,
      name: trimmed,
      icon,
      paymentMode,
      ticketCost: cost,
      spacesAvailable: spaces,
      applicationsOpen,
      applicationsClose,
      info: info.trim(),
      secretCode: secretCode.trim() || generateSecretCode(),
    });
    onClose();
  };

  const renderDateField = (target: DateTarget, value: string | null) => (
    <button
      type="button"
      className={`date-field ${value ? "" : "is-empty"}`}
      onClick={() => setPickerTarget(target)}
    >
      <i className="fa-regular fa-calendar df-icon" aria-hidden />
      <span className="df-display">
        {value ? formatEditorDate(value) : "Select date"}
      </span>
      <i className="fa-solid fa-chevron-down df-chev" aria-hidden />
    </button>
  );

  return (
    <>
      <EditorDrawer
        open={open}
        onClose={onClose}
        eyebrow="Traders"
        title={editing ? "Edit trader type" : "Add trader type"}
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
            >
              {editing ? "Save changes" : "Save trader type"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  onRemove(editing.id);
                  onClose();
                }}
                aria-label="Delete trader type"
                className="ml-1 w-11 h-11 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center shrink-0"
              >
                <i className="fa-solid fa-trash text-sm" aria-hidden />
              </button>
            )}
          </>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Category name <span className="text-gold-600">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Food & Drink"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Payment mode - never free. */}
        <div className="pt-3 border-t border-ink-200">
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            How do traders pay?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMode("online")}
              aria-pressed={paymentMode === "online"}
              className={[
                "px-3 py-3 rounded-lg border-2 text-left transition",
                paymentMode === "online"
                  ? "border-gold-500 bg-gold-50"
                  : "border-ink-200 bg-white hover:border-ink-300",
              ].join(" ")}
            >
              <span className="block text-sm font-semibold text-ink-900">
                <i className="fa-solid fa-credit-card mr-1.5" aria-hidden />
                Online
              </span>
              <span className="block text-xs text-ink-500 mt-0.5">
                Pay at checkout when approved
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("in_person")}
              aria-pressed={paymentMode === "in_person"}
              className={[
                "px-3 py-3 rounded-lg border-2 text-left transition",
                paymentMode === "in_person"
                  ? "border-gold-500 bg-gold-50"
                  : "border-ink-200 bg-white hover:border-ink-300",
              ].join(" ")}
            >
              <span className="block text-sm font-semibold text-ink-900">
                <i className="fa-solid fa-file-invoice mr-1.5" aria-hidden />
                In person
              </span>
              <span className="block text-xs text-ink-500 mt-0.5">
                Invoice / bank transfer / on the day
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Pitch fee (£)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                placeholder="0.00"
                value={costStr}
                onChange={(e) => setCostStr(e.target.value)}
              />
              {paymentMode === "in_person" && (
                <p className="text-xs text-ink-400 mt-1">
                  Collected offline - shown to traders for reference.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Spaces (optional)
              </label>
              <input
                type="number"
                min={0}
                step="1"
                className="input"
                placeholder="Unlimited"
                value={spacesStr}
                onChange={(e) => setSpacesStr(e.target.value)}
              />
            </div>
          </div>
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
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Trader information
          </label>
          <p className="text-xs text-ink-500 mb-3">
            Perks, arrival times, pitch sizes, power availability - what traders
            need to know.
          </p>
          <EditorTextarea
            value={info}
            onChange={setInfo}
            placeholder="3m × 3m pitch. Arrival from 6am for setup. Power and water at extra cost. Public liability insurance required."
          />
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
          if (pickerTarget === "open") setApplicationsOpen(next);
          else if (pickerTarget === "close") setApplicationsClose(next);
        }}
      />
    </>
  );
}
