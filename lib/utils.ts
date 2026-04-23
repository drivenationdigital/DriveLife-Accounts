import type { OrderStatus, ApplicationStatus, ShowCarStatus } from "@/context/types";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function currency(amount: number): string {
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
