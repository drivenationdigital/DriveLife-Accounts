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
  const { kpis, orders, showCars, clubs, traders } = useEventData();
  const tabsRef = useRef<HTMLDivElement | null>(null);

  // Orders tab shows the *total* order count (from KPIs, not the loaded page).
  // Other tabs show entity count, or nothing when coming-soon stubbed.
  const tabs: TabDef[] = [
    { key: "overview",  label: "Overview" },
    { key: "orders",    label: "Orders",    count: kpis.totalOrders || orders.length },
    { key: "showcars",  label: "Show Cars", count: showCars.length },
    { key: "clubs",     label: "Clubs",     count: clubs.length },
    { key: "traders",   label: "Traders",   count: traders.length },
  ];

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
            className={cx("tab", activeTab === t.key && "active")}
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
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "showcars" && <ShowCarsTab />}
        {activeTab === "clubs" && <ClubsTab />}
        {activeTab === "traders" && <TradersTab />}
      </div>
    </>
  );
}
