"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  useNotifications,
  useMarkNotificationsRead,
  type NotificationItem,
} from "@/lib/notifications";
import { iconFor, stripHtml, formatWhen } from "@/lib/notificationIcons";

/**
 * Notifications screen.
 *
 * Lists every notification newest-first; unread ones are highlighted.
 * Opening the screen auto-marks everything read (once), so the bell
 * badge clears - but the just-read items stay visually flagged for this
 * view via a snapshot taken before the mark, so the user can still see
 * what was new.
 *
 * Inline styles on the layout-critical bits so it renders correctly
 * regardless of whether the app's global CSS is present.
 */
export default function NotificationsPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();

  const markRead = useMarkNotificationsRead();

  const items = useMemo<NotificationItem[]>(
    () => (data ? data.pages.flatMap((p) => p.notifications) : []),
    [data],
  );

  const unreadCount = data?.pages[0]?.unread_count ?? 0;

  // Snapshot which ids were unread on first load, so they stay
  // highlighted for this session even after we auto-mark them read.
  // This is render-derived state (not a ref): we compute it once, the
  // first time data arrives, and commit it during render.
  const [initiallyUnread, setInitiallyUnread] = useState<Set<number> | null>(
    null,
  );
  if (initiallyUnread === null && data) {
    setInitiallyUnread(
      new Set(items.filter((n) => !n.is_read).map((n) => n.id)),
    );
  }

  // Auto-mark-all-read once, when the screen first has unread items.
  const didAutoMark = useRef(false);
  useEffect(() => {
    if (didAutoMark.current) return;
    if (!data) return;
    if (unreadCount > 0) {
      didAutoMark.current = true;
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, unreadCount]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="page-title">Notifications</h1>
        {initiallyUnread && initiallyUnread.size > 0 && (
          <span className="text-sm text-ink-400">
            {initiallyUnread.size} new
          </span>
        )}
      </div>

      {isLoading && !data && <NotificationsSkeleton />}

      {error && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-ink-100">
          <p className="text-sm font-semibold text-red-500">
            Couldn&apos;t load your notifications.
          </p>
          <p className="mt-1 text-sm text-ink-500">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-ink-100">
          <div
            aria-hidden
            style={{
              fontSize: 40,
              lineHeight: 1,
              marginBottom: 12,
              opacity: 0.5,
            }}
          >
            🔔
          </div>
          <p className="text-sm font-semibold text-ink-700">
            You&apos;re all caught up
          </p>
          <p className="mt-1 text-sm text-ink-400">
            New notifications will show up here.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div
          className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100"
          style={{ display: "flex", flexDirection: "column" }}
        >
          {items.map((n, i) => (
            <NotificationRow
              key={n.id}
              n={n}
              wasUnread={initiallyUnread?.has(n.id) ?? false}
              isLast={i === items.length - 1}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-xl border border-ink-200 bg-white px-6 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────

function NotificationRow({
  n,
  wasUnread,
  isLast,
}: {
  n: NotificationItem;
  wasUnread: boolean;
  isLast: boolean;
}) {
  const { bg, fg, icon } = iconFor(n);

  const body = (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "16px 20px",
        borderBottom: isLast ? "none" : "1px solid var(--border, #ecebe6)",
        background: wasUnread ? "rgba(189,116,32,0.06)" : "transparent",
      }}
    >
      {/* Type icon */}
      <div
        style={{
          flex: "0 0 auto",
          width: 38,
          height: 38,
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

      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        {n.title && (
          <div
            style={{
              fontWeight: wasUnread ? 700 : 600,
              fontSize: 14,
              color: "var(--ink, #1f1d18)",
            }}
          >
            {n.title}
          </div>
        )}
        {/* Legacy messages may contain HTML; render as plain text. */}
        <div
          style={{
            fontSize: 14,
            color: "var(--muted, #6b6860)",
            marginTop: n.title ? 2 : 0,
            wordBreak: "break-word",
          }}
        >
          {stripHtml(n.message)}
        </div>
        <div style={{ fontSize: 12, color: "#9b988f", marginTop: 6 }}>
          {formatWhen(n.date_iso || n.date)}
        </div>
      </div>

      {/* Unread dot */}
      <div style={{ width: 8, paddingTop: 6, flex: "0 0 auto" }}>
        {wasUnread && (
          <span
            aria-label="Unread"
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

  // Whole row is a link when the notification points somewhere.
  if (n.link) {
    // Internal links via Next router; external via anchor.
    const isInternal = n.link.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={n.link}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          {body}
        </Link>
      );
    }
    return (
      <a
        href={n.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {body}
      </a>
    );
  }

  return body;
}

// ─── Skeleton ─────────────────────────────────────────────────────────

/** Shimmer placeholder shown while the first page loads. */
function NotificationsSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100"
      aria-busy="true"
      aria-label="Loading notifications"
    >
      <style>{`
        @keyframes ntfShimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            padding: "16px 20px",
            borderBottom: i === 4 ? "none" : "1px solid var(--border, #ecebe6)",
          }}
        >
          <SkelBlock width={38} height={38} radius="9999px" />
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <SkelBlock width="55%" height={13} />
            <div style={{ height: 8 }} />
            <SkelBlock width="85%" height={12} />
            <div style={{ height: 8 }} />
            <SkelBlock width={80} height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkelBlock({
  width,
  height,
  radius = "6px",
}: {
  width: number | string;
  height: number;
  radius?: string;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, #eeece7 25%, #f6f5f2 37%, #eeece7 63%)",
        backgroundSize: "800px 100%",
        animation: "ntfShimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}
