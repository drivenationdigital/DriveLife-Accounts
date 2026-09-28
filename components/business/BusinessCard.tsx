"use client";

import type { MyBusiness } from "@/lib/myBusinesses";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { regionFromSite } from "@/lib/regions";
import { roleBadgeLabel } from "@/lib/roleBadge";

interface Props {
  business: MyBusiness;
  onClick?: (business: MyBusiness) => void;
}

/** Card for the My Businesses grid - a sibling of VenueCard. */
export function BusinessCard({ business, onClick }: Props) {
  const badgeClass = business.is_published ? "owner" : "unpublished";
  const cats = business.categories.slice(0, 2).map((c) => c.name);
  const extra = business.categories.length - cats.length;

  return (
    <button
      type="button"
      className="business-card"
      onClick={() => onClick?.(business)}
      aria-label={business.title}
    >
      <div className="business-cover">
        {business.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.cover_image}
            alt=""
            loading="lazy"
            className="business-cover-img"
          />
        ) : (
          <div className="business-cover-img business-cover-empty" aria-hidden />
        )}
        <div className="business-cover-scrim" />

        {business.logo && (
          <div className="business-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={business.logo} alt="" className="business-logo" loading="lazy" />
          </div>
        )}

        <div className="business-cover-corner">
          <span className={`business-badge ${badgeClass}`}>
            {roleBadgeLabel(business.badge)}
          </span>
          {business.site && (
            <span className="card-site-badge">
              <CountryFlag
                country={business.site.country}
                label={business.site.label}
              />
              {regionFromSite(business.site).abbr}
            </span>
          )}
        </div>

        {business.traders_directory.member && (
          <span className="business-trader-tag">
            <i className="fa-solid fa-store" aria-hidden /> Event Trader
          </span>
        )}
      </div>

      <div className="business-body">
        <h3 className="business-title">{business.title}</h3>
        {business.tagline && (
          <p className="business-tagline">{business.tagline}</p>
        )}
        {cats.length > 0 && (
          <p className="business-cats">
            {cats.join(" · ")}
            {extra > 0 ? ` +${extra}` : ""}
          </p>
        )}
        <p className="business-location">
          <PinIcon />
          <span>{business.location || "-"}</span>
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
      className="business-pin"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
