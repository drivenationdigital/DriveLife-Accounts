/**
 * The 4 steps of the venue-edit wizard. Defined once here and re-used by
 * every piece of chrome (sidebar, mobile tab bar, mobile bottom bar) and
 * by the panel router in the edit page.
 *
 * Mirrors `lib/clubEditSteps.ts` and `lib/eventCreateSteps.ts` — the
 * three editors share the same chrome and the same `editor.css`, so
 * keeping the step shape identical means the components stay near-copies
 * of each other rather than drifting apart.
 *
 * `key` is the URL search-param value (`?step=profile`) and the panel
 * lookup key. `mobileLabel` is the abbreviated label for the horizontal
 * mobile tab bar. `title`/`subtitle` feed the shared PanelHeader.
 */
export type VenueEditStepKey = "basic" | "profile" | "description" | "publish";

export type VenueEditStep = {
  key: VenueEditStepKey;
  number: number;
  label: string;
  mobileLabel: string;
  sublabel: string;
  title: string;
  subtitle: string;
};

export const VENUE_EDIT_STEPS: VenueEditStep[] = [
  {
    key: "basic",
    number: 1,
    label: "Basic details",
    mobileLabel: "Basics",
    sublabel: "Title and location",
    title: "Basic details",
    subtitle:
      "The essentials — what the venue is called and where people will find it.",
  },
  {
    key: "profile",
    number: 2,
    label: "Venue profile",
    mobileLabel: "Profile",
    sublabel: "Logo, cover, contact",
    title: "Your venue profile",
    subtitle:
      "The images and contact details visitors see. Photos upload as soon as you pick them.",
  },
  {
    key: "description",
    number: 3,
    label: "Description",
    mobileLabel: "Description",
    sublabel: "About the venue",
    title: "Describe your venue",
    subtitle:
      "Facilities, parking, what makes it worth the drive — anything a visitor would want to know.",
  },
  {
    key: "publish",
    number: 4,
    label: "Publish",
    mobileLabel: "Publish",
    sublabel: "Status & visibility",
    title: "Save and publish",
    subtitle: "Choose whether the venue is visible to everyone.",
  },
];

/** Total step count. Used for "Step N of M" headings + progress bar. */
export const VENUE_EDIT_STEP_COUNT = VENUE_EDIT_STEPS.length;

/** Default step shown when no `?step=` is in the URL. */
export const DEFAULT_VENUE_STEP: VenueEditStepKey = "basic";

/** Get a step by its key, with fallback to the first step. */
export function getVenueStep(key: string | null | undefined): VenueEditStep {
  const match = VENUE_EDIT_STEPS.find((s) => s.key === key);
  return match ?? VENUE_EDIT_STEPS[0]!;
}

/** Get the previous/next step keys, or null at the boundary. */
export function adjacentVenueSteps(key: VenueEditStepKey): {
  prev: VenueEditStepKey | null;
  next: VenueEditStepKey | null;
} {
  const idx = VENUE_EDIT_STEPS.findIndex((s) => s.key === key);
  return {
    prev: idx > 0 ? VENUE_EDIT_STEPS[idx - 1]!.key : null,
    next:
      idx >= 0 && idx < VENUE_EDIT_STEPS.length - 1
        ? VENUE_EDIT_STEPS[idx + 1]!.key
        : null,
  };
}
