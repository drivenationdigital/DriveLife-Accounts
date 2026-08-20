"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { EditorTopBar } from "@/components/event-create/EditorTopBar";
import { EditorSidebar } from "@/components/event-create/EditorSidebar";
import { EditorTabBar } from "@/components/event-create/EditorTabBar";
import { EditorBottomBar } from "@/components/event-create/EditorBottomBar";
import { BasicsPanel } from "@/components/event-create/panels/BasicsPanel";
import { CarClubsPanel } from "@/components/event-create/panels/CarClubsPanel";
import { DatesPanel } from "@/components/event-create/panels/DatesPanel";
import { DescriptionPanel } from "@/components/event-create/panels/DescriptionPanel";
import { DiscountsPanel } from "@/components/event-create/panels/DiscountsPanel";
import { GalleryPanel } from "@/components/event-create/panels/GalleryPanel";
import { PublishPanel } from "@/components/event-create/panels/PublishPanel";
import { ShowCarsPanel } from "@/components/event-create/panels/ShowCarsPanel";
import { TicketsPanel } from "@/components/event-create/panels/TicketsPanel";
import { TradersPanel } from "@/components/event-create/panels/TradersPanel";
import { useEventCreate } from "@/context/EventCreateContext";
import {
  DEFAULT_STEP,
  type EventCreateStepKey,
} from "@/lib/eventCreateSteps";
import { mapEventEditResponse } from "@/lib/eventEditMapper";
import { parseRef } from "@/lib/siteRef";
import { useEventForEdit } from "@/lib/queries";
import { useEventSteps } from "@/lib/useEventSteps";
import { isStepVisible } from "@/lib/eventCreateSteps";
import { ApiError } from "@/lib/apiClient";

/**
 * Active panel router. Lives inside a Suspense boundary because it
 * reads useSearchParams() - Next 14 requires Suspense around any
 * component that uses search params during static rendering.
 *
 * Future panels are registered here as they're built. Unknown / not-yet-
 * built steps fall back to a placeholder block so a stale URL doesn't
 * blow up the page.
 */
function ActivePanel() {
  const searchParams = useSearchParams();
  const { steps } = useEventSteps();
  const requested =
    (searchParams.get("step") as EventCreateStepKey | null) ?? DEFAULT_STEP;

  // A step that doesn't exist on this event's region falls back to the
  // first one. Reachable by hand-editing the URL, or by following a
  // bookmark to ?step=tickets on an event that has since turned out to
  // be listing-only - the sidebar and tab bar already hide these.
  const step: EventCreateStepKey = isStepVisible(requested, steps)
    ? requested
    : DEFAULT_STEP;

  switch (step) {
    case "basics":
      return <BasicsPanel />;

    case "dates":
      return <DatesPanel />;

    case "description":
      return <DescriptionPanel />;

    case "gallery":
      return <GalleryPanel />;

    case "tickets":
      return <TicketsPanel />;

    case "discounts":
      return <DiscountsPanel />;

    case "show-cars":
      return <ShowCarsPanel />;

    case "car-clubs":
      return <CarClubsPanel />;

    case "traders":
      return <TradersPanel />;

    case "publish":
      return <PublishPanel />;

    // Other steps fall through to the placeholder until they're built.
    default:
      return (
        <div className="panel is-active">
          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-8 text-center">
            <p className="text-sm font-semibold text-ink-700 mb-1">
              Coming next
            </p>
            <p className="text-xs text-ink-500">
              The “{step}” step hasn’t been ported yet. Use the navigation
              to jump back to the steps that are ready.
            </p>
          </div>
        </div>
      );
  }
}

/**
 * Top-level page for /events/new.
 *
 * Layout:
 *   [TopBar - full width, sticky]
 *   [Sidebar (lg+) | [TabBar (mobile) → main content]]
 *   [BottomBar (mobile, sticky)]
 *
 * Both Sidebar and TabBar render - they're each gated by their own
 * media-query classes (hidden lg:flex / lg:hidden) so only one is
 * visible at a time. Doing it this way means we don't need to read
 * window size in JS at all; CSS is the source of truth for layout.
 */
export default function EventCreatePage() {
  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  );
}

