"use client";

/**
 * Card-grid skeleton for list pages (clubs, venues, saved events).
 *
 * Inline-styled so it doesn't depend on each page's grid CSS classes,
 * which aren't guaranteed to be loaded. Renders a responsive grid of
 * shimmer placeholder cards that roughly match a media card: image
 * banner, title, a line of meta, and a footer row.
 *
 * `variant` tweaks the shape:
 *   - "media"  (default) → image banner + text (clubs, venues, events)
 *   - "ticket"            → wider, QR-style block + text (tickets)
 */
export function CardGridSkeleton({
  count = 6,
  variant = "media",
  minCardWidth = 300,
}: {
  count?: number;
  variant?: "media" | "ticket";
  minCardWidth?: number;
}) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <style>{`
        @keyframes cardSkelShimmer {
          0% { background-position: -450px 0; }
          100% { background-position: 450px 0; }
        }
      `}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
          gap: 20,
          alignItems: "start",
        }}
      >
        {Array.from({ length: count }).map((_, i) =>
          variant === "ticket" ? (
            <TicketSkeletonCard key={i} />
          ) : (
            <MediaSkeletonCard key={i} />
          ),
        )}
      </div>
    </div>
  );
}

function MediaSkeletonCard() {
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid var(--border, #ecebe6)",
      }}
    >
      <Shimmer style={{ width: "100%", height: 140, borderRadius: 0 }} />
      <div style={{ padding: 16 }}>
        <Shimmer style={{ width: "70%", height: 16 }} />
        <div style={{ height: 10 }} />
        <Shimmer style={{ width: "45%", height: 12 }} />
        <div style={{ height: 16 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Shimmer style={{ width: 70, height: 22, borderRadius: 999 }} />
          <Shimmer style={{ width: 50, height: 12 }} />
        </div>
      </div>
    </div>
  );
}

function TicketSkeletonCard() {
  return (
    <div
      style={{
        borderRadius: 16,
        background: "#fff",
        border: "1px solid var(--border, #ecebe6)",
        padding: 16,
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      <Shimmer style={{ width: 96, height: 96, borderRadius: 12, flex: "0 0 auto" }} />
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <Shimmer style={{ width: "75%", height: 16 }} />
        <div style={{ height: 10 }} />
        <Shimmer style={{ width: "55%", height: 12 }} />
        <div style={{ height: 8 }} />
        <Shimmer style={{ width: "40%", height: 12 }} />
        <div style={{ height: 16 }} />
        <Shimmer style={{ width: 110, height: 30, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function Shimmer({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 6,
        background:
          "linear-gradient(90deg, #eeece7 25%, #f6f5f2 37%, #eeece7 63%)",
        backgroundSize: "900px 100%",
        animation: "cardSkelShimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
