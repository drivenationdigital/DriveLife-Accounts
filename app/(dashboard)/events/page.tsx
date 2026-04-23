"use client";

import { useRouter } from "next/navigation";
import { useOrganiserEvents } from "@/lib/queries";
import type { EventRecord } from "@/lib/apiTypes";

export default function MyEventsPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrganiserEvents({ filter_eventtype: 1, filter_eventdate: 1 });

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">My Events</div>
          <div className="section-subtitle">
            {isLoading
              ? "Loading…"
              : data
              ? `${data.count} event${data.count === 1 ? "" : "s"} total`
              : ""}
          </div>
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

        {data && data.count === 0 && (
          <EmptyState
            title={data.empty_state.title}
            content={data.empty_state.content}
          />
        )}

        {data && data.count > 0 && (
          <EventsTable
            events={data.events}
            onRowClick={(ev) => router.push(`/events/${ev.encrypted_id}`)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────

function EventsTable({
  events,
  onRowClick,
}: {
  events: EventRecord[];
  onRowClick: (ev: EventRecord) => void;
}) {
  return (
    <table className="table">
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
              <span className={`pill ${pillForStatus(ev.post_status)}`}>
                {ev.status.label || ev.post_status}
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

function EmptyState({ title, content }: { title: string; content: string }) {
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
