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
import { useRouter } from "next/navigation";
import {
  useCloneEvent,
  useCancelEvent,
  useDeleteEvent,
} from "@/lib/eventActions";
import { useAction } from "@/context/ActionContext";

export function EventHero() {
  const { event } = useEventData();
  const router = useRouter();
  // Confirm + full-screen loader + result notification all come from
  // the shared action flow, so these behave exactly like the same
  // actions elsewhere in the app.
  const runAction = useAction();

  const clone = useCloneEvent();
  const cancel = useCancelEvent();
  const del = useDeleteEvent();

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
    const res = await runAction({
      confirm: {
        title: "Duplicate this event?",
        message:
          "A copy will be created as a new draft with all the same details, and you'll be taken to edit it.",
        confirmLabel: "Duplicate Event",
        cancelLabel: "Cancel",
      },
      loadingLabel: "Duplicating event...",
      successTitle: "Event duplicated",
      successMessage: "The copy has been created as a draft.",
      errorTitle: "Couldn't duplicate the event",
      run: () => clone.mutateAsync({ eid: event.encryptedId }),
    });
    // New draft -> straight into its editor.
    if (res) router.push("/events/new?eid=" + res.encrypted_id);
  };

  const handleCancel = async () => {
    const res = await runAction({
      confirm: {
        title: "Cancel this event?",
        message:
          "The event will be marked as cancelled and will no longer accept bookings.",
        confirmLabel: "Cancel Event",
        cancelLabel: "Keep Event",
        danger: true,
      },
      loadingLabel: "Cancelling event...",
      successTitle: "Event cancelled",
      successMessage: "It no longer accepts bookings.",
      errorTitle: "Couldn't cancel the event",
      run: () => cancel.mutateAsync({ eid: event.encryptedId }),
    });
    if (res) router.push("/events");
  };

  const handleDelete = async () => {
    const res = await runAction({
      confirm: {
        title: "Delete this event?",
        message:
          "The event will be removed from your events. This action cannot be undone.",
        confirmLabel: "Delete Event",
        cancelLabel: "Keep Event",
        danger: true,
      },
      loadingLabel: "Deleting event...",
      successTitle: "Event deleted",
      successMessage: "It's been removed from your events.",
      errorTitle: "Couldn't delete the event",
      run: () => del.mutateAsync({ eid: event.encryptedId }),
    });
    if (res) router.push("/events");
  };

  return (
    <>
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

