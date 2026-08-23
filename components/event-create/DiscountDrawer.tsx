"use client";

import { useEventRegion } from "@/lib/useEventSteps";
import { useState } from "react";

import {
  useEventCreate,
  type Discount,
  type DiscountId,
  type DiscountKind,
  type Ticket,
  type TicketId,
} from "@/context/EventCreateContext";
import { formatEditorDate } from "@/lib/formatEditorDate";
import { formatRegionCurrency } from "@/lib/regions";
import { makeLocalId } from "@/lib/makeLocalId";

import { EditorDrawer } from "./EditorDrawer";
import { FullScreenDatePicker } from "./FullScreenDatePicker";

/**
 * Discount add/edit drawer.
 *
 * State seeding pattern:
 *   - All form fields seeded via `useState(() => …)` from `editing`
 *     at mount. Parent (DiscountsPanel) re-keys this component on
 *     each open so seeding is fresh - no `useEffect` re-syncing.
 *
 * Form sections:
 *   1. Code - uppercase mono input, helper line.
 *   2. Discount type - segmented `percentage` | `fixed`. The amount
 *      input swaps its prefix/suffix marker accordingly (£ before vs
 *      % after).
 *   3. Usage limits - total + per-customer (both nullable; blank ⇒
 *      unlimited).
 *   4. Applicable tickets - checkbox list. The empty array stored on
 *      the discount means "applies to all tickets" - semantically
 *      different from a populated array containing every current id,
 *      because new tickets added later should auto-apply.
 *   5. Availability window - date+time on each side.
 */
type DateTarget = "from" | "until";

