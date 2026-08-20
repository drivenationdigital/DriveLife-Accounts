/**
 * Composite record references - the region key prefixed onto the
 * encrypted id: "uk" + "YStz…" → "ukYStz…".
 *
 * Encrypted ids are only unique within a multisite blog: the same eid
 * exists on the UK and US sites and resolves to different posts. So an
 * id on its own does not identify a record, and every API call that
 * takes one also has to say which region to resolve it against.
 *
 * That pairing used to live in a `?site=` query param travelling
 * alongside the id. It kept coming apart - a link minted without it, a
 * page that read it but forgot to pass it on - and the failure is
 * silent: the API resolves against its default blog and happily reads
 * or writes a different region's record. Two live data bugs came from
 * exactly that (see SITE_REQUIRED_ROUTES in apiClient).
 *
 * Folding the region into the id makes the pair inseparable. There is
 * no longer a second value that can go missing, because there is only
 * one token.
 *
 *   /events/ukYStzZDhkamxzdFBSRkhNa1FZZDY1UT09
 *
 * ── Why no separator is needed ───────────────────────────────────────
 *
 * Splitting on a fixed two-character prefix is only safe if a bare id
 * can never start with one. It can't, and this is structural rather
 * than lucky:
 *
 *   - The ids are base64 of an ASCII payload (they're base64 of a
 *     base64 string - "YStz…" decodes to "a+sd8djlstPRFHMkQYd65Q==").
 *   - The first character of a base64 string is the first payload byte
 *     shifted right by 2. An ASCII byte is < 128, so that index is
 *     < 32, so the first character is always one of A-Z or a-f.
 *   - "u" is index 46. Producing it needs a first byte of 184-187,
 *     which ASCII cannot be.
 *
 * So no id begins with "u", let alone "uk" or "us", and a bare id can
 * never be mistaken for a prefixed one. `formatRef` asserts this in
 * development so a change to the server's id encoding surfaces at mint
 * time rather than as an unopenable link.
 *
 * The invariant is only load-bearing for REGION-LESS refs - old links
 * minted before this scheme, and links we mint with no region to hand.
 * Everything we mint with a region round-trips regardless.
 */

import { REGION_LIST, isRegionKey, type RegionKey } from "./regions";

/**
 * The region key `raw` starts with, if any. Matched against the real
 * key list rather than a fixed two-character slice, so adding a region
 * with a longer key needs no change here.
 *
 * Assumes no key is a prefix of another ("u" and "uk" would be
 * ambiguous). Nothing enforces that beyond the two keys that exist.
 */
function leadingRegion(raw: string): RegionKey | null {
  for (const region of REGION_LIST) {
    if (raw.startsWith(region.key)) return region.key;
  }
  return null;
}

export interface ParsedRef {
  /** The bare encrypted id - what every API call wants. */
  id: string;
  /** The region the id belongs to, or null when the ref didn't carry
   *  one. Null is meaningful: it means "unknown", not "UK". Callers
   *  that need a concrete region resolve it themselves, usually via a
   *  `?site=` fallback for older links and then `resolveRegion`. */
  site: RegionKey | null;
}

/**
 * Build a ref for a URL. Returns the bare id when the region is
 * unknown - better an ambiguous link that falls back to the API's
 * default than one asserting a region we guessed.
 */
export function formatRef(id: string, site?: string | null): string {
  if (!id) return "";
  if (process.env.NODE_ENV !== "production") {
    // The id must not look like it already carries a region, or
    // parseRef would strip two characters off a legitimate id. See the
    // header for why base64-of-ASCII can't start with "u" - this fires
    // only if that stops being true.
    if (leadingRegion(id)) {
      console.error(
        `[siteRef] id "${id}" starts with a region key. The prefix scheme ` +
          `assumes ids can't, so this ref will not parse back correctly.`,
      );
    }
  }
  if (!isRegionKey(site)) return id;
  return `${site}${id}`;
}

/**
 * Split a ref back into its id and region. Safe on anything: a bare
 * id, a ref, an empty string, null.
 */
export function parseRef(raw: string | null | undefined): ParsedRef {
  if (!raw) return { id: "", site: null };
  const prefix = leadingRegion(raw);
  // The length check stops a stray "uk" on its own parsing as a region
  // with an empty id - that's a malformed link, and returning it whole
  // lets the caller's own empty-id guard catch it.
  if (prefix && raw.length > prefix.length) {
    return { id: raw.slice(prefix.length), site: prefix };
  }
  return { id: raw, site: null };
}
