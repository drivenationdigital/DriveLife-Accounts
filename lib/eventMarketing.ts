"use client";

import { useMutation } from "@tanstack/react-query";
import { apiPost } from "./apiClient";
import type { ApiEventMarketingOrganiser, SiteKey } from "./apiTypes";
import type { MarketingList } from "./marketingSettings";
import { useUpdateEvent } from "./eventMutations";
import type { ApiEventUpdateMarketing } from "./eventSaveMapper";

/**
 * The editor's Marketing step.
 *
 *   POST /event-marketing-lists { eid, site }
 *     → the Brevo/Mailchimp lists on the EVENT's primary organiser's
 *       account (a co-organiser or admin sees the account owner's lists,
 *       not their own). Mirrors /marketing-settings/lists, which is
 *       always the signed-in user's account.
 *
 *   POST /event-update?eid= { marketing: {...} }
 *     → the same route every other editor section saves through. The
 *       Marketing step autosaves its two controls the moment they change
 *       (a promo request should reach the team without waiting for the
 *       organiser to hit Save), so this wraps useUpdateEvent with just
 *       that section.
 */

export interface EventMarketingListsResponse {
  status: "success";
  lists: MarketingList[];
  organiser: ApiEventMarketingOrganiser;
}

export function useEventMarketingLists() {
  return useMutation<
    EventMarketingListsResponse,
    Error,
    { eid: string; site: SiteKey }
  >({
    mutationFn: ({ eid, site }) =>
      apiPost<EventMarketingListsResponse, { eid: string }>(
        "/event-marketing-lists",
        { eid },
        { site },
      ),
  });
}

/** Save only the marketing section of an existing event. */
export function useSaveEventMarketing() {
  const update = useUpdateEvent();
  return {
    ...update,
    save: (eid: string, site: SiteKey, marketing: ApiEventUpdateMarketing) =>
      update.mutateAsync({ eid, site, body: { marketing } }),
  };
}
