"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useOrganiserEvents } from "@/lib/queries";
import type { EventRecord } from "@/lib/apiTypes";
import { Pagination } from "@/components/ui/Pagination";

const PER_PAGE = 20;

export default function MyEventsPage() {
  // Suspense boundary is required because EventsList reads searchParams.
  return (
    <Suspense fallback={<LoadingRow />}>
      <EventsList />
    </Suspense>
  );
}

function EventsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, parseInt(searchParams?.get("page") ?? "1", 10) || 1);

  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } =
    useOrganiserEvents({
      filter_eventtype: 1,
      filter_eventdate: 1,
      page,
      per_page: PER_PAGE,
    });

  const setPage = (next: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(next));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // Scroll to top on page change so the user sees the new page's first row.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">My Events</div>
          <div className="section-subtitle">{buildSubtitle(data, isLoading, page)}</div>
        </div>
      </div>

      <div className="section-body flush">
        {isLoading && <LoadingRow />}

        {isError && (
          <ErrorRow
            message={(error as Error)?.message ?? "Failed to load events"}
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        )}

        {data && data.pagination.total === 0 && (
          <EmptyState
            title={data.empty_state?.title}
            content={data.empty_state?.content}
          />
        )}

        {data && data.pagination.total > 0 && (
          <>
            <EventsTable
              events={data.events}
              dimmed={isPlaceholderData}
              onRowClick={(ev) => router.push(`/events/${ev.encrypted_id}`)}
            />
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.total_pages}
              onPageChange={setPage}
              disabled={isFetching}
            />
          </>
        )}
      </div>
    </div>
  );
}

function buildSubtitle(
  data: { pagination: { total: number; page: number; per_page: number } } | undefined,
  isLoading: boolean,
  page: number
): string {
  if (isLoading) return "Loading…";
  if (!data) return "";
  const { total, per_page } = data.pagination;
  if (total === 0) return "0 events";
  const first = (page - 1) * per_page + 1;
  const last = Math.min(page * per_page, total);
  return `Showing ${first}–${last} of ${total} event${total === 1 ? "" : "s"}`;
}

// ─── Table ────────────────────────────────────────────────────────────

function EventsTable({
  events,
  onRowClick,
  dimmed,
}: {
  events: EventRecord[];
  onRowClick: (ev: EventRecord) => void;
  dimmed?: boolean;
}) {
  return (
    <table
      className="table"
      style={{ opacity: dimmed ? 0.55 : 1, transition: "opacity 120ms" }}
    >
      <thead>
        <tr>
          <th>Event</th>
          <th>Date</th>
          <th>Status</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {events.map((ev) => (
          <tr
            key={ev.id}
            onClick={() => onRowClick(ev)}
            style={{ cursor: "pointer" }}
          >
            <td>
              <div className="customer-name">
                {ev.is_pinned && (
                  <span style={{ color: "var(--gold)", marginRight: 6 }}>★</span>
                )}
                {ev.title}
              </div>
            </td>
            <td style={{ color: "var(--muted)", fontSize: "12.5px" }}>
              {formatDateCell(ev)}
            </td>
            <td>
              <span className={`pill capitalize ${pillForStatus(ev.post_status)}`}>
                {ev.post_status}
              </span>
            </td>
            <td style={{ color: "var(--muted)", fontSize: "12.5px" }}>
              {ev.post_type === "club_events" ? "Club event" : "Event"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── State rows ───────────────────────────────────────────────────────

function LoadingRow() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      Loading your events…
    </div>
  );
}

function ErrorRow({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ color: "var(--danger)", marginBottom: 12 }}>{message}</div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onRetry}
        disabled={retrying}
      >
        {retrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}

function EmptyState({
  title,
  content,
}: {
  title?: string;
  content?: string;
}) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          marginBottom: 8,
        }}
      >
        {title || "No events yet"}
      </h3>
      <p style={{ color: "var(--muted)" }}>
        {content || "Create your first event to get started."}
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDateCell(ev: EventRecord): string {
  if (ev.is_recurring && ev.recurring) return ev.recurring.display || "Recurring";

  const first = ev.first_date?.start_date;
  const last = ev.last_date?.end_date ?? ev.last_date?.start_date;
  if (!first) return "—";

  if (!last || first === last) return formatDate(first);
  return `${formatDate(first)} — ${formatDate(last)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function pillForStatus(postStatus: string): "paid" | "pending" | "refunded" {
  switch (postStatus) {
    case "publish":
      return "paid";
    case "future":
    case "draft":
      return "pending";
    case "cancelled":
      return "refunded";
    default:
      return "pending";
  }
}
