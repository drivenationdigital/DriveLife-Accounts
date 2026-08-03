"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Reusable drawer / modal shell.
 *
 * Layout matches the mockup's drawer pattern:
 *   - Mobile: bottom sheet (rounded-t-3xl), full width.
 *   - Desktop: centred dialog, max-w-lg, rounded-2xl, max-h 90vh.
 *
 * Used by TicketDrawer, SectionDrawer, and any future drawers
 * (DiscountDrawer, ShowCarCategoryDrawer, TraderCategoryDrawer).
 *
 * Design notes:
 *   - Rendered via portal to document.body so the overlay escapes
 *     the editor's sticky topbar / sidebar transforms (same reason
 *     as FullScreenDatePicker).
 *   - ESC closes; backdrop click closes; body scroll locks via the
 *     `editor-drawer-open` class added to <body>.
 *   - Header / footer slots are passed in so each drawer can supply
 *     its own title + action buttons. The body is just `children`.
 *   - Footer is sticky at the bottom of the panel - the body
 *     scrolls beneath. This means long forms (like the Ticket form)
 *     keep Save/Cancel always visible.
 */
export function EditorDrawer({
  open,
  onClose,
  eyebrow,
  title,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Small uppercase label above the title, e.g. "Ticket". */
  eyebrow: string;
  /** The drawer's main heading. */
  title: string;
  /** Sticky footer content - usually action buttons. */
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  // ESC closes + body scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.classList.add("editor-drawer-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("editor-drawer-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Mobile drag-handle decoration. */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-ink-200" />
        </div>

        <header className="flex items-center justify-between p-5 sm:p-6 border-b border-ink-200">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold">
              {eyebrow}
            </p>
            <h3 className="font-display text-xl text-ink-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition shrink-0"
          >
            <i className="fa-solid fa-xmark text-ink-700" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {children}
        </div>

        <footer className="flex items-center gap-2 p-5 sm:p-6 border-t border-ink-200 bg-ink-50">
          {footer}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
