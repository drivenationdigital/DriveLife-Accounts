"use client";

import { DashboardTiles } from "@/components/event/DashboardTiles";
import { MyEventsSummary } from "@/components/event/MyEventsSummary";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.display_name?.split(" ")[0] ?? "there";

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Dashboard</div>
          <div className="section-subtitle">Welcome back, {firstName}.</div>
        </div>
      </div>
      <div className="section-body">
        <DashboardTiles />
        <MyEventsSummary />
      </div>
    </div>
  );
}
