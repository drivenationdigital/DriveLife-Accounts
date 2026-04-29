"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  useEventCreate,
  TRADER_ICONS,
  type TraderCategory,
  type TraderIcon,
} from "@/context/EventCreateContext";
import {
  EVENT_CREATE_STEP_COUNT,
  adjacentSteps,
} from "@/lib/eventCreateSteps";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { slugify } from "@/lib/slugify";

import { ApplicationLinksCard } from "../ApplicationLinksCard";
import { PanelHeader } from "../PanelHeader";
import { TraderCategoryDrawer } from "../TraderCategoryDrawer";

/**
 * Step 9 — Traders.
 *
 * Simpler than Show Cars (no event-level capacity, no ticket toggle).
 * Each trader category carries its own info text + application
 * window. Master enable toggle gates the section.
 */
export function TradersPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { prev, next } = adjacentSteps("traders");

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

  // DnD reorder
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
    const next = [...state.traderCategories];
    const [moved] = next.splice(dragIdx, 1);
    if (moved) {
      next.splice(targetIdx, 0, moved);
      dispatch({ type: "REORDER_TRADER_CATEGORIES", items: next });
    }
    onDragEnd();
  };
  const moveItem = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= state.traderCategories.length) return;
    const next = [...state.traderCategories];
    const a = next[idx];
    const b = next[target];
    if (!a || !b) return;
    next[idx] = b;
    next[target] = a;
    dispatch({ type: "REORDER_TRADER_CATEGORIES", items: next });
  };

  return (
    <section className="panel is-active" data-panel="traders" role="tabpanel">
      <PanelHeader
        stepNumber={9}
        totalSteps={EVENT_CREATE_STEP_COUNT}
        title="Traders"
        subtitle="Invite vendors, exhibitors and sponsors to apply for a trade stand at your event."
      />

      <label className="flex items-center justify-between gap-3 p-5 bg-white border border-ink-200 rounded-xl cursor-pointer mb-6">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            Enable trader applications
          </p>
          <p className="text-xs text-ink-500 mt-0.5">
            Accept applications from food vans, merchandise stalls, sponsors
            and exhibitors
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
                  Group traders by type — each category has its own
                  application window &amp; info
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
                No trader types yet. Add at least one for applicants to
                choose from.
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
                        onDelete={() =>
                          dispatch({
                            type: "REMOVE_TRADER_CATEGORY",
                            id: c.id,
                          })
                        }
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
              <i className="fa-solid fa-plus" aria-hidden /> Add another
              trader type
            </button>
          </div>

          <ApplicationLinksCard
            applicationKind="traders"
            slug={slugify(state.title) || "your-event"}
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
        onSave={(c) => {
          if (editing) {
            dispatch({ type: "UPDATE_TRADER_CATEGORY", category: c });
          } else {
            dispatch({ type: "ADD_TRADER_CATEGORY", category: c });
          }
        }}
        onRemove={(id) =>
          dispatch({ type: "REMOVE_TRADER_CATEGORY", id })
        }
      />
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
  const subtitle = subtitleForCategory(category);
  const iconClass = iconClassFor(category.icon);
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
        <i className={`${iconClass} text-gold-600 text-sm`} aria-hidden />
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

function iconClassFor(icon: TraderIcon): string {
  const found = TRADER_ICONS.find((i) => i.id === icon);
  return found?.faClass ?? "fa-solid fa-store";
}

function subtitleForCategory(c: TraderCategory): string {
  if (!c.applicationsOpen && !c.applicationsClose) return "";
  const parts: string[] = ["Applications"];
  if (c.applicationsOpen) parts.push(formatShort(c.applicationsOpen));
  parts.push("–");
  if (c.applicationsClose) parts.push(formatShort(c.applicationsClose));
  return parts.join(" ").replace("Applications  – ", "Applications ");
}

function formatShort(iso: string): string {
  const full = formatEditorDate(iso);
  return full
    .replace(
      /(January|February|March|April|May|June|July|August|September|October|November|December)/,
      (m) => m.slice(0, 3),
    )
    .replace(/\s\d{4}$/, "");
}
