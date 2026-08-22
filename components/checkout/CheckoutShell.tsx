"use client";

import { type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  APPLY_THEME_PARAM,
  applyShellClass,
  parseApplyTheme,
} from "@/lib/applyTheme";

/**
 * Page chrome for the public ticket checkout.
 *
 * Deliberately identical to the apply-form shells (see
 * app/apply/car-club/[eventEid]/page.tsx): same `apply-shell` root
 * class so the `?theme=dark` inverted palette in globals.css applies
 * unchanged, same `.input` styling block because there is no shared
 * input primitive in this codebase.
 */
export function CheckoutShell({ children }: { children: ReactNode }) {
  const theme = parseApplyTheme(useSearchParams()?.get(APPLY_THEME_PARAM));
  return (
    <div
      className={`${applyShellClass(theme)} min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40 py-8 sm:py-14 px-4`}
    >
      <style>{`
        .apply-shell .input,
        .apply-shell input.input,
        .apply-shell select.input,
        .apply-shell textarea.input {
          width: 100%;
          padding: 11px 14px;
          font-size: 15px;
          line-height: 1.4;
          color: var(--ink, #1f1d18);
          background: #fafafa;
          border: 1px solid #dedcd5;
          border-radius: 10px;
          outline: none;
          transition: border-color .15s, box-shadow .15s, background .15s;
          -webkit-appearance: none;
          appearance: none;
        }
        .apply-shell textarea.input { min-height: 88px; resize: vertical; }
        .apply-shell .input::placeholder { color: #a8a59c; }
        .apply-shell .input:hover { border-color: #cfccc3; }
        .apply-shell .input:focus {
          background: #fff;
          border-color: var(--gold-deep, #bd7420);
          box-shadow: 0 0 0 3px rgba(189,116,32,.15);
        }
        .apply-shell .input.input-error { border-color: #dc2626; }
        .apply-shell select.input {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a877e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
        }
      `}</style>
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );
}

export function Section({
  title,
  step,
  children,
  aside,
}: {
  title: string;
  step?: number;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-ink-100">
        {typeof step === "number" && (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold-500 text-white text-xs font-bold shrink-0">
            {step}
          </span>
        )}
        <h2 className="text-base font-bold text-ink-900 tracking-tight">
          {title}
        </h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-500 inline-flex items-center gap-1">
        {label}
        {required && (
          <span className="text-gold-600 text-sm leading-none">*</span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}
