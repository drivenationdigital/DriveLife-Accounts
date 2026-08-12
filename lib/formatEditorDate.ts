import { DATE_STYLES, formatRegionDate, type Region } from "./regions";

/**
 * A date in the editor's date-field style - "19 April 2026" in the UK,
 * "April 19, 2026" in the US.
 *
 * `region` is REQUIRED, and deliberately so. It used to default to UK,
 * which meant any call site that forgot to pass one compiled fine and
 * then quietly rendered a US event's dates in British order - the exact
 * bug this whole layer exists to prevent, made invisible. Making it
 * required turns every such omission into a build error instead.
 *
 * Inside the editor the region comes from `useEventRegion()`; panels
 * that already call `useEventSteps()` can take it from there.
 */
export function formatEditorDate(
  iso: string | null | undefined,
  region: Region,
): string {
  return formatRegionDate(iso, region, DATE_STYLES.full);
}
