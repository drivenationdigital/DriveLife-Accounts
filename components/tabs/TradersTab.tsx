"use client";

import { useEventData } from "@/context/EventContext";
import { KpiCard } from "@/components/cards/KpiCard";
import { AppCard } from "@/components/cards/AppCard";
import { PlusIcon } from "@/components/ui/Icons";
import { ComingSoonBanner } from "@/components/ui/ComingSoonBanner";
import {
  ApplicationsSkeleton,
  ApplicationsError,
} from "@/components/tabs/ApplicationsSkeleton";
import { useTraderApplications } from "@/lib/traderApplications";
import { ApplicationLinkBar } from "@/components/tabs/ApplicationLinkBar";
import { applyFormUrl } from "@/lib/applyFormUrl";
import type { Trader } from "@/context/types";

/**
 * Public trader application link for an event - the shared helper
 * yields the apply.carevents.com short form in production and the
 * current origin's /apply path elsewhere.
 */
function traderApplyUrl(eid: string): string {
  return applyFormUrl("trader", eid);
}

function TraderGroup({
  title,
  subtitle,
  traders,
  action,
}: {
  title: string;
  subtitle?: string;
  traders: Trader[];
  action?: React.ReactNode;
}) {
  if (traders.length === 0) return null;
  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">{title}</div>
          {subtitle && <div className="section-subtitle">{subtitle}</div>}
        </div>
        {action}
      </div>
      <div className="section-body">
        <div className="app-card-grid">
          {traders.map((t) => (
            <AppCard key={t.id} kind="trader" entity={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TradersTab() {
  const { event, features } = useEventData();
  const eid = event.encryptedId;

  // Shareable public application-form link, shown whenever the
  // feature is switched on for the event.
  const linkBar = features.traders.enabled ? (
    <ApplicationLinkBar
      kind="trader"
      eid={eid}
      title="Trader application form"
    />
  ) : null;
  const {
    data: traders = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useTraderApplications(eid, event.region);

  // First load: shimmer the card grid rather than showing an empty
  // KPI strip that snaps into content a moment later.
  if (isLoading) {
    return (
      <ApplicationsSkeleton
        variant="cards"
        rows={4}
        label="Loading trader applications"
      />
    );
  }

  if (error && traders.length === 0) {
    return (
      <ApplicationsError
        message={(error as Error)?.message}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  }

  if (traders.length === 0) {
    return (
      <>
        {linkBar}
        <ComingSoonBanner
          title={
            features.traders.enabled
              ? "No trader applications yet"
              : "Trader applications not enabled for this event"
          }
          message="Applications will appear here as traders apply through your event's trader application link."
        />
      </>
    );
  }

  const pending = traders.filter((t) => t.status === "pending");
  // Server maps confirmed traders → 'approved'; both show here.
  const approved = traders.filter((t) => t.status === "approved");

  return (
    <>
      {linkBar}
      <div className="kpi-grid">
        <KpiCard label="Total Applications" value={traders.length} />
        <KpiCard
          label="Pending Review"
          value={pending.length}
          valueColor="var(--warn)"
        />
        <KpiCard
          label="Confirmed Traders"
          value={approved.length}
          valueColor="var(--success)"
        />
      </div>

      <TraderGroup title="Pending Trader Applications" traders={pending} />

      <TraderGroup
        title="Approved Traders"
        subtitle={`${approved.length} confirmed for event`}
        traders={approved}
        action={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              window.open(traderApplyUrl(eid), "_blank", "noopener,noreferrer")
            }
          >
            <PlusIcon /> Add Trader
          </button>
        }
      />
    </>
  );
}
