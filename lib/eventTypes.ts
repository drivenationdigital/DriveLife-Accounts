/**
 * The 3 event types available in the create wizard.
 *
 * The `id` values match the whitelist on the WP `/events` POST
 * endpoint (`general | dev_club | venue_dover`). Adding a new option
 * here also means whitelisting it server-side in
 * `dl-accounts-create-event.php` — keep both in sync.
 *
 * Eventually this list may become per-organiser (each user only sees
 * the venues / clubs they own). For now it's hardcoded — when the WP
 * side gains a `/event-types` route, swap this for a hook.
 */
export type EventTypeId = "general" | "dev_club" | "venue_dover";

export type EventTypeOption = {
  id: EventTypeId;
  label: string;
  description: string;
};

export const EVENT_TYPES: EventTypeOption[] = [
  {
    id: "general",
    label: "General Event",
    description: "Create a general public or private event",
  },
  {
    id: "dev_club",
    label: "Dev Club Event",
    description: "Create a public or private event hosted by your car club/group",
  },
  {
    id: "venue_dover",
    label: "Dover Transport Museum Event",
    description: "Create a public or private event hosted by your venue",
  },
];
