/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { useClubEdit } from "@/context/ClubEditContext";
import { useInviteClubAdmin } from "@/lib/clubAdmins";
import { FieldLabel, inputCls } from "../shared";

/**
 * Step 6 - club administrators.
 *
 * Admins are added by INVITATION, not directly: inviting emails the
 * person an accept link, and they become an administrator only once
 * they accept. So the existing admin list here is read-only, and
 * invites show as pending until accepted.
 *
 * The invite endpoint is owner-only, so the form is hidden for users
 * who are administrators rather than the owner.
 */
export function ClubAdministratorsPanel({
  canInvite = true,
}: {
  /** Only the club owner may invite (endpoint enforces this too). */
  canInvite?: boolean;
}) {
  const { club } = useClubEdit();
  const invite = useInviteClubAdmin();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invited, setInvited] = useState<string[]>([]);

  const handleInvite = async () => {
    const value = email.trim();
    setError(null);

    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    if (club.administrators.some((a) => a.email === value)) {
      setError("That person is already an administrator.");
      return;
    }
    if (invited.includes(value)) {
      setError("You've already invited that email.");
      return;
    }

    try {
      await invite.mutateAsync({ clubId: club.encrypted_id, email: value });
      setInvited((list) => [...list, value]);
      setEmail("");
    } catch (err) {
      // Endpoint messages are user-facing ("No user found with that
      // email address", "You do not have permission…").
      setError(
        err instanceof Error ? err.message : "Couldn't send the invite.",
      );
    }
  };

  return (
    <div className="mb-8 space-y-6">
      {canInvite && (
        <div>
          <FieldLabel hint="They'll get an email invitation. They become an administrator once they accept.">
            Invite an administrator
          </FieldLabel>
          <div className="flex gap-2">
            <input
              className={`${inputCls} flex-1 min-w-0`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInvite();
                }
              }}
              placeholder="their@email.com"
              type="email"
              disabled={invite.isPending}
            />
            <button
              type="button"
              onClick={handleInvite}
              disabled={invite.isPending}
              className="shrink-0 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {invite.isPending ? "Sending…" : "Invite"}
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          <p className="mt-1 text-xs text-ink-500">
            They need an existing account to be invited.
          </p>
        </div>
      )}

      {/* Pending invites from this session */}
      {invited.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Invitations sent
          </h3>
          <ul className="space-y-2">
            {invited.map((addr) => (
              <li
                key={addr}
                className="flex items-center justify-between gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3"
              >
                <span className="truncate text-sm text-ink-700">{addr}</span>
                <span className="shrink-0 rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-700">
                  Pending
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Current administrators (read-only - managed via invites) */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Current administrators
        </h3>
        {club.administrators.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-white px-6 py-8 text-center text-sm text-ink-500">
            No administrators yet - you're the only one who can manage this
            club.
          </div>
        ) : (
          <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200">
            {club.administrators.map((admin) => (
              <li
                key={admin.id}
                className="flex items-center justify-between gap-3 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-900">
                    {admin.name}
                  </div>
                  <div className="truncate text-xs text-ink-500">
                    {admin.email}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
