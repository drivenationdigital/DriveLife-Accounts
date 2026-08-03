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
