"use client";

import { useClubEdit } from "@/context/ClubEditContext";
import { LocationAutocomplete } from "@/components/event-create/LocationAutocomplete";
import { FieldLabel, inputCls, selectCls } from "../shared";
import type { ClubLocationType } from "@/lib/clubEditTypes";

const TITLE_MAX = 60;

/**
 * Step 1 - title, categories, location type (+ address when regional).
 *
 * Field rhythm matches the event editor's BasicsPanel: mb-8 between
 * blocks, a live character counter under the title, and the categories
 * grid in a white bordered box using the editor's `.cb-label` checkboxes.
 */
export function BasicDetailsPanel() {
  const { club, categories, setField, toggleCategory, setAllCategories } =
    useClubEdit();

  const allSelected =
    categories.length > 0 && club.categoryIds.length === categories.length;

  return (
    <div>
      {/* Title field. */}
      <div className="mb-8">
        <FieldLabel required>Club title</FieldLabel>
        <input
          className={`${inputCls} text-lg`}
          value={club.title}
          maxLength={TITLE_MAX}
          onChange={(e) =>
            setField("title", e.target.value.slice(0, TITLE_MAX))
          }
          placeholder="e.g. Kent Classic Car Club"
        />
        <div className="flex justify-between mt-2 text-xs text-ink-500">
          <span>Keep it clear and recognisable</span>
          <span>
            {club.title.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      {/* Categories grid. */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <label className="block text-sm font-semibold text-ink-900">
            Categories
          </label>
          <button
            type="button"
            onClick={() => setAllCategories(!allSelected)}
            className="text-xs font-semibold text-gold-600 hover:text-gold-700 transition"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="bg-white border border-ink-200 rounded-xl p-5 sm:p-6">
          {categories.length === 0 ? (
            <p className="text-sm text-ink-500">No categories available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
              {categories.map((cat) => (
                <label key={cat.id} className="cb-label">
                  <input
                    type="checkbox"
                    value={cat.id}
                    checked={club.categoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  <span className="cb-box" />
                  <span className="cb-text">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location. */}
      <div className="mb-8">
        <FieldLabel required>Club location</FieldLabel>
        <select
          className={selectCls}
          value={club.locationType}
          onChange={(e) =>
            setField("locationType", e.target.value as ClubLocationType)
          }
        >
          <option value="1">National club</option>
          <option value="2">Local / regional club</option>
        </select>

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