function PageInner() {
  const searchParams = useSearchParams();
  // `?eid=` is a ref - "uk{eid}" - so the region travels as part of the
  // id rather than as a separate param that can go missing. Null when
  // there's no eid at all: a brand-new event from the create wizard.
  const parsedEid = parseRef(searchParams.get("eid"));
  const eid = parsedEid.id || null;
  // The region the eid belongs to. From the ref, falling back to a
  // `?site=` param on links minted before refs existed. It has to go up
  // on both the load and every subsequent save.
  const site = parsedEid.site ?? searchParams.get("site") ?? undefined;

  // Drives the load. The hook stays idle when eid is null/empty
  // (brand-new event from the create wizard - context is already
  // populated by the wizard, no fetch needed).
  const query = useEventForEdit(eid, site);
  const { dispatch } = useEventCreate();

  // Track which eid we've hydrated for. Without this, every render
  // of a successful query would re-dispatch HYDRATE and clobber any
  // user edits since the load. Storing the eid (not just a boolean)
  // means switching events in-place (rare, but possible if the URL
  // changes) re-hydrates correctly.
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!query.data || !eid) return;
    if (hydratedFor.current === eid) return;
    dispatch({
      type: "HYDRATE",
      // The region isn't part of the /event-edit payload, so it's
      // folded in from the URL here. Saving reads it back off state.
      partial: { ...mapEventEditResponse(query.data), site: site ?? null },
    });
    hydratedFor.current = eid;
  }, [query.data, eid, site, dispatch]);

  // Loading state - only when we have an eid AND haven't yet
  // hydrated. The data becoming available + the effect running
  // happens in the same tick, so we also gate on the ref to avoid
  // a one-frame flash of skeleton after the response arrives.
  const isInitialLoad =
    Boolean(eid) && (query.isLoading || hydratedFor.current !== eid);

  if (eid && query.isError) {
    return <EditorErrorState error={query.error} />;
  }

  if (isInitialLoad) {
    return <EditorSkeleton />;
  }

  return (
    <>
      <EditorTopBar />
      <div className="lg:flex">
        <EditorSidebar />
        <div className="lg:flex-1 lg:min-w-0">
          <EditorTabBar />
          <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16">
            <ActivePanel />
          </main>
        </div>
      </div>
      <EditorBottomBar />
    </>
  );
}

/**
 * Full-page skeleton shown while /event-edit is in flight. Mirrors
 * the editor's chrome so the layout doesn't shift when the real
 * content arrives - sidebar rail on the left, main column on the
 * right, fake panel header + a few field-shaped placeholders.
 *
 * Uses the same `.skeleton-shimmer` class the categories grid uses,
 * scoped under .event-editor by the parent layout.
 */
function EditorSkeleton() {
  return (
    <>
      {/* Topbar placeholder - match the real EditorTopBar's height
          (sticky h-14) so vertical position doesn't jump. */}
      <div className="h-14 border-b border-ink-200 bg-white flex items-center px-4 gap-3">
        <span className="skeleton-shimmer h-6 w-6 rounded-md" />
        <span className="skeleton-shimmer h-4 w-40 rounded" />
        <span className="ml-auto skeleton-shimmer h-8 w-24 rounded-lg" />
      </div>

      <div className="lg:flex">
        {/* Sidebar - visible only at lg+, same width as the real one. */}
        <aside className="hidden lg:block lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white p-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <span className="skeleton-shimmer h-7 w-7 rounded-full" />
              <span
                className={`skeleton-shimmer h-3.5 ${
                  ["w-32", "w-24", "w-36", "w-28"][i % 4]
                }`}
              />
            </div>
          ))}
        </aside>

        <div className="lg:flex-1 lg:min-w-0">
          <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16">
            {/* Eyebrow + title */}
            <div className="mb-8">
              <span className="skeleton-shimmer h-3 w-20 rounded mb-3 block" />
              <span className="skeleton-shimmer h-8 w-64 rounded mb-3 block" />
              <span className="skeleton-shimmer h-4 w-full rounded block" />
            </div>

            {/* A handful of "fields" */}
            <div className="space-y-6">
              {["w-20", "w-16", "w-24", "w-20"].map((labelW, i) => (
                <div key={i}>
                  <span
                    className={`skeleton-shimmer h-3 ${labelW} rounded mb-2 block`}
                  />
                  <span className="skeleton-shimmer h-11 w-full rounded-lg block" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

/**
 * Error state - shown for 401/403/404 from the load endpoint, plus
 * any other failure. Keeps the editor chrome out of the way so the
 * user sees a focused message + a way back to the dashboard.
 *
 * 401 shouldn't happen in practice: the apiClient redirects to
 * /login on auth failures via the unauthorizedHandler. We still
 * render a generic message here in case that handler is suppressed
 * or fails for some reason.
 */
function EditorErrorState({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : 0;
  const { title, body } = (() => {
    if (status === 403) {
      return {
        title: "You don’t have access to this event",
        body: "This event is owned by another organiser. If you think this is a mistake, contact support.",
      };
    }
    if (status === 404) {
      return {
        title: "Event not found",
        body: "The event you’re trying to edit doesn’t exist, or its link has been removed.",
      };
    }
    if (status === 400) {
      return {
        title: "That link looks broken",
        body: "We couldn’t recognise the event id in the URL. Try opening the event again from My Events.",
      };
    }
    return {
      title: "Couldn’t load the event",
      body:
        error instanceof Error
          ? error.message
          : "Something went wrong while loading. Please try again in a moment.",
    };
  })();

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-ink-200 p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <i
            className="fa-solid fa-triangle-exclamation text-red-500"
            aria-hidden
          />
        </div>
        <h1 className="font-display text-xl text-ink-900 mb-2">{title}</h1>
        <p className="text-sm text-ink-500 mb-6">{body}</p>
        <a
          href="/events"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back to
          My Events
        </a>
      </div>
    </div>
  );
}
