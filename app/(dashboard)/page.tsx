"use client";

import { DashboardTiles } from "@/components/event/DashboardTiles";
import { MyEventsSummary } from "@/components/event/MyEventsSummary";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.display_name?.split(" ")[0] ?? "there";

  // Two separate cards rather than one card with both blocks inside:
  // the shortcut tiles and the events list are unrelated, so merging
  // them under a single "Dashboard" header made the events list look
  // like a sub-section of the shortcuts.
  return (
    <>
      <div className="section">
        <div className="section-header">
          <div>
            <h2 className="mes-title">Dashboard</h2>
            <div className="section-subtitle">Welcome back, {firstName}.</div>
          </div>
        </div>
        <div className="section-body">
          <DashboardTiles />
        </div>
      </div>

      {/* MyEventsSummary renders its own .section card. */}
      <MyEventsSummary />
    </>
  );
}
