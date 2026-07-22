"use client";

import { useAuth } from "@/context/AuthContext";

/**
 * My Account — profile view for the signed-in user.
 *
 * Laid out to match the account screen (Your details + Notification
 * Preferences), but display-only: there's no profile-update endpoint
 * yet, so fields are disabled and prefilled from AuthContext. When a
 * WP update route lands, these inputs become editable with minimal
 * change — the structure is already here.
 *
 * AuthUser only carries id / email / display_name / roles, so First/
 * Last name are derived from display_name; Town and notification
 * preferences have no source yet and render as empty/disabled.
 */
export default function AccountPage() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">My Account</div>
            <div className="section-subtitle">Loading your details…</div>
          </div>
        </div>
      </div>
    );
  }

  const [firstName, lastName] = splitName(user.display_name);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      {/* ── Your details ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 md:p-8">
        <h2 className="mb-6 text-lg font-extrabold text-ink-900">
          Your details
        </h2>

        <div className="space-y-5">
          <FieldRow label="First Name">
            <input className={inputCls} value={firstName} disabled />
          </FieldRow>

          <FieldRow label="Last Name">
            <input className={inputCls} value={lastName} disabled />
          </FieldRow>

          <FieldRow
            label="Nearest Town/City"
            hint="So we can show events close to you"
          >
            <input
              className={inputCls}
              value=""
              placeholder="Not set"
              disabled
            />
          </FieldRow>

          <FieldRow label="Email">
            <input className={inputCls} value={user.email} disabled />
          </FieldRow>

          <FieldRow label="Password">
            <button
              type="button"
              disabled
              className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
            >
              Change Password
            </button>
          </FieldRow>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-6">
          <button
            type="button"
            disabled
            className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 text-sm font-bold text-white opacity-60"
          >
            Update
          </button>
          <p className="mt-2 text-xs text-ink-400">
            Editing your profile isn’t available yet — coming soon.
          </p>
        </div>
      </div>

      {/* ── Notification Preferences ─────────────────────────────── */}
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 md:p-8">
        <h2 className="mb-6 text-lg font-extrabold text-ink-900">
          Notification Preferences
        </h2>

        <div className="overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2 border-b border-ink-100 pb-3">
            <span />
            <span className="text-center text-sm font-bold text-ink-900">
              Email
            </span>
            <span className="text-center text-sm font-bold text-ink-900">
              Notifications
            </span>
          </div>

          <PrefRow label="Events that I might like" />
          <PrefRow label="News & updates" />
        </div>

        <div className="mt-6">
          <button
            type="button"
            disabled
            className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 text-sm font-bold text-white opacity-60"
          >
            Update
          </button>
        </div>
      </div>

      {/* ── Footer / support + sign out ──────────────────────────── */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          type="button"
          className="rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          onClick={signOut}
        >
          Sign out
        </button>
        <p className="text-center text-xs text-ink-400">
          For help, support or if you would like to delete your account, please
          email{" "}
          <a
            href="mailto:info@carevents.com"
            className="font-semibold text-gold-600 hover:underline"
          >
            info@carevents.com
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-2.5 text-sm text-ink-700 disabled:cursor-not-allowed";

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[minmax(160px,220px)_1fr] md:gap-6">
      <div>
        <label className="text-sm font-semibold text-ink-900">{label}</label>
        {hint && <p className="mt-0.5 text-xs italic text-ink-400">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function PrefRow({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2 border-b border-ink-100 py-4 last:border-0">
      <span className="text-sm text-ink-700">{label}</span>
      <div className="flex justify-center">
        <input
          type="checkbox"
          disabled
          className="h-4 w-4 rounded border-ink-300 accent-gold-500"
        />
      </div>
      <div className="flex justify-center">
        <input
          type="checkbox"
          disabled
          className="h-4 w-4 rounded border-ink-300 accent-gold-500"
        />
      </div>
    </div>
  );
}

/** Split a display name into [first, last]. Single-word names put the
 *  whole thing in first; extra words fold into last. */
function splitName(displayName: string): [string, string] {
  const parts = (displayName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ["", ""];
  if (parts.length === 1) return [parts[0], ""];
  return [parts[0], parts.slice(1).join(" ")];
}
