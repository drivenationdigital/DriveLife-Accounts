/**
 * Internal dashboard URLs that carry the region alongside the eid.
 *
 * Encrypted ids are only unique within a multisite blog, so an eid on
 * its own doesn't identify an event - the same id exists on both the UK
 * and US sites and resolves to different posts. Every internal link to
 * an event therefore has to carry its region, and every page that
 * receives one has to send it back up on its API calls.
 *
 * We keep the region in a `?site=` query param rather than a path
 * segment (`/events/[site]/[eid]`) so links minted before the multisite
 * rollout still resolve: an old `/events/{eid}` URL simply arrives with
 * no site, and the API falls back to its default region exactly as it
 * did before. Restructuring the path would have broken every one of
 * those saved links and bookmarks.
 *
 * Pass `undefined` when the region genuinely isn't known - it's better
 * to omit the param than to guess a region and silently open the wrong
 * event.
 */

/** Append `?site=` (or `&site=`) only when we actually have a region. */
function withSite(path: string, site?: string | null): string {
  if (!site) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}site=${encodeURIComponent(site)}`;
}

/** The dashboard event view: overview, orders, applications. */
export function eventDetailPath(eid: string, site?: string | null): string {
  return withSite(`/events/${encodeURIComponent(eid)}`, site);
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
export function orderDetailPath(oid: string, site?: string | null): string {
  return withSite(`/orders/${encodeURIComponent(oid)}`, site);
}

/** The editor. `eid` rides in the query string here, not the path. */
export function eventEditorPath(eid: string, site?: string | null): string {
  return withSite(`/events/new?eid=${encodeURIComponent(eid)}`, site);
}

/** The club edit wizard. Clubs carry a region for the same reason
 *  events do - `/my-clubs` merges both, and cids repeat across them. */
export function clubEditPath(cid: string, site?: string | null): string {
  return withSite(`/club/${encodeURIComponent(cid)}/edit`, site);
}

/** The venue edit wizard. */
export function venueEditPath(vid: string, site?: string | null): string {
  return withSite(`/venue/${encodeURIComponent(vid)}/edit`, site);
}
