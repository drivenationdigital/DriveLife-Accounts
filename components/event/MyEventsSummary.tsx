"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EventCard } from "@/components/event/EventCard";
import { useMyEventsSummary } from "@/lib/myEventsSummary";
import type { EventRecord } from "@/lib/apiTypes";
import { eventRowPath } from "@/lib/siteRoutes";

export function MyEventsSummary() {
  const router = useRouter();
  const { data, isLoading, error } = useMyEventsSummary();
  const events = data?.events ?? [];

  const openEvent = (event: EventRecord) => {
    if (event.can_manage === true) {
      router.push(eventRowPath(event));
    } else {
      window.open(event.link, "_blank");
    }
  };

  // Renders as its own white card - the dashboard composes it next to
  // the shortcut-tiles card rather than nesting it inside one.
  return (
    <section className="section mes">
      <div className="section-header mes-header">
        <h2 className="mes-title">My Events</h2>
        <Link href="/events" className="mes-viewall">
          View all →
        </Link>
      </div>

      <div className="section-body">
        {error && (
          <div className="mes-state error">
            Couldn’t load your events. {error.message}
          </div>
        )}

        <div
          className="mes-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Create card always first - matches the live dashboard. */}
          {/* <Link
            href="/events/create"
            className="mes-card mes-create"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 300,
              border: "2px dashed #d6d3ca",
              borderRadius: 12,
              background: "#fff",
              textDecoration: "none",
            }}
          >
            <div className="mes-create-inner">
              <span className="mes-create-plus" aria-hidden>
                +
              </span>
              <span className="mes-create-title">Create</span>
              <span className="mes-create-sub">
                Add an event, car club or car-friendly venue
              </span>
            </div>
          </Link> */}

          {isLoading &&
            !data &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="mes-card mes-skeleton"
                aria-hidden
                style={{
                  minHeight: 300,
                  borderRadius: 12,
                  background: "#f2f1ec",
                }}
              />
            ))}

          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} onClick={openEvent} />
          ))}
        </div>

        {!isLoading && events.length === 0 && !error && (
          <div className="mes-empty">
            You have no upcoming events yet. Create one to get started.
          </div>
        )}
      </div>
    </section>
  );
}