export function DiscountDrawer({
  open,
  editing,
  onClose,
  onSave,
  onRemove,
  isSaving = false,
  isDeleting = false,
  errorMessage = null,
}: {
  open: boolean;
  editing: Discount | null;
  onClose: () => void;
  onSave: (discount: Discount) => void;
  onRemove: (id: DiscountId) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  errorMessage?: string | null;
}) {
  const { state } = useEventCreate();

  // Pull just the ticket-kind rows from the ticket list - sections
  // aren't selectable for discounts.
  const allTickets: Ticket[] = state.ticketList.filter(
    (i): i is Ticket => i.kind === "ticket",
  );

  // ---- Form state ----
  const [code, setCode] = useState(() => editing?.code ?? "");
  const [kind, setKind] = useState<DiscountKind>(
    () => editing?.kind ?? "percentage",
  );
  const [amount, setAmount] = useState(() =>
    editing && Number.isFinite(editing.amount)
      ? String(editing.amount)
      : "",
  );
  const [usageLimit, setUsageLimit] = useState(() =>
    editing?.usageLimit != null ? String(editing.usageLimit) : "",
  );
  const [perCustomerLimit, setPerCustomerLimit] = useState(() =>
    editing?.perCustomerLimit != null ? String(editing.perCustomerLimit) : "",
  );

  // applicableTicketIds: empty in state = "all tickets". For the UI
  // we initialise the local "all" toggle from that, and the
  // checkboxes from a derived set. We keep a local Set for fast
  // toggling, then serialise back to the empty-array convention
  // when the user has all of them ticked.
  const [allTicketsChecked, setAllTicketsChecked] = useState(
    () => !editing || editing.applicableTicketIds.length === 0,
  );
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<TicketId>>(
    () => {
      if (!editing || editing.applicableTicketIds.length === 0) {
        return new Set(allTickets.map((t) => t.id));
      }
      return new Set(editing.applicableTicketIds);
    },
  );

  const [availableFrom, setAvailableFrom] = useState<string | null>(
    () => editing?.availableFrom ?? null,
  );
  const [availableUntil, setAvailableUntil] = useState<string | null>(
    () => editing?.availableUntil ?? null,
  );

  const [pickerTarget, setPickerTarget] = useState<DateTarget | null>(null);

  // ---- Handlers ----
  // Code field: uppercase + strip whitespace as the user types so
  // copy-pasted "early bird 15" lands as "EARLYBIRD15".
  const onCodeChange = (raw: string) => {
    setCode(raw.toUpperCase().replace(/\s+/g, ""));
  };

  const toggleAllTickets = (checked: boolean) => {
    setAllTicketsChecked(checked);
    if (checked) {
      setSelectedTicketIds(new Set(allTickets.map((t) => t.id)));
    } else {
      setSelectedTicketIds(new Set());
    }
  };

  const toggleTicket = (id: TicketId) => {
    // Compute the next set OUTSIDE the state updater. The previous
    // version called setAllTicketsChecked() inside the
    // setSelectedTicketIds updater - updaters must be pure, and React
    // (which double-invokes them in dev and may re-run them under
    // concurrent rendering) fired the nested setState an unpredictable
    // number of times, making the checkboxes glitch and sometimes
    // crashing the drawer blank.
    const next = new Set(selectedTicketIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTicketIds(next);
    // Keep the "all" master in sync.
    setAllTicketsChecked(next.size === allTickets.length);
  };

  const handleSave = () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    // Empty array convention for "applies to all".
    const applicable: TicketId[] = allTicketsChecked
      ? []
      : allTickets
          .filter((t) => selectedTicketIds.has(t.id))
          .map((t) => t.id);

    const id = editing?.id ?? (makeLocalId("disc") as DiscountId);
    const discount: Discount = {
      id,
      code: trimmedCode,
      kind,
      amount: parsedAmount,
      usageLimit: usageLimit ? Math.max(1, parseInt(usageLimit, 10)) : null,
      perCustomerLimit: perCustomerLimit
        ? Math.max(1, parseInt(perCustomerLimit, 10))
        : null,
      // Preserve usageCount when editing; new discounts start at 0.
      usageCount: editing?.usageCount ?? 0,
      applicableTicketIds: applicable,
      availableFrom,
      availableUntil,
      note: editing?.note ?? "",
      discountGiven:0,
    };
    onSave(discount);
    // No onClose() here - caller drives the drawer's open state
    // around the async save (same pattern as TicketDrawer).
  };

  const isPercent = kind === "percentage";
  const region = useEventRegion();

  const renderDateField = (target: DateTarget, value: string | null) => (
    <button
      type="button"
      className={`date-field ${value ? "" : "is-empty"}`}
      onClick={() => setPickerTarget(target)}
    >
      <i className="fa-regular fa-calendar df-icon" aria-hidden />
      <span className="df-display">
        {value ? formatEditorDate(value, region) : "Select date"}
      </span>
      <i className="fa-solid fa-chevron-down df-chev" aria-hidden />
    </button>
  );

  const isSaveable =
    code.trim().length > 0 &&
    Number.isFinite(parseFloat(amount)) &&
    parseFloat(amount) > 0;

  return (
    <>
      <EditorDrawer
        open={open}
        onClose={onClose}
        eyebrow="Discount"
        title={editing ? "Edit discount code" : "Add discount code"}
        footer={
          <div className="flex flex-col gap-2 w-full">
            {errorMessage && (
              <p className="text-xs text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting}
                className="flex-1 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isSaveable || isSaving || isDeleting}
                className="flex-1 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition inline-flex items-center justify-center gap-2"
              >
                {isSaving && (
                  <i
                    className="fa-solid fa-spinner fa-spin text-xs"
                    aria-hidden
                  />
                )}
                {isSaving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Save discount"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => onRemove(editing.id)}
                  disabled={isSaving || isDeleting}
                  aria-label="Delete discount"
                  className="ml-1 w-11 h-11 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center shrink-0"
                >
                  <i
                    className={
                      isDeleting
                        ? "fa-solid fa-spinner fa-spin text-sm"
                        : "fa-solid fa-trash text-sm"
                    }
                    aria-hidden
                  />
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Code */}
        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Discount code <span className="text-gold-600">*</span>
          </label>
          <input
            type="text"
            className="input font-mono uppercase tracking-wide"
            placeholder="e.g. EARLYBIRD15"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-ink-500 mt-2">
            Customers enter this at checkout. Letters and numbers only, no
            spaces.
          </p>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Discount type <span className="text-gold-600">*</span>
          </label>
          <div className="seg w-full" role="group">
            <button
              type="button"
              className={`seg-btn ${isPercent ? "is-active" : ""}`}
              onClick={() => setKind("percentage")}
            >
              <i className="fa-solid fa-percent mr-2" aria-hidden />
              Percentage
            </button>
            <button
              type="button"
              className={`seg-btn ${!isPercent ? "is-active" : ""}`}
              onClick={() => setKind("fixed")}
            >
              <i className={`${region.currencyIcon} mr-2`} aria-hidden />
              Fixed amount
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-ink-900 mb-2">
            Amount <span className="text-gold-600">*</span>
          </label>
          <div className="relative">
            {/* Prefix shows the region's currency symbol for fixed;
                suffix shows % for percentage. We swap them rather than
                rendering both - avoids a hidden-but-occupying-space
                layout shift bug. */}
            {!isPercent && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-semibold pointer-events-none">
                {region.currencySymbol}
              </span>
            )}
            {isPercent && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 font-semibold pointer-events-none">
                %
              </span>
            )}
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              className={`input ${!isPercent ? "pl-9" : ""}`}
              placeholder={isPercent ? "15" : "5.00"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Usage limits */}
        <div className="pt-3 border-t border-ink-200">
          <p className="text-sm font-semibold text-ink-900 mb-3">Usage limits</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Total uses
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                className="input"
                placeholder="e.g. 100"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
              <p className="text-xs text-ink-500 mt-1.5">
                Leave blank for unlimited
              </p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Per customer
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                className="input"
                placeholder="e.g. 1"
                value={perCustomerLimit}
                onChange={(e) => setPerCustomerLimit(e.target.value)}
              />
              <p className="text-xs text-ink-500 mt-1.5">Max uses per buyer</p>
            </div>
          </div>
        </div>

        {/* Applicable tickets */}
        <div className="pt-3 border-t border-ink-200">
          <p className="text-sm font-semibold text-ink-900 mb-1">
            Applicable tickets
          </p>
          <p className="text-xs text-ink-500 mb-3">
            Which tickets can this code be used with?
          </p>
          {allTickets.length === 0 ? (
            <p className="text-xs text-ink-500 italic">
              No tickets yet - add tickets in step 5 first.
            </p>
          ) : (
            <div className="bg-ink-50 border border-ink-200 rounded-lg p-4">
              <label className="cb-label !py-2">
                <input
                  type="checkbox"
                  checked={allTicketsChecked}
                  onChange={(e) => toggleAllTickets(e.target.checked)}
                />
                <span className="cb-box" />
                <span className="cb-text font-semibold">
                  Select all tickets
                </span>
              </label>
              <div className="h-px bg-ink-200 my-2" />
              {allTickets.map((t) => (
                <label key={t.id} className="cb-label !py-2">
                  <input
                    type="checkbox"
                    checked={selectedTicketIds.has(t.id)}
                    onChange={() => toggleTicket(t.id)}
                  />
                  <span className="cb-box" />
                  <span className="cb-text">
                    {t.name}
                    {Number.isFinite(t.price) && (
                      <span className="text-ink-400">
                        {" "}
                        · {formatRegionCurrency(t.price, region)}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Availability window */}
        <div className="pt-3 border-t border-ink-200">
          <p className="text-sm font-semibold text-ink-900 mb-3">
            Availability window
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Available from
              </label>
              {renderDateField("from", availableFrom)}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">
                Available until
              </label>
              {renderDateField("until", availableUntil)}
            </div>
          </div>
        </div>
      </EditorDrawer>

      <FullScreenDatePicker
        open={pickerTarget !== null}
        title={
          pickerTarget === "from" ? "Available from" : "Available until"
        }
        value={
          pickerTarget === "from"
            ? availableFrom
            : pickerTarget === "until"
              ? availableUntil
              : null
        }
        onClose={() => setPickerTarget(null)}
        onChange={(next) => {
          if (pickerTarget === "from") setAvailableFrom(next);
          else if (pickerTarget === "until") setAvailableUntil(next);
        }}
      />
    </>
  );
}
