"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useBusinessEdit } from "@/context/BusinessEditContext";
import { useAction } from "@/context/ActionContext";
import { useAddBusinessOwner, useRemoveBusinessOwner } from "@/lib/myBusinesses";
import { FieldLabel, inputCls } from "../shared";

/**
 * Step 4 - business owners.
 *
 * Unlike club administrators (invitation flow), owners are added
 * directly by email: the person must already have a CarEvents account,
 * and every owner can add or remove others. The last owner can't be
 * removed, and removing yourself sends you back to My Businesses.
 */
export function OwnersPanel() {
  const { business, setOwners } = useBusinessEdit();
  const router = useRouter();
  const runAction = useAction();
  const add = useAddBusinessOwner();
  const remove = useRemoveBusinessOwner();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const value = email.trim();
    setError(null);
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    if (business.owners.some((o) => o.email.toLowerCase() === value.toLowerCase())) {
      setError("That person is already an owner.");
      return;
    }
    try {
      const res = await add.mutateAsync({
        bid: business.bid,
        site: business.site,
        email: value,
      });
      setOwners(res.owners);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that owner.");
    }
  };

  const handleRemove = async (userId: number, name: string, isSelf: boolean) => {
    const res = await runAction({
      confirm: {
        title: isSelf ? "Remove yourself as an owner?" : `Remove ${name}?`,
        message: isSelf
          ? "You'll lose access to this business from your dashboard. Another owner can add you back."
          : `${name} will no longer be able to manage this business.`,
        confirmLabel: "Remove",
        cancelLabel: "Keep",
        danger: true,
      },
      loadingLabel: "Removing owner...",
      successTitle: "Owner removed",
      successMessage: isSelf
        ? "You no longer manage this business."
        : `${name} has been removed.`,
      errorTitle: "Couldn't remove the owner",
      run: () =>
        remove.mutateAsync({ bid: business.bid, site: business.site, userId }),
    });
    if (!res) return;
    if (res.removed_self) {
      router.push("/businesses");
      return;
    }
    setOwners(res.owners);
  };

  const canRemove = business.owners.length > 1;

  return (
    <div className="mb-8 space-y-6">
      <div>
        <FieldLabel hint="They need an existing CarEvents account. They'll be able to edit this listing straight away.">
          Add an owner
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
                void handleAdd();
              }
            }}
            placeholder="their@email.com"
            type="email"
            disabled={add.isPending}
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={add.isPending}
            className="shrink-0 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {add.isPending ? "Adding…" : "Add owner"}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Current owners
        </h3>
        {business.owners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-white px-6 py-8 text-center text-sm text-ink-500">
            No owners listed yet.
          </div>
        ) : (
          <ul className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200">
            {business.owners.map((owner) => (
              <li
                key={owner.id}
                className="flex items-center justify-between gap-3 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-900">
                    {owner.name}
                    {owner.is_self && (
                      <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700">
                        You
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-ink-500">{owner.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemove(owner.id, owner.name, owner.is_self)}
                  disabled={!canRemove || remove.isPending}
                  title={canRemove ? "Remove owner" : "A business needs at least one owner"}
                  className="shrink-0 text-xs font-semibold text-ink-500 underline underline-offset-4 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink-500">
          A business always keeps at least one owner.
        </p>
      </div>
    </div>
  );
}
