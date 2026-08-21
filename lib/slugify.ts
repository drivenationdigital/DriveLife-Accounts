/**
 * Slugify a string into a URL-safe form. Strips diacritics, lowercases,
 * replaces non-alphanumerics with hyphens, collapses adjacent runs,
 * trims hyphens at either end.
 *
 * Used in the application-links card for show-cars / car-clubs /
 * traders, and in the Publish panel's URL preview.
 *
 * Note: this is a client-side GUESS, never the real URL. WordPress
 * owns the slug: it appends a collision suffix when one is taken, and
 * it doesn't re-slug a renamed event. The Publish panel uses this only
 * for an event that has no permalink yet (brand-new, never loaded from
 * /event-edit) and prefers `state.permalink` whenever it's set.
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
