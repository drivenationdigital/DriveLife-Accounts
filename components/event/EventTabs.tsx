"use client";

import { useMemo, useRef } from "react";
import { useUI } from "@/context/UIContext";
import { useEventData } from "@/context/EventContext";
import { occurrencesInScope } from "@/lib/occurrenceScope";
import { cx } from "@/lib/utils";
import type { TabKey } from "@/context/types";

import { OverviewTab } from "@/components/tabs/OverviewTab";
import { OrdersTab } from "@/components/tabs/OrdersTab";
import { ShowCarsTab } from "@/components/tabs/ShowCarsTab";
import { ClubsTab } from "@/components/tabs/ClubsTab";
import { TradersTab } from "@/components/tabs/TradersTab";
import { OccurrenceTable } from "@/components/event/OccurrenceTable";

interface TabDef {
  key: TabKey;
  label: string;
  count?: number;
}

export function EventTabs() {
  const { activeTab, setActiveTab } = useUI();
  const { event, occurrences, kpis, orders, showCars, clubs, traders } =
    useEventData();
  const tabsRef = useRef<HTMLDivElement | null>(null);

  // A series parent has no sales dashboard of its own - the KPIs,
  // tickets and recent orders on Overview all belong to the individual
  // dates. So the parent trades Overview for its two date lists, and
  // keeps whichever ticketing tabs apply across the series.
  const isSeriesParent = occurrences !== null;

  const occurrenceCounts = useMemo(
    () => ({
      upcoming: occurrences
        ? occurrencesInScope(occurrences.items, "upcoming").length
        : 0,
      past: occurrences
        ? occurrencesInScope(occurrences.items, "past").length
        : 0,
    }),
    [occurrences],
  );

  // Ticketing - orders, attendees and all three application types -
  // is a per-region capability. The API returns shape-identical zero
  // payloads on a listing-only region rather than erroring, so these
  // tabs would render as a row of empty states; hide them instead.
  // Both live regions are ticketed now, so in practice this only bites
  // a series with no sales, below.
  //
  // On a series parent the same question is answered by the first
  // child, which is how the legacy page decided whether the parent had
  // any sales surface at all.
  const ticketingVisible =
    event.region.ticketing &&
    (occurrences === null ||
      occurrences.ticketed ||
      occurrences.registrationRequired);

  // Orders tab shows the *total* order count (from KPIs, not the loaded page).
  // Other tabs show entity count, or nothing when coming-soon stubbed.
  const tabs: TabDef[] = [
    ...(isSeriesParent
      ? ([
          { key: "upcoming", label: "Upcoming Events", count: occurrenceCounts.upcoming },
          { key: "past",     label: "Past Events",     count: occurrenceCounts.past },
        ] as TabDef[])
      : ([{ key: "overview", label: "Overview" }] as TabDef[])),
    ...(ticketingVisible
      ? ([
          { key: "orders",   label: "Orders",    count: kpis.totalOrders || orders.length },
          { key: "showcars", label: "Show Cars", count: showCars.length },
          { key: "clubs",    label: "Clubs",     count: clubs.length },
          { key: "traders",  label: "Traders",   count: traders.length },
        ] as TabDef[])
      : []),
  ];

  // The active tab is remembered across events, so it can name a tab
  // this event doesn't have - a listing-only event opened after a
  // ticketed one, or a parent (no Overview) after a normal event (no
  // Upcoming). Fall back to whichever tab this event leads with rather
  // than rendering a panel with no tab to match it.
  const currentTab: TabKey = tabs.some((t) => t.key === activeTab)
    ? activeTab
    : tabs[0]!.key;

  const handleTabClick = (key: TabKey) => {
    setActiveTab(key);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="tabs" ref={tabsRef} id="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={cx("tab", currentTab === t.key && "active")}
            onClick={() => handleTabClick(t.key)}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="tab-count">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {currentTab === "overview" && <OverviewTab />}
        {currentTab === "upcoming" && <OccurrenceTable scope="upcoming" />}
        {currentTab === "past" && <OccurrenceTable scope="past" />}
        {currentTab === "orders" && <OrdersTab />}
        {currentTab === "showcars" && <ShowCarsTab />}
        {currentTab === "clubs" && <ClubsTab />}
        {currentTab === "traders" && <TradersTab />}
      </div>
    </>
  );
}
