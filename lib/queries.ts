import { useQuery } from "@tanstack/react-query";
import { apiPost } from "./apiClient";
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
} from "./apiTypes";

// Centralised query-key factory so invalidations stay in sync with keys.
export const queryKeys = {
  organiserEvents: (params: OrganiserEventsParams) =>
    ["organiser-events", params] as const,
  event: (eid: string, orders_limit: number, apps_limit: number) =>
    ["event", eid, { orders_limit, apps_limit }] as const,
  eventOrders: (eid: string, limit: number, offset: number) =>
    ["event-orders", eid, { limit, offset }] as const,
  eventShowCars: (
    eid: string,
    status: ApplicationStatusApi | undefined,
    limit: number,
    offset: number
  ) => ["event-show-cars", eid, { status, limit, offset }] as const,
  eventCarClubs: (
    eid: string,
    status: ApplicationStatusApi | undefined,
    limit: number,
    offset: number
  ) => ["event-car-clubs", eid, { status, limit, offset }] as const,
};

export function useOrganiserEvents(params: OrganiserEventsParams = {}) {
  const normalised: OrganiserEventsParams = {
    filter_eventtype: params.filter_eventtype ?? 1,
    filter_eventdate: params.filter_eventdate ?? 1,
  };

  return useQuery<OrganiserEventsResponse>({
    queryKey: queryKeys.organiserEvents(normalised),
    queryFn: () =>
      apiPost<OrganiserEventsResponse>("/organiser-events", normalised),
    staleTime: 30_000,
  });
}

/** Loads a single event + first N orders + first N applications per status. */
export function useEvent(
  eid: string | undefined,
  orders_limit = 5,
  apps_limit = 5
) {
  return useQuery<EventResponse>({
    queryKey: queryKeys.event(eid ?? "", orders_limit, apps_limit),
    queryFn: () =>
      apiPost<EventResponse, EventParams>("/event", {
        eid: eid as string,
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
    limit = 50,
    offset = 0,
    enabled = false,
  }: { limit?: number; offset?: number; enabled?: boolean } = {}
) {
  return useQuery<EventOrdersResponse>({
    queryKey: queryKeys.eventOrders(eid ?? "", limit, offset),
    queryFn: () =>
      apiPost<EventOrdersResponse, EventOrdersParams>("/event/orders", {
        eid: eid as string,
        limit,
        offset,
      }),
    enabled: enabled && Boolean(eid),
    staleTime: 30_000,
  });
}

/**
 * Loads a paginated page of show-car applications, optionally filtered by
 * status. Disabled by default — enable once the Show Cars tab is active.
 */
export function useEventShowCars(
  eid: string | undefined,
  {
    status,
    limit = 100,
    offset = 0,
    enabled = false,
  }: {
    status?: ApplicationStatusApi;
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) {
  return useQuery<EventShowCarsResponse>({
    queryKey: queryKeys.eventShowCars(eid ?? "", status, limit, offset),
    queryFn: () =>
      apiPost<EventShowCarsResponse, EventShowCarsParams>(
        "/event/show-cars",
        { eid: eid as string, status, limit, offset }
      ),
    enabled: enabled && Boolean(eid),
    staleTime: 30_000,
  });
}

export function useEventCarClubs(
  eid: string | undefined,
  {
    status,
    limit = 100,
    offset = 0,
    enabled = false,
  }: {
    status?: ApplicationStatusApi;
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) {
  return useQuery<EventCarClubsResponse>({
    queryKey: queryKeys.eventCarClubs(eid ?? "", status, limit, offset),
    queryFn: () =>
      apiPost<EventCarClubsResponse, EventCarClubsParams>(
        "/event/car-clubs",
        { eid: eid as string, status, limit, offset }
      ),
    enabled: enabled && Boolean(eid),
    staleTime: 30_000,
  });
}
