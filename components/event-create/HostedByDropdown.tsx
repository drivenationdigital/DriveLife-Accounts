"use client";

import { useEventCreate } from "@/context/EventCreateContext";
import { useHostOptions, type HostOption } from "@/lib/hostOptions";
import { useEventRegion } from "@/lib/useEventSteps";

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
 * The options are region-scoped - a club you admin in the UK isn't a
 * host you can pick for a US event - so the list reloads when the
 * country changes, and the region picker resets the selection to "Me"
 * rather than carrying a stale club id across.
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
  // Clubs and venues are per-region, so this list changes with the
  // country picker above it.
  const region = useEventRegion();
  const { data, isLoading } = useHostOptions(region.key);

  // "Me" is guaranteed present. The API is documented to return it
  // first, but an empty list (a region with no host-options support, or
  // a failed fetch) would otherwise leave the select with nothing in
  // it, and the state defaults to hosting as "me" regardless.
  const fetched = data?.options ?? [];
  const options = fetched.some((o) => o.type === "me")
    ? fetched
    : [ME_OPTION, ...fetched];

  // Build a stable value string per option ("me", "club:123", …).
  const valueOf = (o: HostOption) =>
    o.type === "me" ? "me" : `${o.type}:${o.id}`;
  const storedValue =
    state.hostType === "me" ? "me" : `${state.hostType}:${state.hostId}`;
  // A stored host that isn't in this region's list would leave the
  // select showing its first option while state still held the old id.
  // Region changes already reset the host, so this only covers the gap
  // while the new region's options are in flight.
  const currentValue = options.some((o) => valueOf(o) === storedValue)
    ? storedValue
    : "me";

  const onChange = (raw: string) => {
    const picked = options.find((o) => valueOf(o) === raw);
    if (!picked) return;
    dispatch({ type: "SET_FIELD", key: "hostType", value: picked.type });
    dispatch({ type: "SET_FIELD", key: "hostId", value: picked.id });
    dispatch({ type: "SET_FIELD", key: "hostName", value: picked.name });
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
              {o.type === "me" ? "Me" : `${o.name}`}
              {o.type === "club" ? " (Club)" : o.type === "venue" ? " (Venue)" : ""}
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
