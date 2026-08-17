"use client";

import type { MyClub } from "@/lib/myClubs";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { regionFromSite } from "@/lib/regions";
import { roleBadgeLabel } from "@/lib/roleBadge";

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

        {/* Top-right cluster: Unpublished / role badge, plus the
            region. /my-clubs merges both countries when no site filter
            is given, so without the flag a US and a UK club look alike.
            Account dashboard only - never the public site. */}
        <div className="club-cover-corner">
          <span
            className={`club-badge${club.is_published ? " role" : " unpublished"}`}
          >
            {roleBadgeLabel(club.badge)}
          </span>
          {club.site && (
            <span className="card-site-badge">
              <CountryFlag
                country={club.site.country}
                label={club.site.label}
              />
              {regionFromSite(club.site).abbr}
            </span>
          )}
        </div>
      </div>

      <div className="club-body">
        <h3 className="club-title">{club.title}</h3>
        <p className="club-meta">{meta}</p>
      </div>
    </button>
  );
}
