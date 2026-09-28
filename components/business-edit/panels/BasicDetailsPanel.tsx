"use client";

import { useBusinessEdit } from "@/context/BusinessEditContext";
import { useBusinessOptions } from "@/lib/myBusinesses";
import { FieldLabel, inputCls, selectCls } from "../shared";

const TITLE_MAX = 60;
const TAGLINE_MAX = 140;

/**
 * Step 1 - name, tagline, country and categories.
 *
 * Categories and the country list come from /business-options (the
 * taxonomy terms + the theme's country table) so wp-admin additions
 * show up without a release.
 */
export function BasicDetailsPanel() {
  const {
    business,
    set,
    errors,
    touched,
    markTouched,
    toggleCategory,
    setCategories,
  } = useBusinessEdit();
  const options = useBusinessOptions(business.site);

  const categories = options.data?.categories ?? [];
  const countries = options.data?.countries ?? [];
  const allSelected =
    categories.length > 0 && business.categories.length === categories.length;

  return (
    <div>
      {/* Name */}
      <div className="mb-8">
        <FieldLabel required>Business name</FieldLabel>
        <input
          className={`input text-lg ${
            touched.title && errors.title ? "has-error" : ""
          }`}
          value={business.title}
          maxLength={TITLE_MAX}
          onChange={(e) => set("title", e.target.value.slice(0, TITLE_MAX))}
          onBlur={() => markTouched("title")}
          placeholder="e.g. Kent Detailing Co."
          aria-invalid={Boolean(touched.title && errors.title)}
        />
        <div className="flex justify-between mt-2 text-xs text-ink-500">
          <span>
            {touched.title && errors.title ? (
              <span className="text-red-500">{errors.title}</span>
            ) : (
              "Your trading name, as customers know it"
            )}
          </span>
          <span>
            {business.title.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      {/* Tagline */}
      <div className="mb-8">
        <FieldLabel hint="One line shown on directory cards under your name.">
          Tagline
        </FieldLabel>
        <input
          className={inputCls}
          value={business.tagline}
          maxLength={TAGLINE_MAX}
          onChange={(e) => set("tagline", e.target.value.slice(0, TAGLINE_MAX))}
          placeholder="e.g. Ceramic coatings and paint correction specialists"
        />
        <div className="flex justify-end mt-2 text-xs text-ink-500">
          <span>
            {business.tagline.length}/{TAGLINE_MAX}
          </span>
        </div>
      </div>

      {/* Country */}
      <div className="mb-8">
        <FieldLabel>Country</FieldLabel>
        <select
          className={selectCls}
          value={business.country}
          onChange={(e) => set("country", e.target.value)}
          disabled={options.isLoading && countries.length === 0}
        >
          {countries.length === 0 && (
            <option value={business.country}>{business.country}</option>
          )}
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <label className="block text-sm font-semibold text-ink-900">
            Categories
          </label>
          <button
            type="button"
            onClick={() =>
              setCategories(allSelected ? [] : categories.map((c) => c.slug))
            }
            className="text-xs font-semibold text-gold-600 hover:text-gold-700 transition"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        <p className="-mt-2 mb-3 text-xs text-ink-500">
          Tick everything you do - customers filter the directory by category.
        </p>
        <div className="bg-white border border-ink-200 rounded-xl p-5 sm:p-6">
          {options.isLoading && categories.length === 0 ? (
            <p className="text-sm text-ink-500">Loading categories…</p>
          ) : options.error ? (
            <p className="text-sm text-red-500">
              Couldn’t load the categories. {options.error.message}
            </p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-ink-500">No categories available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
              {categories.map((cat) => (
                <label key={cat.slug} className="cb-label">
                  <input
                    type="checkbox"
                    value={cat.slug}
                    checked={business.categories.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                  />
                  <span className="cb-box" />
                  <span className="cb-text">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
