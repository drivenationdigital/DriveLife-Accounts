"use client";

import { useState } from "react";

import {
  TRADER_ICONS,
  type TraderCategory,
  type TraderCategoryId,
  type TraderIcon,
} from "@/context/EventCreateContext";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { makeLocalId } from "@/lib/makeLocalId";

import { EditorDrawer } from "./EditorDrawer";
import { EditorTextarea } from "./EditorTextarea";
import { FullScreenDatePicker } from "./FullScreenDatePicker";

/**
 * Trader category add/edit drawer.
 *
 * Form sections:
 *   1. Name + icon picker (4 curated icons matching the mockup —
 *      utensils / shirt / wrench / handshake)
 *   2. Application window (open/close dates)
 *   3. Per-category info textarea with the decorative toolbar
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
  const [icon, setIcon] = useState<TraderIcon>(
    () => editing?.icon ?? "utensils",
  );
  const [applicationsOpen, setApplicationsOpen] = useState<string | null>(
    () => editing?.applicationsOpen ?? null,
  );
  const [applicationsClose, setApplicationsClose] = useState<string | null>(
    () => editing?.applicationsClose ?? null,
  );
  const [info, setInfo] = useState(() => editing?.info ?? "");
  const [pickerTarget, setPickerTarget] = useState<DateTarget | null>(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = editing?.id ?? (makeLocalId("tc") as TraderCategoryId);
    onSave({
      id,
      name: trimmed,
      icon,
      applicationsOpen,
      applicationsClose,
      info: info.trim(),
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

        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Icon
          </label>
          <div className="grid grid-cols-4 gap-2">
            {TRADER_ICONS.map((opt) => {
              const active = opt.id === icon;
              const cls = [
                "h-12 rounded-lg border-2 flex items-center justify-center transition",
                active
                  ? "border-gold-500 bg-gold-50 text-gold-700"
                  : "border-ink-200 bg-white text-ink-500 hover:border-ink-300",
              ].join(" ");
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIcon(opt.id)}
                  aria-pressed={active}
                  aria-label={opt.label}
                  className={cls}
                  title={opt.label}
                >
                  <i className={`${opt.faClass} text-base`} aria-hidden />
                </button>
              );
            })}
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
            Perks, arrival times, pitch sizes, power availability — what
            traders need to know.
          </p>
          <EditorTextarea
            value={info}
            onChange={setInfo}
            placeholder="3m × 3m pitch. Arrival from 6am for setup. Power and water at extra cost. Public liability insurance required."
            rows={5}
          />
        </div>
      </EditorDrawer>

      <FullScreenDatePicker
        open={pickerTarget !== null}
        title={pickerTarget === "open" ? "Applications open" : "Applications close"}
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
