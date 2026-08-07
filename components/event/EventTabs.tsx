"use client";

import { useRef } from "react";
import { useUI } from "@/context/UIContext";
import { useEventData } from "@/context/EventContext";
import { cx } from "@/lib/utils";
import type { TabKey } from "@/context/types";

import { OverviewTab } from "@/components/tabs/OverviewTab";
import { OrdersTab } from "@/components/tabs/OrdersTab";
import { ShowCarsTab } from "@/components/tabs/ShowCarsTab";
import { ClubsTab } from "@/components/tabs/ClubsTab";
import { TradersTab } from "@/components/tabs/TradersTab";

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

  // Ticketing - orders, attendees and all three application types -
  // exists on the UK site only for now. The API returns shape-identical
  // zero payloads for a US event rather than erroring, so these tabs
  // would render as a row of empty states; hide them instead.
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
    { key: "overview",  label: "Overview" },
    ...(ticketingVisible
      ? ([
          { key: "orders",   label: "Orders",    count: kpis.totalOrders || orders.length },
          { key: "showcars", label: "Show Cars", count: showCars.length },
          { key: "clubs",    label: "Clubs",     count: clubs.length },
          { key: "traders",  label: "Traders",   count: traders.length },
        ] as TabDef[])
      : []),
  ];

  // A US event opened while the UI still remembers a ticketing tab from
  // the last (UK) event would otherwise render a panel with no tab to
  // match it.
  const currentTab: TabKey =
    tabs.some((t) => t.key === activeTab) ? activeTab : "overview";

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
        {currentTab === "orders" && <OrdersTab />}
        {currentTab === "showcars" && <ShowCarsTab />}
        {currentTab === "clubs" && <ClubsTab />}
        {currentTab === "traders" && <TradersTab />}
      </div>
    </>
  );
}
