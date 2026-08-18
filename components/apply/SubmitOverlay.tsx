"use client";

/**
 * Full-screen busy overlay for the public application forms.
 *
 * Shown while the photo uploads and/or the application posts, so the
 * user gets unmissable feedback (the button-label swap alone was easy
 * to overlook) and can't re-submit or edit fields mid-flight.
 *
 * The spinner is pure CSS - the apply pages don't load FontAwesome
 * (only the editor layout does), so an <i class="fa-…"> here would
 * render as nothing.
 */
export function SubmitOverlay({
  show,
  label,
}: {
  show: boolean;
  label: string;
}) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 bg-white rounded-2xl shadow-xl ring-1 ring-ink-100 px-10 py-8">
        <span
          aria-hidden
          className="block w-9 h-9 rounded-full border-[3px] border-gold-200 border-t-gold-600 animate-spin"
        />
        <p className="text-sm font-semibold text-ink-800">{label}</p>
      </div>
    </div>
  );
}
