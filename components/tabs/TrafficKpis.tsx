"use client";

import type { ReactNode } from "react";
import { KpiCard } from "@/components/cards/KpiCard";
import { useEventAnalytics } from "@/lib/eventAnalytics";
import type { Region } from "@/lib/regions";

/**
 * The three GA4 traffic cards on the event overview.
 *
 * Loads independently of the event itself (see lib/eventAnalytics), so
 * the row has three states of its own:
 *
 *   loading - dashes, so the grid doesn't reflow when numbers land
 *   error   - dashes plus a quiet note; the rest of the page is fine
 *   ok      - the figures
 *
 * It never unmounts itself on failure. A row that disappears reads as
 * "this event has no traffic", which is a different and much worse
 * claim than "we couldn't reach Google".
 */
export function TrafficKpis({
  eid,
  site,
  region,
}: {
  eid: string;
  site: string;
  /** Formats the counts in the event's own locale - 1,204 vs 1.204. */
  region: Region;
}) {
  const { data, isLoading, isError } = useEventAnalytics(eid, site);

  // `available: false` is a 200 carrying zeroes because the server
  // couldn't reach GA4. Rendering those zeroes would state that nobody
  // visited the page, which is a different thing from not knowing - so
  // it's treated exactly like a failed request.
  const unavailable = isError || data?.available === false;

  /**
   * What goes in a card, in priority order:
   *
   *   in flight   - a spinner, so the wait reads as "fetching" rather
   *                 than "there's nothing here"
   *   unavailable - a dash. We don't know the number, and a 0 would be
   *                 a claim that nobody visited
   *   otherwise   - the figure, including a genuine 0
   */
  const cardValue = (n: number | undefined): ReactNode => {
    if (isLoading) return <ValueSpinner />;
    if (unavailable || typeof n !== "number") return "-";
    return n.toLocaleString(region.locale);
  };

  return (
    <>
      {/* The period is in the label rather than a sub-line, so each card
          is one statement. No `sub` on any of them - passing one to some
          and not others would leave the row ragged. */}
      <div className="kpi-grid">
        <KpiCard
          label="Page Views (last 7 days)"
          value={cardValue(data?.page_views_7d)}
        />
        <KpiCard
          label="Page Views (Lifetime)"
          value={cardValue(data?.page_views_lifetime)}
        />
        <KpiCard
          label="Unique Visitors (Lifetime)"
          value={cardValue(data?.visitors_lifetime)}
        />
      </div>
      {unavailable && !isLoading && (
        <p
          className="text-xs text-ink-500"
          style={{ margin: "-8px 0 16px" }}
          role="status"
        >
          Visitor stats are unavailable right now.
        </p>
      )}
    </>
  );
}

/**
 * The in-flight placeholder for a KPI value.
 *
 * Sized well below the 36px `.kpi-value` - a spinner at the full figure
 * size dominates the card. The parent's line-height still sets the line
 * box, so swapping the spinner for the number doesn't shift the row.
 */
function ValueSpinner() {
  return (
    <span role="status" aria-label="Loading">
      <i
        className="fa-solid fa-spinner fa-spin text-ink-300"
        style={{ fontSize: 20 }}
        aria-hidden
      />
    </span>
  );
}
