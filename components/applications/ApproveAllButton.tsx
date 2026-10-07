"use client";

import { useState } from "react";

import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { CheckIcon } from "@/components/ui/Icons";

/**
 * "Approve all" for a pending-applications group (show cars, car clubs,
 * traders).
 *
 * Runs the SAME per-application approve the detail modal / card uses,
 * one at a time, rather than a bulk endpoint: every approval already
 * sends an email, creates a £0 order or a club ticket, adjusts stock,
 * and so on, and running those sequentially keeps that server-side
 * behaviour identical to approving by hand - just without the clicks.
 * A failure on one application doesn't stop the rest; it's reported at
 * the end and that application stays pending.
 *
 * The ids are captured when the organiser confirms, so the list
 * refetching underneath (each approve invalidates it) can't change
 * what gets approved.
 */
export function ApproveAllButton({
  ids,
  noun,
  approve,
}: {
  /** Application ids currently pending, in display order. */
  ids: number[];
  /** Singular noun for the copy, e.g. "show car application". */
  noun: string;
  /** The per-application approve. Should reject on failure. */
  approve: (id: number) => Promise<unknown>;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  if (ids.length === 0) return null;

  const plural = (n: number) => `${n} ${noun}${n === 1 ? "" : "s"}`;

  const run = async () => {
    if (progress) return;
    const targets = [...ids];
    const ok = await confirm({
      title: `Approve all ${plural(targets.length)}?`,
      message:
        "Each applicant is approved and emailed exactly as if you approved them one by one. Approvals can't be undone from here - reject individually if you change your mind.",
      confirmLabel: "Approve all",
    });
    if (!ok) return;

    let approved = 0;
    let failed = 0;
    setProgress({ done: 0, total: targets.length });
    for (const id of targets) {
      try {
        await approve(id);
        approved += 1;
      } catch {
        failed += 1;
      }
      setProgress({ done: approved + failed, total: targets.length });
    }
    setProgress(null);

    if (failed === 0) {
      toast.success(`Approved ${plural(approved)}.`);
    } else {
      toast.error(
        `Approved ${approved}, but ${failed} couldn't be approved - ${failed === 1 ? "it is" : "they are"} still pending.`,
      );
    }
  };

  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={run}
      disabled={progress !== null}
      aria-busy={progress !== null}
    >
      <CheckIcon />
      {progress
        ? `Approving ${progress.done} of ${progress.total}…`
        : `Approve all (${ids.length})`}
    </button>
  );
}
