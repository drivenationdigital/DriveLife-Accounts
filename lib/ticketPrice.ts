import { formatRegionCurrency, type Region } from "./regions";

/**
 * Ticket price rule: free, or at least 1.00 in the event's currency
 * (£1 / $1 / €1).
 *
 * The checkout can't take payment for less - Stripe errors on very
 * small charges and the other providers have floors of their own - so
 * one round minimum applies to every price an organiser sets and to
 * the total a buyer pays. The backend enforces the same rule
 * (dl_accounts_ticket_price_error for prices, cc_checkout_min_total
 * for order totals); these helpers only say so before the request.
 */
export const MIN_PAID_AMOUNT = 1;

/** True for an amount that is neither free nor payable (0.01 - 0.99). */
export function isBelowMinimumAmount(amount: number): boolean {
  if (!Number.isFinite(amount)) return false;
  const minor = Math.round(amount * 100);
  return minor > 0 && minor < MIN_PAID_AMOUNT * 100;
}

/** Inline wording for a price field holding such an amount. */
export function minimumPriceMessage(
  region: Region,
  subject = "Paid tickets",
): string {
  return `${subject} must be at least ${formatRegionCurrency(MIN_PAID_AMOUNT, region)} - or enter 0 to make it free.`;
}

/** Buyer-facing wording for an order total the checkout can't charge. */
export function belowMinimumOrderMessage(total: number, region: Region): string {
  return `This order comes to ${formatRegionCurrency(total, region)}, which is below the ${formatRegionCurrency(MIN_PAID_AMOUNT, region)} minimum we can take payment for. Please change your order or contact the event organiser.`;
}
