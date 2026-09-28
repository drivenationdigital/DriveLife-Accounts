"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useExhibitorDirectory, type ExhibitorBusiness } from "@/lib/myBusinesses";
import { REGION_LIST, type RegionKey, DEFAULT_REGION_KEY } from "@/lib/regions";
import { CountryFlag } from "@/components/ui/CountryFlag";

/**
 * Event Exhibitor Directory - businesses that are current members of
 * the Event Traders directory, for organisers looking for exhibitors.
 * Searchable, filterable by category, switchable between the UK and US
 * directories.
 */
export default function ExhibitorDirectoryPage() {
  const [site, setSite] = useState<RegionKey>(DEFAULT_REGION_KEY);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search box; a new query always starts from page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ((prev) => {
        const next = q.trim();
        if (next !== prev) setPage(1);
        return next;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const changeSite = (key: RegionKey) => {
    setSite(key);
    setPage(1);
  };
  const changeCategory = (slug: string) => {
    setCategory(slug);
    setPage(1);
  };

  const { data, isLoading, error, isPlaceholderData } = useExhibitorDirectory({
    site,
    q: debouncedQ,
    category,
    page,
  });

  const businesses = data?.businesses ?? [];
  const categories = data?.categories ?? [];
  const pagination = data?.pagination;
  const filtered = Boolean(debouncedQ || category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <Link
          href="/organiser-resources"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Event Resources
        </Link>
        <h1 className="page-title mt-2">Event Exhibitor Directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">
          Find food, drink and retail exhibitors for your next event. Every
          business here is a member of the Event Traders directory - browse by
          category and contact them directly about trading at your event.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100 md:flex-row md:items-center">
        <div className="flex rounded-lg border border-ink-200 p-0.5">
          {REGION_LIST.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => changeSite(r.key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                site === r.key ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
              }`}
              aria-pressed={site === r.key}
            >
              <CountryFlag country={r.country} label={r.label} />
              {r.abbr}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or keyword"
          className="flex-1 rounded-lg border border-ink-200 bg-ink-50/40 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20"
        />
        <select
          value={category}
          onChange={(e) => changeCategory(e.target.value)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20 md:w-64"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              changeCategory("");
            }}
            className="text-xs font-semibold text-gold-600 hover:text-gold-700"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn’t load the directory. {error.message}
        </div>
      )}

      {isLoading && !data && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-ink-100" />
          ))}
        </div>
      )}

      {!isLoading && !error && businesses.length === 0 && (
        <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-ink-100">
          <p className="text-sm font-semibold text-ink-900">
            {filtered ? "No exhibitors match those filters." : "No exhibitors listed yet."}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
            {filtered
              ? "Try another category or clear the search."
              : "Businesses join the Event Traders directory from their own dashboard. Check back soon, or ask your regular traders to list themselves."}
          </p>
        </div>
      )}

      {businesses.length > 0 && (
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          style={{ opacity: isPlaceholderData ? 0.6 : 1 }}
        >
          {businesses.map((b) => (
            <ExhibitorCard key={`${site}:${b.id}`} business={b} />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1 || isPlaceholderData}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <span className="text-sm text-ink-500">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!pagination.has_more || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}

function ExhibitorCard({ business }: { business: ExhibitorBusiness }) {
  const c = business.contact;
  const website = c.website ? c.website.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "") : "";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
      <div className="relative h-36 bg-ink-800">
        {business.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.cover_image} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        {business.logo && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={business.logo} alt="" className="h-20 w-20 rounded-xl bg-white object-contain p-1.5" loading="lazy" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-base font-bold text-ink-900">{business.title}</h2>
        {business.tagline && <p className="mt-0.5 text-sm text-ink-600">{business.tagline}</p>}
        {business.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {business.categories.map((cat) => (
              <span key={cat.slug} className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                {cat.name}
              </span>
            ))}
          </div>
        )}
        {business.description_excerpt && (
          <p className="mt-3 text-xs leading-relaxed text-ink-500">{business.description_excerpt}</p>
        )}
        {business.location && (
          <p className="mt-3 text-xs text-ink-500">
            <span aria-hidden>📍</span> {business.location}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-3 text-xs">
          {c.email && (
            <a href={`mailto:${c.email}`} className="rounded-lg bg-gold-500 px-3 py-1.5 font-semibold text-white transition hover:bg-gold-600">
              Email
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="rounded-lg border border-ink-200 px-3 py-1.5 font-semibold text-ink-700 transition hover:bg-ink-50">
              {c.phone}
            </a>
          )}
          {c.website && (
            <a href={c.website} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-ink-200 px-3 py-1.5 font-semibold text-ink-700 transition hover:bg-ink-50">
              {website || "Website"}
            </a>
          )}
          {c.instagram && (
            <a href={`https://www.instagram.com/${c.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-ink-200 px-3 py-1.5 font-semibold text-ink-700 transition hover:bg-ink-50">
              @{c.instagram.replace(/^@/, "")}
            </a>
          )}
        </div>
        {business.permalink && (
          <a
            href={business.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs font-semibold text-gold-600 hover:text-gold-700"
          >
            View full profile ↗
          </a>
        )}
      </div>
    </article>
  );
}
