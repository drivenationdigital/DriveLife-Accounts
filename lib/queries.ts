import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import type {
  OrganiserEventsParams,
  OrganiserEventsResponse,
  EventParams,
  EventResponse,
  EventOrdersParams,
  EventOrdersResponse,
  EventShowCarsParams,
  EventShowCarsResponse,
  EventCarClubsParams,
  EventCarClubsResponse,
  ApplicationStatusApi,
  SiteKey,
} from "./apiTypes";

/** Shape returned by GET /event-categories. Mirrors the response from
 *  `dl-accounts-event-categories.php`. Kept here next to the hook so a
 *  schema change in the WP route is one obvious place to update. */
export type EventCategoriesResponse = {
  success: boolean;
  categories: { id: number; name: string; slug: string }[];
};

// Centralised query-key factory so invalidations stay in sync with keys.
//
// `site` sits inside the trailing options object rather than next to
// `eid` so existing prefix invalidations (["event", eid]) keep matching.
export const queryKeys = {
  organiserEvents: (params: OrganiserEventsParams) =>
    ["organiser-events", params] as const,
  event: (
    eid: string,
    site: SiteKey | undefined,
    orders_limit: number,
    apps_limit: number
  ) => ["event", eid, { site, orders_limit, apps_limit }] as const,
  eventOrders: (
    eid: string,
    site: SiteKey | undefined,
    limit: number,
    offset: number
  ) => ["event-orders", eid, { site, limit, offset }] as const,
  eventShowCars: (
    eid: string,
    site: SiteKey | undefined,
    status: ApplicationStatusApi | undefined,
    limit: number,
    offset: number
  ) => ["event-show-cars", eid, { site, status, limit, offset }] as const,
  eventCarClubs: (
    eid: string,
    site: SiteKey | undefined,
    status: ApplicationStatusApi | undefined,
    limit: number,
    offset: number
  ) => ["event-car-clubs", eid, { site, status, limit, offset }] as const,
  eventCategories: () => ["event-categories"] as const,
  eventEdit: (eid: string, site: SiteKey | undefined) =>
    ["event-edit", eid, { site }] as const,
};

export function useOrganiserEvents(params: OrganiserEventsParams = {}) {
  const normalised: OrganiserEventsParams = {
    filter_eventtype: params.filter_eventtype ?? 1,
    filter_eventdate: params.filter_eventdate ?? 1,
    page: params.page ?? 1,
    per_page: params.per_page ?? 20,
    // Empty string treated as no filter - same as omitting it.
    search: params.search?.trim() || undefined,
    // Left undefined on purpose: the list routes merge every region
    // when `site` is absent, which is the account view's default.
    site: params.site || undefined,
  };

  return useQuery<OrganiserEventsResponse>({
    queryKey: queryKeys.organiserEvents(normalised),
    queryFn: () =>
      apiPost<OrganiserEventsResponse>("/organiser-events", normalised),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep last page's data visible while loading the next
  });
}

/**
 * Loads a single event + first N orders + first N applications per status.
 *
 * `site` is the multisite blog key the event lives on ("uk", "us", …).
 * It comes from the `?site=` query param on the event page, which the
 * events list sets from `event.site.key`. Omitting it lets the API fall
 * back to its default site, so pre-multisite links still resolve.
 */
export function useEvent(
  eid: string | undefined,
  {
    site,
    orders_limit = 5,
    apps_limit = 5,
  }: { site?: SiteKey; orders_limit?: number; apps_limit?: number } = {}
) {
  return useQuery<EventResponse>({
    queryKey: queryKeys.event(eid ?? "", site, orders_limit, apps_limit),
    queryFn: () =>
      apiPost<EventResponse, EventParams>("/event", {
        eid: eid as string,
        site,
        orders_limit,
        apps_limit,
      }),
    enabled: Boolean(eid),
    staleTime: 30_000,
  });
}

