"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { LatLng } from "@/context/EventCreateContext";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

/**
 * Location autocomplete input with custom-styled dropdown.
 *
 * Architecture choices:
 *
 *   1. Custom dropdown (not Google's default `pac-container`).
 *      Google's widget injects its own UI which is hard to style to
 *      match this app's design tokens. Calling AutocompleteService
 *      directly + rendering our own listbox keeps the input + dropdown
 *      consistent with the rest of the form.
 *
 *   2. Session tokens. Places API bills "autocomplete + details" as
 *      a single session if you pass a fresh session token to all
 *      autocomplete predictions, then to the final details call.
 *      We mint a new token after each commit so each search is its
 *      own session. Without this, the per-keystroke autocomplete
 *      cost adds up quickly.
 *
 *   3. Debounced fetches. 200ms keeps the dropdown responsive while
 *      avoiding a request on every keystroke.
 *
 *   4. Cancellable. A bumping `requestId` ref discards stale results
 *      so a slow earlier query never overwrites a faster newer one.
 *
 *   5. Graceful failure. If the API key is missing or the script
 *      fails to load, the input still works as a plain text field -
 *      the user just doesn't get suggestions. We show a small notice
 *      when this happens so the dev knows what to fix.
 *
 * Props:
 *   - `value` is the displayed text. Parent owns it.
 *   - `onValueChange(text)` fires on every keystroke (typing).
 *   - `onPlacePicked({ name, address, coords })` fires once the user
 *     selects a prediction. Parent should sync `value` from this too
 *     if it wants the formatted address rather than what was typed.
 */

// Minimal surface type - we cast narrowly in code to avoid pulling in
// @types/google.maps for the small surface we use.
type AutocompletePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

type GMaps = {
  places: {
    AutocompleteService: new () => {
      getPlacePredictions: (
        req: {
          input: string;
          sessionToken?: unknown;
          types?: string[];
          componentRestrictions?: { country?: string | string[] };
        },
        cb: (
          predictions: AutocompletePrediction[] | null,
          status: string,
        ) => void,
      ) => void;
    };
    AutocompleteSessionToken: new () => unknown;
    PlacesService: new (attribution: HTMLElement) => {
      getDetails: (
        req: { placeId: string; fields: string[]; sessionToken?: unknown },
        cb: (place: PlaceDetails | null, status: string) => void,
      ) => void;
    };
    PlacesServiceStatus: { OK: string };
  };
};

type PlaceDetails = {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: { lat: () => number; lng: () => number };
  };
};

const DEBOUNCE_MS = 200;

