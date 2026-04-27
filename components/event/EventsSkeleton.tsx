"use client";

/**
 * Loading skeletons that match the actual rendered shapes — grid cards
 * and table rows — so the layout doesn't jump when real data arrives.
 *
 * Shimmer styles live alongside the components in globals.css under
 * `.events-page .skeleton-*`.
 */

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="event-grid" aria-busy="true" aria-label="Loading events">
      {Array.from({ length: count }).map((_, i) => (
        <div className="ev-card skeleton-card" key={i}>
          <div className="ev-cover skeleton-shimmer" />
          <div className="ev-body">
            <div className="skeleton-line skeleton-shimmer" style={{ width: "80%", height: 22 }} />
            <div className="ev-meta">
              <div className="skeleton-line skeleton-shimmer" style={{ width: "60%", height: 13 }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: "45%", height: 13 }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: "75%", height: 13 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="events-table-wrap" aria-busy="true" aria-label="Loading events">
      <div className="events-table-scroll">
        <table className="events-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="skeleton-row">
                <td>
                  <div className="tbl-event-cell">
                    <div className="tbl-thumb skeleton-shimmer" />
                    <div className="tbl-event-text" style={{ minWidth: 0, flex: 1 }}>
                      <div
                        className="skeleton-line skeleton-shimmer"
                        style={{ width: "70%", height: 16, marginBottom: 6 }}
                      />
                      <div
                        className="skeleton-line skeleton-shimmer"
                        style={{ width: "50%", height: 12 }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div
                    className="skeleton-line skeleton-shimmer"
                    style={{ width: 180, height: 13 }}
                  />
                </td>
                <td>
                  <div
                    className="skeleton-line skeleton-shimmer"
                    style={{ width: 60, height: 18, borderRadius: 20 }}
                  />
                </td>
                <td>
                  <div
                    className="skeleton-line skeleton-shimmer"
                    style={{ width: 80, height: 18, borderRadius: 20 }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
