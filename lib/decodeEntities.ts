/**
 * Decode HTML entities in text coming back from WordPress.
 *
 * WP runs post titles (and most other free-text fields) through
 * wptexturize + esc_html before they reach the REST layer, so an event
 * called "Mark's Event" arrives as "Mark&#8217;s Event". React escapes
 * strings when rendering, so the raw entity is what the user sees.
 * Decoding on the way in fixes it once, at the mapper boundary, rather
 * than sprinkling dangerouslySetInnerHTML through the UI.
 *
 * Handles numeric entities (&#8217; / &#x2019;) plus the named entities
 * WP actually emits. Deliberately not a full HTML parser - we never
 * want to interpret tags here, only unescape text.
 */

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "-",
  mdash: "-",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  pound: "£",
  euro: "€",
  copy: "©",
  reg: "®",
  trade: "™",
  deg: "°",
  times: "×",
  middot: "·",
  bull: "•",
  prime: "′",
  Prime: "″",
};

/** Codepoints we normalise to a plain ASCII dash on decode. */
const DASH_CODEPOINTS = new Set([0x2013, 0x2014, 0x2012, 0x2015]);

function fromCodePoint(cp: number): string {
  if (!Number.isFinite(cp) || cp <= 0 || cp > 0x10ffff) return "";
  if (DASH_CODEPOINTS.has(cp)) return "-";
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
}

/**
 * Decode entities in `input`. Runs repeatedly so double-encoded values
 * ("&amp;#8217;", which WP produces when a title is escaped twice)
 * resolve fully. Non-string input is returned untouched.
 */
export function decodeEntities<T extends string | null | undefined>(
  input: T,
): T {
  if (typeof input !== "string" || input === "") return input;

  let out: string = input;
  // Two passes covers single and double encoding; the loop exits early
  // once a pass changes nothing.
  for (let pass = 0; pass < 3; pass++) {
    const next = out.replace(
      /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g,
      (match, body: string) => {
        if (body.charAt(0) === "#") {
          const hex = body.charAt(1) === "x" || body.charAt(1) === "X";
          const cp = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
          const decoded = fromCodePoint(cp);
          return decoded || match;
        }
        const named = NAMED[body];
        return named ?? match;
      },
    );
    if (next === out) break;
    out = next;
  }

  return out as T;
}

/**
 * Keys whose values are raw HTML rendered with dangerouslySetInnerHTML.
 * Those already render entities correctly in the browser, and decoding
 * them first could turn escaped markup into live markup - so we leave
 * them exactly as the server sent them.
 */
const RAW_HTML_KEYS = new Set(["event_info", "message"]);

/**
 * Walk a parsed JSON payload and decode entities in every string,
 * in place where possible. Arrays and nested objects are handled;
 * numbers, booleans and nulls pass through untouched.
 *
 * Applied once at the API-client boundary so every screen gets
 * correctly-rendered apostrophes, ampersands and accents without each
 * mapper having to remember to decode.
 */
export function decodeEntitiesDeep<T>(value: T, key?: string): T {
  if (typeof value === "string") {
    if (key && RAW_HTML_KEYS.has(key)) return value;
    return decodeEntities(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = decodeEntitiesDeep(value[i], key);
    }
    return value;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      obj[k] = decodeEntitiesDeep(obj[k], k);
    }
    return value;
  }
  return value;
}
