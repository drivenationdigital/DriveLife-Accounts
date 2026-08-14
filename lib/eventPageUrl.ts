/**
 * Public event page on the main site.
 *
 * The public apply endpoints (/event-show-cars-public,
 * /event-traders-public, /event-car-clubs-public) give us `event_id`
 * but no permalink, so we use WordPress' canonical post URL - it 302s
 * to the pretty permalink, which means we don't need the slug and
 * can't produce a broken link if the organiser renames the event.
 * Same shape the editor's Preview button uses.
 */
const CAREVENTS_BASE =
  process.env.NEXT_PUBLIC_CAREVENTS_URL || "https://www.carevents.com/uk";

export function eventPageUrl(eventId: number): string {
  return `${CAREVENTS_BASE}/?post_type=events&p=${eventId}`;
}

/**
 * The public site's home page - the sidebar's "Back to CarEvents.com".
 *
 * Shares CAREVENTS_BASE with the event links above so a deployment
 * pointing at staging doesn't send people from a staging dashboard to
 * the live site. Note the base includes the region path ("/uk"): the
 * sidebar has no event in scope to take a region from, so it lands on
 * whichever the deployment is configured for, matching the API's own
 * default.
 */
export function careventsHomeUrl(): string {
  return CAREVENTS_BASE;
}
