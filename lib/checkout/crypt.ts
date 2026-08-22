import crypto from "crypto";

/**
 * Node port of the theme's make_crypt() (cc2022/functions.php).
 *
 * The WordPress side identifies events, tickets, orders and Stripe
 * accounts by AES-256-CBC blobs with a fixed key/IV derived from a
 * hardcoded passphrase, so ciphertexts are stable and shareable -
 * that's what makes /get-tickets links work at all. Replicating it
 * here lets the proxy mint encrypted ticket ids for the raw rows the
 * PHP API returns (the encrypted form otherwise only exists inside
 * its server-rendered HTML) and decode order ids for display.
 *
 * PHP details mirrored exactly: key = first 32 chars of
 * sha256(passphrase) hex used as ASCII bytes, IV = first 16 chars,
 * and openssl_encrypt's base64 output is base64-encoded again.
 * Verified byte-identical against wp eval on staging.
 */

const PASSPHRASE_HASH = crypto
  .createHash("sha256")
  .update("lamborghini")
  .digest("hex");

const KEY = Buffer.from(PASSPHRASE_HASH.substring(0, 32), "utf8");
const IV = Buffer.from(PASSPHRASE_HASH.substring(0, 16), "utf8");

export function ccEncrypt(value: string): string {
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, IV);
  const raw = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.from(raw.toString("base64"), "utf8").toString("base64");
}

export function ccDecrypt(value: string): string | null {
  try {
    const inner = Buffer.from(value, "base64").toString("utf8");
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, IV);
    return Buffer.concat([
      decipher.update(Buffer.from(inner, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
