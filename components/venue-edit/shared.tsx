"use client";

import { useRef, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  useVenueEdit,
  type VenueFieldKey,
  type VenueForm,
} from "@/context/VenueEditContext";
import { pushStepUrl } from "@/lib/stepNav";
import { getVenueStep, type VenueEditStepKey } from "@/lib/venueEditSteps";

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

/**
 * Step navigation for the venue editor's chrome.
 *
 * Shallow, like the event editor's (lib/stepNav.ts): a step change only
 * swaps the `?step=` param and every panel is already in the bundle, so
 * there is nothing to fetch. `router.push` round-tripped to the server
 * first, which showed up as a dead pause between clicking a tab and the
 * panel changing.
 *
 * `activeStep` is resolved through getVenueStep, so a hand-edited or
 * stale `?step=` falls back to the first step everywhere at once.
 */
export function useVenueStepNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStep = getVenueStep(searchParams.get("step")).key;

  const goToStep = (
    key: VenueEditStepKey,
    { scrollTop = true }: { scrollTop?: boolean } = {},
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    pushStepUrl(`${pathname}?${params.toString()}`);
    // Land on the header of the next step, not mid-form.
    if (scrollTop) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { activeStep, goToStep };
}

/**
 * Wording + icon for the save controls, from the status picked on the
 * Publish step and what the server currently holds. Same rules as the
 * event editor: the rocket is reserved for the click that actually
 * takes the venue live; everything else - including pulling a live
 * venue back to draft - is a plain save.
 */
export function venueSaveCta(
  status: VenueForm["status"],
  liveStatus: VenueForm["status"],
) {
  const isLive = liveStatus === "publish";
  const willGoLive = status === "publish" && !isLive;
  return {
    /** Short - fits the mobile topbar. */
    label: willGoLive
      ? "Publish"
      : status === "draft" && isLive
        ? "Save as draft"
        : "Save",
    /** Longer - the bottom bar and the Publish step's big button. */
    longLabel: willGoLive
      ? "Publish venue"
      : status === "draft"
        ? "Save draft"
        : "Save",
    busyLabel: willGoLive ? "Publishing…" : "Saving…",
    icon: willGoLive ? "fa-solid fa-rocket" : "fa-solid fa-floppy-disk",
  };
}

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
 * Text input with a leading icon - the event editor's "Contact & links"
 * row, plus the venue editor's blur-triggered validation underneath.
 * The placeholder doubles as the visible label, so the same text is
 * repeated as an aria-label.
 */
export function IconTextField({
  field,
  icon,
  placeholder,
  type,
  onBlur,
}: {
  field: VenueFieldKey;
  icon: string;
  placeholder: string;
  type?: string;
  /** Extra blur handling (e.g. normalising a handle) before markTouched. */
  onBlur?: () => void;
}) {
  const { venue, set, errors, touched, markTouched } = useVenueEdit();
  const error = errors[field];
  const showError = Boolean(touched[field] && error);

  return (
    <div>
      <div className="relative">
        <i
          className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-4 text-center pointer-events-none`}
          aria-hidden
        />
        <input
          className={`${inputCls} ${showError ? "has-error" : ""}`}
          style={{ paddingLeft: 44 }}
          value={String(venue[field] ?? "")}
          onChange={(e) => set(field, e.target.value as never)}
          onBlur={() => {
            onBlur?.();
            markTouched(field);
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          type={type}
          aria-invalid={showError}
        />
      </div>
      {showError && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/** Hidden file input shared by an image field's buttons. */
function usePicker(onPick: (file: File, previewUrl: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow re-picking the same file
        if (file) onPick(file, URL.createObjectURL(file));
      }}
    />
  );
  return { open: () => inputRef.current?.click(), input };
}

/**
 * Cover image - the event editor's large preview, at the same 11:5
 * shape the public page crops to, so what the organiser sees here is
 * what visitors get. `percent` is defined while an upload is running.
 */
export function CoverImageField({
  label,
  hint,
  previewUrl,
  percent,
  error,
  onPick,
}: {
  label: string;
  hint: string;
  previewUrl: string | null;
  percent?: number;
  error?: string | null;
  onPick: (file: File, previewUrl: string) => void;
}) {
  const { open, input } = usePicker(onPick);
  const busy = percent !== undefined;

  return (
    <div className="mb-8">
      <label className="block text-sm font-semibold text-ink-900 mb-2">
        {label}
      </label>
      <p className="text-xs text-ink-500 mb-3">{hint}</p>

      <div className="relative rounded-2xl overflow-hidden border border-ink-200 bg-ink-100 aspect-[11/5]">
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            {/* Always visible rather than hover-only: there is no hover
                on a phone, which is where most venue photos come from. */}
            <button
              type="button"
              onClick={open}
              disabled={busy}
              className="absolute bottom-3 right-3 px-3 py-2 text-xs font-semibold text-ink-900 bg-white/95 hover:bg-white rounded-lg transition disabled:opacity-60"
            >
              <i className="fa-solid fa-upload mr-1.5" aria-hidden />
              Replace
            </button>
            {busy && (
              <div className="absolute inset-0 bg-ink-900/40 flex flex-col items-center justify-center gap-2 pointer-events-none">
                <i
                  className="fa-solid fa-spinner fa-spin text-white text-2xl"
                  aria-hidden
                />
                <span className="text-xs font-semibold text-white">
                  Uploading… {percent}%
                </span>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={open}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-500 hover:bg-gold-50 hover:text-gold-700 transition"
          >
            <i className="fa-solid fa-image text-3xl" aria-hidden />
            <span className="text-sm font-semibold">Add cover image</span>
            <span className="text-xs">Recommended 1100 × 500px</span>
          </button>
        )}
      </div>

      {input}

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Logo - the event editor's logo card: a square preview that shows the
 * whole logo (object-contain, not cropped) beside a Replace button, or
 * a dashed drop-style button while there isn't one.
 */
export function LogoImageField({
  label,
  hint,
  uploadLabel,
  previewUrl,
  percent,
  error,
  onPick,
}: {
  label: string;
  hint: string;
  uploadLabel: string;
  previewUrl: string | null;
  percent?: number;
  error?: string | null;
  onPick: (file: File, previewUrl: string) => void;
}) {
  const { open, input } = usePicker(onPick);
  const busy = percent !== undefined;

  return (
    <div className="bg-white border border-ink-200 rounded-xl p-4 mb-8">
      <label className="block text-sm font-semibold text-ink-900 mb-2">
        {label}
      </label>
      <p className="text-xs text-ink-500 mb-3">{hint}</p>

      {input}

      {previewUrl ? (
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 shrink-0 rounded-lg border border-ink-200 bg-ink-50 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={open}
            disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 disabled:opacity-50 rounded-lg transition"
          >
            {busy ? `Uploading… ${percent}%` : "Replace logo"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          disabled={busy}
          className="w-full py-6 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 disabled:opacity-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex flex-col items-center justify-center gap-2"
        >
          <i className="fa-solid fa-image text-lg" aria-hidden />
          {busy ? `Uploading… ${percent}%` : uploadLabel}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
