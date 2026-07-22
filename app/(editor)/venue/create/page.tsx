"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Create Venue — entry step (UI only).
 *
 * A single "name your venue" step. In future, pressing Next Step /
 * Create will POST the title to create a draft venue, then forward to
 * /venues/edit/[venueId] where the full wizard (profile, description,
 * publish) continues. For now it's UI-only: see handleCreate().
 */
export default function CreateVenuePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    // TODO (wire later): create a draft venue with { title } via the
    // venue-create endpoint, then forward to the edit wizard:
    //
    //   const { venueId } = await createVenue({ title });
    //   router.push(`/venue/edit/${venueId}`);
    //
    // UI-only for now — no-op so the button doesn't navigate anywhere
    // half-built. Remove this line when the endpoint lands.
    void router;
  };

  const canProceed = title.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 md:px-6">
        {/* Left nav */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="mb-6">
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400 transition hover:text-gold-600"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </Link>
            <h2 className="mt-2 text-lg font-extrabold text-ink-900">
              Create Venue
            </h2>
          </div>
          <nav className="space-y-1.5">
            <div className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-3 text-left text-sm font-semibold text-white shadow-sm shadow-gold-500/25">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25 text-[11px] font-bold text-white">
                ›
              </span>
              Get Started
            </div>
          </nav>
        </aside>

        {/* Panel */}
        <main className="flex-1">
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />
            <div className="p-8 md:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
                Create Venue
              </p>
              <h1 className="mt-1 text-center text-2xl font-extrabold text-ink-900 md:text-3xl">
                Name your venue
              </h1>
              <div className="mx-auto mt-6 mb-8 h-px w-full bg-gradient-to-r from-transparent via-ink-100 to-transparent" />

              <div>
                <label className="mb-2 block text-sm font-bold text-ink-900">
                  Venue title
                </label>
                <input
                  className="w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  value={title}
                  maxLength={60}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="venue title"
                />
                <p className="mt-1 text-right text-xs text-ink-400">
                  Max 60 characters
                </p>
              </div>

              {/* Actions */}
              <div className="mt-10 flex items-center justify-center gap-3">
                <Link
                  href="/create"
                  className="rounded-xl bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
                >
                  Go Back
                </Link>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!canProceed}
                  className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
