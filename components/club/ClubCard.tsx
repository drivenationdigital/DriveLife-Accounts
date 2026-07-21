"use client";

import type { MyClub } from "@/lib/myClubs";

interface Props {
  club: MyClub;
  onClick?: (club: MyClub) => void;
}

export function ClubCard({ club, onClick }: Props) {
  const meta = [
    `${club.member_count} member${club.member_count === 1 ? "" : "s"}`,
    club.category,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <button
      type="button"
      className="club-card"
      onClick={() => onClick?.(club)}
      aria-label={club.title}
    >
      <div className="club-cover">
        {club.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={club.cover_image}
            alt=""
            loading="lazy"
            className="club-cover-img"
          />
        ) : (
          <div className="club-cover-img club-cover-empty" aria-hidden />
        )}
        <div className="club-cover-scrim" />

        {/* Centered logo overlay */}
        {club.logo && (
          <div className="club-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={club.logo} alt="" className="club-logo" loading="lazy" />
          </div>
        )}

        {/* Corner badge: Unpublished / role */}
        <span
          className={`club-badge${club.is_published ? " role" : " unpublished"}`}
        >
          {club.badge}
        </span>
      </div>

      <div className="club-body">
        <h3 className="club-title">{club.title}</h3>
        <p className="club-meta">{meta}</p>
      </div>
    </button>
  );
}
