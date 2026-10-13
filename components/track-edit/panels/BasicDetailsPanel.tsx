"use client";

import { useTrackEdit } from "@/context/TrackEditContext";
import { LocationAutocomplete } from "@/components/event-create/LocationAutocomplete";
import { resolveRegion } from "@/lib/regions";
import { MapPreview } from "@/components/event-create/MapPreview";
import { useTrackOptions } from "@/lib/myTracks";
import { FieldLabel, inputCls } from "../shared";

const TITLE_MAX = 60;

/** Fallback while /track-options is in flight (same list as the API). */
const DEFAULT_TYPES: Array<{ value: string; label: string }> = [
  { value: "race_circuit", label: "Race circuit" },
  { value: "drag_strip", label: "Drag strip" },
  { value: "kart_circuit", label: "Kart circuit" },
  { value: "oval", label: "Oval / speedway" },
  { value: "hill_climb", label: "Hill climb" },
  { value: "sprint", label: "Sprint course" },
  { value: "rally_stage", label: "Rally stage" },
  { value: "drift", label: "Drift track" },
  { value: "off_road", label: "Off-road / 4x4" },
  { value: "airfield", label: "Airfield" },
  { value: "proving_ground", label: "Proving ground / test track" },
  { value: "skid_pan", label: "Skid pan" },
];

/**
 * Step 1 - title, location and the track facts (type, length, noise
 * limit). Same rhythm as the venue editor's BasicDetailsPanel.
 */
export function BasicDetailsPanel() {
  const { track, set, toggleType, errors, touched, markTouched } =
    useTrackEdit();
  const { data: options } = useTrackOptions();
  const types = options?.types?.length ? options.types : DEFAULT_TYPES;

  // A track belongs to one region, so its address search is limited to
  // that country.
  const region = resolveRegion(track.site);

  const locationError = Boolean(touched.location && errors.location);

  const coords =
    track.latitude && track.longitude
      ? { lat: Number(track.latitude), lng: Number(track.longitude) }
      : null;

  return (
    <div>
      {/* Title field. Not a <TextField> because of the counter row. */}
      <div className="mb-8">
        <FieldLabel required>Track name</FieldLabel>
        <input
          className={`input text-lg ${
            touched.title && errors.title ? "has-error" : ""
          }`}
          value={track.title}
          maxLength={TITLE_MAX}
          onChange={(e) => set("title", e.target.value.slice(0, TITLE_MAX))}
          onBlur={() => markTouched("title")}
          placeholder="e.g. Santa Pod Raceway"
          aria-invalid={Boolean(touched.title && errors.title)}
        />
        <div className="flex justify-between mt-2 text-xs text-ink-500">
          <span>
            {touched.title && errors.title ? (
              <span className="text-red-500">{errors.title}</span>
            ) : (
              "Use the name people know it by"
            )}
          </span>
          <span>
            {track.title.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      {/* Location - Google Places autocomplete + static map preview. */}
      <div className="mb-8">
        <FieldLabel required>Track location</FieldLabel>
        <LocationAutocomplete
          value={track.location}
          countries={region.country}
          onValueChange={(text) => set("location", text)}
          onPlacePicked={(place) => {
            set("location", place.address || place.name);
            set("latitude", String(place.coords.lat));
            set("longitude", String(place.coords.lng));
            markTouched("location");
          }}
          placeholder="Search for the track address"
        />
        {locationError && (
          <p className="mt-2 text-xs text-red-500">{errors.location}</p>
        )}
        <MapPreview coords={coords} />
      </div>

      {/* Track types - multi-select chips. */}
      <div className="mb-8">
        <FieldLabel hint="Tick everything that applies - a venue can be a race circuit and a drag strip.">
          Track type
        </FieldLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Track type">
          {types.map((t) => {
            const on = track.trackTypes.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleType(t.value)}
                aria-pressed={on}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  on
                    ? "border-gold-500 bg-gold-500 text-white"
                    : "border-ink-200 bg-white text-ink-700 hover:border-gold-400"
                }`}
              >
                {on && <i className="fa-solid fa-check text-xs" aria-hidden />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="mb-8">
          <FieldLabel hint="Free text, with units.">Track length</FieldLabel>
          <input
            className={inputCls}
            value={track.trackLength}
            onChange={(e) => set("trackLength", e.target.value)}
            placeholder="e.g. 2.43 miles (3.9 km)"
          />
        </div>
        <div className="mb-8">
          <FieldLabel hint="If the track publishes one.">Noise limit</FieldLabel>
          <input
            className={inputCls}
            value={track.noiseLimit}
            onChange={(e) => set("noiseLimit", e.target.value)}
            placeholder="e.g. 105 dB static"
          />
        </div>
      </div>
    </div>
  );
}
