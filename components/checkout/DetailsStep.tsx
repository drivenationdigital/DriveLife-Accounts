"use client";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import DOMPurify from "isomorphic-dompurify";
import type {
  CartData,
  CartTotals,
  CheckoutEvent,
  CheckoutTicket,
} from "@/lib/checkout/api";
import { formatRegionCurrency, type Region } from "@/lib/regions";
import { ButtonSpinner } from "@/components/apply/ApplyIcons";
import { Field, Section } from "./CheckoutShell";

/**
 * Step 2 - buyer details.
 *
 * One card per ticket *unit* (a qty-2 line renders two cards), with
 * the extra fields the ticket's meta flags demand - exactly the rules
 * templates/checkout.php applies server-side in the classic checkout.
 * Field values sync to the PHP cart row so the order builder can read
 * them; the page owns that syncing, this component just reports
 * changes and blurs.
 */

export interface BillingState {
  billing_first_name: string;
  billing_last_name: string;
  billing_email: string;
  billing_phone: string;
}

export interface AttendeeState {
  attendee_display: boolean;
  attendee_name: string;
  attendee_vehicle: string;
}

export interface CheckoutUnit {
  pid: string;
  index: number;
  ticket: CheckoutTicket;
}

/** Expand cart lines into per-unit entries, in cart order. */
export function cartUnits(
  cart: CartData,
  tickets: CheckoutTicket[],
): CheckoutUnit[] {
  const byPid = new Map(tickets.map((t) => [t.pid, t]));
  const units: CheckoutUnit[] = [];
  for (const [pid, line] of Object.entries(cart)) {
    const ticket = byPid.get(pid);
    if (!ticket) continue;
    for (let i = 0; i < line.qty; i++) {
      units.push({ pid, index: i, ticket });
    }
  }
  return units;
}

export type UnitFieldKind = "text" | "tel" | "checkbox" | "photo";

export interface UnitFieldSpec {
  field: string;
  label: string;
  kind: UnitFieldKind;
}

/** The per-unit inputs a ticket's flags require, in render order. */
export function unitFieldSpecs(ticket: CheckoutTicket): UnitFieldSpec[] {
  const specs: UnitFieldSpec[] = [];
  if (ticket.flags.contactDetails) {
    specs.push({ field: "name", label: "Full Name", kind: "text" });
    specs.push({ field: "phone", label: "Phone Number", kind: "tel" });
  }
  if (ticket.flags.carDetails) {
    specs.push({ field: "make", label: "Vehicle Make", kind: "text" });
    specs.push({ field: "model", label: "Vehicle Model", kind: "text" });
    specs.push({ field: "reg", label: "Vehicle Registration", kind: "text" });
  }
  if (ticket.flags.carClub) {
    specs.push({ field: "car_club", label: "Car Club Name", kind: "text" });
  }
  if (ticket.flags.vehiclePhoto) {
    specs.push({
      field: "vehicle_photo",
      label: "Vehicle Photo",
      kind: "photo",
    });
  }
  if (ticket.flags.concours) {
    specs.push({
      field: "concours",
      label: "Concours / Special Display",
      kind: "checkbox",
    });
  }
  return specs;
}

/**
 * Single-photo upload for a ticket unit (request_vehicle_photo).
 * The file goes straight to Cloudflare Images via the parent's
 * onUpload; what we hold in cart meta is only the delivery URL.
 */
