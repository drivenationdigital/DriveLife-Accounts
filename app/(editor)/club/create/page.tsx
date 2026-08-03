"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateClub } from "@/lib/clubEdit";

/**
 * Create Club - entry flow (UI only).
 *
 * Two steps in one page, both under the "Get Started" nav item:
 *   1. Club type - Private (join requests need approval) or Public.
 *   2. Name - the club title.
 *
 * In future, Next Step on the name step will create the club and
 * forward to /club/[clubId]/edit where the full wizard (profile,
 * description, membership questions, terms, admins, publish)
 * continues. See handleCreate().
 */

type Step = "type" | "name";
type ClubType = "private" | "public";

const CLUB_TYPES: { key: ClubType; title: string; description: string }[] = [
  {
    key: "private",
    title: "Private Club",
    description:
      "Users can request to join the club but must be approved by Club Admin",
  },
  {
    key: "public",
    title: "Public Club",
    description:
      "Anyone can join the club without requiring Club Admin approval",
  },
];

export default function CreateClubPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [clubType, setClubType] = useState<ClubType>("private");
  const [title, setTitle] = useState("");

  const createClub = useCreateClub();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    try {
      const club = await createClub.mutateAsync({
        post_title: title.trim(),
        club_type: clubType === "private" ? "1" : "2",
      });
      // Straight into the wizard to finish the remaining steps.
      router.push(`/club/${club.encrypted_id}/edit`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create the club.",
      );
    }
  };

  const canName = title.trim().length > 0;

  return (
    // Single centred card, matching the create-event entry screen -
    // no "Get Started" side column.
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
      <div className="mx-auto max-w-xl w-full px-4 py-8 sm:py-12">
        <main>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <div className="p-8 md:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
                Create Club
              </p>
              <h1 className="mt-1 text-center text-2xl font-extrabold text-ink-900 md:text-3xl">
                {step === "type" ? "Get Started" : "Name your club"}
              </h1>
              <div className="mx-auto mt-6 mb-8 h-px w-full bg-gradient-to-r from-transparent via-ink-100 to-transparent" />

              {/* ── Step 1: club type ───────────────────────────── */}
              {step === "type" && (
                <div className="space-y-4">
                  {CLUB_TYPES.map((opt) => {
                    const selected = clubType === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setClubType(opt.key)}
                        aria-pressed={selected}
                        className={[
                          "relative w-full rounded-xl px-6 py-5 text-left transition",
                          selected
                            ? "border-2 border-gold-500 bg-gold-50/40"
                            : "border-2 border-transparent bg-ink-50/70 hover:bg-ink-50",
                        ].join(" ")}
                      >
                        <h3 className="text-lg font-bold text-ink-900">
                          {opt.title}
                        </h3>
                        <p className="mt-1 pr-8 text-sm text-ink-500">
                          {opt.description}
                        </p>
                        {selected && (
                          <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-white">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Step 2: club name ───────────────────────────── */}
              {step === "name" && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-ink-900">
                    Club title
                  </label>
                  <input
                    className="w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                    value={title}
                    maxLength={60}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Club title"
                    autoFocus
                  />
                  <p className="mt-1 text-right text-xs text-ink-400">
                    Max 60 characters
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-10 flex items-center justify-center gap-3">
                {step === "name" && (
                  <button
                    type="button"
                    onClick={() => setStep("type")}
                    disabled={createClub.isPending}
                    className="disabled:opacity-50 rounded-xl bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
                  >
                    Go Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    step === "type" ? setStep("name") : handleCreate()
                  }
                  disabled={
                    (step === "name" && !canName) || createClub.isPending
                  }
                  className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createClub.isPending ? "Creating…" : "Next Step"}
                </button>
              </div>

              {error && (
                <p className="mt-4 text-center text-xs font-semibold text-red-500">
                  {error}
                </p>
              )}

              {/* Replaces the Back link that used to live in the side
                  column - same placement as the create-event screen. */}
              <div className="mt-8 text-center">
                <Link
                  href="/create"
                  className="text-xs text-ink-500 transition hover:text-ink-900"
                >
                  Cancel and return
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
