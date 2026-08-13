"use client";

import type { MyVenue } from "@/lib/myVenues";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { regionFromSite } from "@/lib/regions";
import { roleBadgeLabel } from "@/lib/roleBadge";

interface Props {
  venue: MyVenue;
  onClick?: (venue: MyVenue) => void;
}

export function VenueCard({ venue, onClick }: Props) {
  const badgeClass = venue.is_published
    ? venue.role === "owner"
      ? "owner"
      : "following"
    : "unpublished";

  return (
    <button
      type="button"
      className="venue-card"
      onClick={() => onClick?.(venue)}
      aria-label={venue.title}
    >
      <div className="venue-cover">
        {venue.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={venue.cover_image}
            alt=""
            loading="lazy"
            className="venue-cover-img"
          />
        ) : (
          <div className="venue-cover-img venue-cover-empty" aria-hidden />
        )}
        <div className="venue-cover-scrim" />

        {venue.logo && (
          <div className="venue-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={venue.logo} alt="" className="venue-logo" loading="lazy" />
          </div>
        )}

        {/* Top-right cluster. The role badge already owned this corner,
            so the region marker sits alongside it rather than on top.
            /my-venues merges both countries when no site filter is
            given, so without the flag a US and a UK venue look alike.
            Account dashboard only - never the public site. */}
        <div className="venue-cover-corner">
          <span className={`venue-badge ${badgeClass}`}>
            {roleBadgeLabel(venue.badge)}
          </span>
          {venue.site && (
            <span className="card-site-badge">
              <CountryFlag
                country={venue.site.country}
                label={venue.site.label}
              />
              {regionFromSite(venue.site).abbr}
            </span>
          )}
        </div>
      </div>

      <div className="venue-body">
        <h3 className="venue-title">{venue.title}</h3>
        <p className="venue-location">
          <PinIcon />
          <span>{venue.location || "-"}</span>
        </p>
      </div>
    </button>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="venue-pin"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
