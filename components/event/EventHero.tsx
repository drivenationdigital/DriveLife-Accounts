"use client";

import { useEventData } from "@/context/EventContext";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/Dropdown";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  LinkIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  MoreVerticalIcon,
  InfoCircleIcon,
  CreditCardIcon,
  CircleSlashIcon,
  TrashIcon,
} from "@/components/ui/Icons";

export function EventHero() {
  const { event } = useEventData();

  const copyUrl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`https://${event.url}`);
    }
  };

  return (
    <section className="event-hero">
      <div className="event-hero-grid">
        <div>
          <div className="event-title-row">
            <h1 className="event-title">{event.title}</h1>
            <span className={`status-chip ${event.status}`}>
              {event.status === "published" ? "Published" : event.status}
            </span>
          </div>

          <div className="event-meta">
            <span className="event-meta-item">
              <CalendarIcon />
              {event.date}
            </span>
            <span className="event-meta-item">
              <ClockIcon />
              {event.timeRange}
            </span>
            <span className="event-meta-item">
              <MapPinIcon />
              {event.location}
            </span>
          </div>

          <div className="event-url">
            <LinkIcon style={{ width: 14, height: 14, flexShrink: 0, color: "var(--muted)" }} />
            <a href={`https://${event.url}`}>{event.url}</a>
            <button
              type="button"
              className="copy-btn"
              title="Copy link"
              onClick={copyUrl}
            >
              <CopyIcon />
            </button>
          </div>
        </div>

        <div className="event-actions">
          <button type="button" className="btn btn-primary">
            <EditIcon /> Edit Event
          </button>
          <button type="button" className="btn btn-secondary">
            <ExternalLinkIcon /> View
          </button>

          <Dropdown>
            <DropdownTrigger className="btn btn-ghost" ariaLabel="More actions">
              <MoreVerticalIcon />
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem>
                <InfoCircleIcon /> Add Manual Order
              </DropdownItem>
              <DropdownItem>
                <CreditCardIcon /> Duplicate Event
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem danger>
                <CircleSlashIcon /> Cancel Event
              </DropdownItem>
              <DropdownItem danger>
                <TrashIcon /> Delete Event
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </section>
  );
}
