"use client";

import { useEventData } from "@/context/EventContext";
import { currency } from "@/lib/utils";
import { KpiCard } from "@/components/cards/KpiCard";
import { AppCard } from "@/components/cards/AppCard";
import { DownloadIcon } from "@/components/ui/Icons";
import { ComingSoonBanner } from "@/components/ui/ComingSoonBanner";
import type { Club } from "@/context/types";

function ClubGroup({
  title,
  subtitle,
  clubs,
  action,
}: {
  title: string;
  subtitle: string;
  clubs: Club[];
  action?: React.ReactNode;
}) {
  if (clubs.length === 0) return null;
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">{title}</div>
          <div className="section-subtitle">{subtitle}</div>
        </div>
        {action}
      </div>
      <div className="section-body">
        <div className="app-card-grid">
          {clubs.map((c) => (
            <AppCard key={c.id} kind="club" entity={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClubsTab() {
  const { clubs } = useEventData();

  if (clubs.length === 0) {
    return (
      <ComingSoonBanner
        title="Clubs — Coming Soon"
        message="Club applications will appear here once the feature is wired up."
      />
    );
  }

  const pending = clubs.filter((c) => c.status === "pending");
  const approved = clubs.filter((c) => c.status === "approved");
  const rejected = clubs.filter((c) => c.status === "rejected");

  const totalMembers = clubs
    .filter((c) => c.status === "approved")
    .reduce((n, c) => n + c.membersAttending, 0);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Total Clubs" value={clubs.length} />
        <KpiCard
          label="Total Club Sales"
          value={
            <>
              <span className="currency">£</span>
              {(totalMembers * 10).toLocaleString("en-GB")}
              <span
                style={{ fontSize: 18, opacity: 0.5, fontWeight: 400 }}
              >
                .00
              </span>
            </>
          }
        />
        <KpiCard
          label="Attending Members"
          value={clubs.reduce((n, c) => n + c.membersAttending, 0)}
        />
      </div>

      <ClubGroup
        title="Pending Club Applications"
        subtitle={`${pending.length} awaiting review`}
        clubs={pending}
      />

      <ClubGroup
        title="Approved Clubs"
        subtitle={`${approved.length} confirmed for event`}
        clubs={approved}
        action={
          <button type="button" className="btn btn-secondary">
            <DownloadIcon /> Export
          </button>
        }
      />

      <ClubGroup
        title="Rejected Clubs"
        subtitle={`${rejected.length} application${rejected.length === 1 ? "" : "s"} rejected`}
        clubs={rejected}
      />
    </>
  );
}

// Suppress unused warning for the demo currency helper
void currency;
