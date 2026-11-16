/**
 * Name for a duplicated row in the event editor (a ticket, a show car
 * category, a trader type): "Adult" → "Adult (copy)".
 *
 * The duplicate opens in its drawer before anything is saved, so this
 * is only a starting point the organiser can retype - it just has to
 * make the two rows tell-apart-able if they save it untouched.
 */
export function copyName(name: string): string {
  const trimmed = name.trim();
  return trimmed ? `${trimmed} (copy)` : "";
}
