"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AccountSkeleton from "@/components/account/AccountSkeleton";
import { LocationAutocomplete } from "@/components/event-create/LocationAutocomplete";
import { REGION_COUNTRIES } from "@/lib/regions";
import {
  useAccount,
  useUpdateAccount,
  useChangePassword,
  type NotificationPrefs,
} from "@/lib/account";

/**
 * My Account - editable profile for the signed-in user.
 *
 * Loads the full profile from /account (name, town, email, notification
 * preferences), which is richer than AuthUser. "Your details" and
 * "Notification Preferences" save independently; changing the password
 * is a separate sub-form that requires the current password.
 */
const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  events_email: true,
  events_push: true,
  news_email: true,
  news_push: true,
};

export default function AccountPage() {
  const { signOut } = useAuth();
  const { data, isLoading, error } = useAccount();
  const account = data?.account;

  // ── Details form ────────────────────────────────────────────────
  // Seed the editable form from the loaded account. Rather than syncing
  // via an effect (which double-renders), we reset state *during render*
  // when the loaded values change - the "adjust state on prop change"
  // pattern from the React docs. `hydratedFrom` tracks what we last
  // seeded from, so we only reset when the server data actually changes
  // (initial load, or after a save returns fresh values), never on every
  // keystroke.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [town, setTown] = useState("");
  const [email, setEmail] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [notifs, setNotifs] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATIONS,
  );

  // A signature of the server values we've hydrated from. When the query
  // returns new data, this differs and we re-seed the fields once.
  const [hydratedFrom, setHydratedFrom] = useState<string | null>(null);
  const accountSig = account
    ? JSON.stringify([
        account.first_name,
        account.last_name,
        account.nearest_town,
        account.email,
        account.notifications,
      ])
    : null;

  if (account && accountSig !== hydratedFrom) {
    setFirstName(account.first_name);
    setLastName(account.last_name);
    setTown(account.nearest_town);
    setEmail(account.email);
    setInitialEmail(account.email);
    setNotifs(account.notifications);
    setHydratedFrom(accountSig);
  }

  const updateAccount = useUpdateAccount();
  const [detailsMsg, setDetailsMsg] = useState<Msg>(null);
  const [notifMsg, setNotifMsg] = useState<Msg>(null);

  const saveDetails = async () => {
    setDetailsMsg(null);
    if (!firstName.trim() || !lastName.trim()) {
      setDetailsMsg({
        kind: "error",
        text: "First and last name are required.",
      });
      return;
    }
    const emailChanged = email.trim() !== initialEmail;
    try {
      const res = await updateAccount.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nearest_town: town.trim(),
        email: email.trim(),
        email_changed: emailChanged,
      });
      setInitialEmail(res.account.email);
      setDetailsMsg({ kind: "ok", text: "Saved ✓" });
    } catch (err) {
      setDetailsMsg({
        kind: "error",
        text:
          err instanceof Error ? err.message : "Couldn't save your details.",
      });
    }
  };

  const saveNotifs = async () => {
    setNotifMsg(null);
    try {
      await updateAccount.mutateAsync({ notifications: notifs });
      setNotifMsg({ kind: "ok", text: "Saved ✓" });
    } catch (err) {
      setNotifMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Couldn't save preferences.",
      });
    }
  };

  const toggle = (key: keyof NotificationPrefs) =>
    setNotifs((n) => ({ ...n, [key]: !n[key] }));

  // ── Loading / error ─────────────────────────────────────────────
  if (isLoading && !account) {
    return <AccountSkeleton />;
  }

  if (error || !account) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-ink-100">
          <p className="text-sm font-semibold text-red-500">
            Couldn&apos;t load your account.
          </p>
          {error && (
            <p className="mt-1 text-sm text-ink-500">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  const savingDetails = updateAccount.isPending;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      {/* ── Your details ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 md:p-8">
        <h2 className="mb-6 text-lg font-extrabold text-ink-900">
          Your details
        </h2>

        <div className="space-y-5">
          <FieldRow label="First Name">
            <input
              className={inputCls}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </FieldRow>

          <FieldRow label="Last Name">
            <input
              className={inputCls}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </FieldRow>

          <FieldRow
            label="Nearest Town/City"
            hint="So we can show events close to you"
          >
            {/* Cities only, and restricted to the countries we actually
                list events in - the field exists to place the user near
                events, so a town we'll never have anything near isn't a
                useful answer. Free text still works for somewhere too
                small for Places to know. */}
            <LocationAutocomplete
              value={town}
              countries={REGION_COUNTRIES}
              types={["(cities)"]}
              placeholder="e.g. Manchester"
              // Match the other fields on this form. The component's
              // default is the editor's `.input`, which renders as an
              // unstyled box here.
              inputClassName={inputCls}
              showPinIcon={false}
              onValueChange={setTown}
              onPlacePicked={(place) => setTown(place.address || place.name)}
            />
          </FieldRow>

          <FieldRow label="Email">
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldRow>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-6">
          <button
            type="button"
            onClick={saveDetails}
            disabled={savingDetails}
            className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 text-sm font-bold text-white transition hover:from-gold-600 hover:to-gold-700 disabled:opacity-50"
          >
            {savingDetails ? "Saving…" : "Update"}
          </button>
          {detailsMsg && <FeedbackLine msg={detailsMsg} />}
        </div>
      </div>

      {/* ── Change password ──────────────────────────────────────── */}
      <ChangePasswordCard />

      {/* ── Notification Preferences ─────────────────────────────── */}
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 md:p-8">
        <h2 className="mb-6 text-lg font-extrabold text-ink-900">
          Notification Preferences
        </h2>

        <div>
          <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2 border-b border-ink-100 pb-3">
            <span />
            <span className="text-center text-sm font-bold text-ink-900">
              Email
            </span>
            <span className="text-center text-sm font-bold text-ink-900">
              Notifications
            </span>
          </div>

          <PrefRow
            label="Events that I might like"
            email={notifs.events_email}
            push={notifs.events_push}
            onEmail={() => toggle("events_email")}
            onPush={() => toggle("events_push")}
          />
          <PrefRow
            label="News & updates"
            email={notifs.news_email}
            push={notifs.news_push}
            onEmail={() => toggle("news_email")}
            onPush={() => toggle("news_push")}
          />
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={saveNotifs}
            disabled={savingDetails}
            className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 text-sm font-bold text-white transition hover:from-gold-600 hover:to-gold-700 disabled:opacity-50"
          >
            {savingDetails ? "Saving…" : "Update"}
          </button>
          {notifMsg && <FeedbackLine msg={notifMsg} />}
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

// ─── Change password ──────────────────────────────────────────────────

function ChangePasswordCard() {
  const changePassword = useChangePassword();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<Msg>(null);

  const submit = async () => {
    setMsg(null);
    if (!current || !next) {
      setMsg({ kind: "error", text: "Fill in both password fields." });
      return;
    }
    if (next.length < 8) {
      setMsg({
        kind: "error",
        text: "New password must be at least 8 characters.",
      });
      return;
    }
    if (next !== confirm) {
      setMsg({ kind: "error", text: "New passwords don't match." });
      return;
    }
    try {
      await changePassword.mutateAsync({
        current_password: current,
        new_password: next,
      });
      setMsg({ kind: "ok", text: "Password updated ✓" });
      setCurrent("");
      setNext("");
      setConfirm("");
      setOpen(false);
    } catch (err) {
      setMsg({
        kind: "error",
        text: err instanceof Error ? err.message : "Couldn't change password.",
      });
    }
  };

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink-900">Password</h2>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
          >
            Change Password
          </button>
        )}
      </div>

      {open && (
        <div className="mt-6 space-y-5">
          <FieldRow label="Current Password">
            <input
              className={inputCls}
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </FieldRow>
          <FieldRow label="New Password">
            <input
              className={inputCls}
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </FieldRow>
          <FieldRow label="Confirm New Password">
            <input
              className={inputCls}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </FieldRow>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={changePassword.isPending}
              className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 text-sm font-bold text-white transition hover:from-gold-600 hover:to-gold-700 disabled:opacity-50"
            >
              {changePassword.isPending ? "Saving…" : "Save Password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setMsg(null);
                setCurrent("");
                setNext("");
                setConfirm("");
              }}
              className="text-sm font-semibold text-ink-500 hover:text-ink-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && <FeedbackLine msg={msg} />}
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-2.5 text-sm text-ink-700 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20";

type Msg = { kind: "ok" | "error"; text: string } | null;

function FeedbackLine({ msg }: { msg: NonNullable<Msg> }) {
  return (
    <p
      className={`mt-2 text-xs font-semibold ${
        msg.kind === "error" ? "text-red-500" : "text-green-600"
      }`}
    >
      {msg.text}
    </p>
  );
}

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

function PrefRow({
  label,
  email,
  push,
  onEmail,
  onPush,
}: {
  label: string;
  email: boolean;
  push: boolean;
  onEmail: () => void;
  onPush: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2 border-b border-ink-100 py-4 last:border-0">
      <span className="text-sm text-ink-700">{label}</span>
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={email}
          onChange={onEmail}
          className="h-4 w-4 rounded border-ink-300 accent-gold-500"
        />
      </div>
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={push}
          onChange={onPush}
          className="h-4 w-4 rounded border-ink-300 accent-gold-500"
        />
      </div>
    </div>
  );
}
