"use client";

import { useEventData } from "@/context/EventContext";
import { useUI } from "@/context/UIContext";
import { KpiCard } from "@/components/cards/KpiCard";
import { ComingSoonBanner } from "@/components/ui/ComingSoonBanner";
import { CheckIcon, XIcon, DownloadIcon } from "@/components/ui/Icons";
import { useClubApplications } from "@/lib/clubApplications";
import type { Club } from "@/context/types";

/**
 * Clubs tab — lists car club applications grouped by status.
 *
 * Markup mirrors the dashboard's existing section/club-row classes
 * (section / section-body flush / club-row / club-name / club-sub /
 * tab-count / pill). Reads from the dedicated useClubApplications
 * query so the list refreshes on tab focus + after approve/reject.
 * Approve/reject open the detail modal, which owns the mutation.
 */
export function ClubsTab() {
  const { event } = useEventData();
  const eid = event.encryptedId;
  const { data, isLoading, error } = useClubApplications(eid);
  const clubs = data?.clubs ?? [];
  const sales = data?.sales;

  if (!isLoading && !error && clubs.length === 0) {
    return (
      <ComingSoonBanner
        title="No club applications yet"
        message="Applications will appear here as car clubs apply through your event's club application link."
      />
    );
  }

  const pending = clubs.filter((c) => c.status === "pending");
  // Server maps confirmed clubs (DB 'confirmed') → FE 'approved'.
  const confirmed = clubs.filter((c) => c.status === "approved");
  const rejected = clubs.filter((c) => c.status === "rejected");

  // Attending members comes from the server: real tickets sold for
  // paid events, or confirmed slots for free events. NOT a sum of
  // applied member counts (which would include pending + over-count).
  const attendingMembers = sales?.attending ?? 0;

  // Total Club Sales = actual tickets sold × price (real purchases),
  // from the ticket's stock_sold — not a function of confirmed
  // member counts.
  const salesTotal = sales?.total ?? 0;
  const salesPounds = Math.floor(salesTotal);
  const salesPence = Math.round((salesTotal - salesPounds) * 100)
    .toString()
    .padStart(2, "0");

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Total Clubs" value={clubs.length} />
        <KpiCard
          label="Total Club Sales"
          value={
            <>
              <span className="currency">£</span>
              {salesPounds.toLocaleString("en-GB")}
              <span style={{ fontSize: 18, opacity: 0.5, fontWeight: 400 }}>
                .{salesPence}
              </span>
            </>
          }
        />
        <KpiCard label="Attending Members" value={attendingMembers} />
      </div>

      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Car Club Applications</div>
            <div className="section-subtitle">
              All clubs organised by status
            </div>
          </div>
          <button type="button" className="btn btn-secondary">
            <DownloadIcon />
            Export
          </button>
        </div>

        <div className="section-body flush">
          <ClubGroup
            label="Pending"
            tone="warn"
            clubs={pending}
            variant="pending"
            isFirst
          />
          <ClubGroup
            label="Confirmed"
            tone="success"
            clubs={confirmed}
            variant="managed"
          />
          <ClubGroup
            label="Rejected"
            tone="muted"
            clubs={rejected}
            variant="managed"
          />
        </div>
      </div>
    </>
  );
}

function ClubGroup({
  label,
  tone,
  clubs,
  variant,
  isFirst,
}: {
  label: string;
  tone: "warn" | "success" | "muted";
  clubs: Club[];
  variant: "pending" | "managed";
  isFirst?: boolean;
}) {
  if (clubs.length === 0) return null;

  // tab-count colours per the mock: warn-soft/warn, success-soft/
  // success, bg-2/muted. Inline styles match the reference HTML so
  // we don't depend on extra class variants existing.
  const pillStyle: React.CSSProperties =
    tone === "warn"
      ? { background: "var(--warn-soft)", color: "var(--warn)" }
      : tone === "success"
        ? { background: "var(--success-soft)", color: "var(--success)" }
        : { background: "var(--bg-2)", color: "var(--muted)" };

  return (
    <>
      <div
        style={{
          padding: "14px 24px 8px",
          borderBottom: "1px solid var(--border)",
          borderTop: isFirst ? undefined : "1px solid var(--border)",
          display: "flex",
          gap: 8,
        }}
      >
        <span
          className="tab-count"
          style={{ ...pillStyle, fontWeight: 600, padding: "4px 10px" }}
        >
          {label} · {clubs.length}
        </span>
      </div>
      {clubs.map((club) => (
        <ClubRow key={club.id} club={club} variant={variant} />
      ))}
    </>
  );
}

function ClubRow({
  club,
  variant,
}: {
  club: Club;
  variant: "pending" | "managed";
}) {
  const { openDetail } = useUI();
  const openView = () => openDetail({ type: "club", data: club });

  // FE status → pill class. The stylesheet styles confirmed clubs
  // via the `paid` pill class and rejected via `refunded`. The FE
  // 'approved' status IS the confirmed state for clubs (server maps
  // DB 'paid' → 'approved'), so we label it "Confirmed".
  const pillClass =
    club.status === "approved"
      ? "paid"
      : club.status === "rejected"
        ? "refunded"
        : "pending";
  const pillLabel =
    club.status === "approved"
      ? "Confirmed"
      : club.status.charAt(0).toUpperCase() + club.status.slice(1);

  return (
    <div
      className="club-row"
      onClick={openView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openView();
        }
      }}
    >
      <div>
        <div className="club-name">{club.name}</div>
        <div className="club-sub">
          {variant === "pending"
            ? `${club.membersAttending} member${club.membersAttending === 1 ? "" : "s"} attending · ${club.appliedLabel}`
            : club.status === "rejected"
              ? club.updatedLabel
              : `${club.membersAttending} member${club.membersAttending === 1 ? "" : "s"} attending · ${club.updatedLabel}`}
        </div>
      </div>

      {variant === "pending" ? (
        <div style={{ display: "flex", gap: 6, marginRight: 10 }}>
          {/* Both buttons open the detail modal, which owns the
              approve/reject mutation + async UI. stopPropagation so
              the row's own openView doesn't also fire. */}
          <button
            type="button"
            className="showcar-action-btn approve"
            style={{ width: 28, height: 28 }}
            title="Review & approve"
            onClick={(e) => {
              e.stopPropagation();
              openView();
            }}
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            className="showcar-action-btn reject"
            style={{ width: 28, height: 28 }}
            title="Review & reject"
            onClick={(e) => {
              e.stopPropagation();
              openView();
            }}
          >
            <XIcon />
          </button>
        </div>
      ) : (
        <div />
      )}

      <span className={`pill ${pillClass}`}>{pillLabel}</span>
    </div>
  );
}
