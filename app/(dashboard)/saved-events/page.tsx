"use client";

import { useState } from "react";
import { CardGridSkeleton } from "@/components/ui/CardGridSkeleton";
import { useRouter } from "next/navigation";
import { EventCard } from "@/components/event/EventCard";
import { useSavedEvents, type SavedEventScope } from "@/lib/savedEvents";
import type { EventRecord } from "@/lib/apiTypes";
import { eventRowPath } from "@/lib/siteRoutes";

export default function SavedEventsPage() {
  const router = useRouter();
  const openEvent = (event: EventRecord) => {
    // Favourites are mostly events the user doesn't own. Only send
    // owners/admins to the manage view (which needs an admin token);
    // everyone else goes to the public event preview.
    if (event.can_manage) {
      router.push(eventRowPath(event));
    } else if (event.link) {
      // Public permalink - open in a new tab (leaves the dashboard).
      window.open(event.link, "_blank", "noopener,noreferrer");
    }
  };

  const [scope, setScope] = useState<SavedEventScope>("upcoming");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, isPlaceholderData } = useSavedEvents(
    scope,
    page,
  );

  const switchScope = (next: SavedEventScope) => {
    if (next === scope) return;
    setScope(next);
    setPage(1);
  };

  const counts = data?.counts;
  const events = data?.events ?? [];
  const pagination = data?.pagination;

  return (
    <div className="saved-events">
      <header className="se-header">
        <h1 className="se-title">Saved Events</h1>
      </header>

      <div className="se-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "upcoming"}
          className={`se-tab${scope === "upcoming" ? " active" : ""}`}
          onClick={() => switchScope("upcoming")}
        >
          Upcoming
          {counts ? (
            <span className="se-tab-count">{counts.upcoming}</span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "past"}
          className={`se-tab${scope === "past" ? " active" : ""}`}
          onClick={() => switchScope("past")}
        >
          Past
          {counts ? <span className="se-tab-count">{counts.past}</span> : null}
        </button>
      </div>

      {error && (
        <div className="se-state error">
          Couldn’t load your saved events. {error.message}
        </div>
      )}

      {isLoading && !data && <CardGridSkeleton variant="media" count={6} />}

      {!isLoading && events.length === 0 && !error && (
        <div className="se-state">
          {scope === "upcoming"
            ? "You haven’t saved any upcoming events yet."
            : "No past saved events."}
        </div>
      )}

      {events.length > 0 && (
        <div
          className="se-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
            alignItems: "start",
            opacity: isPlaceholderData ? 0.6 : 1,
          }}
        >
          {events.map((e) => (
            <EventCard key={e.id} event={e} onClick={openEvent} />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="se-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            disabled={page <= 1 || isPlaceholderData}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <span className="se-page-indicator">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
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
