"use client";

import { useVenueEdit } from "@/context/VenueEditContext";
import { LocationAutocomplete } from "@/components/event-create/LocationAutocomplete";
import { resolveRegion } from "@/lib/regions";
import { MapPreview } from "@/components/event-create/MapPreview";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { FieldLabel } from "../shared";

const TITLE_MAX = 60;

/**
 * Step 1 - title, country and location.
 *
 * Field rhythm matches the event editor's BasicsPanel: mb-8 between
 * blocks, a live character counter under the title, the read-only
 * country, and a static map preview under the location once
 * coordinates exist.
 */
export function BasicDetailsPanel() {
  const { venue, set, errors, touched, markTouched } = useVenueEdit();

  // A venue belongs to one region, so its address search is limited to
  // that country.
  const region = resolveRegion(venue.site);

  const locationError = Boolean(touched.location && errors.location);

  const coords =
    venue.latitude && venue.longitude
      ? { lat: Number(venue.latitude), lng: Number(venue.longitude) }
      : null;

  return (
    <div>
      {/* Title field. With a live counter row underneath. */}
      <div className="mb-8">
        <FieldLabel required>Venue title</FieldLabel>
        <input
          className={`input text-lg ${
            touched.title && errors.title ? "has-error" : ""
          }`}
          value={venue.title}
          maxLength={TITLE_MAX}
          onChange={(e) => set("title", e.target.value.slice(0, TITLE_MAX))}
          onBlur={() => markTouched("title")}
          placeholder="e.g. Brands Hatch Circuit"
          aria-invalid={Boolean(touched.title && errors.title)}
        />
        <div className="flex justify-between mt-2 text-xs text-ink-500">
          <span>
            {touched.title && errors.title ? (
              <span className="text-red-500">{errors.title}</span>
            ) : (
              "Keep it clear and recognisable"
            )}
          </span>
          <span>
            {venue.title.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      {/* Country - read-only. Chosen on the create screen and fixed
          from then on: a venue lives on one site. Shown rather than
          hidden because it explains why the address search below only
          finds places in one country. */}
      <div className="mb-8">
        <p
          id="f-venue-country-label"
          className="block text-sm font-semibold text-ink-900 mb-2"
        >
          Country
        </p>
        <div
          className="input input-readonly"
          aria-labelledby="f-venue-country-label"
        >
          <CountryFlag country={region.country} label={region.label} />
          <span>{region.label}</span>
        </div>
        <p className="mt-2 text-xs text-ink-500">Country cannot be changed.</p>
      </div>

      {/* Location - Google Places autocomplete + static map preview. */}
      <div className="mb-8">
        <FieldLabel required>Venue location</FieldLabel>
        <LocationAutocomplete
          value={venue.location}
          countries={region.country}
          onValueChange={(text) => set("location", text)}
          onPlacePicked={(place) => {
            set("location", place.address || place.name);
            set("latitude", String(place.coords.lat));
            set("longitude", String(place.coords.lng));
            markTouched("location");
          }}
          placeholder={`Search for the venue address in the ${region.abbr}`}
        />
        {locationError && (
          <p className="mt-2 text-xs text-red-500">{errors.location}</p>
        )}
        <MapPreview coords={coords} />
      </div>
    </div>
  );
}
