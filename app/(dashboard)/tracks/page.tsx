"use client";

import { useState } from "react";
import { CardGridSkeleton } from "@/components/ui/CardGridSkeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrackCard } from "@/components/track/TrackCard";
import { useMyTracks, type MyTrack } from "@/lib/myTracks";
import { trackEditPath } from "@/lib/siteRoutes";

/**
 * My Tracks - tracks & circuits the user owns or follows. Mirrors the
 * My Venues page (same CSS classes, same pagination).
 */
export default function MyTracksPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isPlaceholderData } = useMyTracks(page);

  const tracks = data?.tracks ?? [];
  const pagination = data?.pagination;

  const openTrack = (track: MyTrack) => {
    // Only owners can edit. Followers open the public track page (in a
    // new tab) rather than the edit wizard, which they can't access.
    if (track.role === "owner") {
      router.push(trackEditPath(track.encrypted_id, track.site?.key));
    } else if (track.permalink) {
      window.open(track.permalink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="my-venues my-tracks">
      <header className="mv-header">
        <div className="mv-header-text">
          <h1 className="mv-title">My Tracks &amp; Circuits</h1>
          <p className="mv-sub">
            Race circuits, drag strips and tracks you manage or follow
          </p>
        </div>
        <Link href="/track/create" className="mv-create-btn">
          + Add Track
        </Link>
      </header>

      {error && (
        <div className="mv-state error">
          Couldn’t load your tracks. {error.message}
        </div>
      )}

      {isLoading && !data && <CardGridSkeleton variant="media" count={6} />}

      {!isLoading && tracks.length === 0 && !error && (
        <div className="mv-state">
          You’re not managing or following any tracks yet. Add one and it
          becomes a “Hosted by” option when you create an event.
        </div>
      )}

      {tracks.length > 0 && (
        <div
          className="mv-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
            alignItems: "stretch",
            opacity: isPlaceholderData ? 0.6 : 1,
          }}
        >
          {tracks.map((track) => (
            <TrackCard
              key={`${track.site?.key ?? ""}:${track.id}`}
              track={track}
              onClick={openTrack}
            />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="mv-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            disabled={page <= 1 || isPlaceholderData}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <span className="mv-page-indicator">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            disabled={!pagination.has_more || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
