/**
 * Slugify a string into a URL-safe form. Strips diacritics, lowercases,
 * replaces non-alphanumerics with hyphens, collapses adjacent runs,
 * trims hyphens at either end.
 *
 * Used in the application-links card for show-cars / car-clubs /
 * traders, and in the Publish panel's URL preview.
 *
 * Note: this is a client-side preview only. The eventual server-
 * generated slug may differ (collision suffixes etc) — that's fine
 * for a preview; the saved URL will replace this once the API call
 * lands.
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
