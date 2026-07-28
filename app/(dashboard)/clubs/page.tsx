"use client";

import { useState } from "react";
import { CardGridSkeleton } from "@/components/ui/CardGridSkeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClubCard } from "@/components/club/ClubCard";
import { useMyClubs, type MyClub } from "@/lib/myClubs";

export default function MyClubsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isPlaceholderData } = useMyClubs(page);

  const clubs = data?.clubs ?? [];
  const pagination = data?.pagination;

  const openClub = (club: MyClub) => {
    // Owners and admins can edit (club-update allows both). Members and
    // followers can't, so they open the public club page instead.
    if (club.role === "owner" || club.role === "admin") {
      router.push(`/club/${club.encrypted_id}/edit`);
    } else if (club.permalink) {
      window.open(club.permalink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="my-clubs">
      <header className="mc-header">
        <h1 className="mc-title">My Clubs</h1>
        <Link href="/clubs/create" className="mc-create-btn">
          + Create Club
        </Link>
      </header>

      {error && (
        <div className="mc-state error">
          Couldn’t load your clubs. {error.message}
        </div>
      )}

      {isLoading && !data && <CardGridSkeleton variant="media" count={6} />}

      {!isLoading && clubs.length === 0 && !error && (
        <div className="mc-state">
          You’re not part of any clubs yet. Create one to get started.
        </div>
      )}

      {clubs.length > 0 && (
        <div
          className="mc-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
            alignItems: "start",
            opacity: isPlaceholderData ? 0.6 : 1,
          }}
        >
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} onClick={openClub} />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="mc-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            disabled={page <= 1 || isPlaceholderData}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <span className="mc-page-indicator">
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
