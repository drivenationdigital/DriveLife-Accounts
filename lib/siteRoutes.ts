/**
 * Internal dashboard URLs that carry the region alongside the eid.
 *
 * Encrypted ids are only unique within a multisite blog, so an eid on
 * its own doesn't identify an event - the same id exists on both the UK
 * and US sites and resolves to different posts. Every internal link to
 * an event therefore has to carry its region, and every page that
 * receives one has to send it back up on its API calls.
 *
 * @see lib/siteRef.ts for the ref format these helpers produce.
 *
 * The region is folded into the id itself - `uk{eid}` - rather than
 * riding alongside it in a `?site=` query param. See lib/siteRef.ts for
 * why: a separate param kept going missing, and losing it is silent.
 * One token can't come apart. No separator is needed because the ids
 * are base64 of ASCII, which can never begin with "u" - siteRef.ts has
 * the working.
 *
 * Old `?site=` links still work. A pre-multisite `/events/{eid}` has no
 * region anywhere and falls back to the API's default exactly as it did
 * before; a `/events/{eid}?site=us` link minted under the old scheme
 * still has its param, and every reader below honours it as a fallback
 * when the ref carries no region.
 *
 * Pass `undefined` for `site` when the region genuinely isn't known -
 * better an ambiguous link than one asserting a region we guessed.
 */

import { formatRef } from "./siteRef";

/** URL-safe ref for a path segment. `encodeURIComponent` escapes the
 *  `+`, `/` and `=` that base64 ids can contain; the region prefix is
 *  plain letters and passes through untouched. */
function ref(id: string, site?: string | null): string {
  return encodeURIComponent(formatRef(id, site));
}

/** The dashboard event view: overview, orders, applications. */
export function eventDetailPath(eid: string, site?: string | null): string {
  return `/events/${ref(eid, site)}`;
}

/**
 * Where a list row should go.
 *
 * A recurring row carries two ids doing different jobs. `encrypted_id`
 * is the SERIES identity - the parent - and is what pinning and "View
 * Related Events" act on. `link_eid` is the next upcoming occurrence,
 * and is what a click should open, so the user lands on a real event
 * view rather than the series overview.
 *
 * Non-recurring rows have no `link_eid`, so they fall through to
 * `encrypted_id` and behave exactly as before.
 */
export function eventRowPath(
  event: { encrypted_id: string; link_eid?: string; site?: { key: string } },
  site?: string | null,
): string {
  return eventDetailPath(
    event.link_eid ?? event.encrypted_id,
    site ?? event.site?.key,
  );
}

/**
 * The order detail view.
 *
 * Orders are WooCommerce posts, so an encrypted order id is only unique
 * within a blog for the same reason an eid is - and the order page has
 * no event in scope to infer a region from. Without the site it renders
 * a US order's money and dates in the UK's, so the region has to travel
 * with the link from whichever list minted it.
 */
export function orderDetailPath(
  oid: string,
  site?: string | null,
  /**
   * Encrypted id of the event the user was looking at when they opened
   * this order. Powers the order page's back link, which returns to
   * that event's view rather than dropping the user at the dashboard.
   *
   * Carried in the URL rather than read off the order because the order
   * response only exposes a NUMERIC event id, and every internal event
   * link needs the encrypted one. Omit it where there's no event in
   * scope - My Tickets, say - and the back link falls back.
   */
  fromEventEid?: string | null,
): string {
  const path = `/orders/${ref(oid, site)}`;
  if (!fromEventEid) return path;
  // The back link's event is a ref too - it's the same event id in the
  // same region, and the order page hands it straight to
  // eventDetailPath.
  return `${path}?from=${ref(fromEventEid, site)}`;
}

/** The editor. `eid` rides in the query string here, not the path -
 *  it's still a ref, just in a different slot. */
export function eventEditorPath(eid: string, site?: string | null): string {
  return `/events/new?eid=${ref(eid, site)}`;
}

/** The club edit wizard. Clubs carry a region for the same reason
 *  events do - `/my-clubs` merges both, and cids repeat across them. */
export function clubEditPath(cid: string, site?: string | null): string {
  return `/club/${ref(cid, site)}/edit`;
}

/** The venue edit wizard. */
export function venueEditPath(vid: string, site?: string | null): string {
  return `/venue/${ref(vid, site)}/edit`;
}
