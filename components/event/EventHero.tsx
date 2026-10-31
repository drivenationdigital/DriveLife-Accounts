"use client";

import { appAction, inEventManager } from "@/lib/appReturn";
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
  PlusIcon,
  RepeatIcon,
  InfoCircleIcon,
  CreditCardIcon,
  CircleSlashIcon,
  TrashIcon,
} from "@/components/ui/Icons";
import { usePathname, useRouter } from "next/navigation";
import { useUI } from "@/context/UIContext";
import {
  useCloneEvent,
  useCancelEvent,
  useDeleteEvent,
} from "@/lib/eventActions";
import { useAction } from "@/context/ActionContext";
import { eventDetailPath, eventEditorPath } from "@/lib/siteRoutes";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { DEFAULT_REGION_KEY } from "@/lib/regions";

export function EventHero() {
  const { event, occurrences } = useEventData();
  const router = useRouter();
  // Confirm + full-screen loader + result notification all come from
  // the shared action flow, so these behave exactly like the same
  // actions elsewhere in the app.
  const runAction = useAction();
  const pathname = usePathname();
  const { setActiveTab } = useUI();

  const clone = useCloneEvent();
  const cancel = useCancelEvent();
  const del = useDeleteEvent();

  // The page "View" opens. Only a post with a real public page has one:
  // a draft or scheduled post's permalink is the WordPress preview URL
  // (?post_type=events&p=...), which must not be shown (2026-10-14). A
  // series parent has no page of its own, so it borrows its next live
  // date's and shows nothing while the whole series is still draft.
  const liveOccurrence = event.isRecurringParent
    ? ((occurrences?.items ?? []).find(
        (o) =>
          o.eid === occurrences?.next?.eid &&
          !o.isDeleted &&
          o.statusSlug === "live" &&
          o.link,
      ) ??
      (occurrences?.items ?? []).find(
        (o) => !o.isDeleted && o.statusSlug === "live" && o.link,
      ))
    : null;
  const eventUrl: string | null = event.isRecurringParent
    ? (liveOccurrence?.link ?? null)
    : event.publicUrl;
  const displayUrl = eventUrl ? eventUrl.replace(/^https?:\/\//, "") : "";
  const hasPublicPage = eventUrl !== null;

  const copyUrl = () => {
    if (eventUrl && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(eventUrl);
    }
  };

  const openPublic = () => {
    // Inside the app, hand back and let it open its own event screen.
    //
    // Two reasons. window.open with _blank is a no-op in a WKWebView and
    // needs onCreateWindow wiring on Android, so this button simply did
    // nothing in the container. And the app's event page already exists
    // natively, with the gallery and the community tab — opening a browser
    // on top of the app to show a worse copy is the kind of seam that makes
    // an embedded page announce itself as a website.
    //
    // The app has handled dl-view=1 all along (see open_event_overview.dart);
    // the only code that sent it lived in EventActions.tsx, which nothing
    // imports any more, so the signal had quietly stopped being sent.
    const viewInApp = appAction("dl-view=1");

    if (viewInApp) {
      window.location.href = viewInApp;
      return;
    }

    if (eventUrl) window.open(eventUrl, "_blank", "noopener,noreferrer");
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
      run: () =>
        clone.mutateAsync({ eid: event.encryptedId, site: event.region.key }),
    });
    // New draft -> straight into its editor. The clone is created on
    // the same blog as its source, so it keeps the same region.
    if (res) router.push(eventEditorPath(res.encrypted_id, event.site));
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
      run: () =>
        cancel.mutateAsync({ eid: event.encryptedId, site: event.region.key }),
    });
    if (res) leaveAfterRemoval();
  };

  /**
   * Where to go once the event this page is about no longer exists.
   *
   * In a browser that is the events list. Inside the app's web container
   * there is no events list to land on: the dashboard renders it without a
   * header or sidebar in there, so pushing to it drops the user on a bare
   * list with no way onward. The app has its own events list already
   * underneath, so hand control back and let it show that.
   */
  const leaveAfterRemoval = () => {
    // In the app's Event Manager the events list is a real screen behind
    // this one, so it is where a removed event's page gives way to - the
    // handback below is for the single-page flow, where there is no list.
    const back = inEventManager() ? "" : appAction("dl-back=1");

    if (back) {
      // A real navigation, not router.push: the target is a custom scheme
      // the Next router knows nothing about. The WebView intercepts it,
      // closes the screen and pops back to the app.
      window.location.href = back;
      return;
    }

    router.push("/events");
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
      run: () =>
        del.mutateAsync({ eid: event.encryptedId, site: event.region.key }),
    });
    if (res) leaveAfterRemoval();
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
              {/* Region marker. Account dashboard only - this must not
                  appear on the public carevents.com site. */}
              <span className="event-site-chip">
                <CountryFlag
                  country={event.region.country}
                  label={event.region.label}
                />
                {event.region.abbr}
              </span>
            </div>

            {/* One occurrence of a series - link back up to the parent,
                which owns the pattern and the full list of dates.

                Since the events list now links to the next occurrence
                rather than the series, this button is the only route
                into the occurrence table - so it carries the pattern
                alongside it to make clear why it's here. */}
            {event.isRecurringChild && event.parentEid && (
              <button
                type="button"
                className="event-series-link my-12"
                onClick={() =>
                  router.push(eventDetailPath(event.parentEid, event.site))
                }
              >
                <RepeatIcon /> View Related Events
                {(event.recurringDisplay || event.recurringCount > 0) && (
                  <span className="event-series-pattern">
                    {event.recurringDisplay}
                    {event.recurringCount > 0 && (
                      <>
                        {event.recurringDisplay ? " · " : ""}
                        {event.recurringCount}{" "}
                        {event.recurringCount === 1 ? "date" : "dates"}
                      </>
                    )}
                  </span>
                )}
              </button>
            )}

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

            {hasPublicPage && eventUrl && (
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
                  {displayUrl}
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
            )}

          </div>

          <div className="event-actions">
            {/* A series is extended from its own view: the Upcoming tab's
                occurrence table owns the "Add dates" dialog, and the
                ?addDates=1 param opens it on arrival. */}
            {event.isRecurringParent && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab("upcoming");
                  router.replace(`${pathname}?addDates=1`);
                }}
              >
                <CalendarIcon /> Add Dates
              </button>
            )}
            <button
              type="button"
              className={`btn ${event.isRecurringParent ? "btn-secondary" : "btn-primary"}`}
              onClick={() => {
                router.push(eventEditorPath(event.encryptedId, event.site));
              }}
            >
              <EditIcon /> Edit Event
            </button>
            {hasPublicPage && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={openPublic}
              >
                <ExternalLinkIcon /> View
              </button>
            )}

            <Dropdown>
              <DropdownTrigger
                className="btn btn-ghost"
                ariaLabel="More actions"
              >
                <MoreVerticalIcon />
              </DropdownTrigger>
              <DropdownMenu>
                {/* Box-office order: opens the public checkout in
                    box-office mode - payment skipped, order placed
                    immediately (the backend verifies the organiser
                    session before allowing it). Only offered when the
                    event uses CarEvents Ticketing - external-ticketing
                    and no-ticketing events have nothing to sell here. */}
                {event.ceTicketing && (
                  <DropdownItem
                    onClick={() =>
                      window.open(
                        // The region rides in front of the id (see
                        // checkoutLinks.ts). Without it a US event's box
                        // office opens whichever UK event shares that post
                        // id — and places a real order against it.
                        `/get-tickets/${encodeURIComponent(
                          (event.region.key !== DEFAULT_REGION_KEY
                            ? event.region.key
                            : "") + event.encryptedId,
                        )}?boxoffice=1`,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    <PlusIcon /> Add Order
                  </DropdownItem>
                )}
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

