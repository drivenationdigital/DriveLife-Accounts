/**
 * Save a remote image to the visitor's device.
 *
 * `<a download>` is ignored for cross-origin URLs, and the car photos live
 * on Cloudflare Images, so the file is fetched (the host allows it) and
 * handed over as a blob. If that fails - offline, a host without CORS -
 * the image opens in a new tab instead, where "Save image as" still works.
 */
export async function downloadImage(url: string, baseName: string) {
  const safe = baseName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "photo";
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg").split("+")[0];
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${safe}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
