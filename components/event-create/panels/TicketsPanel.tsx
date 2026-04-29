"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  useEventCreate,
  type Ticket,
  type TicketSection,
  type TicketSourceMode,
} from "@/context/EventCreateContext";
import { EVENT_CREATE_STEP_COUNT, adjacentSteps } from "@/lib/eventCreateSteps";
import { formatEditorDate } from "@/lib/formatEditorDate";

import { PanelHeader } from "../PanelHeader";
import { TicketDrawer } from "../TicketDrawer";
import { SectionDrawer } from "../SectionDrawer";

/**
 * Step 5 of the wizard.
 *
 * Three modes (`ticketSource`):
 *   - "ce"        → managed CarEvents ticketing. Full ticket list +
 *                   fee toggle + show-attendees toggle.
 *   - "external"  → URL field + additional-info textarea. No list.
 *   - "none"      → entry-info textarea + register-required checkbox.
 *
 * Each mode keeps its own fields in state — switching modes does
 * not wipe anything, so users can experiment without losing entries.
 *
 * Within "ce" mode, the list contains both Tickets and Sections in
 * a single flat array, ordered by index. Drag-to-reorder uses the
 * same HTML5 DnD pattern as Gallery. Click-to-reorder via
 * up/down chevrons is provided as a keyboard / mobile fallback —
 * surfaced inline next to the edit/delete actions on hover (or
 * always-visible via focus).
 */