export function useEventOrders(
  eid: string | undefined,
  {
    site,
    limit = 50,
    offset = 0,
    enabled = false,
  }: {
    site?: SiteKey;
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) {
  return useQuery<EventOrdersResponse>({
    queryKey: queryKeys.eventOrders(eid ?? "", site, limit, offset),
    queryFn: () =>
      apiPost<EventOrdersResponse, EventOrdersParams>("/event/orders", {
        eid: eid as string,
        site,
        limit,
        offset,
      }),
    enabled: enabled && Boolean(eid),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous page visible while loading next
  });
}

/**
 * Loads a paginated page of show-car applications, optionally filtered by
 * status. Disabled by default - enable once the Show Cars tab is active.
 */
export function useEventShowCars(
  eid: string | undefined,
  {
    site,
    status,
    limit = 100,
    offset = 0,
    enabled = false,
  }: {
    site?: SiteKey;
    status?: ApplicationStatusApi;
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) {
  return useQuery<EventShowCarsResponse>({
    queryKey: queryKeys.eventShowCars(eid ?? "", site, status, limit, offset),
    queryFn: () =>
      apiPost<EventShowCarsResponse, EventShowCarsParams>(
        "/event/show-cars",
        { eid: eid as string, site, status, limit, offset }
      ),
    enabled: enabled && Boolean(eid),
    staleTime: 30_000,
  });
}

export function useEventCarClubs(
  eid: string | undefined,
  {
    site,
    status,
    limit = 100,
    offset = 0,
    enabled = false,
  }: {
    site?: SiteKey;
    status?: ApplicationStatusApi;
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) {
  return useQuery<EventCarClubsResponse>({
    queryKey: queryKeys.eventCarClubs(eid ?? "", site, status, limit, offset),
    queryFn: () =>
      apiPost<EventCarClubsResponse, EventCarClubsParams>(
        "/event/car-clubs",
        { eid: eid as string, site, status, limit, offset }
      ),
    enabled: enabled && Boolean(eid),
    staleTime: 30_000,
  });
}

/**
 * Fetch the list of event categories used by the create-event page.
 * Mirrors the legacy WP form's category set (chunks 0+1+2 of
 * `get_categories(... orderby ID asc, exclude 1/9/10)` chunked at 7).
 *
 * Categories rarely change, so we use a generous staleTime - once
 * the page has them they're treated as fresh for 30 minutes. The
 * cache is keyed without parameters because the route returns a
 * single canonical list.
 */
export function useEventCategories() {
  return useQuery({
    queryKey: queryKeys.eventCategories(),
    queryFn: () => apiGet<EventCategoriesResponse>("/event-categories"),
    staleTime: 30 * 60_000, // 30 minutes
  });
}

// ============================================================
// Create event
// ============================================================

/** Body for POST /events. Mirrors the args defined in
 *  `dl-accounts-create-event.php`. */
export type CreateEventParams = {
  title: string;
  event_type: "general" | "dev_club" | "venue_dover";
  host_type?: "me" | "club" | "venue"; 
  host_id?: number | null;
};

/** Response shape from POST /events. `encrypted_id` is the canonical
 *  `eid` used by every other route in the API. */
export type CreateEventResponse = {
  success: boolean;
  event_id: number;
  encrypted_id: string;
  edit_url: string;
};

/**
 * Mutation hook for creating a draft event. The wizard calls this
 * after the user has chosen a type + entered a title; on success it
 * navigates to the editor with the returned `encrypted_id`.
 *
 * No automatic invalidation here - the My Events list will re-fetch
 * on its next visit naturally; eagerly invalidating would cause an
 * extra request the user doesn't see during the redirect.
 */
export function useCreateEvent() {
  return useMutation({
    mutationFn: (body: CreateEventParams) =>
      apiPost<CreateEventResponse, CreateEventParams>("/events", body),
  });
}

// ============================================================
// Load event for editing
// ============================================================

/**
 * Fetch the editor payload for a given event by its encrypted id.
 * Used by the editor page when loading from `/events/new?eid=…`.
 *
 * The query is gated on a non-empty eid; passing `null`/`""` keeps
 * the hook idle so the editor's brand-new-event flow doesn't
 * fire a network request with a missing identifier.
 *
 * staleTime is 0 because the editor is the source of truth while
 * the user is editing - we don't want a refocus-refetch to throw
 * away unsaved local edits. The TanStack default of "stale on
 * mount, fresh while window has focus" would do that. We also turn
 * off refetch-on-window-focus for the same reason.
 *
 * `site` is the multisite blog key the event lives on. Encrypted ids
 * are only unique within a site, so without it a US eid resolves
 * against the UK blog - usually a 404, but a silent mismatch when the
 * organiser happens to own a UK event with the same post id.
 */
export function useEventForEdit(
  eid: string | null | undefined,
  site?: SiteKey,
) {
  const safeEid = (eid ?? "").trim();
  return useQuery({
    queryKey: queryKeys.eventEdit(safeEid, site),
    queryFn: () =>
      apiGet<import("./apiTypes").ApiEventEditResponse>(
        `/event-edit?eid=${encodeURIComponent(safeEid)}` +
          (site ? `&site=${encodeURIComponent(site)}` : ""),
      ),
    enabled: safeEid.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
