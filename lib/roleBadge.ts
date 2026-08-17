/**
 * The role pill shown on club and venue cards.
 *
 * `badge` arrives already-rendered from the API ("Unpublished",
 * "Owner", "Admin", "Member", "Following"), so this is a display
 * relabel rather than a change of meaning - the underlying `role` is
 * untouched, and so is every permission that reads it.
 *
 * Both card types share this so the wording can't drift apart, and so
 * a future rename is one edit rather than a hunt through components.
 */

/** Badge text the API sends that we relabel on the way to the screen. */
const BADGE_OVERRIDES: Record<string, string> = {
  // "Owner" reads as a claim about who holds the club/venue rather than
  // what the person can do with it, and "Admin" is what the rest of the
  // dashboard calls that capability.
  owner: "Admin",
};

/**
 * Display text for a role badge.
 *
 * Matched case-insensitively on the trimmed value: the badge is server
 * copy, and a change of casing there shouldn't quietly switch the
 * override off. Anything unrecognised passes through untouched, so a
 * new role the API starts sending still renders rather than vanishing.
 */
export function roleBadgeLabel(badge: string | null | undefined): string {
  if (!badge) return "";
  const trimmed = badge.trim();
  return BADGE_OVERRIDES[trimmed.toLowerCase()] ?? trimmed;
}
