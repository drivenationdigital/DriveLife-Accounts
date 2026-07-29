"use client";

import { useEventCreate } from "@/context/EventCreateContext";
import { useHostOptions, type HostOption } from "@/lib/hostOptions";

/**
 * "Hosted by" dropdown — sits under the event title.
 *
 * Replaces the old three-card "Choose Event Type" step. Defaults to
 * "Me"; auto-populates any clubs the user owns/admins and venues they
 * own. If "Me" is the only option, the whole control hides itself (a
 * plain user with no clubs/venues never sees it).
 *
 * Writes hostType / hostId / hostName into the create-event context;
 * the save mapper turns hostType into the legacy event_type.
 */
export function HostedByDropdown() {
  const { state, dispatch } = useEventCreate();
  const { data, isLoading } = useHostOptions();

  const options = data?.options ?? [];

  // Hide entirely when the only option is "Me" (or nothing loaded yet
  // and there's no reason to show a single-choice control).
  const hasRealChoice = options.some((o) => o.type !== "me");
  if (!isLoading && !hasRealChoice) return null;

  // Build a stable value string per option ("me", "club:123", …).
  const valueOf = (o: HostOption) =>
    o.type === "me" ? "me" : `${o.type}:${o.id}`;
  const currentValue =
    state.hostType === "me" ? "me" : `${state.hostType}:${state.hostId}`;

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
