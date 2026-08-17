"use client";

import type { ReactNode } from "react";
import type { EventDetail } from "@/context/types";
import { useEventAnalytics } from "@/lib/eventAnalytics";

/**
 * The stat row at the top of the event overview.
 *
 * One wrapping flex strip rather than two fixed grids. A listing event
 * has no orders, tickets sold or revenue, so those three items simply
 * aren't rendered - and because the strip wraps rather than sitting on
 * a 3-column grid, the remaining traffic figures spread to fill the
 * card instead of leaving a gap where the sales ones were.
 *
 * The traffic half loads on its own request (see lib/eventAnalytics),
 * so it has its own in-flight and unavailable states while the sales
 * figures - already on the event response - are there immediately.
 */
export function EventStatStrip({
  event,
  kpis,
  showSales,
}: {
  event: EventDetail;
  kpis: {
    totalOrders: number;
    ticketsSold: number;
    netSales: number;
  };
  /** False on an event with no ticket types - see OverviewTab. */
  showSales: boolean;
}) {
  const { data, isLoading, isError } = useEventAnalytics(
    event.encryptedId,
    event.site,
  );

  // `available: false` is a 200 carrying zeroes because the server
  // couldn't reach GA4. Rendering those zeroes would state that nobody
  // visited the page, which is a different thing from not knowing - so
  // it's treated exactly like a failed request.
  const unavailable = isError || data?.available === false;

  /**
   * Spinner while in flight, dash when we couldn't get a figure,
   * otherwise the number.
   */
  const traffic = (n: number | undefined): ReactNode => {
    if (isLoading) return <ValueSpinner />;
    if (unavailable || typeof n !== "number") return "-";
    return n.toLocaleString(event.region.locale);
  };

  return (
    <div className="section stat-strip-card">
      <div className="stat-strip">
        {showSales && (
          <>
            <StatItem
              label="Total Orders"
              value={kpis.totalOrders.toLocaleString(event.region.locale)}
            />
            <StatItem
              label="Tickets Sold"
              value={kpis.ticketsSold.toLocaleString(event.region.locale)}
            />
            <StatItem label="Net Sales" value={<Money event={event} amount={kpis.netSales} />} />
          </>
        )}

        <StatItem
          label="Page Views"
          qualifier="Lifetime"
          value={traffic(data?.page_views_lifetime)}
        />
        <StatItem
          label="Page Views"
          qualifier="7 Days"
          value={traffic(data?.page_views_7d)}
        />
        <StatItem
          label="Unique Visitors"
          qualifier="Lifetime"
          value={traffic(data?.visitors_lifetime)}
        />
      </div>

      {unavailable && !isLoading && (
        <p className="stat-strip-note" role="status">
          Visitor stats are unavailable right now.
        </p>
      )}
    </div>
  );
}

function StatItem({
  label,
  qualifier,
  value,
}: {
  label: string;
  /** The period, shown after a separator dot in a lighter weight so the
   *  metric name stays the thing you read first. */
  qualifier?: string;
  value: ReactNode;
}) {
  return (
    <div className="stat-item">
      <div className="stat-label">
        {label}
        {qualifier && <span className="stat-qualifier"> • {qualifier}</span>}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

/**
 * Money with the symbol and the pence de-emphasised, so the pounds read
 * first at a glance. Split rather than formatted whole because only the
 * decimal part is styled down, and Intl gives us one string.
 */
function Money({ event, amount }: { event: EventDetail; amount: number }) {
  const safe = Number.isFinite(amount) ? amount : 0;
  // Split in whole pence rather than by subtracting the integer part.
  // Rounding the fraction separately carries wrong at the boundary -
  // 2340.999 gives ".100" - and the sign has to come off before the
  // symbol, so a refunded-out event reads "-£4.50" and not "£-4.50".
  const negative = safe < 0;
  const totalPence = Math.round(Math.abs(safe) * 100);
  const whole = Math.floor(totalPence / 100);
  const pence = (totalPence % 100).toString().padStart(2, "0");
  return (
    <>
      {negative && "-"}
      <span className="currency">{event.region.currencySymbol}</span>
      {whole.toLocaleString(event.region.locale)}
      <span className="decimals">.{pence}</span>
    </>
  );
}

/**
 * The in-flight placeholder for a stat value.
 *
 * A CSS ring (`.stat-spinner`), NOT a Font Awesome icon. FA is loaded
 * only by the editor layout, so an `<i class="fa-spinner">` on a
 * dashboard page renders as nothing at all - which is what a blank
 * stat cell was.
 */
function ValueSpinner() {
  return (
    <span role="status" aria-label="Loading">
      <span className="stat-spinner" aria-hidden />
    </span>
  );
}
