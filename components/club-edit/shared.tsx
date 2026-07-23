"use client";

import { useRef, type ReactNode } from "react";

/** Shared form bits for the club edit panels. */

export const inputCls =
  "w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20";

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
      <label className="mb-2 block text-sm font-bold text-ink-900">
        {children}
        {required && <span className="ml-0.5 text-gold-600">*</span>}
      </label>
      {hint && <p className="-mt-1 mb-2 text-xs text-ink-400">{hint}</p>}
    </>
  );
}

/** Section divider used between field groups. */
export function Divider() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-ink-100 to-transparent" />
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
    <div className="flex gap-4 rounded-2xl border border-gold-100 bg-gradient-to-br from-gold-50/60 to-transparent p-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-100 transition hover:ring-2 hover:ring-gold-400"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-gold-400">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </span>
        )}
      </button>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-ink-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-ink-500">{description}</p>
        )}
        <p className="mt-0.5 text-xs text-ink-400">{hint}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-gold-500/20 transition hover:from-gold-600 hover:to-gold-700"
        >
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
