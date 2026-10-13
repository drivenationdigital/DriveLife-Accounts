/**
 * The 4 steps of the track-edit wizard. Defined once here and re-used by
 * every piece of chrome (sidebar, mobile tab bar, mobile bottom bar) and
 * by the panel router in the edit page.
 *
 * Mirrors `lib/venueEditSteps.ts` - the venue and track editors share the
 * same chrome and the same `editor.css`.
 */
export type TrackEditStepKey = "basic" | "profile" | "description" | "publish";

export type TrackEditStep = {
  key: TrackEditStepKey;
  number: number;
  label: string;
  mobileLabel: string;
  sublabel: string;
  title: string;
  subtitle: string;
};

export const TRACK_EDIT_STEPS: TrackEditStep[] = [
  {
    key: "basic",
    number: 1,
    label: "Basic details",
    mobileLabel: "Basics",
    sublabel: "Name, location, track type",
    title: "Basic details",
    subtitle:
      "What the track is called, where it is, and what kind of circuit it is.",
  },
  {
    key: "profile",
    number: 2,
    label: "Track profile",
    mobileLabel: "Profile",
    sublabel: "Logo, cover, contact",
    title: "Your track profile",
    subtitle:
      "The images and contact details visitors see. Photos upload as soon as you pick them.",
  },
  {
    key: "description",
    number: 3,
    label: "Description",
    mobileLabel: "Description",
    sublabel: "About the track",
    title: "Describe your track",
    subtitle:
      "Layouts, facilities, paddock, spectator areas - anything a driver or visitor would want to know.",
  },
  {
    key: "publish",
    number: 4,
    label: "Publish",
    mobileLabel: "Publish",
    sublabel: "Status & visibility",
    title: "Save and publish",
    subtitle: "Choose whether the track is visible to everyone.",
  },
];

/** Total step count. Used for "Step N of M" headings + progress bar. */
export const TRACK_EDIT_STEP_COUNT = TRACK_EDIT_STEPS.length;

/** Default step shown when no `?step=` is in the URL. */
export const DEFAULT_TRACK_STEP: TrackEditStepKey = "basic";

/** Get a step by its key, with fallback to the first step. */
export function getTrackStep(key: string | null | undefined): TrackEditStep {
  const match = TRACK_EDIT_STEPS.find((s) => s.key === key);
  return match ?? TRACK_EDIT_STEPS[0]!;
}

/** Get the previous/next step keys, or null at the boundary. */
export function adjacentTrackSteps(key: TrackEditStepKey): {
  prev: TrackEditStepKey | null;
  next: TrackEditStepKey | null;
} {
  const idx = TRACK_EDIT_STEPS.findIndex((s) => s.key === key);
  return {
    prev: idx > 0 ? TRACK_EDIT_STEPS[idx - 1]!.key : null,
    next:
      idx >= 0 && idx < TRACK_EDIT_STEPS.length - 1
        ? TRACK_EDIT_STEPS[idx + 1]!.key
        : null,
  };
}
