/**
 * Generate a short, human-typeable secret code for gating tickets or
 * sections behind a password at checkout.
 *
 * 8 chars uppercase alphanumeric, with confusable characters removed
 * (0/O/1/I/L) so codes can be read over the phone or shared in print
 * without ambiguity. ~30^8 ≈ 6.5 × 10^11 combinations — plenty for
 * the per-event scale we expect.
 *
 * Uses crypto.getRandomValues when available (all modern browsers +
 * Node 19+) and falls back to Math.random otherwise. The fallback is
 * non-cryptographic but still fine for this use case — the codes are
 * a UX gating mechanism, not a security secret.
 */
export function generateSecretCode(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 30 unambiguous chars
  const out: string[] = [];
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      out.push(chars[bytes[i] % chars.length]);
    }
  } else {
    for (let i = 0; i < length; i++) {
      out.push(chars[Math.floor(Math.random() * chars.length)]);
    }
  }
  return out.join("");
}
