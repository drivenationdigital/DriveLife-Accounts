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

/**
 * The steps that only make sense where the region can sell tickets.
 * All five hang off ticketing: discounts price tickets, and the three
 * application types are each backed by a hidden ticket.
 */
export const TICKETING_STEP_KEYS: EventCreateStepKey[] = [
  "tickets",
  "discounts",
  "show-cars",
  "car-clubs",
  "traders",
];

/**
 * The steps an event on this region actually has.
 *
 * A listing-only region has no ticketing, so those five steps aren't
 * shown at all rather than shown-and-broken. Both live regions are
 * ticketed now, so every event currently gets all ten steps - this
 * still matters for a site that launches listing-only. They're
 * removed rather than disabled because a disabled step still implies
 * "not yet" - here the answer is "not in this country".
 *
 * Numbering is recomputed so the wizard still reads 1..N with no gaps.
 */
export function visibleSteps(ticketing: boolean): EventCreateStep[] {
  if (ticketing) return EVENT_CREATE_STEPS;
  return EVENT_CREATE_STEPS.filter(
    (s) => !TICKETING_STEP_KEYS.includes(s.key),
  ).map((s, i) => ({ ...s, number: i + 1 }));
}

/** Whether a step key is reachable on this region. */
export function isStepVisible(
  key: string | null | undefined,
  steps: EventCreateStep[] = EVENT_CREATE_STEPS,
): boolean {
  return steps.some((s) => s.key === key);
}

/** Get a step by its key, with fallback to the first visible step. */
export function getStep(
  key: string | null | undefined,
  steps: EventCreateStep[] = EVENT_CREATE_STEPS,
): EventCreateStep {
  const match = steps.find((s) => s.key === key);
  return match ?? steps[0]!;
}

/**
 * Previous/next step keys, or null at the boundary.
 *
 * `steps` is the visible list, so on a listing-only region Gallery's
 * "next" skips the five ticketing steps and lands on Publish rather
 * than walking into a step that isn't rendered.
 */
export function adjacentSteps(
  key: EventCreateStepKey,
  steps: EventCreateStep[] = EVENT_CREATE_STEPS,
): { prev: EventCreateStepKey | null; next: EventCreateStepKey | null } {
  const idx = steps.findIndex((s) => s.key === key);
  return {
    prev: idx > 0 ? steps[idx - 1]!.key : null,
    next: idx >= 0 && idx < steps.length - 1 ? steps[idx + 1]!.key : null,
  };
}
