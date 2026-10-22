"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateTrack } from "@/lib/myTracks";
import { DEFAULT_REGION_KEY, type RegionKey } from "@/lib/regions";
import { RegionSelect } from "@/components/ui/RegionSelect";
import { trackEditPath } from "@/lib/siteRoutes";

/**
 * Create Track - entry step.
 *
 * A single "name your track" step: creates a draft track then forwards
 * to /track/{ref}/edit where the full wizard (profile, description,
 * publish) continues. Same screen as Create Venue.
 */
export default function CreateTrackPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which WordPress site the track is created on. Fixed once it exists.
  const [site, setSite] = useState<RegionKey>(DEFAULT_REGION_KEY);
  const createTrack = useCreateTrack();

  const handleCreate = async () => {
    setError(null);
    try {
      const track = await createTrack.mutateAsync({
        post_title: title.trim(),
        site,
      });
      router.push(trackEditPath(track.encrypted_id, site));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create the track.",
      );
    }
  };

  const canProceed = title.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
      <div className="mx-auto max-w-xl w-full px-4 py-8 sm:py-12">
        <main>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <div className="p-8 md:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
                Add Track or Circuit
              </p>
              <h1 className="mt-1 text-center text-2xl font-extrabold text-ink-900 md:text-3xl">
                Name your track
              </h1>
              <div className="mx-auto mt-6 mb-8 h-px w-full bg-gradient-to-r from-transparent via-ink-100 to-transparent" />

              <div>
                <label className="mb-2 block text-sm font-bold text-ink-900">
                  Track name
                </label>
                <input
                  className="w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  value={title}
                  maxLength={60}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Santa Pod Raceway"
                />
                <p className="mt-1 text-right text-xs text-ink-400">
                  Max 60 characters
                </p>
              </div>

              <div className="mt-5">
                <RegionSelect value={site} onChange={setSite} />
              </div>

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
                  disabled={!canProceed || createTrack.isPending}
                  className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createTrack.isPending ? "Creating…" : "Next Step"}
                </button>
              </div>

              {error && (
                <p className="mt-4 text-center text-xs font-semibold text-red-500">
                  {error}
                </p>
              )}

              <div className="mt-8 text-center">
                <Link
                  href="/create"
                  className="dashboard-exit text-xs text-ink-500 transition hover:text-ink-900"
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
