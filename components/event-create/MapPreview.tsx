"use client";

import { useState } from "react";

import type { LatLng } from "@/context/EventCreateContext";

/**
 * Map preview using Google Static Maps API.
 *
 * Why static, not interactive?
 *   - This is a passive preview, not something the user pans/zooms.
 *     A static PNG is much lighter than loading the full Maps JS API
 *     a second time (the autocomplete already loads it for predictions,
 *     but the static map renders without ever instantiating a map).
 *   - One <img> tag, no extra runtime, deterministic loading.
 *
 * HiDPI:
 *   - We request `scale=2` so the map looks crisp on retina displays.
 *     The HTML width is the natural width — the browser downsamples
 *     automatically on standard-density screens.
 *
 * Fallback:
 *   - If no coords yet, we render the original placeholder block so
 *     the layout doesn't jump when a place is picked.
 *   - If the image fails to load (key missing, network, etc.), we fall
 *     back to the placeholder too.
 */
export function MapPreview({
  coords,
  label,
}: {
  coords: LatLng | null;
  /** Optional caption shown over the map. Useful for "{venue name}". */
  label?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const showImage = coords && key && !imgError;

  // Static Maps URL. Width/height are display pixels (we request 2x).
  // Marker colour uses a hex without # (Static Maps quirk). Gold-500
  // (`#b89855`) → `0xb89855`.
  const mapUrl = showImage
    ? buildStaticMapUrl(coords, key)
    : null;

  return (
    <div className="mt-3 h-40 sm:h-48 rounded-xl overflow-hidden border border-ink-200 bg-ink-100 relative">
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element --
              Static Maps is a remote image — Next/Image would proxy
              every request through our server, which doesn't help
              here. A plain <img> is cheaper. */}
          <img
            src={mapUrl ?? ""}
            alt={label ?? "Map preview"}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {label && (
            <div className="absolute left-2 bottom-2 bg-white/95 backdrop-blur-sm border border-ink-200 rounded-lg px-2.5 py-1 text-xs font-medium text-ink-900 shadow-sm max-w-[80%] truncate">
              {label}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-ink-400 text-sm">
          <div className="text-center">
            <i
              className="fa-solid fa-map-location-dot text-2xl mb-2 text-gold-500"
              aria-hidden
            />
            <p className="text-xs">
              {coords
                ? "Map preview unavailable"
                : "Map preview"}
            </p>
            {coords && (
              <p className="text-[11px]">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Build a Google Static Maps URL.
 *
 * Notes on parameters:
 *   - `size=600x250` — close to the 16:5 aspect of our preview box,
 *     scaled by `scale=2` for HiDPI.
 *   - `maptype=roadmap` — default styling. Leave the styled-map JSON
 *     for a later pass; the default is fine and free of pricing
 *     surprises.
 *   - `markers=color:0xb89855|<lat>,<lng>` — gold-500 marker.
 */
function buildStaticMapUrl(coords: LatLng, key: string): string {
  const params = new URLSearchParams({
    center: `${coords.lat},${coords.lng}`,
    zoom: "15",
    size: "600x250",
    scale: "2",
    maptype: "roadmap",
    markers: `color:0xb89855|${coords.lat},${coords.lng}`,
    key,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
