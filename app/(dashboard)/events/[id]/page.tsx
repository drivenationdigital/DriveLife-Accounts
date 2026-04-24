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
import { useUI } from "@/context/UIContext";
import { EventProvider } from "@/context/EventContext";
import { Breadcrumb } from "@/components/event/Breadcrumb";
import { EventHero } from "@/components/event/EventHero";
import { EventTabs } from "@/components/event/EventTabs";

const ORDERS_PER_PAGE = 20;

export default function EventDetailPage() {
  return (
    // Suspense is required because EventDetailContent reads searchParams.
    <Suspense
      fallback={
        <>
          <Breadcrumb />
          <StatusBlock>Loading event…</StatusBlock>
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
  // switches tabs — if they're on page 3, come back, still on page 3.
  const ordersPage = Math.max(
    1,
    parseInt(searchParams?.get("ordersPage") ?? "1", 10) || 1
  );

  const eventQuery = useEvent(eid, 5, 5);

  const showCarsEnabled = eventQuery.data?.show_cars?.enabled === true;
  const carClubsEnabled = eventQuery.data?.clubs?.enabled === true;

  const ordersQuery = useEventOrders(eid, {
    limit: ORDERS_PER_PAGE,
    offset: (ordersPage - 1) * ORDERS_PER_PAGE,
    enabled: activeTab === "orders",
  });

  const showCarsQuery = useEventShowCars(eid, {
    limit: 100,
    offset: 0,
    enabled: activeTab === "showcars" && showCarsEnabled,
  });

  const carClubsQuery = useEventCarClubs(eid, {
    limit: 100,
    offset: 0,
    enabled: activeTab === "clubs" && carClubsEnabled,
  });

  const eventData = useMemo(() => {
    if (!eventQuery.data) return null;
    let mapped = mapEventResponse(eventQuery.data);

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
