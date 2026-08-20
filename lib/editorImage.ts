/**
 * Helpers for working with `EditorImage` discriminated unions in
 * the event editor (cover image + gallery).
 *
 * The editor stores images as either `remote` (already uploaded -
 * we have a URL) or `local` (file picked from device, blob URL for
 * preview, real File for the eventual upload). Most of the editor
 * UI just needs "give me something I can put in <img src>" which is
 * what these helpers do.
 *
 * The cleanup helpers exist because `URL.createObjectURL` allocates
 * memory the GC can't free until you tell it to. Forgetting to
 * `revokeObjectURL` an image that's been replaced leaks the file
 * for the page's lifetime - small per image, but it adds up if a
 * user is iterating on a gallery.
 */

import type { EditorImage } from "@/context/EventCreateContext";

/** Render-ready URL - works for both remote and local. */
export function imageSrc(img: EditorImage): string {
  return img.kind === "remote" ? img.url : img.previewUrl;
}

/** Type guard for the local case - used by the save flow when it
 *  needs to find images that still need uploading. */
export function isLocalImage(
  img: EditorImage,
): img is Extract<EditorImage, { kind: "local" }> {
  return img.kind === "local";
}

/**
 * Whether removing this image needs a DELETE /event-image call.
 *
 * True only for remote images we actually own on Cloudflare. The
 * /event-edit payload also returns WordPress-backed rows (source
 * "wordpress", id "wp:<attachment_id>") - those attachments belong to
 * the WP media library, so the editor just drops the tile from local
 * state. Note that /event-update only carries the gallery's ORDER
 * (media.gallery_order), not its membership, so that drop is
 * local-only: the row comes back on the next hydrate until the API
 * supports removing WP-backed media.
 *
 * A remote row with no id has no removable backing either way, and a
 * missing `source` is treated as Cloudflare: that covers images
 * uploaded through this editor (the CF pipeline sets no source field)
 * as well as older /event-edit deploys that pre-date the field.
 */
export function needsServerDelete(
  img: EditorImage,
): img is Extract<EditorImage, { kind: "remote" }> & { cloudflareId: string } {
  return (
    img.kind === "remote" &&
    !!img.cloudflareId &&
    (img.source === undefined || img.source === "cloudflare")
  );
}

/** Convert a File from a file-input change into an EditorImage. The
 *  blob URL must be revoked later via `revokeIfLocal`. */
export function makeLocalImage(file: File): EditorImage {
  return {
    kind: "local",
    previewUrl: URL.createObjectURL(file),
    file,
  };
}

/** Revoke the blob URL on a local image; no-op for remotes. Safe to
 *  call on null. */
export function revokeIfLocal(img: EditorImage | null | undefined): void {
  if (img && img.kind === "local") {
    URL.revokeObjectURL(img.previewUrl);
  }
}