export function TicketsPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { prev, next } = adjacentSteps("tickets");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- Drawer state ----
  // editingTicket / editingSection: null means the drawer is closed.
  // To open a fresh "Add" form we set them to a sentinel object the
  // drawer recognises as "new" — easier than juggling a separate
  // "open" boolean for each.
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TicketSection | null>(
    null,
  );

  const openNewTicket = () => {
    setEditingTicket(null);
    setTicketDrawerOpen(true);
  };
  const openEditTicket = (t: Ticket) => {
    setEditingTicket(t);
    setTicketDrawerOpen(true);
  };
  const openNewSection = () => {
    setEditingSection(null);
    setSectionDrawerOpen(true);
  };
  const openEditSection = (s: TicketSection) => {
    setEditingSection(s);
    setSectionDrawerOpen(true);
  };

  // ---- DnD reorder ----
  // Same pattern as Gallery: track dragIdx + dropIdx in local state,
  // commit the new array to the reducer once on drop.
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const onDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const onDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropIdx !== idx) setDropIdx(idx);
  };
  const onDragEnd = () => {
    setDragIdx(null);
    setDropIdx(null);
  };
  const onDrop = (targetIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) {
      onDragEnd();
      return;
    }
    const next = [...state.ticketList];
    const [moved] = next.splice(dragIdx, 1);
    if (moved) {
      next.splice(targetIdx, 0, moved);
      dispatch({ type: "REORDER_TICKET_LIST", items: next });
    }
    onDragEnd();
  };
  // Keyboard / mobile fallback — bump an item up or down by one slot.
  const moveItem = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= state.ticketList.length) return;
    const next = [...state.ticketList];
    const a = next[idx];
    const b = next[target];
    if (!a || !b) return;
    next[idx] = b;
    next[target] = a;
    dispatch({ type: "REORDER_TICKET_LIST", items: next });
  };

  const setMode = (mode: TicketSourceMode) =>
    dispatch({ type: "SET_FIELD", key: "ticketSource", value: mode });

  const isCE = state.ticketSource === "ce";
  const isExternal = state.ticketSource === "external";
  const isNone = state.ticketSource === "none";

  return (
    <section className="panel is-active" data-panel="tickets" role="tabpanel">
      <PanelHeader
        stepNumber={5}
        totalSteps={EVENT_CREATE_STEP_COUNT}
        title="Tickets & entry"
        subtitle="Choose how attendees get in — sell via CarEvents.com, link to an external site, or run a free event."
      />

      {/* ---- Mode picker ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <ModeCard
          checked={isCE}
          onClick={() => setMode("ce")}
          icon="fa-solid fa-ticket"
          title="CarEvents Ticketing"
          description="Sell tickets through us — fully integrated."
        />
        <ModeCard
          checked={isExternal}
          onClick={() => setMode("external")}
          icon="fa-solid fa-arrow-up-right-from-square"
          title="External website"
          description="Send people to your existing ticket site."
        />
        <ModeCard
          checked={isNone}
          onClick={() => setMode("none")}
          icon="fa-solid fa-door-open"
          title="Not required"
          description="Free event, no booking needed."
        />
      </div>

      {/* ---- External mode ---- */}
      {isExternal && (
        <div className="bg-white border border-ink-200 rounded-xl p-5 sm:p-6 mb-4 space-y-4">
          <div>
            <label
              htmlFor="ext-url"
              className="block text-sm font-semibold text-ink-900 mb-2"
            >
              External ticket URL <span className="text-gold-600">*</span>
            </label>
            <input
              id="ext-url"
              type="url"
              className="input"
              placeholder="https://example.com/buy-tickets"
              value={state.externalTicketUrl}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  key: "externalTicketUrl",
                  value: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label
              htmlFor="ext-info"
              className="block text-sm font-semibold text-ink-900 mb-2"
            >
              Additional entry / ticket information
            </label>
            <textarea
              id="ext-info"
              rows={4}
              className="textarea"
              placeholder="Anything attendees should know before clicking through?"
              value={state.externalTicketInfo}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  key: "externalTicketInfo",
                  value: e.target.value,
                })
              }
            />
          </div>
        </div>
      )}

      {/* ---- None / Free mode ---- */}
      {isNone && (
        <div className="bg-white border border-ink-200 rounded-xl p-5 sm:p-6 mb-4 space-y-4">
          <div>
            <label
              htmlFor="free-info"
              className="block text-sm font-semibold text-ink-900 mb-2"
            >
              Entry information
            </label>
            <textarea
              id="free-info"
              rows={4}
              className="textarea"
              placeholder="Tell attendees what to expect on arrival."
              value={state.freeEntryInfo}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  key: "freeEntryInfo",
                  value: e.target.value,
                })
              }
            />
          </div>
          <label className="cb-label items-start">
            <input
              type="checkbox"
              checked={state.requireRegistration}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  key: "requireRegistration",
                  value: e.target.checked,
                })
              }
            />
            <span className="cb-box mt-0.5" />
            <span className="cb-text">
              <span className="block">Require attendees to register</span>
              <span className="block text-xs text-ink-500 font-normal mt-0.5">
                Attendees will need to register before they can attend the event
              </span>
            </span>
          </label>
        </div>
      )}

      {/* ---- CE mode: ticket list ---- */}
      {isCE && (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-ink-900">
                Your tickets
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={openNewSection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:text-ink-900 transition"
                >
                  <i className="fa-solid fa-list" aria-hidden /> Add section
                </button>
                <button
                  type="button"
                  onClick={openNewTicket}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:text-gold-900 transition"
                >
                  <i className="fa-solid fa-plus" aria-hidden /> Add ticket
                </button>
              </div>
            </div>

            {state.ticketList.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-ink-200 rounded-xl bg-ink-50 text-ink-500 text-sm">
                No tickets yet. Add your first ticket to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {state.ticketList.map((item, idx) => {
                  const isDragging = dragIdx === idx;
                  const isDropTarget = dropIdx === idx && dragIdx !== idx;
                  const wrapperClasses = [
                    isDragging && "opacity-40",
                    isDropTarget && "ring-2 ring-gold-500",
                    "rounded-xl",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <div
                      key={item.id}
                      className={wrapperClasses}
                      draggable
                      onDragStart={onDragStart(idx)}
                      onDragOver={onDragOver(idx)}
                      onDragEnd={onDragEnd}
                      onDrop={onDrop(idx)}
                    >
                      {item.kind === "ticket" ? (
                        <TicketRow
                          ticket={item}
                          showFees={state.ticketFeeMode === "pass"}
                          onEdit={() => openEditTicket(item)}
                          onDelete={() =>
                            dispatch({ type: "REMOVE_TICKET", id: item.id })
                          }
                          onMoveUp={() => moveItem(idx, -1)}
                          onMoveDown={() => moveItem(idx, 1)}
                          canMoveUp={idx > 0}
                          canMoveDown={idx < state.ticketList.length - 1}
                        />
                      ) : (
                        <SectionRow
                          section={item}
                          onEdit={() => openEditSection(item)}
                          onDelete={() =>
                            dispatch({ type: "REMOVE_SECTION", id: item.id })
                          }
                          onMoveUp={() => moveItem(idx, -1)}
                          onMoveDown={() => moveItem(idx, 1)}
                          canMoveUp={idx > 0}
                          canMoveDown={idx < state.ticketList.length - 1}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* "Add another ticket" full-width dashed button */}
            <button
              type="button"
              onClick={openNewTicket}
              className="w-full mt-3 py-4 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus" aria-hidden /> Add another ticket
            </button>
          </div>

          {/* Fee handling */}
          <div className="bg-white border border-ink-200 rounded-xl p-4 mb-4">
            <label className="block text-sm font-semibold text-ink-900 mb-2">
              Ticket fees
            </label>
            <p className="text-xs text-ink-500 mb-3">
              Who covers the booking fee?
            </p>
            <div className="seg w-full" role="group">
              <button
                type="button"
                className={`seg-btn ${state.ticketFeeMode === "pass" ? "is-active" : ""}`}
                onClick={() =>
                  dispatch({
                    type: "SET_FIELD",
                    key: "ticketFeeMode",
                    value: "pass",
                  })
                }
              >
                Pass to buyer
              </button>
              <button
                type="button"
                className={`seg-btn ${state.ticketFeeMode === "absorb" ? "is-active" : ""}`}
                onClick={() =>
                  dispatch({
                    type: "SET_FIELD",
                    key: "ticketFeeMode",
                    value: "absorb",
                  })
                }
              >
                I&apos;ll absorb them
              </button>
            </div>
          </div>

          {/* Show attendees */}
          <label className="flex items-center justify-between gap-3 p-4 bg-white border border-ink-200 rounded-xl cursor-pointer mb-4">
            <div>
              <p className="text-sm font-medium text-ink-900">
                Show attendees on the event page
              </p>
              <p className="text-xs text-ink-500">
                Public list of people who&apos;ve booked
              </p>
            </div>
            <span className="switch">
              <input
                type="checkbox"
                checked={state.showAttendees}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    key: "showAttendees",
                    value: e.target.checked,
                  })
                }
              />
              <span className="slider" />
            </span>
          </label>
        </>
      )}

      {/* ---- Desktop nav row ---- */}
      <div className="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button
          type="button"
          onClick={() => prev && goTo(prev)}
          className="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back
        </button>
        <button
          type="button"
          onClick={() => {
            console.log(state);
            if (next) goTo(next);
          }}
          className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      </div>

      {/* ---- Drawers ----
          The `key` prop forces a full remount whenever the drawer
          opens/closes or the editing target changes — that lets the
          drawer seed its form state synchronously from props via
          `useState(initialiser)` without a re-syncing useEffect (which
          would trigger React's "setState within an effect can cause
          cascading renders" lint error). */}
      <TicketDrawer
        key={`tkt-${ticketDrawerOpen ? "open" : "closed"}-${editingTicket?.id ?? "new"}`}
        open={ticketDrawerOpen}
        editing={editingTicket}
        onClose={() => setTicketDrawerOpen(false)}
        onSave={(t) => {
          if (editingTicket) {
            dispatch({ type: "UPDATE_TICKET", ticket: t });
          } else {
            dispatch({ type: "ADD_TICKET", ticket: t });
          }
        }}
        onRemove={(id) => dispatch({ type: "REMOVE_TICKET", id })}
      />
      <SectionDrawer
        key={`sec-${sectionDrawerOpen ? "open" : "closed"}-${editingSection?.id ?? "new"}`}
        open={sectionDrawerOpen}
        editing={editingSection}
        onClose={() => setSectionDrawerOpen(false)}
        onSave={(s) => {
          if (editingSection) {
            dispatch({ type: "UPDATE_SECTION", section: s });
          } else {
            dispatch({ type: "ADD_SECTION", section: s });
          }
        }}
        onRemove={(id) => dispatch({ type: "REMOVE_SECTION", id })}
      />
    </section>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function ModeCard({
  checked,
  onClick,
  icon,
  title,
  description,
}: {
  checked: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`text-left p-4 border-2 rounded-xl transition h-full ${
        checked
          ? "border-gold-500 bg-gold-50"
          : "border-ink-200 hover:border-ink-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <i className={`${icon} text-gold-600`} aria-hidden />
        {checked && (
          <i
            className="fa-solid fa-circle-check text-gold-500 text-sm"
            aria-hidden
          />
        )}
      </div>
      <p className="font-semibold text-sm text-ink-900">{title}</p>
      <p className="text-xs text-ink-500 mt-1">{description}</p>
    </button>
  );
}

function TicketRow({
  ticket,
  showFees,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  ticket: Ticket;
  showFees: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const isShow = ticket.requireCarDetails;
  const subtitle = ticketSubtitle(ticket);
  const priceText = Number.isFinite(ticket.price)
    ? `£${ticket.price.toFixed(2)}`
    : "—";
  return (
    <div className="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
      <button
        type="button"
        aria-label="Drag to reorder"
        className="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing shrink-0"
      >
        <i className="fa-solid fa-grip-vertical" aria-hidden />
      </button>

      {/* Icon — gold for ordinary tickets, dark with gold car icon when
          this is a Show Car entry. */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isShow ? "bg-ink-900" : "bg-gold-50 border border-gold-200"
        }`}
      >
        <i
          className={
            isShow
              ? "fa-solid fa-car text-gold-500 text-sm"
              : "fa-solid fa-ticket text-gold-600 text-sm"
          }
          aria-hidden
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-ink-900 truncate">
            {ticket.name}
          </p>
          {isShow && (
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-ink-900 text-gold-400 px-2 py-0.5 rounded">
              Show
            </span>
          )}
          {ticket.isSecret && (
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-ink-100 text-ink-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
              <i className="fa-solid fa-lock text-[9px]" aria-hidden /> Secret
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>

      <div className="text-right hidden sm:block shrink-0">
        <p className="text-sm font-semibold text-ink-900">{priceText}</p>
        {showFees && <p className="text-xs text-ink-500">+ fees</p>}
      </div>

      <RowActions
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
    </div>
  );
}

function SectionRow({
  section,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  section: TicketSection;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="bg-ink-900 border border-ink-900 rounded-xl p-3 flex items-center gap-3">
      <button
        type="button"
        aria-label="Drag to reorder"
        className="text-ink-500 hover:text-ink-300 transition cursor-grab active:cursor-grabbing shrink-0"
      >
        <i className="fa-solid fa-grip-vertical" aria-hidden />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs uppercase tracking-wider font-semibold text-white">
            {section.name || "Untitled section"}
          </p>
          {section.isSecret && (
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-white/10 text-gold-400 px-2 py-0.5 rounded inline-flex items-center gap-1">
              <i className="fa-solid fa-lock text-[9px]" aria-hidden /> Secret
            </span>
          )}
        </div>
      </div>
      <SectionRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
    </div>
  );
}

/** Dark variant of RowActions used inside the black SectionRow.
 *  Same logic, lighter icon colours so they're legible on ink-900. */
function SectionRowActions({
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  // ink-300 default, white on hover, white/10 hover bg — same chrome
  // as the rest of the dark surfaces in the editor (publish summary
  // card uses the same palette).
  const baseBtn =
    "w-8 h-8 rounded-lg text-ink-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-300";
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label="Move up"
        className={baseBtn}
      >
        <i className="fa-solid fa-chevron-up text-xs" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label="Move down"
        className={baseBtn}
      >
        <i className="fa-solid fa-chevron-down text-xs" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit"
        className={baseBtn}
      >
        <i className="fa-solid fa-pen text-xs" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete"
        className="w-8 h-8 rounded-lg text-ink-300 hover:text-red-400 hover:bg-red-500/10 transition"
      >
        <i className="fa-solid fa-trash text-xs" aria-hidden />
      </button>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label="Move up"
        className="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <i className="fa-solid fa-chevron-up text-xs" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label="Move down"
        className="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <i className="fa-solid fa-chevron-down text-xs" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit"
        className="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"
      >
        <i className="fa-solid fa-pen text-xs" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete"
        className="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"
      >
        <i className="fa-solid fa-trash text-xs" aria-hidden />
      </button>
    </div>
  );
}

/** Build the small subtitle text shown beneath each ticket name —
 *  available count + sale window in human form. */
function ticketSubtitle(t: Ticket): string {
  const parts: string[] = [];
  if (Number.isFinite(t.quantity) && t.quantity > 0) {
    parts.push(`${t.quantity} available`);
  }
  if (t.requireCarDetails) {
    parts.push("Requires car details");
  } else if (t.saleEnd) {
    parts.push(`Sales end ${formatShort(t.saleEnd)}`);
  } else if (t.saleStart) {
    parts.push(`On sale from ${formatShort(t.saleStart)}`);
  } else {
    parts.push("On sale now");
  }
  return parts.join(" · ");
}

/** "2026-04-15" → "15 Apr". Short variant for the subtitle. */
function formatShort(iso: string): string {
  const full = formatEditorDate(iso); // "15 April 2026"
  // The cheapest way to abbreviate the month is a single replace —
  // we don't need a second Intl format call.
  return full
    .replace(
      /(January|February|March|April|May|June|July|August|September|October|November|December)/,
      (m) => m.slice(0, 3),
    )
    .replace(/\s\d{4}$/, "");
}
