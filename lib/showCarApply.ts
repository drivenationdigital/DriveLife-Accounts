/**
 * Public show-car application - types, query, and mutation hooks
 * for the apply page.
 *
 * The page is end-user facing: anyone with the link can submit. No
 * auth required; we don't surface the apiClient JWT path for these
 * routes. The server enforces validation (event published, ticket is
 * a show car, category open + has capacity).
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import type { EventSite } from "./apiTypes";
import { formatRegionCurrency, type Region } from "./regions";

// ============================================================
// Types
// ============================================================

export interface ShowCarPublicCategory {
  /** Encrypted ticket id - the public face of the show car ticket
   *  row. Used as the dropdown value and round-tripped to the apply
   *  endpoint. */
  encrypted_id: string;
  name: string;
  description: string;
  /** True when the category has a price > 0. Free categories still
   *  flow through application + approval; approval just auto-confirms
   *  without a payment step. */
  require_ticket: boolean;
  ticket_cost: number;
  /** null when the category has unlimited capacity (no stock set on
   *  the ticket). Otherwise the remaining count after subtracting
   *  pending + approved + paid applications. */
  spaces_remaining: number | null;
  is_full: boolean;
  /** "YYYY-MM-DD" - null if the organiser hasn't bounded the window
   *  on that side. */
  applications_open: string | null;
  applications_close: string | null;
}

export interface ShowCarPublicResponse {
  event_id: number;
  event_title: string;
  /** Event date range, Y-m-d. Optional so the page still builds against
   *  a WP deployment that predates these fields. */
  event_start_date?: string | null;
  event_end_date?: string | null;
  /** The organiser's "Show car information" copy (sanitised HTML). */
  event_info?: string | null;
  /** The blog this event lives on - see the note in carClubApply.ts.
   *  Optional until the public endpoints echo one back. */
  site?: EventSite;
  show_cars_enabled: boolean;
  categories: ShowCarPublicCategory[];
}

export interface ShowCarApplicationBody {
  eventEid: string;
  ticketEid: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Contact number. Required on the form, matching the CE apply page. */
  phone: string;
  carMake: string;
  carModel: string;
  carYear: string;
  carReg: string;
  carColor: string;
  /** "yes" when attending with a club, else "no". Drives carClub below. */
  attendingWithClub: "yes" | "no";
  /** Club name - only meaningful when attendingWithClub is "yes";
   *  cleared on submit otherwise so a stale value can't be sent. */
  carClub: string;
  /** Instagram handle without the leading "@". Optional. */
  instagram: string;
  notes: string;
  /** Optional Cloudflare imagedelivery URL from `uploadShowCarPhoto`.
   *  Empty string when no photo was attached - the PHP endpoint
   *  treats empty / missing as "no photo" and stores NULL. */
  photoUrl: string;
}

export interface ShowCarApplicationResponse {
  success: true;
  application_id: number;
}

// ============================================================
// Photo upload (unauthenticated)
// ============================================================

/**
 * Upload a show car photo to Cloudflare Images.
 *
 * Two-step flow, simpler than the authenticated event-image flow:
 *
 *   1. POST /show-car-photo-upload-url  → { upload_url, media_id }
 *   2. multipart POST file → upload_url, capture delivery URL from
 *      CF's response.result.variants[0]
 *
 * No /confirm step because the only place we persist this URL is the
 * applications row, and that happens via the normal apply POST.
 *
 * Throws on any failure (mint, network, or CF rejection) so callers
 * can show an error and re-enable their submit button. The caller
 * supplies an AbortSignal so a user who cancels the form mid-upload
 * doesn't end up creating an orphan CF image.
 */
interface PhotoMintResponse {
  success: true;
  upload_url: string;
  media_id: string;
}

export interface UploadShowCarPhotoArgs {
  eventEid: string;
  file: File;
  signal?: AbortSignal;
}

