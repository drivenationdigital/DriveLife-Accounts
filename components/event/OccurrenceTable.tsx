"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventData } from "@/context/EventContext";
import { eventDetailPath } from "@/lib/siteRoutes";
import { ExternalLinkIcon } from "@/components/ui/Icons";

/**
 * The occurrence table shown on a recurring series PARENT.
 *
 * A `recurring_events` post has no date of its own - it holds the
 * pattern and a list of child events, each a real dated event with its
 * own eid. So the parent view replaces the sales dashboard with this
 * table, and each row links through to that child's own event view.
 *
 * Three behaviours carried over from the legacy view/?eid= page:
 *
 *  1. Rows render in the order the API returned them, which is the
 *     organiser's stored ACF order rather than date order. It's theirs
 *     to control, so there is deliberately no client-side sort here.
 *  2. Deleted occurrences are part of the list, not filtered out of it.
 *     They're hidden by default behind a toggle that only appears when
 *     there's something to reveal, and a revealed deleted row shows its
 *     date as plain text with no link and no actions.
 *  3. Row actions appear only when `canManage` - false for finished,
 *     cancelled and deleted occurrences.
 *
 * Per-occurrence Delete / Duplicate aren't built server-side yet, so
 * the only wired action is opening the child event.
 */
export function OccurrenceTable() {
  const { event, occurrences } = useEventData();
  const router = useRouter();
  const [showDeleted, setShowDeleted] = useState(false);

  const visible = useMemo(() => {
    if (!occurrences) return [];
    return showDeleted
      ? occurrences.items
      : occurrences.items.filter((o) => !o.isDeleted);
  }, [occurrences, showDeleted]);

  // Rendered only from the parent branch of the event page, but the
  // guard keeps the component safe to mount anywhere.
  if (!occurrences) return null;

  const openOccurrence = (eid: string) => {
    // A child lives on the same blog as its parent, so it inherits the
    // region rather than needing one of its own.
    router.push(eventDetailPath(eid, event.site));
  };

  return (
    <section className="section occurrences">
      <div className="section-header">
        <div>
          <h2 className="section-title">Event Dates</h2>
          <p className="section-subtitle">
            {event.recurringDisplay || "Recurring event"}
            {occurrences.total > 0 && (
              <>
                {" · "}
                {occurrences.total}{" "}
                {occurrences.total === 1 ? "date" : "dates"}
              </>
            )}
          </p>
        </div>

        {/* Only offered when the list actually contains deleted rows -
            otherwise the toggle would do nothing. */}
        {occurrences.hasDeleted && (
          <label className="occ-toggle">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            Show deleted events
          </label>
        )}
      </div>

      <div className="occ-body">
        {visible.length === 0 ? (
          <div className="occ-empty">
            No dates have been added to this series yet.
          </div>
        ) : (
          <div className="occ-table-wrap">
            <table className="occ-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col">Location</th>
                  <th scope="col">Status</th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <OccurrenceRow
                    key={o.id}
                    occurrence={o}
                    isNext={occurrences.next?.eid === o.eid}
                    onOpen={openOccurrence}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function OccurrenceRow({
  occurrence: o,
  isNext,
  onOpen,
}: {
  occurrence: import("@/context/types").Occurrence;
  isNext: boolean;
  onOpen: (eid: string) => void;
}) {
  return (
    <tr className={o.isDeleted ? "occ-row deleted" : "occ-row"}>
      <td>
        <div className="occ-date">
          {/* A deleted occurrence has nowhere useful to link to, so its
              date is plain text - same as the legacy page. */}
          {o.isDeleted ? (
            <span className="occ-date-label">{o.dateLabel || "-"}</span>
          ) : (
            <button
              type="button"
              className="occ-date-link"
              onClick={() => onOpen(o.eid)}
            >
              {o.dateLabel || "-"}
            </button>
          )}
          {isNext && !o.isDeleted && <span className="occ-next">Next</span>}
        </div>
        {o.title && <div className="occ-title">{o.title}</div>}
      </td>
      <td>{o.timeLabel || "-"}</td>
      <td className="occ-location">{o.location}</td>
      <td>
        {o.isDeleted ? (
          <span className="pill-status deleted">Deleted</span>
        ) : (
          <span className={`pill-status ${pillClass(o.statusSlug)}`} dangerouslySetInnerHTML={{ __html: o.statusLabel || "-" }} />
        )}
      </td>
      <td className="occ-actions">
        {/* Delete / Duplicate per occurrence aren't wired server-side
            yet, so a manageable row offers only "open the child". */}
        {o.canManage && !o.isDeleted && (
          <button
            type="button"
            className="occ-action"
            onClick={() => onOpen(o.eid)}
          >
            Manage
          </button>
        )}
        {o.link && !o.isDeleted && (
          <a
            className="occ-action"
            href={o.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View this date on carevents.com"
          >
            <ExternalLinkIcon />
          </a>
        )}
      </td>
    </tr>
  );
}

/**
 * Map an API status slug onto the pill classes the stylesheet already
 * defines. The API's vocabulary ("live") and the dashboard's CSS
 * ("published") grew up separately; anything unrecognised falls back to
 * the neutral draft styling rather than rendering an unstyled pill.
 */
function pillClass(slug: string): string {
  switch (slug) {
    case "live":
    case "publish":
    case "published":
      return "published";
    case "future":
    case "scheduled":
      return "scheduled";
    case "cancelled":
      return "cancelled";
    case "draft":
      return "draft";
    default:
      return "draft";
  }
}
