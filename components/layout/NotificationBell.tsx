"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationsRead,
  type NotificationItem,
} from "@/lib/notifications";
import {
  iconFor,
  stripHtml,
  formatWhen,
  BellIcon,
} from "@/lib/notificationIcons";

/**
 * Header notification bell + dropdown preview.
 *
 * The bell shows an unread badge (polled). Clicking opens a popover with
 * the latest handful of notifications; "View all" links to the full
 * screen, and "Mark all read" clears them. Unread rows are highlighted
 * with a dot.
 *
 * Icons are inferred from each notification's type when the backend
 * provides one, otherwise from keywords in the message (the current
 * model has no type field). See iconFor().
 *
 * Self-contained inline styles so it renders without the app's global
 * CSS.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const { data: countData } = useUnreadCount();
  const unread = countData?.unread_count ?? 0;

  // Only fetch the list while the popover is (or has been) open.
  const { data, isLoading } = useNotifications({ enabled: open });
  const latest: NotificationItem[] = data
    ? data.pages.flatMap((p) => p.notifications).slice(0, 6)
    : [];

  const markRead = useMarkNotificationsRead();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "9999px",
          border: "none",
          background: open ? "var(--ink-50, #f6f5f2)" : "transparent",
          color: "var(--ink, #1f1d18)",
          cursor: "pointer",
        }}
      >
        <BellIcon />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: "9999px",
              background: "var(--danger, #c0492f)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "16px",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 380,
            maxWidth: "calc(100vw - 24px)",
            background: "#fff",
            borderRadius: 16,
            boxShadow:
              "0 12px 32px rgba(31,29,24,0.16), 0 2px 8px rgba(31,29,24,0.08)",
            border: "1px solid var(--border, #ecebe6)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
              borderBottom: "1px solid var(--border, #ecebe6)",
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "var(--ink, #1f1d18)",
              }}
            >
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead.mutate()}
                disabled={markRead.isPending}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--gold-deep, #bd7420)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {isLoading && !data && (
              <div
                style={{
                  padding: "28px 18px",
                  textAlign: "center",
                  fontSize: 14,
                  color: "var(--muted, #6b6860)",
                }}
              >
                Loading…
              </div>
            )}

            {!isLoading && latest.length === 0 && (
              <div
                style={{
                  padding: "36px 18px",
                  textAlign: "center",
                  color: "var(--muted, #6b6860)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>
                  🔔
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  You&apos;re all caught up
                </div>
              </div>
            )}

            {latest.map((n, i) => (
              <PreviewRow
                key={n.id}
                n={n}
                isLast={i === latest.length - 1}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              padding: "14px 18px",
              textAlign: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--gold-deep, #bd7420)",
              textDecoration: "none",
              borderTop: "1px solid var(--border, #ecebe6)",
            }}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────

function PreviewRow({
  n,
  isLast,
  onNavigate,
}: {
  n: NotificationItem;
  isLast: boolean;
  onNavigate: () => void;
}) {
  const { bg, fg, icon } = iconFor(n);

  const inner = (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "14px 18px",
        borderBottom: isLast ? "none" : "1px solid var(--border, #ecebe6)",
        background: !n.is_read ? "rgba(189,116,32,0.05)" : "#fff",
      }}
    >
      {/* Type icon */}
      <div
        style={{
          flex: "0 0 auto",
          width: 34,
          height: 34,
          borderRadius: "9999px",
          background: bg,
          color: fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.35,
            color: "var(--ink, #1f1d18)",
            wordBreak: "break-word",
          }}
        >
          {stripHtml(n.message || n.title)}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#9b988f",
            marginTop: 4,
          }}
        >
          {formatWhen(n.date_iso || n.date)}
        </div>
      </div>

      {/* Unread dot */}
      <div style={{ flex: "0 0 auto", paddingTop: 6 }}>
        {!n.is_read && (
          <span
            style={{
              display: "block",
              width: 8,
              height: 8,
              borderRadius: "9999px",
              background: "var(--gold-deep, #bd7420)",
            }}
          />
        )}
      </div>
    </div>
  );

  if (n.link) {
    const isInternal = n.link.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={n.link}
          onClick={onNavigate}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          {inner}
        </Link>
      );
    }
    return (
      <a
        href={n.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {inner}
      </a>
    );
  }
  return inner;
}
