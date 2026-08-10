"use client";

import { useEventCreate } from "@/context/EventCreateContext";
import { RegionSelect } from "@/components/ui/RegionSelect";
import { DEFAULT_REGION_KEY, type RegionKey } from "@/lib/regions";

/**
 * Region picker on the create-event screen.
 *
 * Binds the shared RegionSelect to the create-event wizard's state, and
 * owns the one bit of behaviour specific to events: clearing the host
 * when the region changes.
 *
 * The region decides which WordPress site the event is created on,
 * which is fixed once it exists - a post lives on one blog, and moving
 * it between blogs is a migration rather than a field edit.
 */
export function RegionSelector() {
  const { state, dispatch } = useEventCreate();
  const value = (state.site ?? DEFAULT_REGION_KEY) as RegionKey;

  const onChange = (key: RegionKey) => {
    if (key !== value) {
      // Clubs and venues are per-blog, so the chosen host doesn't
      // survive a region change: a UK club id means nothing on the US
      // site, and sending it would either fail or attach the event to
      // an unrelated post. Reset to "Me" and let the user re-pick from
      // the new region's list, which HostedByDropdown refetches.
      dispatch({ type: "SET_FIELD", key: "hostType", value: "me" });
      dispatch({ type: "SET_FIELD", key: "hostId", value: null });
      dispatch({ type: "SET_FIELD", key: "hostName", value: "Me" });
    }
    dispatch({ type: "SET_FIELD", key: "site", value: key });
  };

  return (
    <div style={{ marginTop: 16 }}>
      <RegionSelect value={value} onChange={onChange} />
    </div>
  );
}
