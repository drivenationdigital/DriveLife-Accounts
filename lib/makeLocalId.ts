/**
 * Generate a short unique id for client-side records (tickets,
 * sections, discounts, …) before they're persisted to the API.
 *
 * crypto.randomUUID is available in all modern browsers; we slice
 * the front of it for compactness in URLs and dev tools (collisions
 * within a single browsing session are vanishingly unlikely with 8
 * hex chars - ~16M space - for the modest record counts we expect).
 *
 * Falls back to Math.random in environments without crypto.
 */
export function makeLocalId(prefix: string): string {
  let core: string;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    core = crypto.randomUUID().slice(0, 8);
  } else {
    core = Math.random().toString(36).slice(2, 10);
  }
  return `${prefix}-${core}`;
}
