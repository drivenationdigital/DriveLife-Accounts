/**
 * Lazy loader for the Google Maps JavaScript API + Places library.
 *
 * Why a custom loader rather than `@googlemaps/js-api-loader`?
 *   - Avoids adding a runtime dependency for a 30-line concern.
 *   - We only need the Places library, not the full Maps experience —
 *     the static-map preview is rendered as a plain <img>, no JS map
 *     instance required.
 *
 * Behaviour:
 *   - First call inserts a <script> tag and returns a promise that
 *     resolves once `window.google.maps.places` is available.
 *   - Subsequent calls return the same promise (dedup).
 *   - If the key is missing, rejects with a descriptive error so the
 *     UI can show a sensible fallback rather than failing silently.
 *
 * Restrictions:
 *   - The key MUST be HTTP-referrer restricted in the Google Cloud
 *     console — exposing an unrestricted maps key in client JS would
 *     let anyone bill against your account.
 */

declare global {
  // Minimal ambient declarations so we don't pull in @types/google.maps
  // for a small surface area. Each call site casts narrowly so this
  // doesn't leak as broad `any` typing.
  interface Window {
    google?: {
      maps?: {
        places?: unknown;
        importLibrary?: (name: string) => Promise<unknown>;
      };
    };
  }
}

let loaderPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (loaderPromise) return loaderPromise;

  loaderPromise = (async () => {
    if (typeof window === "undefined") {
      throw new Error("loadGoogleMaps called on server");
    }

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) {
      throw new Error(
        "NEXT_PUBLIC_GOOGLE_MAPS_KEY is not set — add it to .env.local",
      );
    }

    // Inject the bootstrap script if it isn't there yet. We don't
    // early-return when window.google.maps already exists, because
    // with `loading=async` the namespace is created before the
    // libraries are populated — only `importLibrary()` reliably
    // tells us when classes are ready.
    if (!document.querySelector("script[data-carevents-gmaps]")) {
      await new Promise<void>((resolve, reject) => {
        const callbackName = "__carevents_gmaps_loaded";
        (window as unknown as Record<string, () => void>)[callbackName] =
          () => {
            resolve();
          };
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
          key,
        )}&libraries=places&loading=async&callback=${callbackName}`;
        script.async = true;
        script.dataset.careventsGmaps = "1";
        script.onerror = () => {
          loaderPromise = null;
          reject(new Error("Failed to load Google Maps script"));
        };
        document.head.appendChild(script);
      });
    }

    // Always await importLibrary — this is the only signal that the
    // Places classes are actually available. The call is idempotent
    // and cheap once the library is loaded.
    const importLibrary = window.google?.maps?.importLibrary;
    if (!importLibrary) {
      throw new Error("google.maps.importLibrary not available");
    }
    await importLibrary("places");
  })();

  return loaderPromise;
}
