"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  useEvent,
  useEventOrders,
  useEventShowCars,
  useEventCarClubs,
} from "@/lib/queries";
import {
  mapEventResponse,
  mergeAdditionalOrders,
  mergeAdditionalShowCars,
  mergeAdditionalCarClubs,
} from "@/lib/eventMapper";
import { useUI } from "@/context/UIContext";
import { EventProvider } from "@/context/EventContext";
import { Breadcrumb } from "@/components/event/Breadcrumb";
import { EventHero } from "@/components/event/EventHero";
import { EventTabs } from "@/components/event/EventTabs";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eid = params?.id;
  const { activeTab } = useUI();

  // Main event load: event + 5 recent orders + 5 recent apps per status/bucket.
  const eventQuery = useEvent(eid, 5, 5);

  // Feature flags derived from the event response.
  const showCarsEnabled =
    eventQuery.data?.show_cars?.enabled === true;
  const carClubsEnabled =
    eventQuery.data?.clubs?.enabled === true;

  // Lazy: full orders list when the Orders tab is active.
  const ordersQuery = useEventOrders(eid, {
    limit: 100,
    offset: 0,
    enabled: activeTab === "orders",
  });

  // Lazy: full show-cars list when tab is active AND feature is enabled.
  const showCarsQuery = useEventShowCars(eid, {
    limit: 100,
    offset: 0,
    enabled: activeTab === "showcars" && showCarsEnabled,
  });

  // Lazy: full car-clubs list when tab is active AND feature is enabled.
  const carClubsQuery = useEventCarClubs(eid, {
    limit: 100,
    offset: 0,
    enabled: activeTab === "clubs" && carClubsEnabled,
  });

  const eventData = useMemo(() => {
    if (!eventQuery.data) return null;
    let mapped = mapEventResponse(eventQuery.data);

    if (activeTab === "orders" && ordersQuery.data) {
      mapped = mergeAdditionalOrders(mapped, ordersQuery.data.orders);
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
  ]);

  if (!eid) {
    return <StatusBlock tone="error">Missing event id.</StatusBlock>;
  }

  if (eventQuery.isLoading) {
    return (
      <>
        <Breadcrumb />
        <StatusBlock>Loading event…</StatusBlock>
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
