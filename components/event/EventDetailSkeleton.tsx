"use client";

/**
 * Coarse skeleton for the event detail page - hero block, tab strip,
 * generic content block. Deliberately doesn't mimic individual KPI
 * cards / tables / lists so it doesn't drift when the content changes.
 *
 * Shimmer animation lives in globals.css under `.skeleton-shimmer`.
 */
export function EventDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading event">
      {/* Hero */}
      <div className="event-skeleton-hero">
        <div
          className="skeleton-shimmer"
          style={{ width: "55%", height: 36, marginBottom: 14, borderRadius: 8 }}
        />
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div className="skeleton-shimmer" style={{ width: 160, height: 14 }} />
          <div className="skeleton-shimmer" style={{ width: 110, height: 14 }} />
          <div className="skeleton-shimmer" style={{ width: 220, height: 14 }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: 280, height: 12 }} />
      </div>

      {/* Tabs */}
      <div className="event-skeleton-tabs">
        <div className="skeleton-shimmer" style={{ width: 78, height: 18 }} />
        <div className="skeleton-shimmer" style={{ width: 70, height: 18 }} />
        <div className="skeleton-shimmer" style={{ width: 92, height: 18 }} />
        <div className="skeleton-shimmer" style={{ width: 60, height: 18 }} />
      </div>

      {/* Content block */}
      <div className="event-skeleton-content">
        <div
          className="skeleton-shimmer"
          style={{ width: 180, height: 16, marginBottom: 18 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18, marginBottom: 28 }}>
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>

        <div
          className="skeleton-shimmer"
          style={{ width: 140, height: 16, marginBottom: 14 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div>
      <div
        className="skeleton-shimmer"
        style={{ width: "60%", height: 12, marginBottom: 10 }}
      />
      <div
        className="skeleton-shimmer"
        style={{ width: "40%", height: 28, borderRadius: 4 }}
      />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width: "100%", height: 44, borderRadius: 8 }}
    />
  );
}
