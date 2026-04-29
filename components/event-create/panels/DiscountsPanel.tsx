"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  useEventCreate,
  type Discount,
} from "@/context/EventCreateContext";
import {
  EVENT_CREATE_STEP_COUNT,
  adjacentSteps,
} from "@/lib/eventCreateSteps";
import { formatEditorDate } from "@/lib/formatEditorDate";

import { PanelHeader } from "../PanelHeader";
import { DiscountDrawer } from "../DiscountDrawer";

/**
 * Step 6 of the wizard.
 *
 * Sections:
 *   1. Promo-code list — reorderable cards (HTML5 DnD + chevron
 *      buttons) with edit / delete actions. Expired codes render
 *      with reduced opacity and an "Expired" badge.
 *   2. "Add another discount code" full-width dashed CTA.
 *   3. Quick stats card — Active codes, Total uses, Discount given.
 *      "Discount given" is a server-derived metric so we display 0
 *      until real bookings exist; the others are computed locally.
 */
export function DiscountsPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { prev, next } = adjacentSteps("discounts");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- Drawer state ----
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);

  const openNew = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (d: Discount) => {
    setEditing(d);
    setDrawerOpen(true);
  };

  // ---- DnD reorder (same pattern as Tickets/Gallery) ----
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
    const next = [...state.discounts];
    const [moved] = next.splice(dragIdx, 1);
    if (moved) {
      next.splice(targetIdx, 0, moved);
      dispatch({ type: "REORDER_DISCOUNTS", items: next });
    }
    onDragEnd();
  };
  const moveItem = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= state.discounts.length) return;
    const next = [...state.discounts];
    const a = next[idx];
    const b = next[target];
    if (!a || !b) return;
    next[idx] = b;
    next[target] = a;
    dispatch({ type: "REORDER_DISCOUNTS", items: next });
  };

  // ---- Summary stats ----
  // "Active" = not expired. "Expired" derives from availableUntil < today.
  const todayIso = isoToday();
  const activeCount = state.discounts.filter(
    (d) => !isExpired(d, todayIso),
  ).length;
  const totalUses = state.discounts.reduce((sum, d) => sum + d.usageCount, 0);

  return (
    <section
      className="panel is-active"
      data-panel="discounts"
      role="tabpanel"
    >
      <PanelHeader
        stepNumber={6}
        totalSteps={EVENT_CREATE_STEP_COUNT}
        title="Discounts & upsells"
        subtitle="Create promo codes and early-bird offers. Drag to reorder how they appear at checkout."
      />

      {/* ---- Discount list ---- */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Promo codes</h3>
            <p className="text-xs text-ink-500 mt-0.5">
              Customers enter these at checkout to unlock the discount
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:text-gold-900 transition shrink-0"
          >
            <i className="fa-solid fa-plus" aria-hidden /> Add code
          </button>
        </div>

        {state.discounts.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-ink-200 rounded-xl bg-ink-50 text-ink-500 text-sm">
            No discount codes yet. Create one to offer at checkout.
          </div>
        ) : (
          <div className="space-y-3">
            {state.discounts.map((d, idx) => {
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
                  key={d.id}
                  className={wrapperClasses}
                  draggable
                  onDragStart={onDragStart(idx)}
                  onDragOver={onDragOver(idx)}
                  onDragEnd={onDragEnd}
                  onDrop={onDrop(idx)}
                >
                  <DiscountRow
                    discount={d}
                    todayIso={todayIso}
                    onEdit={() => openEdit(d)}
                    onDelete={() =>
                      dispatch({ type: "REMOVE_DISCOUNT", id: d.id })
                    }
                    onMoveUp={() => moveItem(idx, -1)}
                    onMoveDown={() => moveItem(idx, 1)}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < state.discounts.length - 1}
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
          <i className="fa-solid fa-plus" aria-hidden /> Add another discount
          code
        </button>
      </div>

      {/* ---- Quick stats ---- */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Active codes" value={String(activeCount)} />
        <StatCard label="Total uses" value={String(totalUses)} />
        <StatCard label="Discount given" value="£0" valueColor="gold" />
      </div>

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
          onClick={() => next && goTo(next)}
          className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      </div>

      <DiscountDrawer
        // Same key-based remount pattern as TicketDrawer/SectionDrawer
        // — synchronous form state seeding from props, no useEffect.
        key={`disc-${drawerOpen ? "open" : "closed"}-${editing?.id ?? "new"}`}
        open={drawerOpen}
        editing={editing}
        onClose={() => setDrawerOpen(false)}
        onSave={(d) => {
          if (editing) {
            dispatch({ type: "UPDATE_DISCOUNT", discount: d });
          } else {
            dispatch({ type: "ADD_DISCOUNT", discount: d });
          }
        }}
        onRemove={(id) => dispatch({ type: "REMOVE_DISCOUNT", id })}
      />
    </section>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function DiscountRow({
  discount,
  todayIso,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  discount: Discount;
  todayIso: string;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const expired = isExpired(discount, todayIso);
  const subtitle = discountSubtitle(discount);
  const containerClasses = [
    "ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3",
    expired && "opacity-60",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={containerClasses}>
      <button
        type="button"
        aria-label="Drag to reorder"
        className="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing shrink-0"
      >
        <i className="fa-solid fa-grip-vertical" aria-hidden />
      </button>

      {/* Icon — gold for live codes, muted for expired ones. */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          expired
            ? "bg-ink-100 border border-ink-200"
            : "bg-gold-50 border border-gold-200"
        }`}
      >
        <i
          className={`fa-solid fa-tag text-sm ${
            expired ? "text-ink-400" : "text-gold-600"
          }`}
          aria-hidden
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-ink-900 truncate font-mono tracking-wide">
            {discount.code}
          </p>
          {expired ? (
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-ink-100 text-ink-500 border border-ink-200 px-1.5 py-0.5 rounded">
              Expired
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
              {discountAmountLabel(discount)}
            </span>
          )}
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

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: "ink" | "gold";
}) {
  const cls = valueColor === "gold" ? "text-gold-600" : "text-ink-900";
  return (
    <div className="bg-white border border-ink-200 rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-500 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-display ${cls}`}>{value}</p>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function isoToday(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** A discount is expired when its `availableUntil` is set and is
 *  strictly before today. Null/undefined means no upper bound. */
function isExpired(d: Discount, todayIso: string): boolean {
  return d.availableUntil != null && d.availableUntil < todayIso;
}

/** "15% off" or "£5 off" — the amount badge text. */
function discountAmountLabel(d: Discount): string {
  if (d.kind === "percentage") {
    // Trim a trailing .0 / .00 so 15.0 reads as "15% off".
    return `${stripZeroDecimal(d.amount)}% off`;
  }
  return `£${stripZeroDecimal(d.amount)} off`;
}

function stripZeroDecimal(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}

/** "Used 24 / 100 · Expires 15 Apr 2026" subtitle.
 *  Falls back gracefully when fields are unset. */
function discountSubtitle(d: Discount): string {
  const parts: string[] = [];
  const limit = d.usageLimit == null ? "Unlimited" : String(d.usageLimit);
  parts.push(`Used ${d.usageCount} / ${limit}`);

  if (d.note) {
    parts.push(d.note);
  } else if (d.availableUntil) {
    const dateLabel = formatShort(d.availableUntil);
    const verb =
      d.availableUntil < isoToday() ? "Ended" : "Expires";
    parts.push(`${verb} ${dateLabel}`);
  } else if (d.availableFrom) {
    parts.push(`From ${formatShort(d.availableFrom)}`);
  }
  return parts.join(" · ");
}

/** "2026-04-15" → "15 Apr 2026" — tight subtitle variant. */
function formatShort(iso: string): string {
  const full = formatEditorDate(iso); // "15 April 2026"
  return full.replace(
    /(January|February|March|April|May|June|July|August|September|October|November|December)/,
    (m) => m.slice(0, 3),
  );
}
