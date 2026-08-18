"use client";

import { XIcon } from "@/components/ui/Icons";

/**
 * Help & Support lightbox, opened from the user menu (top right).
 *
 * Controlled by the parent (UserMenu holds the open state) - purely
 * informational, so there's no context or data fetching here. Uses the
 * same modal-backdrop/modal classes as CreateModal so the two dialogs
 * look and behave identically (backdrop click or the X closes it).
 */
export function HelpSupportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-labelledby="helpSupportTitle"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title" id="helpSupportTitle">
            Help &amp; Support
          </h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-sm text-ink-600 mb-4">
            For all support queries, please contact the CarEvents.com and
            DriveLife team on:
          </p>
          <div className="space-y-2">
            <ContactRow
              icon={<MailIcon />}
              label="E"
              display="info@carevents.com"
              href="mailto:info@carevents.com"
            />
            <ContactRow
              icon={<PhoneIcon />}
              label="Tel (UK & Europe)"
              display="(+44) 0800 488 0 720"
              href="tel:+448004880720"
            />
            <ContactRow
              icon={<PhoneIcon />}
              label="Tel (North America)"
              display="(+1) 302 4403699"
              href="tel:+13024403699"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One contact line - icon, muted label, and a clickable value
 *  (mailto/tel) so phones and mail clients open straight from here. */
function ContactRow({
  icon,
  label,
  display,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  display: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50/50 px-4 py-3 transition hover:border-gold-300 hover:bg-gold-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gold-600 ring-1 ring-ink-100">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-ink-500">{label}</span>
        <span className="block truncate text-sm font-semibold text-ink-900">
          {display}
        </span>
      </span>
    </a>
  );
}

// Local icons - Icons.tsx has no mail/phone glyphs; same stroke style
// as the shared set so they don't stand out.

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