export function LocationAutocomplete({
  value,
  onValueChange,
  onPlacePicked,
  placeholder,
}: {
  value: string;
  onValueChange: (text: string) => void;
  onPlacePicked: (place: {
    name: string;
    address: string;
    coords: LatLng;
  }) => void;
  placeholder?: string;
}) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  // Hidden div we hand to PlacesService - it uses this to attribute
  // results ("Powered by Google"). Required by the API; we just keep
  // it offscreen.
  const attributionRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // ---- Boot Google Maps once on mount. ---------------------------
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;
        const g = (window as unknown as { google: { maps: GMaps } }).google
          .maps;
        sessionTokenRef.current = new g.places.AutocompleteSessionToken();
        setReady(true);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.warn("[location-autocomplete]", err.message);
        setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Close dropdown on outside click. --------------------------
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // ---- Fetch predictions on debounced text change. ---------------
  const requestPredictions = (input: string) => {
    if (!ready) return;
    if (!input.trim()) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    const myId = ++requestIdRef.current;
    const g = (window as unknown as { google: { maps: GMaps } }).google.maps;
    const svc = new g.places.AutocompleteService();
    svc.getPlacePredictions(
      {
        input,
        sessionToken: sessionTokenRef.current,
        // No types restriction so users can pick venues, addresses,
        // postcodes, etc. - same flexibility as the original mockup.
      },
      (results, status) => {
        // Stale result - discard.
        if (myId !== requestIdRef.current) return;
        if (status !== g.places.PlacesServiceStatus.OK || !results) {
          setPredictions([]);
          setOpen(false);
          return;
        }
        setPredictions(results);
        setOpen(true);
        setHighlight(0);
      },
    );
  };

  const handleChange = (text: string) => {
    onValueChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => requestPredictions(text),
      DEBOUNCE_MS,
    );
  };

  // ---- Pick a prediction → fetch full details for coords + address. ----
  const pick = (prediction: AutocompletePrediction) => {
    setOpen(false);
    setPredictions([]);

    if (!ready || !attributionRef.current) {
      // Fall back to using just the description text - better than nothing.
      onValueChange(prediction.description);
      return;
    }
    const g = (window as unknown as { google: { maps: GMaps } }).google.maps;
    const places = new g.places.PlacesService(attributionRef.current);
    places.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["name", "formatted_address", "geometry"],
        sessionToken: sessionTokenRef.current,
      },
      (place, status) => {
        if (status !== g.places.PlacesServiceStatus.OK || !place) {
          // Fall back: at least keep the user's selection visible.
          onValueChange(prediction.description);
          return;
        }
        const loc = place.geometry?.location;
        if (!loc) {
          onValueChange(place.formatted_address ?? prediction.description);
          return;
        }
        const name =
          place.name ?? prediction.structured_formatting?.main_text ?? "";
        const address = place.formatted_address ?? prediction.description;
        // Compose the field text the way the original mockup does:
        // "<name>, <address>" if both present and the address doesn't
        // already start with the name (avoids "Foo Cafe, Foo Cafe, ...").
        const text =
          name && !address.toLowerCase().startsWith(name.toLowerCase())
            ? `${name}, ${address}`
            : address;
        onValueChange(text);
        onPlacePicked({
          name,
          address,
          coords: { lat: loc.lat(), lng: loc.lng() },
        });
        // Mint a new session token for the next search.
        sessionTokenRef.current = new g.places.AutocompleteSessionToken();
      },
    );
  };

  // ---- Keyboard nav: ↑ ↓ Enter Esc. ------------------------------
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + predictions.length) % predictions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = predictions[highlight];
      if (picked) pick(picked);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <i
        className="fa-solid fa-location-dot absolute left-4 top-6 -translate-y-1/2 text-ink-400 pointer-events-none"
        aria-hidden
      />
      <input
        id={id}
        type="text"
        className="input has-icon"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
      />

      {/* Custom-styled dropdown. Anchored absolutely below the input. */}
      {open && predictions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-30 left-0 right-0 top-full mt-2 bg-white border border-ink-200 rounded-xl shadow-lg overflow-hidden"
        >
          {predictions.map((p, i) => {
            const main = p.structured_formatting?.main_text ?? p.description;
            const sub = p.structured_formatting?.secondary_text;
            const active = i === highlight;
            return (
              <li
                key={p.place_id}
                role="option"
                aria-selected={active}
                className={`px-4 py-3 text-sm cursor-pointer flex items-start gap-3 ${
                  active ? "bg-gold-50" : "hover:bg-ink-50"
                }`}
                onMouseEnter={() => setHighlight(i)}
                // mousedown rather than click so the input doesn't
                // lose focus before we pick (focus-blur ordering).
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(p);
                }}
              >
                <i
                  className="fa-solid fa-location-dot text-gold-500 mt-0.5 text-xs"
                  aria-hidden
                />
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-ink-900 truncate">
                    {main}
                  </span>
                  {sub && (
                    <span className="block text-xs text-ink-500 truncate">
                      {sub}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Required by PlacesService for attribution; positioned offscreen. */}
      <div
        ref={attributionRef}
        className="absolute -left-[9999px]"
        aria-hidden
      />

      {/* Quiet error notice - only shown when the script failed to load. */}
      {loadError && (
        <p className="mt-2 text-xs text-ink-400">
          Search unavailable - type the address manually.
        </p>
      )}
    </div>
  );
}
