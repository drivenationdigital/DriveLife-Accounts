"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useEventCreate } from "@/context/EventCreateContext";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";
import { useEventCategories } from "@/lib/queries";
import { EVENT_CREATE_STEP_COUNT, adjacentSteps } from "@/lib/eventCreateSteps";

import { PanelHeader } from "../PanelHeader";
import { LocationAutocomplete } from "../LocationAutocomplete";
import { MapPreview } from "../MapPreview";

const TITLE_MAX = 60;

/**
 * Step 1 of the wizard.
 *
 * Fields:
 *   - Event title (text, max 60 chars, with live counter)
 *   - Categories (multi-select grid of custom checkboxes)
 *   - Location: Google Places autocomplete with custom-styled
 *     dropdown, plus a Google Static Maps preview below.
 */
export function BasicsPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Live category list from the WP REST endpoint.
  //
  // Loading model:
  //   - In flight   → render a skeleton grid (avoids the jarring
  //                   "hardcoded → fetched" swap the user used to see).
  //   - Success     → render the live list.
  //   - Error       → fall back to the hardcoded list, log a quiet
  //                   warning. The form stays usable if the endpoint
  //                   isn't deployed yet.
  //
  // Selection state (`state.categoryIds`) is keyed by id, not by
  // reference, so any checked categories survive the source swap
  // intact.
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useEventCategories();

  const liveCategories = categoriesResponse?.categories ?? [];
  const categories =
    liveCategories.length > 0
      ? liveCategories
      : categoriesError
        ? EVENT_CATEGORIES
        : [];

  if (categoriesError) {
    // eslint-disable-next-line no-console
    console.warn(
      "[basics-panel] /event-categories failed; using fallback list",
    );
  }

  const { next } = adjacentSteps("basics");

  const goNext = () => {
    if (!next) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", next);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // The title input is bounded by maxLength but we still gate the
  // dispatch on length - defence-in-depth against paste events that
  // sometimes bypass maxLength on certain mobile keyboards.
  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, TITLE_MAX);
    dispatch({ type: "SET_FIELD", key: "title", value });
  };

  return (
    <section className="panel is-active" data-panel="basics" role="tabpanel">
      <PanelHeader
        stepNumber={1}
        totalSteps={EVENT_CREATE_STEP_COUNT}
        title="Basic details"
        subtitle="The essentials - what your event is called, what type of event it is, and where it takes place."
      />

      {/* Host callout - read-only context, identifies which org the
          event is being created under. Hardcoded to the host on the
          state for now; the create-event flow will pull this from the
          authed user's organisation. */}
      <div className="flex items-center gap-3 p-4 bg-gold-50 border border-gold-200 rounded-xl mb-8">
        <div className="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center">
          <i className="fa-solid fa-mug-hot text-gold-600" aria-hidden />
        </div>
        <div>
          <p className="text-xs text-ink-500">Hosted by</p>
          <p className="font-semibold text-ink-900">{state.hostName}</p>
        </div>
      </div>

      {/* Title field. */}
      <div className="mb-8">
        <label
          htmlFor="f-title"
          className="block text-sm font-semibold text-ink-900 mb-2"
        >
          Event title <span className="text-gold-600">*</span>
        </label>
        <input
          id="f-title"
          type="text"
          maxLength={TITLE_MAX}
          className="input text-lg"
          value={state.title}
          onChange={onTitleChange}
          placeholder="e.g. Summer Supercar Meet 2026"
        />
        <div className="flex justify-between mt-2 text-xs text-ink-500">
          <span>Keep it clear and descriptive</span>
          <span>
            {state.title.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      {/* Categories grid. */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <label className="block text-sm font-semibold text-ink-900">
            Categories
          </label>
          <span className="text-xs text-ink-500">Select all that apply</span>
        </div>
        <div className="bg-white border border-ink-200 rounded-xl p-5 sm:p-6">
          {categoriesLoading ? (
            <CategoriesSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
              {categories.map((cat) => {
                const checked = state.categoryIds.includes(cat.id);
                return (
                  <label key={cat.id} className="cb-label">
                    <input
                      type="checkbox"
                      value={cat.id}
                      checked={checked}
                      onChange={() =>
                        dispatch({ type: "TOGGLE_CATEGORY", id: cat.id })
                      }
                    />
                    <span className="cb-box" />
                    <span className="cb-text">{cat.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Location - Google Places autocomplete + static map preview. */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-ink-900 mb-2">
          Event location <span className="text-gold-600">*</span>
        </label>
        <LocationAutocomplete
          value={state.location}
          placeholder="Search for a venue or address"
          onValueChange={(text) =>
            dispatch({ type: "SET_FIELD", key: "location", value: text })
          }
          onPlacePicked={(place) => {
            // Picking a place commits both the formatted text and the
            // coords in one go. We dispatch sequentially because the
            // SET_FIELD action is per-key - fine in React batching.
            dispatch({
              type: "SET_FIELD",
              key: "location",
              value:
                place.address &&
                place.name &&
                !place.address
                  .toLowerCase()
                  .startsWith(place.name.toLowerCase())
                  ? `${place.name}, ${place.address}`
                  : place.address,
            });
            dispatch({
              type: "SET_FIELD",
              key: "locationCoords",
              value: place.coords,
            });
          }}
        />
        <MapPreview coords={state.locationCoords} />
      </div>

      {/* Desktop "Continue" CTA. Mobile uses the sticky bottom bar
          instead - this row is hidden under the sm breakpoint. */}
      <div className="hidden sm:flex items-center justify-end gap-3 pt-6 border-t border-ink-200">
        <button
          type="button"
          onClick={goNext}
          className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      </div>
    </section>
  );
}

/**
 * Loading placeholder for the categories grid.
 *
 * Renders 14 rows (matching the 7 × 2 visual rhythm the live grid
 * produces on sm+ screens - ≤ 21 categories total, so 14 fills the
 * box without obviously over-counting). Each row mirrors the
 * .cb-label layout: a 20×20 box on the left, an irregular-width
 * label bar on the right.
 *
 * The varied bar widths come from cycling a small sequence - purely
 * cosmetic, makes the placeholder feel less mechanical than uniform
 * bars. Deterministic (no Math.random) so SSR + client render match.
 */
function CategoriesSkeleton() {
  const widths = ["w-32", "w-44", "w-28", "w-40", "w-36", "w-48", "w-24"];
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0"
      aria-hidden
    >
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <span className="skeleton-shimmer w-5 h-5 rounded-md" />
          <span
            className={`skeleton-shimmer h-3.5 ${widths[i % widths.length]}`}
          />
        </div>
      ))}
    </div>
  );
}
