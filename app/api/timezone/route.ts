/**
 * Timezone lookup for a lat/lng - a thin proxy onto the Google Time
 * Zone API.
 *
 * Why a route rather than calling Google from the browser:
 *
 *   1. The key. The Time Zone API is a web service, and web service
 *      calls can't be locked down with an HTTP-referrer restriction the
 *      way the Maps JS key is (see googleMapsLoader). A key that works
 *      from client JS is a key anyone can bill against. Keeping the
 *      call server-side means GOOGLE_MAPS_SERVER_KEY can be IP- or
 *      unrestricted-but-private, and never ships to the browser.
 *   2. CORS. Browser access to Google's web service endpoints is not
 *      something to build a required feature on top of.
 *
 * Falls back to NEXT_PUBLIC_GOOGLE_MAPS_KEY when no server key is
 * configured, so this works in a dev environment with the single key
 * that's already in .env.local. Set GOOGLE_MAPS_SERVER_KEY in
 * production and restrict it separately.
 */

import { NextResponse } from "next/server";

/** Google needs a timestamp to decide DST. "Now" is right: the offset
 *  we care about is the one the organiser is reasoning about while
 *  filling the form, and the zone ID itself doesn't change with it. */
function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

interface GoogleTimeZoneResponse {
  status: string;
  timeZoneId?: string;
  timeZoneName?: string;
  rawOffset?: number;
  dstOffset?: number;
  errorMessage?: string;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const { lat, lng } =
    (body as { lat?: unknown; lng?: unknown } | null) ?? {};

  // Validate here rather than passing through - Google charges for a
  // request whether or not the coordinates were meaningful.
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      { error: "lat and lng must be numbers within valid coordinate ranges." },
      { status: 400 },
    );
  }

  const key =
    process.env.GOOGLE_MAPS_SERVER_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "No Google Maps key configured." },
      { status: 503 },
    );
  }

  const url =
    `https://maps.googleapis.com/maps/api/timezone/json` +
    `?location=${lat},${lng}` +
    `&timestamp=${nowSeconds()}` +
    `&key=${encodeURIComponent(key)}`;

  let data: GoogleTimeZoneResponse;
  try {
    const res = await fetch(url, {
      // Zone boundaries effectively never move, so a coordinate's zone
      // is safe to cache for a day. Cuts repeat cost when an organiser
      // re-picks the same venue.
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Time Zone API returned ${res.status}.` },
        { status: 502 },
      );
    }
    data = (await res.json()) as GoogleTimeZoneResponse;
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the Time Zone API." },
      { status: 502 },
    );
  }

  // ZERO_RESULTS is the normal answer for a point at sea - not an
  // error, but nothing usable either. The client falls back on any
  // non-200, so returning 404 here routes it to the offline guess.
  if (data.status !== "OK" || !data.timeZoneId) {
    return NextResponse.json(
      { error: data.errorMessage ?? data.status ?? "No timezone found." },
      { status: data.status === "ZERO_RESULTS" ? 404 : 502 },
    );
  }

  return NextResponse.json({
    timeZoneId: data.timeZoneId,
    timeZoneName: data.timeZoneName ?? null,
  });
}
