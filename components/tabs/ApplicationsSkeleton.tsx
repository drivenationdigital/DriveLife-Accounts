"use client";

/**
 * Loading skeleton for the application tabs (Show Cars / Clubs /
 * Traders).
 *
 * Those tabs fetch their applications from a dedicated query that only
 * fires once the tab is opened. Before this existed the tabs fell back
 * to an empty array while that request was in flight, so the user got
 * a bare KPI strip reading 0 / 0 / 0 (or the "not enabled" banner)
 * that then popped into real content a moment later. This gives the
 * gap a shape instead.
 *
 * Mirrors the real layout - KPI strip on top, then one section card
 * holding either table rows or the application card grid - using the
 * same `.kpi` / `.section` classes so spacing matches exactly and the
 * swap to real content doesn't jump.
 *
 * Shimmer animation is the global `.skeleton-shimmer` rule in
 * globals.css.
 */
export function ApplicationsSkeleton({
  variant = "table",
  kpis = 3,
  rows = 4,
  label = "Loading applications",
}: {
  /** "table" matches the show car / club tables, "cards" the trader grid. */
  variant?: "table" | "cards";
  kpis?: number;
  /** Rows (table) or cards (cards) to draw. */
  rows?: number;
  label?: string;
}) {
  return (
    <div aria-busy="true" aria-live="polite" aria-label={label}>
      <div className="kpi-grid">
        {Array.from({ length: kpis }).map((_, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-label">
              <span
                className="skeleton-shimmer"
                style={{ display: "block", width: 92, height: 11 }}
              />
            </div>
            <div className="kpi-value">
              <span
                className="skeleton-shimmer"
                style={{ display: "block", width: 64, height: 30, borderRadius: 4 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <div>
            <div
              className="skeleton-shimmer"
              style={{ width: 172, height: 15, marginBottom: 8 }}
            />
            <div
              className="skeleton-shimmer"
              style={{ width: 120, height: 11 }}
            />
          </div>
        </div>

        {variant === "cards" ? (
          <div className="section-body">
            <div className="app-card-grid">
              {Array.from({ length: rows }).map((_, i) => (
                <SkeletonAppCard key={i} />
              ))}
            </div>
          </div>
        ) : (
          <div className="section-body flush">
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} last={i === rows - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Failure counterpart to the skeleton. The tabs used to fall back to
 * an empty list when the request failed, which rendered as an empty
 * page (or a misleading "no applications yet") - indistinguishable
 * from a genuinely empty event. This says what happened and offers a
 * retry.
 */
export function ApplicationsError({
  message,
  onRetry,
  retrying,
}: {
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="section">
      <div className="section-body">
        <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              color: "var(--ink)",
              marginBottom: 8,
            }}
          >
            Couldn&apos;t load applications
          </h3>
          <p>{message ?? "Something went wrong fetching this list."}</p>
          {onRetry && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRetry}
              disabled={retrying}
              style={{ marginTop: 16 }}
            >
              {retrying ? "Retrying..." : "Try again"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** One table row - avatar-ish block, two stacked text lines, a pill. */
function SkeletonTableRow({ last }: { last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 24px",
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      <div
        className="skeleton-shimmer"
        style={{ width: 36, height: 36, borderRadius: 8, flex: "0 0 auto" }}
      />
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <div
          className="skeleton-shimmer"
          style={{ width: "38%", height: 12, marginBottom: 8 }}
        />
        <div className="skeleton-shimmer" style={{ width: "24%", height: 10 }} />
      </div>
      <div
        className="skeleton-shimmer"
        style={{ width: 62, height: 12, flex: "0 0 auto" }}
      />
      <div
        className="skeleton-shimmer"
        style={{ width: 74, height: 22, borderRadius: 999, flex: "0 0 auto" }}
      />
    </div>
  );
}

/** One application card in the trader grid. */
function SkeletonAppCard() {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 18,
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          className="skeleton-shimmer"
          style={{ width: 40, height: 40, borderRadius: 10, flex: "0 0 auto" }}
        />
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div
            className="skeleton-shimmer"
            style={{ width: "62%", height: 13, marginBottom: 8 }}
          />
          <div className="skeleton-shimmer" style={{ width: "40%", height: 10 }} />
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="skeleton-shimmer" style={{ width: "85%", height: 10 }} />
        <div className="skeleton-shimmer" style={{ width: "70%", height: 10 }} />
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
        <div
          className="skeleton-shimmer"
          style={{ width: 92, height: 32, borderRadius: 8 }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: 92, height: 32, borderRadius: 8 }}
        />
      </div>
    </div>
  );
}
