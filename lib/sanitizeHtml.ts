/**
 * Sanitiser for organiser-authored rich text before it goes through
 * `dangerouslySetInnerHTML`.
 *
 * Why it's needed even though WordPress runs kses on save: by the time
 * a description reaches a React component it has been through
 * `decodeEntitiesDeep` at the API-client boundary, which turns escaped
 * markup back into live markup. Anything WP deliberately escaped is
 * live again, so the server's guarantee doesn't survive the trip. This
 * runs last, on the exact string being injected.
 *
 * `isomorphic-dompurify` rather than plain `dompurify` because these
 * components server-render: it supplies a jsdom window on the server
 * and uses the real one in the browser, so the same call works in both
 * and SSR and client output match.
 *
 * The allowlist is the tag set TipTap can actually produce - StarterKit
 * plus the Link extension, which is what EditorTextarea is configured
 * with. Anything outside it is dropped rather than escaped; content
 * authored elsewhere (the WP admin) degrades to its text, which is the
 * right trade for a dashboard summary card.
 */

import DOMPurify from "isomorphic-dompurify";

/** Everything TipTap's StarterKit + Link can emit, and nothing else. */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "del",
  "u",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "a",
];

/**
 * `href` is the only attribute an author controls. `target` and `rel`
 * are allowed because the hook below sets them - DOMPurify strips
 * attributes it doesn't know about, including ones added in a hook.
 *
 * No `style`, `class` or `id`: styling belongs to the page, and an
 * author-supplied class could borrow the dashboard's own chrome.
 */
const ALLOWED_ATTR = ["href", "target", "rel"];

// Links in a description point off to somewhere else entirely, so they
// open in a new tab - and `noopener` keeps the opened page from
// reaching back through `window.opener`.
//
// Registered once at module load. DOMPurify keeps hooks on the shared
// instance, and the guard on `target` means it only touches anchors.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.hasAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Sanitise organiser-authored HTML for rendering. Returns "" for empty
 * or non-string input, so callers can branch on the result being falsy
 * rather than testing the input separately.
 *
 * DOMPurify blocks `javascript:` and other dangerous URL schemes in
 * `href` by default - that isn't configured here because overriding its
 * URI policy is how people accidentally punch holes in it.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
