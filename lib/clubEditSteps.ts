/**
 * The 7 steps of the club-edit wizard. Defined once here and re-used by
 * every piece of chrome (sidebar, mobile tab bar, mobile bottom bar) and
 * by the panel router in the edit page.
 *
 * Mirrors `lib/eventCreateSteps.ts` deliberately — the two editors share
 * the same chrome and the same `editor.css`, so keeping the step shape
 * identical means the components stay near-copies of each other rather
 * than diverging over time.
 *
 * `key` is the URL search-param value (`?step=profile`) and the panel
 * lookup key. `mobileLabel` is the abbreviated label used in the
 * horizontal mobile tab bar where space is tight. `title`/`subtitle`
 * feed the shared PanelHeader.
 */
export type ClubEditStepKey =
  | "basic"
  | "profile"
  | "description"
  | "questions"
  | "terms"
  | "admins"
  | "publish";

export type ClubEditStep = {
  key: ClubEditStepKey;
  number: number;
  label: string;
  mobileLabel: string;
  sublabel: string;
  title: string;
  subtitle: string;
};

export const CLUB_EDIT_STEPS: ClubEditStep[] = [
  {
    key: "basic",
    number: 1,
    label: "Basic details",
    mobileLabel: "Basics",
    sublabel: "Title, categories, location",
    title: "Basic details",
    subtitle:
      "The essentials — what your club is called, what it's about, and where it's based.",
  },
  {
    key: "profile",
    number: 2,
    label: "Club profile",
    mobileLabel: "Profile",
    sublabel: "Logo, cover, links",
    title: "Your club profile",
    subtitle:
      "The images and links members see first. Photos upload as soon as you pick them.",
  },
  {
    key: "description",
    number: 3,
    label: "Description",
    mobileLabel: "Description",
    sublabel: "About your club",
    title: "Describe your club",
    subtitle:
      "Tell people what the club is about, who it's for, and how you meet.",
  },
  {
    key: "questions",
    number: 4,
    label: "Membership questions",
    mobileLabel: "Questions",
    sublabel: "Ask applicants",
    title: "Membership questions",
    subtitle:
      "Questions applicants answer when they request to join. Leave empty to skip them.",
  },
  {
    key: "terms",
    number: 5,
    label: "Club terms",
    mobileLabel: "Terms",
    sublabel: "Rules & conditions",
    title: "Club terms",
    subtitle: "The rules and conditions members agree to when they join.",
  },
  {
    key: "admins",
    number: 6,
    label: "Administrators",
    mobileLabel: "Admins",
    sublabel: "Who can manage this club",
    title: "Club administrators",
    subtitle:
      "Invite people to help manage the club. They become administrators once they accept.",
  },
  {
    key: "publish",
    number: 7,
    label: "Publish",
    mobileLabel: "Publish",
    sublabel: "Status & join policy",
    title: "Save and publish",
    subtitle: "Choose who can see the club and how people join it.",
  },
];

/** Total step count. Used for "Step N of M" headings + progress bar. */
export const CLUB_EDIT_STEP_COUNT = CLUB_EDIT_STEPS.length;

/** Default step shown when no `?step=` is in the URL. */
export const DEFAULT_CLUB_STEP: ClubEditStepKey = "basic";

/** Get a step by its key, with fallback to the first step. */
export function getClubStep(key: string | null | undefined): ClubEditStep {
  const match = CLUB_EDIT_STEPS.find((s) => s.key === key);
  return match ?? CLUB_EDIT_STEPS[0]!;
}

/** Get the previous/next step keys, or null at the boundary. */
export function adjacentClubSteps(key: ClubEditStepKey): {
  prev: ClubEditStepKey | null;
  next: ClubEditStepKey | null;
} {
  const idx = CLUB_EDIT_STEPS.findIndex((s) => s.key === key);
  return {
    prev: idx > 0 ? CLUB_EDIT_STEPS[idx - 1]!.key : null,
    next:
      idx >= 0 && idx < CLUB_EDIT_STEPS.length - 1
        ? CLUB_EDIT_STEPS[idx + 1]!.key
        : null,
  };
}
