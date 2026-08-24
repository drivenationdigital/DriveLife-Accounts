"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { CheckoutTicket, CouponRow } from "@/lib/checkout/api";
import { formatRegionCurrency, type Region } from "@/lib/regions";
import { ButtonSpinner } from "@/components/apply/ApplyIcons";

/**
 * Step 1 - pick tickets.
 *
 * Prices shown here follow the classic checkout's display rules: the
 * organiser's VAT-inclusive multiplier is applied for display only
 * (authoritative totals always come from the server), and a validated
 * pre-checkout coupon strikes through the original price on the
 * tickets it covers.
 */

export function couponAppliesTo(
  coupon: CouponRow | null,
  ticketId: number,
): boolean {
  if (!coupon) return false;
  const allowed = (coupon.allowed_products ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return allowed.length === 0 || allowed.includes(String(ticketId));
}

export function discountedPrice(price: number, coupon: CouponRow): number {
  const amount = Number(coupon.discount_amount) || 0;
  if (coupon.discount_type === "percentage") {
    return price * (1 - amount / 100);
  }
  return Math.max(0, price - amount);
}

function TicketDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > 120;
  const shown = expanded || !isLong ? text : `${text.slice(0, 120)}…`;
  return (
    <div className="text-[13px] text-ink-500 leading-relaxed mt-2.5 whitespace-pre-line">
      {shown}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="ml-1 text-gold-600 hover:text-gold-700 font-semibold"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const btn =
    "w-8 h-8 rounded-lg border border-ink-200 text-ink-700 font-bold text-base leading-none transition hover:border-gold-500 hover:text-gold-600 disabled:opacity-30 disabled:hover:border-ink-200 disabled:hover:text-ink-700";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={btn}
        aria-label="Remove one"
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-bold text-ink-900 tabular-nums">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        aria-label="Add one"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

/** Chip for an active discount/secret code, with a remove control. */
function ActiveCodeChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] font-bold bg-gold-50 text-gold-700 border border-gold-200 rounded-full pl-3 pr-1.5 py-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="w-5 h-5 rounded-full hover:bg-gold-200/60 transition leading-none"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  );
}

