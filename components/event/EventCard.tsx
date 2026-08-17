"use client";

import type { EventRecord } from "@/lib/apiTypes";
import { DEFAULT_EVENT_COVER } from "@/lib/eventDefaults";
import { CountryFlag } from "@/components/ui/CountryFlag";
import {
  formatRegionDate,
  formatRegionDateRange,
  regionFromSite,
  type Region,
} from "@/lib/regions";

const STATUS_LABEL: Record<string, string> = {
  publish: "Published",
  draft: "Draft",
  future: "Scheduled",
  cancelled: "Cancelled",
  pending: "Pending",
  private: "Private",
};

interface Props {
  event: EventRecord;
  onClick?: (e: EventRecord) => void;
}

export function EventCard({ event, onClick }: Props) {
  const statusKey = mapStatus(event.post_status);
  const statusLabel = STATUS_LABEL[event.post_status] ?? event.status.label;

  const dateLabel = formatDateLabel(event);
  const timeLabel = formatTimeLabel(event);
  const address =
    event.location?.address ?? event.location?.name ?? "";

  return (
    <button
      type="button"
      className="ev-card"
      onClick={() => onClick?.(event)}
      aria-label={event.title}
    >
      <div className="ev-cover">
        {/* Always render a cover image - fall back to the brand default if
            the event has none, and again if the URL 404s at runtime. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.cover_image || DEFAULT_EVENT_COVER}
          alt=""
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== DEFAULT_EVENT_COVER) img.src = DEFAULT_EVENT_COVER;
          }}
        />
        <div className="ev-cover-gradient" />
        <div className="ev-cover-pills">
          <span className={`pill-status ${statusKey}`}>{statusLabel}</span>
        </div>
        {/* Top-right cluster. Both markers want the same corner and the
            pinned star is the rarer of the two, so they share a row
            rather than one being pushed elsewhere. */}
        <div className="ev-cover-corner">
          {/* {event.is_pinned && (
            <span className="ev-pinned-marker" aria-label="Pinned">
              ★
            </span>
          )} */}
          {event.site && (
            <span className="card-site-badge">
              <CountryFlag
                country={event.site.country}
                label={event.site.label}
              />
              {regionFromSite(event.site).abbr}
            </span>
          )}
        </div>
      </div>
      <div className="ev-body">
        <h3 className="ev-title">{event.title}</h3>
        <div className="ev-meta">
          <div className="ev-meta-item">
            <CalendarIcon />
            <span>{dateLabel || "-"}</span>
          </div>
          {timeLabel && (
            <div className="ev-meta-item">
              <ClockIcon />
              <span>{timeLabel}</span>
            </div>
          )}
          {address && (
            <div className="ev-meta-item">
              <PinIcon />
              <span>{address}</span>
            </div>
          )}
        </div>
      </div>
    </button>
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

/**
 * The calendar line.
 *
 * On a recurring series this is the pattern on its own ("Last Wednesday
 * Of Every Month"); the concrete next date goes on the clock line below
 * it, so the two facts get a line each instead of being run together.
 */
function formatDateLabel(event: EventRecord): string {
  const region = regionFromSite(event.site);
  if (event.is_recurring && event.recurring) {
    return event.recurring.display || "Recurring";
  }

  const start = event.first_date?.start_date;
  const end = event.last_date?.end_date ?? event.last_date?.start_date;
  if (!start) return "";

  if (!end || start === end) {
    return formatSingleDate(start, region);
  }
  return formatRange(start, end, region);
}

/**
 * The clock line.
 *
 * On a recurring series it carries the occurrence a click actually
 * opens, rather than a time - the card links to the next occurrence,
 * not the series, and the pattern alone doesn't say which date that is.
 */
function formatTimeLabel(event: EventRecord): string {
  const region = regionFromSite(event.site);
  if (event.is_recurring && event.recurring) {
    const next = event.next_occurrence;
    if (!next?.start_date) return "";
    // `is_past` means every occurrence has been and gone and the API
    // fell back to the FIRST child. Printing that date after "Next"
    // would read as an upcoming event, so say what's actually true.
    return next.is_past
      ? "All dates passed"
      : `Next ${formatSingleDate(next.start_date, region)}`;
  }

  const startTime = event.first_date?.start_time;
  const endTime = event.last_date?.end_time ?? event.first_date?.end_time;
  if (startTime && endTime && startTime !== endTime) {
    return `${startTime} - ${endTime}`;
  }
  return startTime ?? endTime ?? "";
}

/** Dates follow the region the event lives on - a US event reads
 *  "Sat, August 15, 2026" where a UK one reads "Sat, 15 August 2026". */
function formatSingleDate(iso: string, region: Region): string {
  return formatRegionDate(iso, region);
}

function formatRange(
  startIso: string,
  endIso: string,
  region: Region,
): string {
  return formatRegionDateRange(startIso, endIso, region);
}

// ─── Icons ────────────────────────────────────────────────────────────

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

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
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
