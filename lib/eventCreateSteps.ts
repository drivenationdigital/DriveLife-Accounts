/**
 * The 10 steps of the event-create wizard. Defined once here and re-used
 * by every piece of chrome (sidebar, mobile tab bar, mobile bottom bar)
 * and by the panel router in the orchestrator page.
 *
 * `key` is the URL search-param value (`?step=basics`) and the panel
 * lookup key. `mobileLabel` is the abbreviated label used in the
 * horizontal mobile tab bar where space is tight.
 */
export type EventCreateStepKey =
  | "basics"
  | "dates"
  | "description"
  | "gallery"
  | "tickets"
  | "discounts"
  | "show-cars"
  | "car-clubs"
  | "traders"
  | "publish";

export type EventCreateStep = {
  key: EventCreateStepKey;
  number: number;
  label: string;
  mobileLabel: string;
  sublabel: string;
};

export const EVENT_CREATE_STEPS: EventCreateStep[] = [
  {
    key: "basics",
    number: 1,
    label: "Basics",
    mobileLabel: "Basics",
    sublabel: "Title, categories, location",
  },
  {
    key: "dates",
    number: 2,
    label: "Dates & times",
    mobileLabel: "Dates",
    sublabel: "Schedule, timezone",
  },
  {
    key: "description",
    number: 3,
    label: "Description",
    mobileLabel: "Description",
    sublabel: "Cover, copy, links",
  },
  {
    key: "gallery",
    number: 4,
    label: "Gallery",
    mobileLabel: "Gallery",
    sublabel: "Photos & media",
  },
  {
    key: "tickets",
    number: 5,
    label: "Tickets & entry",
    mobileLabel: "Tickets",
    sublabel: "Pricing & options",
  },
  {
    key: "discounts",
    number: 6,
    label: "Discounts & upsells",
    mobileLabel: "Discounts",
    sublabel: "Promo codes & offers",
  },
  {
    key: "show-cars",
    number: 7,
    label: "Show cars",
    mobileLabel: "Show cars",
    sublabel: "Applications & categories",
  },
  {
    key: "car-clubs",
    number: 8,
    label: "Car clubs",
    mobileLabel: "Car clubs",
    sublabel: "Club applications",
  },
  {
    key: "traders",
    number: 9,
    label: "Traders",
    mobileLabel: "Traders",
    sublabel: "Trade applications",
  },
  {
    key: "publish",
    number: 10,
    label: "Publish",
    mobileLabel: "Publish",
    sublabel: "Status & visibility",
  },
];

/** Total step count. Useful for "Step N of M" headings + progress bar. */
export const EVENT_CREATE_STEP_COUNT = EVENT_CREATE_STEPS.length;

/** Default step shown when no `?step=` is in the URL. */
export const DEFAULT_STEP: EventCreateStepKey = "basics";

/** Get a step by its key, with fallback to the default step. */
export function getStep(key: string | null | undefined): EventCreateStep {
  const match = EVENT_CREATE_STEPS.find((s) => s.key === key);
  return match ?? EVENT_CREATE_STEPS[0]!;
}

/** Get the previous/next step keys, or null at the boundary. */
export function adjacentSteps(
  key: EventCreateStepKey,
): { prev: EventCreateStepKey | null; next: EventCreateStepKey | null } {
  const idx = EVENT_CREATE_STEPS.findIndex((s) => s.key === key);
  return {
    prev: idx > 0 ? EVENT_CREATE_STEPS[idx - 1]!.key : null,
    next: idx >= 0 && idx < EVENT_CREATE_STEPS.length - 1 ? EVENT_CREATE_STEPS[idx + 1]!.key : null,
  };
}
