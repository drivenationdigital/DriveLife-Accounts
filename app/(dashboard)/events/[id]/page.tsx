"use client";

import { Suspense, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  useEvent,
  useEventOrders,
  useEventShowCars,
  useEventCarClubs,
} from "@/lib/queries";
import {
  mapEventResponse,
  applyOrdersPage,
  mergeAdditionalShowCars,
  mergeAdditionalCarClubs,
} from "@/lib/eventMapper";
import { ticketingEnabled } from "@/lib/regions";
import { useUI } from "@/context/UIContext";
import { EventProvider } from "@/context/EventContext";
import { Breadcrumb } from "@/components/event/Breadcrumb";
import { EventHero } from "@/components/event/EventHero";
import { EventTabs } from "@/components/event/EventTabs";
import { EventDetailSkeleton } from "@/components/event/EventDetailSkeleton";

const ORDERS_PER_PAGE = 20;

export default function EventDetailPage() {
  return (
    // Suspense is required because EventDetailContent reads searchParams.
    <Suspense
      fallback={
        <>
          <Breadcrumb />
          <EventDetailSkeleton />
        </>
      }
    >
      <EventDetailContent />
    </Suspense>
  );
}

function EventDetailContent() {
  const params = useParams<{ id: string }>();
  const eid = params?.id;
  const { activeTab } = useUI();
  const searchParams = useSearchParams();

  // URL-driven page state for the orders tab. Not reset when the user
  // switches tabs - if they're on page 3, come back, still on page 3.
  const ordersPage = Math.max(
    1,
    parseInt(searchParams?.get("ordersPage") ?? "1", 10) || 1
  );

  // Which multisite blog the event lives on. Set by the events list when
  // it navigates here (`/events/{eid}?site=us`); an eid alone is
  // ambiguous across sites. Undefined on older links - the API then
  // resolves against its default site, same as before multisite.
  const site = searchParams?.get("site") || undefined;

  const eventQuery = useEvent(eid, { site });

  // Ticketing is a per-region capability - a listing-only region has no
  // orders, attendees or applications. The API returns shape-identical
  // zero payloads there rather than erroring, so this gating is about
  // not firing pointless requests and not rendering empty states -
  // nothing would crash without it. Both live regions are ticketed now,
  // so this is only load-bearing for a future listing-only site.
  const ticketingAvailable = ticketingEnabled(
    eventQuery.data?.site ?? eventQuery.data?.event?.site,
    eventQuery.data?.sales?.ticketing_available,
    site,
  );

  const showCarsEnabled =
    ticketingAvailable && eventQuery.data?.show_cars?.enabled === true;
  const carClubsEnabled =
    ticketingAvailable && eventQuery.data?.clubs?.enabled === true;

  const ordersQuery = useEventOrders(eid, {
    site,
    limit: ORDERS_PER_PAGE,
    offset: (ordersPage - 1) * ORDERS_PER_PAGE,
    enabled: activeTab === "orders" && ticketingAvailable,
  });

  const showCarsQuery = useEventShowCars(eid, {
    site,
    limit: 100,
    offset: 0,
    enabled: activeTab === "showcars" && showCarsEnabled,
  });

  const carClubsQuery = useEventCarClubs(eid, {
    site,
    limit: 100,
    offset: 0,
    enabled: activeTab === "clubs" && carClubsEnabled,
  });

  const eventData = useMemo(() => {
    if (!eventQuery.data) return null;
    let mapped = mapEventResponse(eventQuery.data, { fallbackSite: site });

    if (activeTab === "orders" && ordersQuery.data) {
      const total = ordersQuery.data.total_count;
      mapped = applyOrdersPage(mapped, ordersQuery.data.orders, {
        page: ordersPage,
        perPage: ORDERS_PER_PAGE,
        total,
        totalPages: Math.max(1, Math.ceil(total / ORDERS_PER_PAGE)),
      });
    }
    if (activeTab === "showcars" && showCarsQuery.data) {
      mapped = mergeAdditionalShowCars(mapped, showCarsQuery.data.items);
    }
    if (activeTab === "clubs" && carClubsQuery.data) {
      mapped = mergeAdditionalCarClubs(mapped, carClubsQuery.data.items);
    }
    return mapped;
  }, [
    eventQuery.data,
    ordersQuery.data,
    showCarsQuery.data,
    carClubsQuery.data,
    activeTab,
    ordersPage,
    site,
  ]);

  if (!eid) {
    return <StatusBlock tone="error">Missing event id.</StatusBlock>;
  }

  if (eventQuery.isLoading) {
    return (
      <>
        <Breadcrumb />
        <EventDetailSkeleton />
      </>
    );
  }

  if (eventQuery.isError) {
    const err = eventQuery.error as Error;
    return (
      <>
        <Breadcrumb />
        <StatusBlock tone="error">
          {err?.message ?? "Failed to load this event."}
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => eventQuery.refetch()}
              disabled={eventQuery.isFetching}
            >
              {eventQuery.isFetching ? "Retrying…" : "Try again"}
            </button>
          </div>
        </StatusBlock>
      </>
    );
  }

  if (!eventData) {
    return (
      <>
        <Breadcrumb />
        <StatusBlock>Event not found.</StatusBlock>
      </>
    );
  }

  // A recurring series parent holds the pattern and the child list, not
  // a date or any sales of its own. EventTabs handles the difference:
  // the parent's date lists take the place of Overview, and the
  // ticketing tabs come or go with the series. There's no separate
  // occurrence endpoint - /event returns one shape or the other, and
  // `occurrences !== null` is the switch.
  return (
    <EventProvider initialData={eventData}>
      <Breadcrumb />
      <EventHero />
      <EventTabs />
    </EventProvider>
  );
}

function StatusBlock({
  children,
  tone = "normal",
}: {
  children: React.ReactNode;
  tone?: "normal" | "error";
}) {
  return (
    <div className="section">
      <div className="section-body">
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: tone === "error" ? "var(--danger)" : "var(--muted)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
