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
  // Full-page overlay label. Set when an action starts and deliberately
  // left set through the router.push, so the spinner covers the gap
  // until the next page mounts (rather than flashing a blank screen).
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

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
    const ok = await confirm({
      title: "Duplicate this event?",
      message:
        "A copy will be created as a new draft with all the same details, and you'll be taken to edit it.",
      confirmLabel: "Duplicate Event",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setBusyLabel("Duplicating event…");
    try {
      const res = await clone.mutateAsync({ eid: event.encryptedId });
      // New draft → straight into its editor. Leave the overlay up
      // through navigation so there's no blank frame.
      router.push("/events/new?eid=" + res.encrypted_id);
    } catch (err) {
      setBusyLabel(null);
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
    setBusyLabel("Cancelling event…");
    try {
      await cancel.mutateAsync({ eid: event.encryptedId });
      router.push("/events");
    } catch (err) {
      setBusyLabel(null);
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
    setBusyLabel("Deleting event…");
    try {
      await del.mutateAsync({ eid: event.encryptedId });
      router.push("/events");
    } catch (err) {
      setBusyLabel(null);
      setActionError(
        err instanceof Error ? err.message : "Couldn't delete the event.",
      );
    }
  };

  return (
    <>
      {busyLabel && <FullPageSpinner label={busyLabel} />}
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
              <DropdownTrigger
                className="btn btn-ghost"
                ariaLabel="More actions"
              >
                <MoreVerticalIcon />
              </DropdownTrigger>
              <DropdownMenu>
                {/* <DropdownItem>
                  <InfoCircleIcon /> Add Manual Order
                </DropdownItem> */}
                <DropdownItem
                  onClick={handleDuplicate}
                  disabled={clone.isPending}
                >
                  <CreditCardIcon />{" "}
                  {clone.isPending ? "Duplicating…" : "Duplicate Event"}
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  danger
                  onClick={handleCancel}
                  disabled={cancel.isPending}
                >
                  <CircleSlashIcon /> Cancel Event
                </DropdownItem>
                <DropdownItem
                  danger
                  onClick={handleDelete}
                  disabled={del.isPending}
                >
                  <TrashIcon /> Delete Event
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Full-page overlay spinner. Covers the screen while an event action
 * runs and through the subsequent navigation, so there's no blank,
 * unresponsive frame. Inline-styled + self-contained keyframes.
 */
function FullPageSpinner({ label }: { label: string }) {
  return (
    <div
      role="alertdialog"
      aria-busy="true"
      aria-label={label}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(2px)",
      }}
    >
      <style>{`@keyframes ehSpin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "9999px",
          border: "4px solid rgba(189,116,32,0.2)",
          borderTopColor: "var(--gold-deep, #bd7420)",
          animation: "ehSpin 0.8s linear infinite",
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink, #1f1d18)",
        }}
      >
        {label}
      </p>
    </div>
  );
}
