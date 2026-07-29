"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import {
  useCloneEvent,
  useCancelEvent,
  useDeleteEvent,
} from "@/lib/eventActions";
import { useConfirm } from "@/context/ConfirmContext";

export function EventHero() {
  const { event } = useEventData();
  const router = useRouter();
  const confirm = useConfirm();

  const clone = useCloneEvent();
  const cancel = useCancelEvent();
  const del = useDeleteEvent();

  const [actionError, setActionError] = useState<string | null>(null);

  const eventUrl = `https://${event.url}`;

  const copyUrl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(eventUrl);
    }
  };

  const openPublic = () => {
    window.open(eventUrl, "_blank", "noopener,noreferrer");
  };

  const handleDuplicate = async () => {
    setActionError(null);
    try {
      const res = await clone.mutateAsync({ eid: event.encryptedId });
      // New draft → straight into its editor.
      router.push("/events/new?eid=" + res.encrypted_id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Couldn't duplicate the event.",
      );
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    const ok = await confirm({
      title: "Cancel this event?",
      message:
        "The event will be marked as cancelled. You can restore it from wp-admin if needed.",
      confirmLabel: "Cancel Event",
      cancelLabel: "Keep Event",
      danger: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync({ eid: event.encryptedId });
      router.push("/events");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Couldn't cancel the event.",
      );
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    const ok = await confirm({
      title: "Delete this event?",
      message:
        "The event will be marked as deleted and removed from your events. This can be undone from wp-admin.",
      confirmLabel: "Delete Event",
      cancelLabel: "Keep Event",
      danger: true,
    });
    if (!ok) return;
    try {
      await del.mutateAsync({ eid: event.encryptedId });
      router.push("/events");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Couldn't delete the event.",
      );
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
            <LinkIcon
              style={{
                width: 14,
                height: 14,
                flexShrink: 0,
                color: "var(--muted)",
              }}
            />
            <a href={eventUrl} target="_blank" rel="noopener noreferrer">
              {event.url}
            </a>
            <button
              type="button"
              className="copy-btn"
              title="Copy link"
              onClick={copyUrl}
            >
              <CopyIcon />
            </button>
          </div>

          {actionError && (
            <p
              role="alert"
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--danger, #c0492f)",
              }}
            >
              {actionError}
            </p>
          )}
        </div>

        <div className="event-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              router.push("/events/new?eid=" + event.encryptedId);
            }}
          >
            <EditIcon /> Edit Event
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openPublic}
          >
            <ExternalLinkIcon /> View
          </button>

          <Dropdown>
            <DropdownTrigger className="btn btn-ghost" ariaLabel="More actions">
              <MoreVerticalIcon />
            </DropdownTrigger>
            <DropdownMenu>
              {/* <DropdownItem>
                <InfoCircleIcon /> Add Manual Order
              </DropdownItem> */}
              <DropdownItem
                onClick={handleDuplicate}
                // disabled={clone.isPending}
              >
                <CreditCardIcon />{" "}
                {clone.isPending ? "Duplicating…" : "Duplicate Event"}
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                danger
                onClick={handleCancel}
                // disabled={cancel.isPending}
              >
                <CircleSlashIcon /> Cancel Event
              </DropdownItem>
              <DropdownItem
                danger
                onClick={handleDelete}
                // disabled={del.isPending}
              >
                <TrashIcon /> Delete Event
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </section>
  );
}