/** Inline expanding code entry - replaces the classic Bootstrap modals. */
function CodeEntry({
  label,
  placeholder,
  cta,
  onApply,
}: {
  label: string;
  placeholder: string;
  cta: string;
  onApply: (code: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onApply(code.trim());
      setCode("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13px] font-semibold text-gold-600 hover:text-gold-700 transition"
      >
        {label}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex gap-2">
        <input
          className="input !py-2 !text-sm"
          placeholder={placeholder}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="px-4 py-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-white text-sm font-bold rounded-lg transition inline-flex items-center gap-2 shrink-0"
        >
          {busy && <ButtonSpinner />}
          {cta}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1.5" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function TicketsStep({
  tickets,
  vatMultiplier,
  region,
  cname,
  cartLimit,
  quantities,
  onQuantityChange,
  coupon,
  onApplyCoupon,
  onRemoveCoupon,
  onApplySecret,
  secretActive,
  onRemoveSecret,
  onCheckout,
  checkingOut,
  error,
}: {
  tickets: CheckoutTicket[];
  vatMultiplier: number;
  region: Region;
  cname: string;
  cartLimit: number;
  quantities: Record<string, number>;
  onQuantityChange: (pid: string, qty: number) => void;
  coupon: CouponRow | null;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
  onApplySecret: (code: string) => Promise<void>;
  secretActive: boolean;
  onRemoveSecret: () => void;
  onCheckout: () => void;
  checkingOut: boolean;
  error: string | null;
}) {
  const totalSelected = useMemo(
    () => Object.values(quantities).reduce((sum, q) => sum + q, 0),
    [quantities],
  );

  // A fixed-amount code is applied ONCE against the basket (the
  // backend spreads it across eligible lines), not per ticket - so it
  // never gets per-ticket strikethrough pricing, and the subtotal
  // subtracts it a single time, capped at the eligible tickets' value.
  // Percentage codes genuinely reprice each eligible ticket, so those
  // keep the per-ticket display.
  const isFixedCoupon = coupon?.discount_type === "fixed";
  const fixedAmount = isFixedCoupon
    ? Number(coupon?.discount_amount) || 0
    : 0;

  const subtotal = useMemo(() => {
    let sum = 0;
    let eligible = 0;
    for (const t of tickets) {
      if (t.isSection) continue;
      const qty = quantities[t.pid] ?? 0;
      if (!qty) continue;
      let price = t.price * vatMultiplier;
      const applies = coupon ? couponAppliesTo(coupon, t.id) : false;
      if (applies && coupon && !isFixedCoupon) {
        price = discountedPrice(price, coupon);
      }
      sum += price * qty;
      if (applies) eligible += price * qty;
    }
    if (isFixedCoupon && eligible > 0) {
      sum = Math.max(0, sum - Math.min(fixedAmount, eligible));
    }
    return sum;
  }, [tickets, quantities, vatMultiplier, coupon, isFixedCoupon, fixedAmount]);

  const buyable = tickets.filter((t) => !t.isSection);

  // A validated code that covers NONE of the selected tickets will be
  // rejected at checkout - say so up front instead of letting the
  // buyer discover it a step later.
  const couponCoversSelection =
    !coupon ||
    totalSelected === 0 ||
    buyable.some(
      (t) => (quantities[t.pid] ?? 0) > 0 && couponAppliesTo(coupon, t.id),
    );

  return (
    <section className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-5 pb-4">
        <h2 className="text-base font-bold text-ink-900 tracking-tight">
          Tickets
        </h2>
      </div>

      {buyable.length === 0 ? (
        <p className="p-6 text-sm text-ink-600">
          There are currently no tickets available for this event.
        </p>
      ) : (
        <ul>
          {tickets.map((t, i) => {
            if (t.isSection) {
              return (
                <li
                  key={`section-${i}`}
                  className="px-6 py-2.5 border-t border-ink-200 bg-ink-50 text-[11px] uppercase tracking-[0.14em] font-bold text-ink-500"
                >
                  {t.name}
                </li>
              );
            }

            const qty = quantities[t.pid] ?? 0;
            const displayPrice = t.price * vatMultiplier;
            // Per-ticket strikethrough for percentage codes only - a
            // fixed discount is shown on the code chip instead.
            const hasDiscount =
              coupon && !isFixedCoupon && couponAppliesTo(coupon, t.id);
            const finalPrice = hasDiscount
              ? discountedPrice(displayPrice, coupon)
              : displayPrice;
            // The classic checkout clamps every stepper by the event's
            // per-order cap as well as the ticket's own limit.
            const remainingCap =
              cartLimit > 0 ? cartLimit - (totalSelected - qty) : Infinity;
            const max = Math.min(t.maxQuantity, remainingCap);

            return (
              <li
                key={t.pid}
                className="px-6 py-4 border-t border-ink-200 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-ink-900 leading-snug">
                    {cname ? `${t.name} – ${cname}` : t.name}
                    {t.secretMatched && (
                      // Open padlock: this ticket was revealed by the
                      // secret code the buyer entered.
                      <svg
                        className="inline-block ml-1.5 align-[-2px] text-gold-500"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        role="img"
                        aria-label="Unlocked with secret code"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                    )}
                  </h3>
                  <div className="text-[15px] font-bold text-ink-900 tabular-nums mt-0.5 flex items-baseline gap-2">
                    <span className={hasDiscount ? "text-gold-600" : undefined}>
                      {finalPrice <= 0
                        ? "Free"
                        : formatRegionCurrency(finalPrice, region)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs font-medium text-ink-400 line-through">
                        {formatRegionCurrency(displayPrice, region)}
                      </span>
                    )}
                  </div>
                  <TicketDescription text={t.description} />
                </div>

                <div className="shrink-0 text-right">
                  {t.earlyLiveDate ? (
                    <p className="text-xs text-ink-500">
                      Goes live
                      <br />
                      <span className="font-semibold text-ink-700">
                        {new Date(t.earlyLiveDate).toLocaleString(
                          region.locale,
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </p>
                  ) : t.soldOut ? (
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wide bg-ink-100 text-ink-500 rounded-full px-2.5 py-1">
                      Sold out
                    </span>
                  ) : (
                    <QuantityStepper
                      value={qty}
                      max={max}
                      onChange={(next) => onQuantityChange(t.pid, next)}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-ink-200 px-6 py-4 space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {coupon ? (
            <ActiveCodeChip
              label={
                isFixedCoupon
                  ? `Code ${coupon.coupon_code} (−${formatRegionCurrency(fixedAmount, region)})`
                  : `Code ${coupon.coupon_code}`
              }
              onRemove={onRemoveCoupon}
            />
          ) : (
            <CodeEntry
              label="Have a discount code?"
              placeholder="Discount code"
              cta="Apply"
              onApply={onApplyCoupon}
            />
          )}
          {secretActive ? (
            <ActiveCodeChip
              label="Secret code active"
              onRemove={onRemoveSecret}
            />
          ) : (
            <CodeEntry
              label="Have a secret code?"
              placeholder="Secret code"
              cta="Unlock"
              onApply={onApplySecret}
            />
          )}
        </div>

        {!couponCoversSelection && coupon && (
          <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            Code {coupon.coupon_code} doesn&apos;t apply to any of the selected
            tickets.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-ink-600">
            Subtotal{" "}
            <span className="text-lg font-extrabold text-ink-900 tabular-nums ml-1">
              {formatRegionCurrency(subtotal, region)}
            </span>
          </p>
          <button
            type="button"
            onClick={onCheckout}
            disabled={totalSelected === 0 || checkingOut}
            className="px-8 py-3 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
          >
            {checkingOut && <ButtonSpinner />}
            {checkingOut ? "Reserving…" : "Checkout"}
          </button>
        </div>
      </div>
    </section>
  );
}
