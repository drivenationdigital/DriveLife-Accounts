"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useOrganiserEvents } from "@/lib/queries";
import type { EventRecord } from "@/lib/apiTypes";
import { eventRowPath } from "@/lib/siteRoutes";
import { eventKey } from "@/lib/eventKey";
import { Pagination } from "@/components/ui/Pagination";
import { EventCard } from "@/components/event/EventCard";
import { EventsTableView } from "@/components/event/EventsTableView";
import {
  EventGridSkeleton,
  EventsTableSkeleton,
} from "@/components/event/EventsSkeleton";

const PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 350;

type TabKey = "active" | "past";
type ViewKey = "grid" | "table";

export default function MyEventsPage() {
  return (
    <div className="events-page">
      <Suspense fallback={<LoadingShell />}>
        <EventsContent />
      </Suspense>
    </div>
  );
}

function EventsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab: TabKey = (searchParams?.get("tab") === "past" ? "past" : "active");
  const view: ViewKey = (searchParams?.get("view") === "table" ? "table" : "grid");
  const page = Math.max(1, parseInt(searchParams?.get("page") ?? "1", 10) || 1);
  const urlSearch = searchParams?.get("q") ?? "";

  // Local input mirrors the URL on mount, then debounces back to the URL
  // so we don't push history entries on every keystroke.
  const [searchInput, setSearchInput] = useState(urlSearch);
  const lastUrlSearchRef = useRef(urlSearch);

  // If the URL changes externally (back button, deep link), sync the input.
  useEffect(() => {
    if (urlSearch !== lastUrlSearchRef.current) {
      lastUrlSearchRef.current = urlSearch;
      setSearchInput(urlSearch);
    }
  }, [urlSearch]);

  // Debounce input → URL.
  useEffect(() => {
    if (searchInput === urlSearch) return; // already in sync
    const t = setTimeout(() => {
      lastUrlSearchRef.current = searchInput;
      // Pushing search resets to page 1 (different result set).
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (searchInput.trim() === "") params.delete("q");
      else params.set("q", searchInput);
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // We intentionally exclude `router`/`pathname`/`searchParams` from deps:
    // they're stable enough and we only want this effect firing on input change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, urlSearch]);

  const filterEventDate = tab === "past" ? 2 : 1;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isPlaceholderData,
  } = useOrganiserEvents({
    filter_eventtype: 1,
    filter_eventdate: filterEventDate,
    page,
    per_page: PER_PAGE,
    search: urlSearch,
  });

  // ── URL helpers ─────────────────────────────────────────────────────
  const updateParams = (
    updates: Record<string, string | null>,
    { keepPage = false }: { keepPage?: boolean } = {}
  ) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    if (!keepPage) params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setTab = (next: TabKey) => {
    updateParams({ tab: next === "active" ? null : "past" });
  };
  const setView = (next: ViewKey) => {
    updateParams({ view: next === "grid" ? null : "table" }, { keepPage: true });
  };
  const setPage = (next: number) => {
    updateParams({ page: next <= 1 ? null : String(next) }, { keepPage: true });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const settledTotal =
    !isPlaceholderData && data ? data.pagination.total : undefined;
  const activeCount = tab === "active" ? settledTotal : undefined;
  const pastCount = tab === "past" ? settledTotal : undefined;

  // The site travels in the URL so the detail page can send it back up
  // with every event-scoped request - encrypted ids are only unique
  // within a site, so `eid` alone doesn't identify the event.
  //
  // A recurring row opens its next occurrence (a real event view), not
  // the series parent - see eventRowPath.
  const goToEvent = (ev: EventRecord) => {
    router.push(eventRowPath(ev));
  };

  // First-time loading (no data yet) - show skeleton matching the chosen view.
  // Subsequent loads use placeholderData (previous data dimmed) instead.
  const showSkeleton = isLoading && !data;

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">My Events</h1>
          <p className="page-sub">
            Manage all the events you&apos;re organising.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn-gold"
            onClick={() => router.push("/events/create")}
          >
            <PlusIcon />
            New Event
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === "active" ? "active" : ""}`}
          onClick={() => setTab("active")}
        >
          Active Events
          {activeCount !== undefined && (
            <span className="tab-count">{activeCount}</span>
          )}
        </button>
        <button
          type="button"
          className={`tab ${tab === "past" ? "active" : ""}`}
          onClick={() => setTab("past")}
        >
          Past Events
          {pastCount !== undefined && (
            <span className="tab-count">{pastCount}</span>
          )}
        </button>
      </div>

      <div className="toolbar">
        <div className="search-field">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search events by name…"
            aria-label="Search events"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="view-toggle" role="tablist" aria-label="View mode">
          <button
            type="button"
            className={`view-toggle-btn ${view === "grid" ? "active" : ""}`}
            onClick={() => setView("grid")}
            role="tab"
            aria-selected={view === "grid"}
          >
            <GridIcon />
            <span className="view-label">Grid</span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${view === "table" ? "active" : ""}`}
            onClick={() => setView("table")}
            role="tab"
            aria-selected={view === "table"}
          >
            <TableIcon />
            <span className="view-label">Table</span>
          </button>
        </div>
      </div>

      {showSkeleton &&
        (view === "grid" ? <EventGridSkeleton /> : <EventsTableSkeleton />)}

      {isError && (
        <ErrorState
          message={(error as Error)?.message ?? "Failed to load events"}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      )}

      {data && data.pagination.total === 0 && (
        <EmptyState
          title={urlSearch ? "No matches" : data.empty_state?.title}
          content={
            urlSearch
              ? `No events match "${urlSearch}".`
              : data.empty_state?.content
          }
          tab={tab}
        />
      )}

      {data && data.pagination.total > 0 && (
        <>
          {view === "grid" ? (
            <div
              className="event-grid"
              style={{
                opacity: isPlaceholderData ? 0.55 : 1,
                transition: "opacity 120ms",
              }}
            >
              {data.events.map((ev) => (
                <EventCard key={eventKey(ev)} event={ev} onClick={goToEvent} />
              ))}
            </div>
          ) : (
            <EventsTableView
              events={data.events}
              onRowClick={goToEvent}
              dimmed={isPlaceholderData}
            />
          )}

          <div style={{ marginTop: 24 }}>
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.total_pages}
              onPageChange={setPage}
              disabled={isFetching}
            />
          </div>
        </>
      )}
    </>
  );
}

// ─── States ─────────────────────────────────────────────────────────────

function LoadingShell() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">My Events</h1>
          <p className="page-sub">Loading…</p>
        </div>
      </div>
    </>
  );
}

function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div style={{ color: "var(--danger)", marginBottom: 12 }}>{message}</div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onRetry}
        disabled={retrying}
      >
        {retrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}

function EmptyState({
  title,
  content,
  tab,
}: {
  title?: string;
  content?: string;
  tab: TabKey;
}) {
  const fallbackTitle =
    tab === "active" ? "No active events" : "No past events";
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <CalendarIcon />
      </div>
      <h3>{title || fallbackTitle}</h3>
      <p>
        {content ||
          (tab === "active"
            ? "Create your first event to get started."
            : "Past events will show up here once they're done.")}
      </p>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
