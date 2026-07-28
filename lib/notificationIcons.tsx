"use client";

/**
 * Shared notification presentation helpers — used by both the header
 * bell dropdown and the full notifications screen so the icon mapping
 * and time formatting stay in one place.
 *
 * Icons are inferred from an explicit `type` on the notification when
 * the backend provides one, otherwise from keywords in the message.
 * The current model has no type field, so inference is the live path;
 * when a `notification_type` is added, iconFor() picks it up with no
 * other change.
 */

import type { NotificationItem } from "./notifications";

export interface NotificationIcon {
  bg: string;
  fg: string;
  icon: React.ReactNode;
}

export function iconFor(n: NotificationItem): NotificationIcon {
  const type = (n as { type?: string }).type;
  const text = `${n.title} ${n.message}`.toLowerCase();

  if (type) return pick(type);

  // Keyword inference (order matters: payment/order before generic).
  if (/\b(order|payment|paid|£|invoice)\b/.test(text)) return pick("order");
  if (/\b(club|member|society)\b/.test(text)) return pick("club");
  if (/\b(trader|review|awaiting)\b/.test(text)) return pick("trader");
  if (/\b(show|car|vehicle|porsche|applied)\b/.test(text)) return pick("show");
  return pick("default");
}

function pick(key: string): NotificationIcon {
  switch (key) {
    case "order":
    case "payment":
      return { bg: "rgba(76,142,90,0.14)", fg: "#3f7d4e", icon: <BoxIcon /> };
    case "club":
      return { bg: "rgba(84,110,170,0.14)", fg: "#4a5e8c", icon: <PeopleIcon /> };
    case "trader":
    case "review":
      return { bg: "rgba(189,116,32,0.14)", fg: "#bd7420", icon: <WarningIcon /> };
    case "show":
    case "car":
    case "vehicle":
      return { bg: "rgba(120,120,120,0.12)", fg: "#6b6860", icon: <CarIcon /> };
    default:
      return {
        bg: "var(--ink-50, #f2f1ec)",
        fg: "var(--muted, #6b6860)",
        icon: <BellIcon size={16} />,
      };
  }
}

/** Strip HTML tags from legacy notification bodies → plain text. */
export function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = html;
    return (el.textContent || el.innerText || "").trim();
  }
  return html.replace(/<[^>]*>/g, "").trim();
}

/** Relative "time ago" with a date fallback. */
export function formatWhen(value: string): string {
  if (!value) return "";
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return value;
  const secs = Math.floor((Date.now() - then.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins === 1 ? "1 minute ago" : `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: then.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

// ─── Glyphs ───────────────────────────────────────────────────────────

export function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}
