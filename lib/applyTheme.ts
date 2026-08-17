/**
 * Light / dark colour scheme for the public application forms.
 *
 * Carried in the URL as `?theme=dark` rather than stored anywhere. The
 * forms are embedded in other people's websites, so the host page - not
 * the organiser's account, and not the visitor's OS - is what decides
 * which scheme reads correctly. A query param is the only handle an
 * `<iframe src>` gives us, and it survives being copied around.
 *
 * Light is the default and is left out of the URL entirely, so existing
 * embeds keep working untouched and a plain link stays clean.
 *
 * Applies to all three forms: show cars, car clubs and traders.
 */

export type ApplyTheme = "light" | "dark";

export const APPLY_THEME_PARAM = "theme";

/**
 * Read a theme off a query value.
 *
 * Anything unrecognised - a typo, an empty string, a missing param -
 * resolves to light. A form that silently renders in the wrong scheme
 * is a cosmetic annoyance; one that throws on a bad param is a broken
 * embed on someone else's website.
 */
export function parseApplyTheme(
  value: string | null | undefined,
): ApplyTheme {
  return value?.trim().toLowerCase() === "dark" ? "dark" : "light";
}

/**
 * Root classes for the form shell. `is-dark` is what the stylesheet
 * hangs the inverted palette off - see `.apply-shell.is-dark` in
 * globals.css.
 */
export function applyShellClass(theme: ApplyTheme): string {
  return theme === "dark" ? "apply-shell is-dark" : "apply-shell";
}

/**
 * Append the theme to a URL, omitting it for light.
 *
 * Leaving the default out matters: it keeps the embed snippet an
 * organiser copies as short as it was before this existed, and means a
 * link shared without the param behaves exactly as it always has.
 */
export function withApplyTheme(url: string, theme: ApplyTheme): string {
  if (theme !== "dark") return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${APPLY_THEME_PARAM}=dark`;
}
