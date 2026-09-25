"use client";

/**
 * The two marketing consents at the bottom of the public application
 * forms (show car, car club, trader) - the same pair the ticket checkout
 * asks for, with the same wording and the same default (both ticked):
 *
 *   marketingOrganiser → the event organiser's own Brevo/Mailchimp list
 *   marketingCarevents → the CarEvents.com newsletter for the site
 *
 * Both flags are stored on the application row whatever the organiser
 * has set up. The push to a list only happens where one is connected;
 * an organiser without an email marketing account still sees the
 * consent in their CSV export.
 */
export function MarketingConsent({
  organiser,
  carevents,
  onOrganiserChange,
  onCareventsChange,
}: {
  organiser: boolean;
  carevents: boolean;
  onOrganiserChange: (checked: boolean) => void;
  onCareventsChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2.5 text-sm text-ink-700">
        <input
          type="checkbox"
          className="w-4 h-4 accent-gold-500 mt-0.5"
          checked={organiser}
          onChange={(e) => onOrganiserChange(e.target.checked)}
        />
        <span>
          Keep me updated about future events from this event organiser
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-sm text-ink-700">
        <input
          type="checkbox"
          className="w-4 h-4 accent-gold-500 mt-0.5"
          checked={carevents}
          onChange={(e) => onCareventsChange(e.target.checked)}
        />
        <span>
          I&apos;d like to hear about other future events from CarEvents.com
        </span>
      </label>
    </div>
  );
}
