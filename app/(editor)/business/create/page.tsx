"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateBusiness } from "@/lib/myBusinesses";
import { DEFAULT_REGION_KEY, type RegionKey } from "@/lib/regions";
import { RegionSelect } from "@/components/ui/RegionSelect";
import { businessEditPath } from "@/lib/siteRoutes";

/**
 * Create Business - entry step.
 *
 * Name the business and pick which CarEvents site (UK / US) lists it,
 * then a draft is created and the full wizard continues at
 * /business/{ref}/edit. The detailed country field lives in the wizard.
 */
export default function CreateBusinessPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [site, setSite] = useState<RegionKey>(DEFAULT_REGION_KEY);
  const createBusiness = useCreateBusiness();

  const handleCreate = async () => {
    setError(null);
    try {
      const business = await createBusiness.mutateAsync({
        post_title: title.trim(),
        site,
      });
      router.push(businessEditPath(business.encrypted_id, site));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create the business.",
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
                Create Business
              </p>
              <h1 className="mt-1 text-center text-2xl font-extrabold text-ink-900 md:text-3xl">
                Name your business
              </h1>
              <p className="mt-3 text-center text-sm text-ink-500">
                List a detailer, tuner, dealer, caterer, photographer - any
                business that serves car culture. You’ll add categories,
                photos and contact details next.
              </p>
              <div className="mx-auto mt-6 mb-8 h-px w-full bg-gradient-to-r from-transparent via-ink-100 to-transparent" />

              <div>
                <label className="mb-2 block text-sm font-bold text-ink-900">
                  Business name
                </label>
                <input
                  className="w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  value={title}
                  maxLength={60}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canProceed) {
                      e.preventDefault();
                      void handleCreate();
                    }
                  }}
                  placeholder="e.g. Kent Detailing Co."
                />
                <p className="mt-1 text-right text-xs text-ink-400">
                  Max 60 characters
                </p>
              </div>

              <div className="mt-5">
                <RegionSelect value={site} onChange={setSite} label="Directory" />
                <p className="mt-1 text-xs text-ink-400">
                  Which CarEvents site lists the business. You can set the exact country next.
                </p>
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
                  onClick={() => void handleCreate()}
                  disabled={!canProceed || createBusiness.isPending}
                  className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createBusiness.isPending ? "Creating…" : "Next Step"}
                </button>
              </div>

              {error && (
                <p className="mt-4 text-center text-xs font-semibold text-red-500">
                  {error}
                </p>
              )}

              <div className="mt-8 text-center">
                <Link
                  href="/businesses"
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