function PhotoField({
  label,
  value,
  error,
  required = true,
  onUpload,
  onRemove,
}: {
  label: string;
  value: string;
  error?: string | null;
  /** Box-office orders relax the photo to optional - the admin
   *  placing a phone order rarely has the customer's photo to hand. */
  required?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    setUploadError(null);
    try {
      await onUpload(file);
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "Upload failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sm:col-span-2">
      <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-500 inline-flex items-center gap-1">
        {label}
        {required && <span className="text-gold-600 text-sm leading-none">*</span>}
      </span>
      <div className="mt-1.5">
        {value ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Vehicle"
              className="w-20 h-20 object-cover rounded-lg ring-1 ring-ink-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={pick}
                disabled={busy}
                className="px-3 py-1.5 text-[13px] font-semibold text-ink-700 bg-white border border-ink-200 rounded-lg hover:border-gold-500 hover:text-gold-600 transition disabled:opacity-40"
              >
                {busy ? "Uploading…" : "Change"}
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={busy}
                className="px-3 py-1.5 text-[13px] font-semibold text-ink-500 bg-white border border-ink-200 rounded-lg hover:border-red-300 hover:text-red-600 transition disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            className={`w-full flex items-center justify-center gap-2.5 py-4 text-sm font-semibold rounded-xl border-2 border-dashed transition ${
              error
                ? "border-red-300 text-red-600"
                : "border-ink-200 text-ink-500 hover:border-gold-500 hover:text-gold-600"
            } disabled:opacity-60`}
          >
            {busy ? (
              <>
                <span
                  aria-hidden
                  className="inline-block w-4 h-4 rounded-full border-2 border-gold-200 border-t-gold-600 animate-spin"
                />
                Uploading photo…
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Upload a photo of your vehicle
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void handleFile(file);
          }}
        />
        {(uploadError || error) && (
          <p className="text-xs text-red-600 mt-1" role="alert">
            {uploadError || error}
          </p>
        )}
      </div>
    </div>
  );
}

function CollapsibleTerms({ event }: { event: CheckoutEvent }) {
  const [open, setOpen] = useState(false);
  const html = useMemo(() => {
    const combined = [event.terms_html, event.site_terms_html]
      .filter(Boolean)
      .join("<hr />");
    return DOMPurify.sanitize(combined);
  }, [event.terms_html, event.site_terms_html]);
  if (!html) return null;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[13px] font-semibold text-gold-600 hover:text-gold-700 transition"
      >
        {open ? "Hide terms & conditions" : "View terms & conditions"}
      </button>
      {open && (
        <div
          className="mt-3 max-h-64 overflow-y-auto text-xs text-ink-600 leading-relaxed bg-ink-50 border border-ink-100 rounded-xl p-4 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-[13px] [&_h2]:font-bold [&_p]:mb-2"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  accent,
}: {
  label: ReactNode;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 text-sm ${
        bold ? "font-extrabold text-ink-900 text-base" : "text-ink-700"
      }`}
    >
      <span>{label}</span>
      <span className={`tabular-nums ${accent ? "text-gold-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function DetailsStep({
  event,
  region,
  tickets,
  cart,
  cname,
  billing,
  onBillingChange,
  attendee,
  onAttendeeChange,
  showAttendee,
  heardAbout,
  onHeardAboutChange,
  futureUpdates,
  onFutureUpdatesChange,
  termsAccepted,
  onTermsChange,
  unitValue,
  onUnitChange,
  onUnitBlur,
  onUnitCommit,
  onUploadPhoto,
  onRemoveUnit,
  removingUnit,
  totals,
  couponBusy,
  onApplyCoupon,
  onRemoveCoupon,
  fieldErrors,
  onContinue,
  submitting,
  error,
  boxOffice,
}: {
  event: CheckoutEvent;
  region: Region;
  tickets: CheckoutTicket[];
  cart: CartData;
  cname: string;
  billing: BillingState;
  onBillingChange: (field: keyof BillingState, value: string) => void;
  attendee: AttendeeState;
  onAttendeeChange: (next: AttendeeState) => void;
  showAttendee: boolean;
  heardAbout: string;
  onHeardAboutChange: (v: string) => void;
  futureUpdates: boolean;
  onFutureUpdatesChange: (v: boolean) => void;
  termsAccepted: boolean;
  onTermsChange: (v: boolean) => void;
  unitValue: (pid: string, index: number, field: string) => string;
  onUnitChange: (pid: string, index: number, field: string, value: string) => void;
  onUnitBlur: (pid: string, index: number, field: string) => void;
  /** Set + sync a field in one step (checkboxes, photo removal) -
   *  avoids the stale-state race of change-then-blur in one event. */
  onUnitCommit: (pid: string, index: number, field: string, value: string) => void;
  onUploadPhoto: (pid: string, index: number, file: File) => Promise<void>;
  onRemoveUnit: (pid: string, index: number) => void;
  removingUnit: boolean;
  totals: CartTotals | null;
  couponBusy: boolean;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: (code: string) => void;
  fieldErrors: Record<string, string>;
  onContinue: () => void;
  submitting: boolean;
  error: string | null;
  /** Authorised organiser placing an order: payment is skipped, the
   *  customer-facing extras are hidden, photos become optional. */
  boxOffice: boolean;
}) {
  const units = useMemo(() => cartUnits(cart, tickets), [cart, tickets]);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  const applyCouponSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || couponBusy) return;
    setCouponError(null);
    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode("");
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Invalid coupon");
    }
  };

  const billingInput = (
    field: keyof BillingState,
    label: string,
    type: string,
  ) => (
    <Field label={label} required error={fieldErrors[field]}>
      <input
        className={`input ${fieldErrors[field] ? "input-error" : ""}`}
        type={type}
        value={billing[field]}
        onChange={(e) => onBillingChange(field, e.target.value)}
        autoComplete={
          field === "billing_email"
            ? "email"
            : field === "billing_phone"
              ? "tel"
              : field === "billing_first_name"
                ? "given-name"
                : "family-name"
        }
        required
      />
    </Field>
  );

  const appliedCoupons = totals?.coupons?.coupons ?? {};
  let stepNo = 0;

  return (
    <div className="space-y-5">
      <Section step={++stepNo} title="Your details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {billingInput("billing_first_name", "First Name", "text")}
          {billingInput("billing_last_name", "Last Name", "text")}
          {billingInput("billing_email", "Email Address", "email")}
          {billingInput("billing_phone", "Phone Number", "tel")}
        </div>
      </Section>

      <Section step={++stepNo} title="Your tickets">
        <div className="space-y-4">
          {units.map((unit) => {
            const specs = unitFieldSpecs(unit.ticket);
            return (
              <div
                key={`${unit.pid}-${unit.index}`}
                className="rounded-xl border border-ink-100 bg-ink-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink-900">
                      {unit.ticket.name}
                    </p>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {unit.ticket.price <= 0
                        ? "Free"
                        : formatRegionCurrency(unit.ticket.price, region)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveUnit(unit.pid, unit.index)}
                    disabled={removingUnit}
                    className="text-ink-400 hover:text-red-600 transition disabled:opacity-40"
                    aria-label={`Remove ${unit.ticket.name}`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {unit.ticket.flags.collectionDelivery &&
                  unit.ticket.collectionInformation && (
                    <p className="mt-3 text-xs text-ink-600 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2">
                      {unit.ticket.collectionInformation}
                    </p>
                  )}

                {specs.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specs.map((spec) => {
                      const errKey = `${unit.pid}:${unit.index}:${spec.field}`;
                      if (spec.kind === "checkbox") {
                        return (
                          <label
                            key={spec.field}
                            className="flex items-center gap-2.5 text-sm text-ink-700 sm:col-span-2"
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-gold-500"
                              checked={
                                unitValue(unit.pid, unit.index, spec.field) ===
                                "yes"
                              }
                              onChange={(e) =>
                                onUnitCommit(
                                  unit.pid,
                                  unit.index,
                                  spec.field,
                                  e.target.checked ? "yes" : "",
                                )
                              }
                            />
                            {spec.label}
                          </label>
                        );
                      }
                      if (spec.kind === "photo") {
                        return (
                          <PhotoField
                            key={spec.field}
                            label={spec.label}
                            value={unitValue(unit.pid, unit.index, spec.field)}
                            error={fieldErrors[errKey]}
                            required={!boxOffice}
                            onUpload={(file) =>
                              onUploadPhoto(unit.pid, unit.index, file)
                            }
                            onRemove={() =>
                              onUnitCommit(
                                unit.pid,
                                unit.index,
                                spec.field,
                                "",
                              )
                            }
                          />
                        );
                      }
                      const locked = spec.field === "car_club" && !!cname;
                      return (
                        <Field
                          key={spec.field}
                          label={spec.label}
                          required
                          error={fieldErrors[errKey]}
                        >
                          <input
                            className={`input ${fieldErrors[errKey] ? "input-error" : ""} ${locked ? "opacity-60" : ""}`}
                            type={spec.kind}
                            value={unitValue(unit.pid, unit.index, spec.field)}
                            disabled={locked}
                            onChange={(e) =>
                              onUnitChange(
                                unit.pid,
                                unit.index,
                                spec.field,
                                e.target.value,
                              )
                            }
                            onBlur={() =>
                              onUnitBlur(unit.pid, unit.index, spec.field)
                            }
                          />
                        </Field>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {showAttendee && (
        <Section step={++stepNo} title="Attendance details">
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              className="w-4 h-4 accent-gold-500"
              checked={attendee.attendee_display}
              onChange={(e) =>
                onAttendeeChange({
                  ...attendee,
                  attendee_display: e.target.checked,
                })
              }
            />
            Display my attendance publicly
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name" required error={fieldErrors.attendee_name}>
              <input
                className={`input ${fieldErrors.attendee_name ? "input-error" : ""}`}
                value={attendee.attendee_name}
                onChange={(e) =>
                  onAttendeeChange({
                    ...attendee,
                    attendee_name: e.target.value,
                  })
                }
              />
            </Field>
            <Field
              label="Vehicle"
              required
              error={fieldErrors.attendee_vehicle}
            >
              <input
                className={`input ${fieldErrors.attendee_vehicle ? "input-error" : ""}`}
                value={attendee.attendee_vehicle}
                onChange={(e) =>
                  onAttendeeChange({
                    ...attendee,
                    attendee_vehicle: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        </Section>
      )}

      <Section step={++stepNo} title="Order summary">
        {totals ? (
          <div className="space-y-2.5">
            {Object.entries(cart).map(([pid, line]) => {
              const ticket = tickets.find((t) => t.pid === pid);
              if (!ticket) return null;
              return (
                <SummaryRow
                  key={pid}
                  label={
                    <>
                      {ticket.name}{" "}
                      <span className="text-ink-400">× {line.qty}</span>
                    </>
                  }
                  value={formatRegionCurrency(ticket.price * line.qty, region)}
                />
              );
            })}
            <div className="border-t border-ink-100 pt-2.5 space-y-2.5">
              <SummaryRow
                label="Subtotal"
                value={formatRegionCurrency(totals.subtotal, region)}
              />
              {totals.coupons && totals.coupons.discount > 0 && (
                <SummaryRow
                  label="Discount"
                  value={`-${formatRegionCurrency(totals.coupons.discount, region)}`}
                  accent
                />
              )}
              {totals.fees && totals.fees.amount > 0 && (
                <SummaryRow
                  label={totals.fees.name || "Processing Fees"}
                  value={formatRegionCurrency(totals.fees.amount, region)}
                />
              )}
              {totals.vat > 0 && (
                <SummaryRow
                  label="VAT (20%)"
                  value={formatRegionCurrency(totals.vat, region)}
                />
              )}
              <SummaryRow
                label="Total"
                value={formatRegionCurrency(totals.total, region)}
                bold
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-500">Calculating…</p>
        )}

        {Object.keys(appliedCoupons).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.keys(appliedCoupons).map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-2 text-[12px] font-bold bg-gold-50 text-gold-700 border border-gold-200 rounded-full pl-3 pr-1.5 py-1"
              >
                {code}
                <button
                  type="button"
                  onClick={() => onRemoveCoupon(code)}
                  disabled={couponBusy}
                  className="w-5 h-5 rounded-full hover:bg-gold-200/60 transition leading-none"
                  aria-label={`Remove coupon ${code}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={applyCouponSubmit} className="flex gap-2">
          <input
            className="input !py-2 !text-sm"
            placeholder="Discount code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button
            type="submit"
            disabled={couponBusy || !couponCode.trim()}
            className="px-4 py-2 bg-ink-900 hover:bg-ink-700 disabled:opacity-40 text-white text-sm font-bold rounded-lg transition inline-flex items-center gap-2 shrink-0"
          >
            {couponBusy && <ButtonSpinner />}
            Apply
          </button>
        </form>
        {couponError && (
          <p className="text-xs text-red-600" role="alert">
            {couponError}
          </p>
        )}
      </Section>

      {!boxOffice && (
      <Section step={++stepNo} title="Before you go">
        <Field label="How did you hear about this event? (Optional)">
          <input
            className="input"
            value={heardAbout}
            onChange={(e) => onHeardAboutChange(e.target.value)}
          />
        </Field>
        <label className="flex items-start gap-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            className="w-4 h-4 accent-gold-500 mt-0.5"
            checked={futureUpdates}
            onChange={(e) => onFutureUpdatesChange(e.target.checked)}
          />
          <span>
            {event.newsletter_label ||
              `Keep me updated about future events from ${event.company_name}.`}
          </span>
        </label>
        <div className="pt-1 space-y-3">
          <label className="flex items-start gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              className="w-4 h-4 accent-gold-500 mt-0.5"
              checked={termsAccepted}
              onChange={(e) => onTermsChange(e.target.checked)}
            />
            <span>
              I accept the terms &amp; conditions{" "}
              <span className="text-gold-600">*</span>
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="text-xs text-red-600" role="alert">
              {fieldErrors.terms}
            </p>
          )}
          <CollapsibleTerms event={event} />
        </div>
      </Section>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={submitting || units.length === 0}
        className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
      >
        {submitting && <ButtonSpinner />}
        {submitting
          ? boxOffice
            ? "Placing order…"
            : "Preparing…"
          : boxOffice
            ? "Place Order"
            : totals && totals.total <= 0
              ? "Complete Order"
              : "Continue to Payment"}
      </button>
    </div>
  );
}