export async function uploadShowCarPhoto(
  args: UploadShowCarPhotoArgs,
): Promise<string> {
  const { eventEid, file, signal } = args;

  // Step 1 - mint a one-time CF direct-upload URL.
  const mint = await apiPost<PhotoMintResponse, { eventEid: string }>(
    "/show-car-photo-upload-url",
    { eventEid },
  );

  if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");

  // Step 2 - POST the file directly to Cloudflare. No auth headers
  // here - CF rejects extra headers on direct-creator uploads.
  const form = new FormData();
  form.append("file", file);

  const cfRes = await fetch(mint.upload_url, {
    method: "POST",
    body: form,
    signal,
  });

  if (!cfRes.ok) {
    let message = `Cloudflare upload failed (HTTP ${cfRes.status})`;
    try {
      const cfBody = await cfRes.json();
      if (cfBody?.errors?.[0]?.message)
        message = String(cfBody.errors[0].message);
      else if (cfBody?.error) message = String(cfBody.error);
    } catch {
      // Non-JSON; stick with the generic message.
    }
    throw new Error(message);
  }

  // Cloudflare's success body includes one delivery URL per configured
  // variant in result.variants[], in NO guaranteed order - this account
  // has "public", "thumbnail" and "blurred" variants, and taking [0]
  // blindly stored blurred URLs for some applications (which then
  // rendered blurred in the organiser dashboard). Pick "public"
  // explicitly, fall back to any non-blurred variant, then to [0].
  const cfBody = (await cfRes.json()) as {
    result?: { variants?: unknown };
  };
  const variants = (
    Array.isArray(cfBody?.result?.variants) ? cfBody.result.variants : []
  ).filter((v): v is string => typeof v === "string");
  if (variants.length === 0) {
    throw new Error("Cloudflare didn't return a delivery URL.");
  }

  return (
    variants.find((v) => v.endsWith("/public")) ??
    variants.find((v) => !v.endsWith("/blurred")) ??
    variants[0]
  );
}

// ============================================================
// Hooks
// ============================================================

/**
 * Fetch event title + show car categories. `enabled` is gated by
 * `!!eventEid` so the query stays idle until the route param is in.
 */
export function useShowCarPublic(eventEid: string) {
  return useQuery<ShowCarPublicResponse, Error>({
    queryKey: ["event-show-cars-public", eventEid],
    queryFn: () =>
      apiGet<ShowCarPublicResponse>(
        `/event-show-cars-public?eid=${encodeURIComponent(eventEid)}`,
      ),
    enabled: !!eventEid,
    // Capacity counts can drift fast during a busy application period
    // - keep the data fresh but don't hammer the endpoint.
    staleTime: 30_000,
  });
}

/**
 * Submit the application form. On success the caller swaps the page
 * to a "thanks" state; on error the caller surfaces `error.message`
 * inline.
 */
export function useSubmitShowCarApplication() {
  return useMutation<ShowCarApplicationResponse, Error, ShowCarApplicationBody>(
    {
      mutationFn: (body) =>
        apiPost<ShowCarApplicationResponse, ShowCarApplicationBody>(
          "/event-show-car-apply",
          body,
        ),
    },
  );
}

// ============================================================
// Availability helpers
// ============================================================

/**
 * Returns true when the category is open today (within its
 * applications_open / applications_close window). The server also
 * validates this on submit - this just dims the dropdown option so
 * the user can see what's available without trying to submit.
 */
export function isCategoryOpenToday(c: ShowCarPublicCategory): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (c.applications_open && today < c.applications_open) return false;
  if (c.applications_close && today > c.applications_close) return false;
  return true;
}

/**
 * Build the suffix shown next to a category name in the dropdown:
 * price plus, where relevant, "full"/"closed". Deliberately no
 * remaining-space counts - the organiser asked for capacity numbers
 * to stay off the public form.
 */
export function categoryAvailabilityLabel(
  c: ShowCarPublicCategory,
  region: Region,
): string {
  const bits: string[] = [];
  bits.push(
    c.require_ticket ? formatRegionCurrency(c.ticket_cost, region) : "Free",
  );
  if (c.is_full) bits.push("full");
  else if (!isCategoryOpenToday(c)) bits.push("closed");
  return bits.join(" · ");
}
