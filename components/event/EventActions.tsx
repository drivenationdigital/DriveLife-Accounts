"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCloneEvent,
  useCancelEvent,
  useDeleteEvent,
} from "@/lib/eventActions";
import { useAction } from "@/context/ActionContext";
import { eventEditorPath } from "@/lib/siteRoutes";

/**
 * Event overview action toolbar: Edit Event / View / three-dot menu.
 *
 * Drop into the overview header:
 *   <EventActions eid={encryptedEid} site={event.site} permalink={event.permalink} />
 *
 * - Edit  → the editor (/events/{eid}/edit)
 * - View  → the public carevents page (permalink), new tab
 * - Menu  → Add Manual Order (placeholder), Duplicate, Cancel, Delete
 *
 * Clone navigates to the new draft's editor. Cancel/Delete confirm
 * first (Delete is danger-styled) and, on success, send the user back
 * to the events list.
 */
export function EventActions({
  eid,
  site,
  permalink,
  onAddManualOrder,
}: {
  /** Encrypted event id (as used in the edit route). */
  eid: string;
  /** Region the eid belongs to ("uk", "us", …). Encrypted ids repeat
   *  across regions, so without this the destructive actions below can
   *  resolve to a different event entirely. */
  site?: string;
  /** Public carevents URL for the View button. */
  permalink?: string;
  /** Optional: opens the manual-order flow (built later). */
  onAddManualOrder?: () => void;
}) {
  const router = useRouter();
  const runAction = useAction();

  const clone = useCloneEvent();
  const cancel = useCancelEvent();
  const del = useDeleteEvent();

  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const busy = clone.isPending || cancel.isPending || del.isPending;

  const handleView = () => {
    if (permalink) {
      window.open(permalink, "_blank", "noopener,noreferrer");
    }
  };

  const handleDuplicate = async () => {
    setMenuOpen(false);
    const res = await runAction({
      confirm: {
        title: "Duplicate this event?",
        message:
          "A copy will be created as a draft, with the same details, tickets and settings. You'll be taken straight to it.",
        confirmLabel: "Duplicate",
        cancelLabel: "Cancel",
      },
      loadingLabel: "Duplicating event...",
      successTitle: "Event duplicated",
      successMessage: "The copy has been created as a draft.",
      errorTitle: "Couldn't duplicate the event",
      run: () => clone.mutateAsync({ eid, site }),
    });
    if (res) router.push(res.edit_url);
  };

  const handleCancel = async () => {
    setMenuOpen(false);
    const res = await runAction({
      confirm: {
        title: "Cancel this event?",
        message:
          "The event will be marked as cancelled and will no longer accept bookings.",
        confirmLabel: "Cancel Event",
        cancelLabel: "Keep Event",
        danger: true,
      },
      loadingLabel: "Cancelling event...",
      successTitle: "Event cancelled",
      successMessage: "It no longer accepts bookings.",
      errorTitle: "Couldn't cancel the event",
      run: () => cancel.mutateAsync({ eid, site }),
    });
    if (res) router.push("/events");
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    const res = await runAction({
      confirm: {
        title: "Delete this event?",
        message:
          "The event will be removed from your events. This action cannot be undone.",
        confirmLabel: "Delete Event",
        cancelLabel: "Keep Event",
        danger: true,
      },
      loadingLabel: "Deleting event...",
      successTitle: "Event deleted",
      successMessage: "It's been removed from your events.",
      errorTitle: "Couldn't delete the event",
      run: () => del.mutateAsync({ eid, site }),
    });
    if (res) router.push("/events");
  };

  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      {/* Edit */}
      <button
        type="button"
        onClick={() => router.push(eventEditorPath(eid, site))}
        style={btnDark}
      >
        <PencilIcon /> Edit Event
      </button>

      {/* View */}
      <button
        type="button"
        onClick={handleView}
        disabled={!permalink}
        style={{ ...btnLight, opacity: permalink ? 1 : 0.5 }}
      >
        <ExternalIcon /> View
      </button>

      {/* Three-dot menu */}
      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label="More actions"
          disabled={busy}
          style={{ ...btnLight, padding: "8px 10px" }}
        >
          <DotsIcon />
        </button>

        {menuOpen && (
          <div role="menu" style={menuStyle}>
            {/* <MenuItem
              onClick={() => {
                setMenuOpen(false);
                onAddManualOrder?.();
              }}
              icon={<PlusCircleIcon />}
            >
              Add Manual Order
            </MenuItem> */}
            <MenuItem
              onClick={handleDuplicate}
              icon={<CopyIcon />}
              disabled={clone.isPending}
            >
              {clone.isPending ? "Duplicating…" : "Duplicate Event"}
            </MenuItem>

            <div style={{ height: 1, background: "var(--border, #ecebe6)", margin: "6px 0" }} />

            <MenuItem onClick={handleCancel} icon={<BanIcon />} danger>
              Cancel Event
            </MenuItem>
            <MenuItem onClick={handleDelete} icon={<TrashIcon />} danger>
              Delete Event
            </MenuItem>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  icon,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 14px",
        border: "none",
        background: "transparent",
        cursor: disabled ? "default" : "pointer",
        fontSize: 14,
        color: danger ? "var(--danger, #c0492f)" : "var(--ink, #1f1d18)",
        textAlign: "left",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--ink-50, #f6f5f2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ display: "inline-flex", width: 16 }}>{icon}</span>
      {children}
    </button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 16px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
const btnDark: React.CSSProperties = {
  ...btnBase,
  background: "var(--ink, #1f1d18)",
  color: "#fff",
  border: "none",
};
const btnLight: React.CSSProperties = {
  ...btnBase,
  background: "#fff",
  color: "var(--ink, #1f1d18)",
  border: "1px solid var(--border, #ecebe6)",
};
const menuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  minWidth: 200,
  background: "#fff",
  borderRadius: 12,
  border: "1px solid var(--border, #ecebe6)",
  boxShadow: "0 12px 32px rgba(31,29,24,0.16)",
  padding: "6px 0",
  zIndex: 50,
};

// ─── Icons ────────────────────────────────────────────────────────────

const ic = {
  width: 16,
  height: 16,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function PencilIcon() {
  return (<svg viewBox="0 0 24 24" {...ic}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>);
}
function ExternalIcon() {
  return (<svg viewBox="0 0 24 24" {...ic}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>);
}
function DotsIcon() {
  return (<svg viewBox="0 0 24 24" {...ic}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>);
}
function PlusCircleIcon() {
  return (<svg viewBox="0 0 24 24" {...ic}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>);
}
function CopyIcon() {
  return (<svg viewBox="0 0 24 24" {...ic}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>);
}
function BanIcon() {
  return (<svg viewBox="0 0 24 24" {...ic}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></svg>);
}
function TrashIcon() {
  return (<svg viewBox="0 0 24 24" {...ic}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>);
}
