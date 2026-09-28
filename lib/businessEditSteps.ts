/**
 * The 6 steps of the business-edit wizard. Same shape as
 * `lib/venueEditSteps.ts` / `lib/clubEditSteps.ts` so the chrome
 * (sidebar, mobile tab bar, bottom bar) stays a near-copy of the venue
 * editor's.
 *
 * `traders` is the "Event traders" step Mark asked for - the tab before
 * Publish, where a business opts in to the Event Traders directory.
 */
export type BusinessEditStepKey =
  | "basic"
  | "profile"
  | "description"
  | "owners"
  | "traders"
  | "publish";

export type BusinessEditStep = {
  key: BusinessEditStepKey;
  number: number;
  label: string;
  mobileLabel: string;
  sublabel: string;
  title: string;
  subtitle: string;
};

export const BUSINESS_EDIT_STEPS: BusinessEditStep[] = [
  {
    key: "basic",
    number: 1,
    label: "Business details",
    mobileLabel: "Details",
    sublabel: "Name, country, categories",
    title: "Business details",
    subtitle:
      "The essentials - what the business is called, where it's based and what it does.",
  },
  {
    key: "profile",
    number: 2,
    label: "Business profile",
    mobileLabel: "Profile",
    sublabel: "Logo, cover, address, contact",
    title: "Your business profile",
    subtitle:
      "The images, address and contact details customers see. Photos upload as soon as you pick them.",
  },
  {
    key: "description",
    number: 3,
    label: "Description & gallery",
    mobileLabel: "About",
    sublabel: "About the business, photos",
    title: "Describe your business",
    subtitle:
      "What you do, who you do it for and what makes you worth the trip - plus a gallery of your work.",
  },
  {
    key: "owners",
    number: 4,
    label: "Business owners",
    mobileLabel: "Owners",
    sublabel: "Who can manage this listing",
    title: "Business owners",
    subtitle:
      "Anyone listed here can edit this business from their own CarEvents account.",
  },
  {
    key: "traders",
    number: 5,
    label: "Event traders",
    mobileLabel: "Traders",
    sublabel: "Join the traders directory",
    title: "Event traders",
    subtitle:
      "Trade at events? Get discovered by event organisers looking for exhibitors.",
  },
  {
    key: "publish",
    number: 6,
    label: "Publish",
    mobileLabel: "Publish",
    sublabel: "Status & visibility",
    title: "Save and publish",
    subtitle: "Choose whether the business is visible in the public directory.",
  },
];

/** Total step count. Used for "Step N of M" headings + progress bar. */
export const BUSINESS_EDIT_STEP_COUNT = BUSINESS_EDIT_STEPS.length;

/** Default step shown when no `?step=` is in the URL. */
export const DEFAULT_BUSINESS_STEP: BusinessEditStepKey = "basic";

/** Get a step by its key, with fallback to the first step. */
export function getBusinessStep(
  key: string | null | undefined,
): BusinessEditStep {
  const match = BUSINESS_EDIT_STEPS.find((s) => s.key === key);
  return match ?? BUSINESS_EDIT_STEPS[0]!;
}

/** Get the previous/next step keys, or null at the boundary. */
export function adjacentBusinessSteps(key: BusinessEditStepKey): {
  prev: BusinessEditStepKey | null;
  next: BusinessEditStepKey | null;
} {
  const idx = BUSINESS_EDIT_STEPS.findIndex((s) => s.key === key);
  return {
    prev: idx > 0 ? BUSINESS_EDIT_STEPS[idx - 1]!.key : null,
    next:
      idx >= 0 && idx < BUSINESS_EDIT_STEPS.length - 1
        ? BUSINESS_EDIT_STEPS[idx + 1]!.key
        : null,
  };
}
