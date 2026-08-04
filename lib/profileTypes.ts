/**
 * Profile types - "which best describes you", asked once in the welcome
 * flow and stored in `ce_user_meta.about_contents` as a JSON array of
 * these indices (e.g. "[1,2]").
 *
 * The indices are the contract with the Flutter app, which reads the
 * same row from its own `profileTypeOptions` map. Never renumber or
 * reorder them - only append.
 */

export interface ProfileTypeOption {
  /** Stored value. Must match the app's profileTypeOptions key. */
  value: number;
  label: string;
  /** One-line hint shown under the label in the welcome flow. */
  description: string;
}

export const PROFILE_TYPE_OPTIONS: ProfileTypeOption[] = [
  {
    value: 0,
    label: "Car Owner / Enthusiast",
    description: "Attend events and show off your cars",
  },
  {
    value: 1,
    label: "Photographer / Videographer",
    description: "Shoot events and share your work",
  },
  {
    value: 2,
    label: "Event Organiser",
    description: "Run shows, meets and rallies",
  },
  {
    value: 3,
    label: "Automotive Venue",
    description: "Host events at your location",
  },
  {
    value: 4,
    label: "Automotive Business",
    description: "Trade at events and reach owners",
  },
  {
    value: 5,
    label: "Car Club",
    description: "Bring your members along together",
  },
];

/** Labels for a stored `about_contents` array, unknown indices dropped. */
export function profileTypeLabels(values: number[] | undefined): string[] {
  if (!values) return [];
  return values
    .map((v) => PROFILE_TYPE_OPTIONS.find((o) => o.value === v)?.label)
    .filter((label): label is string => Boolean(label));
}
