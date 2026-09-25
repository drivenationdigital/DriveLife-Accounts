"use client";

import { useEventCreate } from "@/context/EventCreateContext";
import {
  useAllHostOptions,
  useSuggestedSite,
  type HostOption,
} from "@/lib/hostOptions";
import { DEFAULT_REGION_KEY, resolveRegion } from "@/lib/regions";

/**
 * "Hosted by" dropdown - sits under the event title.
 *
 * Replaces the old three-card "Choose Event Type" step. Defaults to
 * "Me"; auto-populates any clubs the user owns/admins and venues they
 * own.
 *
 * The control always renders, even when "Me" is the only choice - a
 * user with no clubs or venues should still see who their event is
 * being created under, rather than have the field vanish and leave the
 * host unstated.
 *
 * Clubs and venues from EVERY region are listed, each labelled with its
 * country, and picking one switches the event's region to match - a
 * club you admin in the UK can only host a UK event, so the host decides
 * the country rather than the other way round. (Before this the list
 * followed the country picker, which starts on the UK for everyone, so a
 * US organiser saw only "Me" until they thought to change the country.)
 * Changing the country by hand still resets the host to "Me", since the
 * old host doesn't exist on the new region.
 *
 * Writes hostType / hostId / hostName into the create-event context;
 * the save mapper turns hostType into the legacy event_type.
 */

/** Fallback host, used until the API answers and if it comes back with
 *  no "me" entry. The user can always host as themselves, so this is
 *  never an invalid choice. */
const ME_OPTION: HostOption = { type: "me", id: null, name: "Me", role: "" };

export function HostedByDropdown() {
  const { state, dispatch } = useEventCreate();
  const { data, isLoading } = useAllHostOptions();
  // The region the event is currently on, mirroring RegionSelector's
  // fallback chain, so a host picked before any explicit country choice
  // still compares against the right region.
  const suggested = useSuggestedSite();
  const currentSite = state.site ?? suggested ?? DEFAULT_REGION_KEY;

  // "Me" is guaranteed present. The API is documented to return it
  // first, but an empty list (a region with no host-options support, or
  // a failed fetch) would otherwise leave the select with nothing in
  // it, and the state defaults to hosting as "me" regardless.
  const fetched = data?.options ?? [];
  const options = fetched.some((o) => o.type === "me")
    ? fetched
    : [ME_OPTION, ...fetched];

  // Build a stable value string per option ("me", "club:uk:123", …).
  // The region is part of it because post ids repeat across regions.
  const valueOf = (o: HostOption) =>
    o.type === "me" ? "me" : `${o.type}:${o.site ?? ""}:${o.id}`;
  const storedValue =
    state.hostType === "me"
      ? "me"
      : `${state.hostType}:${currentSite}:${state.hostId}`;
  // A stored host that isn't in the list (still loading, or reset by a
  // manual country change) shows as "Me" rather than the first option.
  const currentValue = options.some((o) => valueOf(o) === storedValue)
    ? storedValue
    : "me";

  const onChange = (raw: string) => {
    const picked = options.find((o) => valueOf(o) === raw);
    if (!picked) return;
    // A club or venue lives on one region: hosting under it puts the
    // event there. Set the region first so the country picker follows.
    if (picked.type !== "me" && picked.site && picked.site !== currentSite) {
      dispatch({ type: "SET_FIELD", key: "site", value: picked.site });
    }
    dispatch({ type: "SET_FIELD", key: "hostType", value: picked.type });
    dispatch({ type: "SET_FIELD", key: "hostId", value: picked.id });
    dispatch({ type: "SET_FIELD", key: "hostName", value: picked.name });
  };

  // "Burnyzz (Venue · USA)": the country tells the user which region
  // the event will be created on when they pick it.
  const labelOf = (o: HostOption) => {
    if (o.type === "me") return "Me";
    const kind = o.type === "club" ? "Club" : "Venue";
    const abbr = o.site ? resolveRegion(o.site).abbr : "";
    return `${o.name} (${kind}${abbr ? ` · ${abbr}` : ""})`;
  };

  return (
    <div style={{ marginTop: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--ink, #1f1d18)",
          marginBottom: 6,
        }}
      >
        Hosted by
      </label>

      <div style={{ position: "relative" }}>
        <select
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          style={{
            width: "100%",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            borderRadius: 10,
            border: "1px solid var(--border, #ecebe6)",
            background: "var(--ink-50, #faf9f7)",
            padding: "12px 40px 12px 14px",
            fontSize: 14,
            color: "var(--ink, #1f1d18)",
            cursor: isLoading ? "default" : "pointer",
          }}
        >
          {options.map((o) => (
            <option key={valueOf(o)} value={valueOf(o)}>
              {labelOf(o)}
            </option>
          ))}
        </select>

        {/* Chevron */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--muted, #6b6860)",
            display: "inline-flex",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      <p
        style={{
          fontSize: 12,
          color: "var(--muted, #6b6860)",
          marginTop: 6,
        }}
      >
        Choose whether this event is hosted by you, or by one of your clubs
        or venues.
      </p>
    </div>
  );
}
