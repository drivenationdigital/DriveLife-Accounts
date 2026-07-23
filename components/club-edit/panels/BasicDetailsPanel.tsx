"use client";

import { useClubEdit } from "@/context/ClubEditContext";
import { LocationAutocomplete } from "@/components/event-create/LocationAutocomplete";
import { FieldLabel, Divider, inputCls } from "../shared";
import type { ClubLocationType } from "@/lib/clubEditTypes";

/** Step 1 — title, categories, location type (+ address when regional). */
export function BasicDetailsPanel() {
  const { club, categories, setField, toggleCategory, setAllCategories } =
    useClubEdit();

  const allSelected =
    categories.length > 0 && club.categoryIds.length === categories.length;

  return (
    <div className="space-y-8">
      <div>
        <FieldLabel required>Club Title</FieldLabel>
        <input
          className={inputCls}
          value={club.title}
          maxLength={60}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Club title"
        />
        <p className="mt-1 text-right text-xs text-ink-400">
          Max 60 characters
        </p>
      </div>

      <Divider />

      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-sm font-bold text-ink-900">Categories</span>
          <button
            type="button"
            onClick={() => setAllCategories(!allSelected)}
            className="text-xs font-semibold text-gold-600 underline underline-offset-2 hover:text-gold-700"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-ink-400">No categories available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300 accent-gold-500"
                  checked={club.categoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <Divider />

      <div>
        <FieldLabel required>Club Location</FieldLabel>
        <div className="relative">
          <select
            className={`${inputCls} appearance-none pr-10`}
            value={club.locationType}
            onChange={(e) =>
              setField("locationType", e.target.value as ClubLocationType)
            }
          >
            <option value="1">National Club</option>
            <option value="2">Local/Regional Club</option>
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400">
            ▾
          </span>
        </div>

        {/* Regional clubs need an actual place. */}
        {club.locationType === "2" && (
          <div className="mt-4">
            <FieldLabel required>Where are you based?</FieldLabel>
            <LocationAutocomplete
              value={club.location}
              onValueChange={(text) => setField("location", text)}
              onPlacePicked={(place) => {
                setField("location", place.address || place.name);
                setField("latitude", String(place.coords.lat));
                setField("longitude", String(place.coords.lng));
              }}
              placeholder="Search for a town or city"
            />
          </div>
        )}
      </div>
    </div>
  );
}
