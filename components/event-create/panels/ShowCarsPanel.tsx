"use client";

import { useEventSteps } from "@/lib/useEventSteps";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  useEventCreate,
  type ShowCarCategory,
  type ShowCarCategoryId,
} from "@/context/EventCreateContext";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { slugify } from "@/lib/slugify";
import {
  useSaveShowCarCategory,
  useDeleteShowCarCategory,
  mapShowCarCategoryToBody,
} from "@/lib/showCarMutations";
import { ApiError } from "@/lib/apiClient";
import { useAction } from "@/context/ActionContext";

import { ApplicationLinksCard } from "../ApplicationLinksCard";
import { EditorTextarea } from "../EditorTextarea";
import { PanelHeader } from "../PanelHeader";
import { PerDatePanel } from "../PerDateNotice";
import { ShowCarCategoryDrawer } from "../ShowCarCategoryDrawer";

/**
 * Step 7 - Show Cars.
 *
 * Layout:
 *   1. Master "enable" toggle. Toggling off hides the rest of the
 *      panel (state values are preserved).
 *   2. Capacity limit - paired toggle + number input.
 *   3. Categories list with reorder + drawer.
 *   4. Info textarea (with the decorative toolbar).
 *   5. Application links card.
 */
export function ShowCarsPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { stepCount, adjacent, stepNumber } = useEventSteps();

  const { prev, next } = adjacent("show-cars");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- Drawer state ----
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ShowCarCategory | null>(null);

  const openNew = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (c: ShowCarCategory) => {
    setEditing(c);
    setDrawerOpen(true);
  };

  // ============================================================
  // Per-row save / delete mutations. Same pattern as TicketsPanel /
  // DiscountsPanel - mutation-first, drawer stays open on error.
  // ============================================================
  const saver = useSaveShowCarCategory();
  const remover = useDeleteShowCarCategory();
  const runAction = useAction();
  const eid = state.encryptedId;

  const errorText = (err: Error | null): string | null =>
    err
      ? err instanceof ApiError
        ? err.message
        : err.message || "Save failed."
      : null;

  const handleSaveCategory = async (c: ShowCarCategory, isUpdate: boolean) => {
    if (!eid) return;
    try {
      const res = await saver.mutateAsync({
        eid,
        id: c.id,
        body: mapShowCarCategoryToBody(c),
      });
      // Swap the local synthetic id for the server's raw post id -
      // matches the ticket/discount panel convention so later edits
      // route to the update path.
      const persisted: ShowCarCategory = {
        ...c,
        id: String(res.ticket_id) as ShowCarCategoryId,
      };
      dispatch(
        isUpdate
          ? { type: "UPDATE_SHOW_CAR_CATEGORY", category: persisted }
          : { type: "ADD_SHOW_CAR_CATEGORY", category: persisted },
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
  const handleRemoveCategory = async (id: ShowCarCategoryId, name: string) => {
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
      dispatch({ type: "REMOVE_SHOW_CAR_CATEGORY", id });
      setDrawerOpen(false);
    } else {
      // Cancelled or failed - the notification already covered it, so
      // clear the mutation error rather than repeat it in the drawer.
      remover.reset();
    }
  };

  // ---- DnD reorder ----
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
    const next = [...state.showCarCategories];
    const [moved] = next.splice(dragIdx, 1);
    if (moved) {
      next.splice(targetIdx, 0, moved);
      dispatch({ type: "REORDER_SHOW_CAR_CATEGORIES", items: next });
    }
    onDragEnd();
  };
  const moveItem = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= state.showCarCategories.length) return;
    const next = [...state.showCarCategories];
    const a = next[idx];
    const b = next[target];
    if (!a || !b) return;
    next[idx] = b;
    next[target] = a;
    dispatch({ type: "REORDER_SHOW_CAR_CATEGORIES", items: next });
  };

  // Applications belong to a date, not to the series: the window, the
  // capacity and the categories are all things a single meet has. A
  // recurring event gets the notice in place of the whole form, and
  // sets these up on each date instead.
  if (state.dateType === "recurring") {
    return (
      <PerDatePanel
        step="show-cars"
        title="Show cars"
        subtitle="Let applicants apply to display their vehicle. Set application windows, categories and requirements."
        feature="showCars"
      />
    );
  }

  return (
    <section className="panel is-active" data-panel="show-cars" role="tabpanel">
      <PanelHeader
        stepNumber={stepNumber("show-cars")}
        totalSteps={stepCount}
        title="Show cars"
        subtitle="Let applicants apply to display their vehicle. Set application windows, categories and requirements."
      />

      {/* Master enable toggle */}
      <label className="flex items-center justify-between gap-3 p-5 bg-white border border-ink-200 rounded-xl cursor-pointer mb-6">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            Enable show car applications
          </p>
          <p className="text-xs text-ink-500 mt-0.5">
            Accept applications from car owners wanting to display their vehicle
          </p>
        </div>
        <span className="switch">
          <input
            type="checkbox"
            checked={state.showCarsEnabled}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                key: "showCarsEnabled",
                value: e.target.checked,
              })
            }
          />
          <span className="slider" />
        </span>
      </label>

      {state.showCarsEnabled && (
        <>
          {/* Categories */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  Show car categories
                </h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Group applications by type - each category has its own
                  application window
                </p>
              </div>
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:text-gold-900 transition shrink-0"
              >
                <i className="fa-solid fa-plus" aria-hidden /> Add category
              </button>
            </div>

            {state.showCarCategories.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-ink-200 rounded-xl bg-ink-50 text-ink-500 text-sm">
                No categories yet. Add at least one category for applicants to
                choose from.
              </div>
            ) : (
              <div className="space-y-3">
                {state.showCarCategories.map((c, idx) => {
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
                      <ShowCarCategoryRow
                        category={c}
                        onEdit={() => openEdit(c)}
                        onDelete={() => handleRemoveCategory(c.id, c.name)}
                        onMoveUp={() => moveItem(idx, -1)}
                        onMoveDown={() => moveItem(idx, 1)}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < state.showCarCategories.length - 1}
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
              <i className="fa-solid fa-plus" aria-hidden /> Add another
              category
            </button>
          </div>

          {/* Show car info textarea */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink-900 mb-2">
              Show car information
            </label>
            <p className="text-xs text-ink-500 mb-3">
              Perks, arrival times, parking instructions - anything applicants
              need to know.
            </p>
            <EditorTextarea
              value={state.showCarsInfo}
              onChange={(value) =>
                dispatch({ type: "SET_FIELD", key: "showCarsInfo", value })
              }
              placeholder="Arrival from 8am. Dedicated show parking on the main lawn. Complimentary breakfast rolls for drivers. Judging from 11am."
            />
          </div>

          {/* Application links */}
          <ApplicationLinksCard
            applicationKind="show-car"
            slug={state.encryptedId ? state.encryptedId : ""}
            iframeTitle="Show car applications"
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

      <ShowCarCategoryDrawer
        key={`scc-${drawerOpen ? "open" : "closed"}-${editing?.id ?? "new"}`}
        open={drawerOpen}
        editing={editing}
        onClose={() => {
          // Reset any error from a previous failed save so the next
          // open of the drawer starts clean.
          saver.reset();
          setDrawerOpen(false);
        }}
        onSave={(c) => handleSaveCategory(c, editing !== null)}
        onRemove={(id) => handleRemoveCategory(id, editing?.name ?? "")}
        isSaving={saver.isPending}
        isDeleting={remover.isPending}
        errorMessage={errorText(saver.error) ?? errorText(remover.error)}
      />
    </section>
  );
}

function ShowCarCategoryRow({
  category,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  category: ShowCarCategory;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const ticketBadge = badgeForCategory(category);
  const subtitle = subtitleForCategory(category);
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
        <i className="fa-solid fa-trophy text-gold-600 text-sm" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-ink-900 truncate">
            {category.name}
          </p>
          <span className={ticketBadge.cls}>{ticketBadge.text}</span>
        </div>
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

// ============================================================
// Helpers
// ============================================================

function badgeForCategory(c: ShowCarCategory): {
  text: string;
  cls: string;
} {
  if (!c.requireTicket) {
    return {
      text: "No ticket required",
      cls: "text-[10px] uppercase tracking-wider font-semibold bg-ink-100 text-ink-500 border border-ink-200 px-1.5 py-0.5 rounded",
    };
  }
  const cost =
    Number.isFinite(c.ticketCost) && c.ticketCost > 0
      ? `£${stripZero(c.ticketCost)}`
      : "Free";
  return {
    text: `${cost} ticket`,
    cls: "text-[10px] uppercase tracking-wider font-semibold bg-gold-50 text-gold-700 border border-gold-200 px-1.5 py-0.5 rounded",
  };
}

function subtitleForCategory(c: ShowCarCategory): string {
  if (!c.applicationsOpen && !c.applicationsClose) return "";
  const parts: string[] = ["Applications"];
  if (c.applicationsOpen) parts.push(formatShort(c.applicationsOpen));
  parts.push("-");
  if (c.applicationsClose) parts.push(formatShort(c.applicationsClose));
  return parts.join(" ").replace("Applications  - ", "Applications ");
}

function formatShort(iso: string): string {
  // "15 April 2026" → "15 Apr"
  const full = formatEditorDate(iso);
  return full
    .replace(
      /(January|February|March|April|May|June|July|August|September|October|November|December)/,
      (m) => m.slice(0, 3),
    )
    .replace(/\s\d{4}$/, "");
}

function stripZero(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}
