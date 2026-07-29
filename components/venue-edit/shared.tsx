"use client";

import { useRef, type ReactNode } from "react";

import { useVenueEdit, type VenueFieldKey } from "@/context/VenueEditContext";

/**
 * Shared form bits for the venue edit panels.
 *
 * Fields use the editor's own `.input` / `.select` / `.textarea` classes
 * from app/(editor)/editor.css rather than a local Tailwind string, so
 * the venue editor's controls are literally the same as the event and
 * club editors'. All three pages live under the (editor) route group,
 * which is where that stylesheet is imported.
 */

export const inputCls = "input";
export const selectCls = "select";

export function FieldLabel({
  children,
  required,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <>
      <label className="block text-sm font-semibold text-ink-900 mb-2">
        {children}
        {required && <span className="text-gold-600"> *</span>}
      </label>
      {hint && <p className="-mt-1 mb-2 text-xs text-ink-500">{hint}</p>}
    </>
  );
}

/**
 * Text input wired straight to the venue context, with a blur-triggered
 * inline error. The error only shows once the field has been touched, so
 * a half-typed email doesn't go red under the user's cursor.
 */
export function TextField({
  field,
  label,
  required,
  hint,
  placeholder,
  type,
  onBlur,
}: {
  field: VenueFieldKey;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  type?: string;
  /** Extra blur handling (e.g. normalising a handle) before markTouched. */
  onBlur?: () => void;
}) {
  const { venue, set, errors, touched, markTouched } = useVenueEdit();
  const error = errors[field];
  const showError = Boolean(touched[field] && error);

  return (
    <div className="mb-8">
      <FieldLabel required={required} hint={hint}>
        {label}
      </FieldLabel>
      <input
        className={`${inputCls} ${showError ? "has-error" : ""}`}
        value={String(venue[field] ?? "")}
        onChange={(e) => set(field, e.target.value as never)}
        onBlur={() => {
          onBlur?.();
          markTouched(field);
        }}
        placeholder={placeholder}
        type={type}
        aria-invalid={showError}
      />
      {showError && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/**
 * Image picker row (logo / cover). Hidden file input + ref so the
 * thumbnail and the button both open the picker — the pattern that
 * actually works, rather than a bare button.
 */
export function ImageUploadRow({
  title,
  description,
  hint,
  previewUrl,
  onPick,
}: {
  title: string;
  description?: string;
  hint: string;
  previewUrl: string | null;
  onPick: (file: File, previewUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    onPick(file, URL.createObjectURL(file));
  };

  return (
    <div className="flex gap-4 rounded-xl border border-ink-200 bg-white p-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-100 ring-1 ring-ink-200 transition hover:ring-2 hover:ring-gold-400"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-gold-500">
            <i className="fa-regular fa-image text-2xl" aria-hidden />
          </span>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-ink-500">{description}</p>
        )}
        <p className="mt-0.5 text-xs text-ink-500">{hint}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gold-600"
        >
          <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden />
          {previewUrl ? "Replace" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

/** Progress bar / error line under an image row. */
export function UploadStatus({
  percent,
  error,
}: {
  percent?: number;
  error?: string | null;
}) {
  if (error) {
    return <p className="mt-2 text-xs text-red-500">{error}</p>;
  }
  if (percent === undefined) return null;
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
        <div
          className="h-full rounded-full bg-gold-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-500">Uploading… {percent}%</p>
    </div>
  );
}
