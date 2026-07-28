"use client";

import { useState } from "react";
import { CardGridSkeleton } from "@/components/ui/CardGridSkeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VenueCard } from "@/components/venue/VenueCard";
import { useMyVenues, type MyVenue } from "@/lib/myVenues";

export default function MyVenuesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isPlaceholderData } = useMyVenues(page);

  const venues = data?.venues ?? [];
  const pagination = data?.pagination;

  const openVenue = (venue: MyVenue) => {
    // Only owners can edit. Followers open the public venue page (in a
    // new tab) rather than the edit wizard, which they can't access.
    if (venue.role === "owner") {
      router.push(`/venue/${venue.encrypted_id}/edit`);
    } else if (venue.permalink) {
      window.open(venue.permalink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="my-venues">
      <header className="mv-header">
        <h1 className="mv-title">My Venues</h1>
        <Link href="/venue/create" className="mv-create-btn">
          + Create Venue
        </Link>
      </header>

      {error && (
        <div className="mv-state error">
          Couldn’t load your venues. {error.message}
        </div>
      )}

      {isLoading && !data && <CardGridSkeleton variant="media" count={6} />}

      {!isLoading && venues.length === 0 && !error && (
        <div className="mv-state">
          You’re not following or managing any venues yet.
        </div>
      )}

      {venues.length > 0 && (
        <div
          className="mv-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
            alignItems: "start",
            opacity: isPlaceholderData ? 0.6 : 1,
          }}
        >
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} onClick={openVenue} />
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
