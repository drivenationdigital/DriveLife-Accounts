"use client";

import type { MyTrack } from "@/lib/myTracks";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { regionFromSite } from "@/lib/regions";
import { roleBadgeLabel } from "@/lib/roleBadge";

interface Props {
  track: MyTrack;
  onClick?: (track: MyTrack) => void;
}

/**
 * Card for the My Tracks grid. Reuses the venue card's CSS classes
 * (globals.css `.venue-card` block) so the two lists look identical;
 * the only addition is the track-type line under the title.
 */
export function TrackCard({ track, onClick }: Props) {
  const badgeClass = track.is_published
    ? track.role === "owner"
      ? "owner"
      : "following"
    : "unpublished";

  const types = track.track_types?.slice(0, 3) ?? [];

  return (
    <button
      type="button"
      className="venue-card track-card"
      onClick={() => onClick?.(track)}
      aria-label={track.title}
    >
      <div className="venue-cover">
        {track.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.cover_image}
            alt=""
            loading="lazy"
            className="venue-cover-img"
          />
        ) : (
          <div className="venue-cover-img venue-cover-empty" aria-hidden />
        )}
        <div className="venue-cover-scrim" />

        {track.logo && (
          <div className="venue-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={track.logo} alt="" className="venue-logo" loading="lazy" />
          </div>
        )}

        <div className="venue-cover-corner">
          <span className={`venue-badge ${badgeClass}`}>
            {roleBadgeLabel(track.badge)}
          </span>
          {track.site && (
            <span className="card-site-badge">
              <CountryFlag
                country={track.site.country}
                label={track.site.label}
              />
              {regionFromSite(track.site).abbr}
            </span>
          )}
        </div>
      </div>

      <div className="venue-body">
        <h3 className="venue-title">{track.title}</h3>
        {types.length > 0 && (
          <p className="track-card-types">{types.join(" · ")}</p>
        )}
        <p className="venue-location">
          <PinIcon />
          <span>{track.location || "-"}</span>
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
