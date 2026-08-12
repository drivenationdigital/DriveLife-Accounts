import type { OrderStatus, ApplicationStatus, ShowCarStatus } from "@/context/types";
import { formatRegionCurrency, type Region } from "./regions";

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
 * `region` is required. It used to default to UK, which meant a missing
 * one didn't fail - it just printed a US event's takings in pounds.
 * Every call site has an event (or its region) in scope, so there's
 * nothing to gain from a default and a wrong figure to lose.
 */
export function currency(amount: number, region: Region): string {
  return formatRegionCurrency(amount, region);
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
