import type { OrderStatus, ApplicationStatus, ShowCarStatus } from "@/context/types";
import {
  formatRegionCurrency,
  resolveRegion,
  type Region,
} from "./regions";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Money, in an event's own region.
 *
 * Both the symbol and the grouping move with the region - a US event
 * shows $1,234.00 where a UK one shows £1,234.00 - so pass the region
 * off the event you're rendering (`event.region`).
 *
 * `region` is optional and defaults to UK, matching the API's own
 * fallback for an omitted `site`. That keeps call sites with no event
 * in scope working rather than forcing a wrong region on them.
 */
export function currency(amount: number, region?: Region): string {
  return formatRegionCurrency(amount, region ?? resolveRegion(undefined));
}

/** Map a domain status to the "pill" CSS modifier used throughout the UI */
export function statusPillClass(
  status: OrderStatus | ApplicationStatus | ShowCarStatus | string
): "paid" | "pending" | "refunded" {
  const s = status.toLowerCase();
  if (s === "paid" || s === "approved" || s === "confirmed") return "paid";
  if (s === "refunded" || s === "rejected") return "refunded";
  return "pending";
}

/** Renders **bold** segments in notification text */
export function formatNotification(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
