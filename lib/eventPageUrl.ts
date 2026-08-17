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
import type { Region } from "./regions";

const CAREVENTS_BASE =
  process.env.NEXT_PUBLIC_CAREVENTS_URL || "https://www.carevents.com/uk";

export function eventPageUrl(eventId: number): string {
  return `${CAREVENTS_BASE}/?post_type=events&p=${eventId}`;
}

/**
 * The public site's home page for a region - the sidebar's "Back to
 * CarEvents.com".
 *
 * The two regions are different URLs, not different paths off one:
 * `carevents.com` is the US site and `carevents.com/uk` is the UK one,
 * because the network's main site is the US one and so carries no path
 * prefix. Both come off the region table so a third site declares its
 * URL alongside its currency rather than in a switch here.
 *
 * `NEXT_PUBLIC_CAREVENTS_URL` still wins when set: a staging dashboard
 * must not send people to the live site, whichever region they're in.
 */
export function careventsHomeUrl(region: Region): string {
  if (process.env.NEXT_PUBLIC_CAREVENTS_URL) {
    return process.env.NEXT_PUBLIC_CAREVENTS_URL;
  }
  return region.publicSiteUrl;
}
