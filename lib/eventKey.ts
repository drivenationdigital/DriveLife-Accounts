import type { EventRecord } from "./apiTypes";

/**
 * A React list key that stays unique across regions.
 *
 * `/organiser-events` merges the UK and US sites into one list when no
 * `site` filter is given, and post ids are only unique *within* a site.
 * So two events - one per region - can genuinely share `id`, and keying
 * a list on `id` alone makes React treat them as the same row: it
 * reuses the wrong DOM node, and state that lives in the row (an open
 * menu, a focused control) follows the wrong event.
 *
 * `encrypted_id` doesn't solve it either - it's derived from the post
 * id, so it collides in exactly the same cases.
 */
export function eventKey(event: Pick<EventRecord, "id" | "site">): string {
  return `${event.site?.key ?? ""}:${event.id}`;
}
