"use client";

import { useEventRegion, useEventSteps } from "@/lib/useEventSteps";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  useEventCreate,
  type TraderCategory,
  type TraderCategoryId,
} from "@/context/EventCreateContext";
import {
  useSaveTraderCategory,
  useDeleteTraderCategory,
  mapTraderCategoryToBody,
} from "@/lib/traderMutations";
import { ApiError } from "@/lib/apiClient";
import { useAction } from "@/context/ActionContext";
import {
  formatRegionAmount,
  formatRegionShortDate,
  type Region,
} from "@/lib/regions";
import { slugify } from "@/lib/slugify";

import { ApplicationLinksCard } from "../ApplicationLinksCard";
import { PanelHeader } from "../PanelHeader";
import { PerDatePanel } from "../PerDateNotice";
import { TraderCategoryDrawer } from "../TraderCategoryDrawer";

/**
 * Step 9 - Traders.
 *
 * Each trader category carries its own info text, application window,
 * and a payment mode (online ticket vs. pay in person). Master enable
 * toggle gates the section. Categories persist to the server on save/
 * delete (same pattern as Show Cars) - not batched on event save.
 */
export function TradersPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const saver = useSaveTraderCategory();
  const remover = useDeleteTraderCategory();
  const runAction = useAction();
  const eid = state.encryptedId;

  const { stepCount, adjacent, stepNumber } = useEventSteps();

  const { prev, next } = adjacent("traders");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TraderCategory | null>(null);

  const openNew = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (c: TraderCategory) => {
    setEditing(c);
    setDrawerOpen(true);
  };

  const errorText = (err: Error | null): string | null =>
    err
      ? err instanceof ApiError
        ? err.message
        : err.message || "Save failed."
      : null;

  const handleSaveCategory = async (c: TraderCategory, isUpdate: boolean) => {
    if (!eid) return;
    try {
      const res = await saver.mutateAsync({
        eid,
        id: c.id,
        body: mapTraderCategoryToBody(c),
      });
      // Swap the local synthetic id for the server's category id so
      // later edits route to the update path.
      const persisted: TraderCategory = {
        ...c,
        id: String(res.category_id) as TraderCategoryId,
      };
      dispatch(
        isUpdate
          ? { type: "UPDATE_TRADER_CATEGORY", category: persisted }
          : { type: "ADD_TRADER_CATEGORY", category: persisted },
      );
      setDrawerOpen(false);
    } catch {
      // Drawer stays open; error surfaces via saver.error.
    }
  };

  /** Delete is server-side and permanent, so it runs through the
   *  shared action flow (confirm → full-screen loader → notification).
   *  Both the row button and the drawer's "Remove" funnel through
   *  here, so the confirm can't be skipped from either. */
  const handleRemoveCategory = async (id: TraderCategoryId, name: string) => {
    if (!eid) return;
    const res = await runAction({
      confirm: {
        title: "Delete this category?",
        message: name.trim()
          ? `"${name.trim()}" will be removed. Applications already submitted for it stay, but nobody can apply to it again. This can't be undone.`
          : "The category will be removed. Applications already submitted for it stay, but nobody can apply to it again. This can't be undone.",
        confirmLabel: "Delete category",
        cancelLabel: "Keep category",
        danger: true,
      },
      loadingLabel: "Deleting category...",
      successTitle: "Category deleted",
      errorTitle: "Couldn't delete the category",
      run: async () => {
        await remover.mutateAsync({ eid, id });
        return true;
      },
    });
    if (res) {
      dispatch({ type: "REMOVE_TRADER_CATEGORY", id });
      setDrawerOpen(false);
    } else {
      // Cancelled or failed - the notification already covered it, so
      // clear the mutation error rather than repeat it inline.
      remover.reset();
    }
  };

  // DnD reorder (local only - server has no display_order for traders)
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
    const reordered = [...state.traderCategories];
    const [moved] = reordered.splice(dragIdx, 1);
    if (moved) {
      reordered.splice(targetIdx, 0, moved);
      dispatch({ type: "REORDER_TRADER_CATEGORIES", items: reordered });
    }
    onDragEnd();
  };
  const moveItem = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= state.traderCategories.length) return;
    const reordered = [...state.traderCategories];
    const a = reordered[idx];
    const b = reordered[target];
    if (!a || !b) return;
    reordered[idx] = b;
    reordered[target] = a;
    dispatch({ type: "REORDER_TRADER_CATEGORIES", items: reordered });
  };

  // Each trader category carries its own application window and stand
  // cost, which belong to a single meet rather than to the series. A
  // recurring event sets them up on each date, so the series shows the
  // notice in place of the form.
  if (state.dateType === "recurring") {
    return (
      <PerDatePanel
        step="traders"
        title="Traders"
        subtitle="Invite vendors, exhibitors and sponsors to apply for a trade stand at your event."
        feature="traders"
      />
    );
  }

  return (
    <section className="panel is-active" data-panel="traders" role="tabpanel">
      <PanelHeader
        stepNumber={stepNumber("traders")}
        totalSteps={stepCount}
        title="Traders"
        subtitle="Invite vendors, exhibitors and sponsors to apply for a trade stand at your event."
      />

      <label className="flex items-center justify-between gap-3 p-5 bg-white border border-ink-200 rounded-xl cursor-pointer mb-6">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            Enable trader applications
          </p>
          <p className="text-xs text-ink-500 mt-0.5">
            Accept applications from food vans, merchandise stalls, sponsors and
            exhibitors
          </p>
        </div>
        <span className="switch">
          <input
            type="checkbox"
            checked={state.tradersEnabled}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                key: "tradersEnabled",
                value: e.target.checked,
              })
            }
          />
          <span className="slider" />
        </span>
      </label>

      {state.tradersEnabled && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  Trader types
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Group traders by type - each category has its own application
                  window &amp; info
                </p>
              </div>
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:text-gold-900 transition shrink-0"
              >
                <i className="fa-solid fa-plus" aria-hidden /> Add type
              </button>
            </div>

            {state.traderCategories.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-ink-200 rounded-xl bg-ink-50 text-ink-500 text-sm">
                No trader types yet. Add at least one for applicants to choose
                from.
              </div>
            ) : (
              <div className="space-y-3">
                {state.traderCategories.map((c, idx) => {
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
                      key={c.id}
                      className={wrapperClasses}
                      draggable
                      onDragStart={onDragStart(idx)}
                      onDragOver={onDragOver(idx)}
                      onDragEnd={onDragEnd}
                      onDrop={onDrop(idx)}
                    >
                      <TraderCategoryRow
                        category={c}
                        onEdit={() => openEdit(c)}
                        onDelete={() => handleRemoveCategory(c.id, c.name)}
                        onMoveUp={() => moveItem(idx, -1)}
                        onMoveDown={() => moveItem(idx, 1)}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < state.traderCategories.length - 1}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={openNew}
              className="w-full mt-3 py-4 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus" aria-hidden /> Add another trader
              type
            </button>
          </div>

          <ApplicationLinksCard
            applicationKind="trader"
            slug={state.encryptedId || slugify(state.title || "event")}
            iframeTitle="Trader applications"
          />
        </>
      )}

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
          onClick={() => next && goTo(next)}
          className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      </div>

      <TraderCategoryDrawer
        key={`tc-${drawerOpen ? "open" : "closed"}-${editing?.id ?? "new"}`}
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSave={(c) => handleSaveCategory(c, editing !== null)}
        onRemove={(id) => handleRemoveCategory(id, editing?.name ?? "")}
      />

      {errorText(saver.error ?? remover.error) && (
        <p className="text-sm text-red-600 mt-3" role="alert">
          {errorText(saver.error ?? remover.error)}
        </p>
      )}
    </section>
  );
}

