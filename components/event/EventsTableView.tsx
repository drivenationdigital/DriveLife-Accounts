"use client";

import type { EventRecord } from "@/lib/apiTypes";
import { DEFAULT_EVENT_COVER } from "@/lib/eventDefaults";
import { clickableRow } from "@/components/ui/clickableRow";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { eventKey } from "@/lib/eventKey";

const STATUS_LABEL: Record<string, string> = {
  publish: "Published",
  draft: "Draft",
  future: "Scheduled",
  cancelled: "Cancelled",
  pending: "Pending",
  private: "Private",
};

interface Props {
  events: EventRecord[];
  onRowClick?: (e: EventRecord) => void;
  dimmed?: boolean;
}

export function EventsTableView({ events, onRowClick, dimmed }: Props) {
  return (
    <div className="events-table-wrap">
      <div className="events-table-scroll">
        <table
          className="events-table"
          style={{ opacity: dimmed ? 0.55 : 1, transition: "opacity 120ms" }}
        >
          <thead>
            <tr>
              <th>Event</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <Row key={eventKey(ev)} event={ev} onRowClick={onRowClick} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  event,
  onRowClick,
}: {
  event: EventRecord;
  onRowClick?: (e: EventRecord) => void;
}) {
  const statusKey = mapStatus(event.post_status);
  const statusLabel = STATUS_LABEL[event.post_status] ?? event.status.label;
  const type = event.type ?? "free";
  const address =
    event.location?.address ?? event.location?.name ?? "-";

  return (
    <tr
      {...clickableRow(() => onRowClick?.(event), {
        label: `Open ${event.title}`,
      })}
    >
      <td>
        <div className="tbl-event-cell">
          <div className="tbl-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.cover_image || DEFAULT_EVENT_COVER}
              alt=""
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== DEFAULT_EVENT_COVER)
                  img.src = DEFAULT_EVENT_COVER;
              }}
            />
            {/* Region marker - the list merges both regions, so without
                it two same-named events are indistinguishable. No key
                text at this size; the flag alone carries it, and the
                label is on the element for screen readers.
                Account dashboard only, never the public site. */}
            {event.site && (
              <CountryFlag
                country={event.site.country}
                label={event.site.label}
                className="tbl-site-flag"
              />
            )}
          </div>
          <div className="tbl-event-text">
            <div className="tbl-event-title">
              {event.is_pinned && (
                <span style={{ color: "var(--gold)", marginRight: 6 }}>★</span>
              )}
              {event.title}
            </div>
            <div className="tbl-event-sub">{formatDateSubLabel(event)}</div>
          </div>
        </div>
      </td>
      <td>
        <span className="tbl-location">
          <PinIcon />
          {address}
        </span>
      </td>
      <td>
        <span className={`pill-type ${type}`}>
          {type === "ticketed" ? "Ticketed" : "Free"}
        </span>
      </td>
      <td>
        <span className={`pill-status ${statusKey}`}>{statusLabel}</span>
      </td>
    </tr>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function mapStatus(postStatus: string): string {
  switch (postStatus) {
    case "publish":
      return "published";
    case "future":
      return "scheduled";
    case "draft":
      return "draft";
    case "cancelled":
      return "cancelled";
    default:
      return "draft";
  }
}

function formatDateSubLabel(event: EventRecord): string {
  if (event.is_recurring && event.recurring) {
    const pattern = event.recurring.display || "Recurring";
    // The card opens the next occurrence, not the series, so name the
    // date a click actually lands on rather than the pattern alone.
    const next = event.next_occurrence;
    if (!next?.start_date) return pattern;
    // `is_past` means every occurrence has been and gone and the API
    // fell back to the FIRST child. Printing that date next to "Next"
    // would read as an upcoming event, so say what's actually true.
    return next.is_past
      ? `${pattern} · All dates passed`
      : `${pattern} · Next ${formatSingleDate(next.start_date)}`;
  }

  const start = event.first_date?.start_date;
  const end = event.last_date?.end_date ?? event.last_date?.start_date;
  if (!start) return "-";

  const dateLabel = !end || start === end
    ? formatSingleDate(start)
    : formatRange(start, end);
  const startTime = event.first_date?.start_time;
  const endTime = event.last_date?.end_time ?? event.first_date?.end_time;
  const timeLabel =
    startTime && endTime && startTime !== endTime
      ? `${startTime} - ${endTime}`
      : startTime ?? endTime ?? "";
  return timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel;
}

function formatSingleDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatRange(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sameMonth =
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      const month = start.toLocaleDateString("en-GB", { month: "long" });
      const year = start.getFullYear();
      return `${start.getDate()}-${end.getDate()} ${month} ${year}`;
    }
    return `${formatSingleDate(startIso)} - ${formatSingleDate(endIso)}`;
  } catch {
    return `${startIso} - ${endIso}`;
  }
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
