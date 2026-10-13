/**
 * Pre-flight for browser → Cloudflare Images direct uploads.
 *
 * Why this exists (2026-10-11): an organiser adding gallery photos from
 * an iPhone got "The upload failed to send due to a slow connection.
 * Check your internet connection and try again." on most of them. That
 * text is Cloudflare's own direct-upload error (5408): it gives up when a
 * single file takes too long to arrive. Phone photos are 4-12 MB each and
 * the gallery fired every selected file at once, so on mobile data each
 * upload crawled and Cloudflare timed it out. Nothing was wrong with the
 * user's connection; the files were just too big and too many at once.
 *
 * Two fixes, both here so every uploader (event cover, gallery, ticket
 * logo, business images) gets them:
 *
 *   1. shrinkImage()  - downscale to a sane long edge and re-encode, so
 *      a 10 MB camera JPEG becomes ~1 MB. The site never shows images
 *      at camera resolution, so nothing visible is lost.
 *   2. withUploadSlot() - at most UPLOAD_CONCURRENCY uploads in flight,
 *      so each gets the bandwidth it needs to finish inside Cloudflare's
 *      window instead of all of them sharing it and all timing out.
 *
 * Decoding goes through an <img> element rather than createImageBitmap:
 * browsers apply EXIF orientation to <img> (CSS image-orientation is
 * from-image by default), so portrait phone photos stay upright once the
 * canvas re-encode strips the EXIF. Safari also decodes HEIC that way.
 *
 * Every failure path returns the ORIGINAL file: shrinking is an
 * optimisation, never a reason to refuse an upload.
 */

/** Longest edge after shrinking. Cloudflare serves variants well below this. */
const MAX_EDGE = 2560;
/** Files at or under this, already within MAX_EDGE, are sent untouched. */
const SKIP_UNDER_BYTES = 1_500_000;
const JPEG_QUALITY = 0.85;
/** Simultaneous Cloudflare uploads across the whole page. */
const UPLOAD_CONCURRENCY = 2;

/** Formats worth re-encoding. GIF (animation) and SVG (vector) are left alone. */
const SHRINKABLE = /^image\/(jpeg|jpg|png|webp|heic|heif|bmp|tiff)$/i;

export async function shrinkImage(file: File): Promise<File> {
  if (typeof document === "undefined" || !SHRINKABLE.test(file.type))
    return file;

  try {
    const img = await decodeImage(file);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const alreadyWebFormat = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
    if (scale === 1 && alreadyWebFormat && file.size <= SKIP_UNDER_BYTES)
      return file;

    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    // PNG stays PNG so logos keep their transparency; everything else
    // becomes a JPEG, which is what the photos were anyway.
    const png = /png$/i.test(file.type);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(
        resolve,
        png ? "image/png" : "image/jpeg",
        png ? undefined : JPEG_QUALITY,
      ),
    );
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) return file;

    // Re-encoding a small, already-fitting file can grow it; keep the original then.
    if (scale === 1 && alreadyWebFormat && blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + (png ? ".png" : ".jpg");
    return new File([blob], name, {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

function decodeImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

// ---- Upload slots -----------------------------------------------------

let active = 0;
const waiting: Array<() => void> = [];

/**
 * Run `fn` once an upload slot is free. Slots are released in `finally`,
 * so a failed or aborted upload never leaks one.
 */
export async function withUploadSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= UPLOAD_CONCURRENCY) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  active += 1;
  try {
    return await fn();
  } finally {
    active -= 1;
    const next = waiting.shift();
    if (next) next();
  }
}

/**
 * Cloudflare's wording blames the user's connection, which sent an
 * organiser looking for a Wi-Fi problem that didn't exist. Say what
 * actually happened and what helps.
 */
export function friendlyCloudflareUploadError(message: string): string {
  if (/slow connection|timed out|time out|5408/i.test(message)) {
    return "The upload took too long and Cloudflare gave up on it. Please try again - on mobile data, add a few photos at a time.";
  }
  return message;
}
