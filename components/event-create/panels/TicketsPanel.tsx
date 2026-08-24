"use client";

import { useEventSteps, useEventRegion } from "@/lib/useEventSteps";
import { useRef, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";

import { pushStepUrl } from "@/lib/stepNav";

import {
  useEventCreate,
  type Ticket,
  type TicketId,
  type TicketSection,
  type SectionId,
  type TicketSourceMode,
} from "@/context/EventCreateContext";
import {
  formatRegionAmount,
  formatRegionShortDate,
  type Region,
} from "@/lib/regions";
import {
  useSaveTicketRow,
  useDeleteTicketRow,
  useReorderTicketRows,
  mapTicketToBody,
  mapSectionToBody,
} from "@/lib/ticketMutations";
import { ApiError } from "@/lib/apiClient";
import { useAction } from "@/context/ActionContext";
import {
  useUploadEventImage,
  useRemoveEventImage,
} from "@/lib/imageMutations";
import {
  imageSrc,
  makeLocalImage,
  needsServerDelete,
  revokeIfLocal,
} from "@/lib/editorImage";

import { PanelHeader } from "../PanelHeader";
import { PerDateNotice } from "../PerDateNotice";
import { TicketDrawer } from "../TicketDrawer";
import { SectionDrawer } from "../SectionDrawer";
import { EditorTextarea } from "../EditorTextarea";

/**
 * Step 5 of the wizard.
 *
 * Three modes (`ticketSource`):
 *   - "ce"        → managed CarEvents ticketing. Full ticket list +
 *                   fee toggle + show-attendees toggle.
 *   - "external"  → URL field + additional-info textarea. No list.
 *   - "none"      → entry-info textarea + register-required checkbox.
 *
 * Each mode keeps its own fields in state - switching modes does
 * not wipe anything, so users can experiment without losing entries.
 *
 * Within "ce" mode, the list contains both Tickets and Sections in
 * a single flat array, ordered by index. Drag-to-reorder uses the
 * same HTML5 DnD pattern as Gallery. Click-to-reorder via
 * up/down chevrons is provided as a keyboard / mobile fallback -
 * surfaced inline next to the edit/delete actions on hover (or
 * always-visible via focus).
 */
export function TicketsPanel() {
  const { state, dispatch } = useEventCreate();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { region, stepCount, adjacent, stepNumber } = useEventSteps();

  const { prev, next } = adjacent("tickets");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    pushStepUrl(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- Drawer state ----
  // editingTicket / editingSection: null means the drawer is closed.
  // To open a fresh "Add" form we set them to a sentinel object the
  // drawer recognises as "new" - easier than juggling a separate
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
      persistOrder(next);
    }
    onDragEnd();
  };
  // Keyboard / mobile fallback - bump an item up or down by one slot.
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
    persistOrder(next);
  };

  const setMode = (mode: TicketSourceMode) =>
    dispatch({ type: "SET_FIELD", key: "ticketSource", value: mode });

  // ============================================================
  // Per-row save / delete / reorder mutations.
  //
  // Two save-mutation instances (one per drawer) so each drawer
  // gets its own isPending / error state - they can't bleed into
  // each other.
  //
  // The delete mutation is shared by the inline list buttons and
  // the drawer "Remove" buttons; only one delete can be in flight
  // at a time so a single instance is fine.
  // ============================================================
  const ticketSaver = useSaveTicketRow();
  const sectionSaver = useSaveTicketRow();
  const ticketRemover = useDeleteTicketRow();
  const reorderer = useReorderTicketRows();
  const runAction = useAction();

  /** True once a server eid exists. Per-row saves require it; without
   *  it the user must publish the event basics first so a draft post
   *  is created and we have an event to attach tickets to. */
  const eid = state.encryptedId;

  /** The blog the eid resolves against, sent with every ticket write.
   *
   *  Taken from the resolved region rather than raw `state.site`: that
   *  is null on an event opened from a pre-multisite link, and the
   *  route requires a real key. `resolveRegion` supplies the API's own
   *  default in that case, which is the blog it would have used anyway. */
  const site = region.key;

  /** Pull a human message out of whatever the mutation threw. */
  const errorText = (err: Error | null): string | null =>
    err
      ? err instanceof ApiError
        ? err.message
        : err.message || "Save failed."
      : null;

  /** Save a ticket - closes the drawer only on success. */
  const handleSaveTicket = async (t: Ticket, isUpdate: boolean) => {
    if (!eid) return;
    try {
      const res = await ticketSaver.mutateAsync({
        eid,
        site,
        id: t.id,
        body: mapTicketToBody(t),
      });
      // Swap the local synthetic id for the server's raw post id.
      // /event-edit returns plain ids (not encrypted), so the editor
      // state needs to match - saving here as encrypted_id would mean
      // a later refresh produces a different id and the row wouldn't
      // match the one in state.
      const persisted: Ticket = { ...t, id: String(res.ticket_id) as TicketId };
      dispatch(
        isUpdate
          ? { type: "UPDATE_TICKET", ticket: persisted }
          : { type: "ADD_TICKET", ticket: persisted },
      );
      setTicketDrawerOpen(false);
    } catch {
      // Error stays on ticketSaver.error and renders inside the drawer
      // via the errorMessage prop; drawer stays open.
    }
  };

  /** Save a section - same flow as handleSaveTicket. */
  const handleSaveSection = async (s: TicketSection, isUpdate: boolean) => {
    if (!eid) return;
    try {
      const res = await sectionSaver.mutateAsync({
        eid,
        site,
        id: s.id,
        body: mapSectionToBody(s),
      });
      const persisted: TicketSection = {
        ...s,
        id: String(res.ticket_id) as SectionId,
      };
      dispatch(
        isUpdate
          ? { type: "UPDATE_SECTION", section: persisted }
          : { type: "ADD_SECTION", section: persisted },
      );
      setSectionDrawerOpen(false);
    } catch {
      // Drawer stays open; error surfaces via sectionSaver.error.
    }
  };

  /** Remove a ticket - deletion is server-side and permanent, so it
   *  goes through the shared action flow (confirm → full-screen
   *  loader → notification). The local row is dropped only AFTER the
   *  server confirms, since rollback for a deletion would be jarring.
   *
   *  Both entry points (the inline row button and the drawer's
   *  "Remove ticket") funnel through here, so the confirm can't be
   *  skipped from either. */
  const handleRemoveTicket = async (id: TicketId, name: string) => {
    if (!eid) return;
    const res = await runAction({
      confirm: {
        title: "Delete this ticket?",
        message: name.trim()
          ? `"${name.trim()}" will be removed from this event. Existing orders keep their tickets, but nobody can buy it again. This can't be undone.`
          : "The ticket will be removed from this event. Existing orders keep their tickets, but nobody can buy it again. This can't be undone.",
        confirmLabel: "Delete ticket",
        cancelLabel: "Keep ticket",
        danger: true,
      },
      loadingLabel: "Deleting ticket...",
      successTitle: "Ticket deleted",
      errorTitle: "Couldn't delete the ticket",
      run: async () => {
        await ticketRemover.mutateAsync({ eid, site, id });
        return true;
      },
    });
    if (res) {
      dispatch({ type: "REMOVE_TICKET", id });
      setTicketDrawerOpen(false);
    } else {
      // Cancelled or failed - the notification already told them why.
      // Clear the mutation error so the drawer doesn't repeat it inline.
      ticketRemover.reset();
    }
  };

  const handleRemoveSection = async (id: SectionId, name: string) => {
    if (!eid) return;
    const res = await runAction({
      confirm: {
        title: "Delete this section?",
        message: name.trim()
          ? `"${name.trim()}" will be removed. The tickets under it stay on the event. This can't be undone.`
          : "The section will be removed. The tickets under it stay on the event. This can't be undone.",
        confirmLabel: "Delete section",
        cancelLabel: "Keep section",
        danger: true,
      },
      loadingLabel: "Deleting section...",
      successTitle: "Section deleted",
      errorTitle: "Couldn't delete the section",
      run: async () => {
        await ticketRemover.mutateAsync({ eid, site, id });
        return true;
      },
    });
    if (res) {
      dispatch({ type: "REMOVE_SECTION", id });
      setSectionDrawerOpen(false);
    } else {
      ticketRemover.reset();
    }
  };

  /** Persist the current ticketList ordering. Fired by the reorder
   *  helpers AFTER they've already dispatched locally - so the visual
   *  order updates immediately and the server catches up in the
   *  background. A reorder failure logs but doesn't roll back; the
   *  next save / refresh will reconcile. */
  const persistOrder = (items: typeof state.ticketList) => {
    if (!eid) return;
    const ids = items.map((it) => String(it.encryptedTicketID));
    reorderer.mutate({ eid, site, ids });
  };

  const isCE = state.ticketSource === "ce";
  const isExternal = state.ticketSource === "external";
  const isNone = state.ticketSource === "none";

  // A recurring event publishes one listing per date, and a ticket
  // belongs to a date - it has its own allocation, its own sale window
  // and its own sales. So the series keeps the choice of *how* people
  // get in (this mode picker, which is genuinely series-wide) and hands
  // the ticket list itself to the per-date editors. External and free
  // entry are a URL and a paragraph, which do apply to every date, so
  // those two modes keep their fields.
  const perDateTickets = state.dateType === "recurring" && isCE;

  return (
    <section className="panel is-active" data-panel="tickets" role="tabpanel">
      <PanelHeader
        stepNumber={stepNumber("tickets")}
        totalSteps={stepCount}
        title="Tickets & entry"
        subtitle="Choose how attendees get in - sell via CarEvents.com, link to an external site, or run a free event."
      />

      {/* ---- Mode picker ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <ModeCard
          checked={isCE}
          onClick={() => setMode("ce")}
          icon="fa-solid fa-ticket"
          title="CarEvents Ticketing"
          description="Sell tickets through us - fully integrated."
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
              placeholder="e.g. https://example.com/buy-tickets"
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

      {/* ---- CE mode on a recurring event: per-date notice ---- */}
      {perDateTickets && <PerDateNotice feature="tickets" />}

      {/* ---- CE mode: ticket list ---- */}
      {isCE && !perDateTickets && (
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
                          region={region}
                          showFees={state.ticketFeeMode === "pass"}
                          onEdit={() => openEditTicket(item)}
                          onDelete={() => handleRemoveTicket(item.id, item.name)}
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
                            handleRemoveSection(item.id, item.name)
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
          {/* ---- Ticket presentation + policy ----
              CarEvents ticketing only. The logo, extra info, terms and
              on-the-gate details all describe tickets we issue, so
              there's nothing for them to attach to in the external /
              free modes. */}
          <TicketLogoField />

          <div className="bg-white border border-ink-200 rounded-xl p-4 mb-4">
            <label className="block text-sm font-semibold text-ink-900 mb-2">
              Additional ticket information
            </label>
            <p className="text-xs text-ink-500 mb-3">
              Shown alongside the tickets on your event page and repeated on
              the ticket itself. Arrival times, what&apos;s included, parking,
              anything buyers should read before booking.
            </p>
            <EditorTextarea
              value={state.ticketInfo}
              onChange={(value) =>
                dispatch({ type: "SET_FIELD", key: "ticketInfo", value })
              }
              placeholder="e.g. Gates open at 9am. Entry includes parking for one vehicle. Under 12s go free."
            />
          </div>

          <div className="bg-white border border-ink-200 rounded-xl p-4 mb-4">
            <label className="block text-sm font-semibold text-ink-900 mb-2">
              Terms &amp; conditions / refund policy
            </label>
            <p className="text-xs text-ink-500 mb-3">
              Buyers agree to this at checkout, so be specific about refunds,
              transfers and what happens if the event is cancelled.
            </p>
            <EditorTextarea
              value={state.ticketTerms}
              onChange={(value) =>
                dispatch({ type: "SET_FIELD", key: "ticketTerms", value })
              }
              placeholder="e.g. Tickets are non-refundable within 14 days of the event. Tickets may be transferred to another attendee at any time by contacting us."
            />
          </div>

          {/* Tickets on the gate - tickbox reveals the details textarea. */}
          <div className="bg-white border border-ink-200 rounded-xl p-5 mb-4">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Tickets on the gate
                </p>
                <p className="text-xs text-ink-500 mt-0.5">
                  Tickets will also be available to buy on the day
                </p>
              </div>
              <span className="switch">
                <input
                  type="checkbox"
                  checked={state.ticketsOnGate}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "ticketsOnGate",
                      value: e.target.checked,
                    })
                  }
                />
                <span className="slider" />
              </span>
            </label>
            {state.ticketsOnGate && (
              <div className="mt-4 pt-4 border-t border-ink-200">
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                  On the gate details
                </label>
                <EditorTextarea
                  value={state.ticketsOnGateInfo}
                  onChange={(value) =>
                    dispatch({
                      type: "SET_FIELD",
                      key: "ticketsOnGateInfo",
                      value,
                    })
                  }
                  placeholder={`Cash and card accepted on the gate. ${region.currencySymbol}15 per adult, under 12s free. Gate prices are higher than advance tickets.`}
                />
              </div>
            )}
          </div>
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
            if (next) goTo(next);
          }}
          className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      </div>

      {/* ---- Drawers ----
          The `key` prop forces a full remount whenever the drawer
          opens/closes or the editing target changes - that lets the
          drawer seed its form state synchronously from props via
          `useState(initialiser)` without a re-syncing useEffect (which
          would trigger React's "setState within an effect can cause
          cascading renders" lint error). */}
      <TicketDrawer
        key={`tkt-${ticketDrawerOpen ? "open" : "closed"}-${editingTicket?.id ?? "new"}`}
        open={ticketDrawerOpen}
        editing={editingTicket}
        onClose={() => {
          // Reset any error from a previous failed save so the next
          // open of the drawer starts clean.
          ticketSaver.reset();
          setTicketDrawerOpen(false);
        }}
        onSave={(t) => handleSaveTicket(t, editingTicket !== null)}
        onRemove={(id) => handleRemoveTicket(id, editingTicket?.name ?? "")}
        isSaving={ticketSaver.isPending}
        isDeleting={ticketRemover.isPending}
        errorMessage={
          errorText(ticketSaver.error) ?? errorText(ticketRemover.error)
        }
      />
      <SectionDrawer
        key={`sec-${sectionDrawerOpen ? "open" : "closed"}-${editingSection?.id ?? "new"}`}
        open={sectionDrawerOpen}
        editing={editingSection}
        onClose={() => {
          sectionSaver.reset();
          setSectionDrawerOpen(false);
        }}
        onSave={(s) => handleSaveSection(s, editingSection !== null)}
        onRemove={(id) => handleRemoveSection(id, editingSection?.name ?? "")}
        isSaving={sectionSaver.isPending}
        isDeleting={ticketRemover.isPending}
        errorMessage={
          errorText(sectionSaver.error) ?? errorText(ticketRemover.error)
        }
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
  region,
  showFees,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  ticket: Ticket;
  region: Region;
  showFees: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const isShow = ticket.requireCarDetails;
  const subtitle = ticketSubtitle(ticket, region);
  const priceText = Number.isFinite(ticket.price)
    ? formatRegionAmount(ticket.price, region)
    : "-";
  return (
    <div className="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
      <button
        type="button"
        aria-label="Drag to reorder"
        className="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing shrink-0"
      >
        <i className="fa-solid fa-grip-vertical" aria-hidden />
      </button>

      {/* Icon - gold for ordinary tickets, dark with gold car icon when
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
  // ink-300 default, white on hover, white/10 hover bg - same chrome
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

/** Build the small subtitle text shown beneath each ticket name -
 *  stock summary + sale window in human form.
 *
 *  `quantity` is what's LEFT: ticketing decrements `stock` and
 *  increments `stock_sold` on each sale, so the total allocation has
 *  to be added back up. A ticket with 60 left and 40 sold reads
 *  "60 available of 100". The total is spelled out because the drawer
 *  edits availability, so the organiser needs to see both numbers to
 *  know what they're changing. Once anything has sold the sold count
 *  is shown too.
 *
 *  A NaN quantity means unlimited, so no stock line is shown at all. */
function ticketSubtitle(t: Ticket, region: Region): string {
  const parts: string[] = [];
  const available = t.quantity;
  const total = t.quantity + t.quantitySold;
  if (Number.isFinite(t.quantity) && available > 0) {
    parts.push(
      t.quantitySold > 0
        ? `${available} available of ${total} (${t.quantitySold} sold)`
        : `${available} available`,
    );
  }
  if (t.requireCarDetails) {
    parts.push("Requires car details");
  } else if (t.saleEnd) {
    parts.push(`Sales end ${formatRegionShortDate(t.saleEnd, region)}`);
  } else if (t.saleStart) {
    parts.push(`On sale from ${formatRegionShortDate(t.saleStart, region)}`);
  } else {
    parts.push("On sale now");
  }
  return parts.join(" · ");
}

/**
 * Event ticket logo - the image printed on the tickets themselves.
 *
 * Uploads on pick (rather than deferring to the event save) so the
 * panel can show the real hosted image straight away, matching how
 * the gallery behaves. Needs a saved event first: the upload endpoint
 * attaches the image to an event id, so before the draft exists there
 * is nothing to attach to.
 */
function TicketLogoField() {
  const { state, dispatch } = useEventCreate();
  const upload = useUploadEventImage();
  const remove = useRemoveEventImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const eid = state.encryptedId;
  // The region the eid resolves against. The image confirm step writes
  // this to the DB, so it has to match the event.
  const site = useEventRegion().key;
  const logo = state.ticketLogo;

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!eid) {
      setError(
        "Save the event basics first so we know which event to attach the logo to.",
      );
      return;
    }

    // Show the local preview immediately, then swap in the hosted
    // image once Cloudflare confirms.
    const local = makeLocalImage(file);
    dispatch({ type: "SET_FIELD", key: "ticketLogo", value: local });

    try {
      const image = await upload.mutateAsync({
        eid,
        site,
        file,
        mediaGroup: "ticket_logo",
      });
      dispatch({
        type: "SET_FIELD",
        key: "ticketLogo",
        value: { kind: "remote", url: image.url, cloudflareId: image.id },
      });
    } catch (err) {
      dispatch({ type: "SET_FIELD", key: "ticketLogo", value: null });
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed.",
      );
    } finally {
      revokeIfLocal(local);
    }
  };

  const handleRemove = async () => {
    setError(null);
    const current = logo;
    dispatch({ type: "SET_FIELD", key: "ticketLogo", value: null });
    revokeIfLocal(current);
    // Only Cloudflare-backed images need a server-side delete; a local
    // one that never uploaded is gone the moment we drop it, and a
    // WordPress attachment isn't ours to delete.
    if (eid && current && needsServerDelete(current)) {
      try {
        await remove.mutateAsync({ eid, site, mediaId: current.cloudflareId });
      } catch {
        // The logo is already detached in the editor; a failed cleanup
        // just leaves an orphan in Cloudflare, which isn't worth
        // interrupting the user for.
      }
    }
  };

  return (
    <div className="bg-white border border-ink-200 rounded-xl p-4 mb-4">
      <label className="block text-sm font-semibold text-ink-900 mb-2">
        Event ticket logo
      </label>
      <p className="text-xs text-ink-500 mb-3">
        Printed at the top of every ticket for this event. A square or wide
        logo on a transparent background works best.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          handlePick(e.target.files?.[0]);
          // Reset so picking the same file twice still fires onChange.
          e.target.value = "";
        }}
      />

      {logo ? (
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 shrink-0 rounded-lg border border-ink-200 bg-ink-50 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(logo)}
              alt="Ticket logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="px-4 py-2 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 disabled:opacity-50 rounded-lg transition"
            >
              {upload.isPending ? "Uploading..." : "Replace logo"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={upload.isPending}
              className="px-4 py-2 text-sm font-semibold text-ink-500 hover:text-red-600 disabled:opacity-50 transition text-left"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="w-full py-6 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 disabled:opacity-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex flex-col items-center justify-center gap-2"
        >
          <i className="fa-solid fa-image text-lg" aria-hidden />
          {upload.isPending ? "Uploading..." : "Upload ticket logo"}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