function TraderCategoryRow({
  category,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  category: TraderCategory;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  // Read straight off the context rather than threading a prop down.
  const region = useEventRegion();
  const subtitle = subtitleForCategory(category, region);
  return (
    <div className="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
      <button
        type="button"
        aria-label="Drag to reorder"
        className="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing shrink-0"
      >
        <i className="fa-solid fa-grip-vertical" aria-hidden />
      </button>
      <div className="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
        <i className="fa-solid fa-store text-gold-600 text-sm" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-900 truncate">
          {category.name}
        </p>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
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
    </div>
  );
}

function subtitleForCategory(c: TraderCategory, region: Region): string {
  const bits: string[] = [];
  // Payment mode + fee
  if (c.paymentMode === "in_person") {
    bits.push("Pay in person");
  } else {
    bits.push("Online");
  }
  if (Number.isFinite(c.ticketCost) && c.ticketCost > 0) {
    bits.push(formatRegionAmount(c.ticketCost, region));
  }
  // Window
  if (c.applicationsOpen || c.applicationsClose) {
    const win = [
      c.applicationsOpen
        ? formatRegionShortDate(c.applicationsOpen, region)
        : "",
      "-",
      c.applicationsClose
        ? formatRegionShortDate(c.applicationsClose, region)
        : "",
    ]
      .join(" ")
      .trim();
    bits.push(win);
  }
  return bits.join(" · ");
}
