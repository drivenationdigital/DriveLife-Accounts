"use client";

import { useUI } from "@/context/UIContext";
import { clickableRow } from "@/components/ui/clickableRow";
import type { Club } from "@/context/types";

/**
 * Car club applications as a table.
 *
 * Used by the Clubs tab (once per status group, each in its own
 * section card) and by the Overview tab's "Pending Car Clubs" card.
 *
 * The spaces column changes meaning with the group:
 *   - pending / rejected → "Spaces requested", the number the club
 *     asked for.
 *   - approved           → "Spaces sold", sold out of allocated, so
 *     the organiser can see take-up at a glance.
 *
 * Whole-row click opens the detail modal; approve / reject live in
 * there.
 */
export function ClubTable({
  clubs,
  spacesMode,
}: {
  clubs: Club[];
  spacesMode: "requested" | "sold";
}) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th className="col-thumb" />
          <th>Group Name</th>
          <th>{spacesMode === "sold" ? "Spaces Sold" : "Spaces Requested"}</th>
          <th>Contact</th>
          <th>Applied</th>
          <th className="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {clubs.map((club) => (
          <ClubTableRow key={club.id} club={club} spacesMode={spacesMode} />
        ))}
      </tbody>
    </table>
  );
}

/** Stable initials for the avatar - first letter of the first two words. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/** Deterministic tint (t1-t5) from the club name, so a club keeps the
 *  same avatar colour across every table it appears in. */
function tintClass(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return `t${(Math.abs(h) % 5) + 1}`;
}

function ClubTableRow({
  club,
  spacesMode,
}: {
  club: Club;
  spacesMode: "requested" | "sold";
}) {
  const { openDetail } = useUI();
  const open = () => openDetail({ type: "club", data: club });

  const dateLabel =
    club.status === "pending"
      ? club.appliedLabel
      : club.updatedLabel || club.appliedLabel;

  return (
    <tr {...clickableRow(open, { label: `Open ${club.name}` })}>
      <td className="col-thumb">
        <div className={`app-card-logo ${tintClass(club.name)} row-thumb-logo`}>
          {initials(club.name)}
        </div>
      </td>
      <td>
        <div className="customer-name">{club.name}</div>
      </td>
      <td className="mono">
        {spacesMode === "sold" ? (
          <>
            {club.ticketsSold}{" "}
            <span style={{ color: "var(--muted)" }}>
              / {club.membersAttending}
            </span>
          </>
        ) : (
          club.membersAttending
        )}
      </td>
      <td>
        <div className="showcar-owner">{club.contactName || "-"}</div>
        <div className="showcar-email">{club.contactEmail}</div>
      </td>
      <td style={{ color: "var(--muted)", fontSize: "12.5px" }}>{dateLabel}</td>
      <td className="col-actions">
        <button
          type="button"
          className="btn btn-secondary btn-view"
          onClick={open}
        >
          View
        </button>
      </td>
    </tr>
  );
}
