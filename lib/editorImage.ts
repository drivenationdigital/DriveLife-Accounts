/**
 * Helpers for working with `EditorImage` discriminated unions in
 * the event editor (cover image + gallery).
 *
 * The editor stores images as either `remote` (already uploaded —
 * we have a URL) or `local` (file picked from device, blob URL for
 * preview, real File for the eventual upload). Most of the editor
 * UI just needs "give me something I can put in <img src>" which is
 * what these helpers do.
 *
 * The cleanup helpers exist because `URL.createObjectURL` allocates
 * memory the GC can't free until you tell it to. Forgetting to
 * `revokeObjectURL` an image that's been replaced leaks the file
 * for the page's lifetime — small per image, but it adds up if a
 * user is iterating on a gallery.
 */

import type { EditorImage } from "@/context/EventCreateContext";

/** Render-ready URL — works for both remote and local. */
export function imageSrc(img: EditorImage): string {
  return img.kind === "remote" ? img.url : img.previewUrl;
}

/** Type guard for the local case — used by the save flow when it
 *  needs to find images that still need uploading. */
export function isLocalImage(
  img: EditorImage,
): img is Extract<EditorImage, { kind: "local" }> {
  return img.kind === "local";
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
