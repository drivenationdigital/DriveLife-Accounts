"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import type { PaymentIntent } from "@stripe/stripe-js";

import { ConfettiBurst } from "@/components/apply/ConfettiBurst";
import { readTokenClient } from "@/lib/authCookies";
import { SubmitOverlay } from "@/components/apply/SubmitOverlay";
import {
  ArrowRightIcon,
  ButtonSpinner,
  CheckIcon,
} from "@/components/apply/ApplyIcons";
import { useConfirm } from "@/context/ConfirmContext";
import {
  formatRegionDateRange,
  formatRegionCurrency,
  resolveRegion,
} from "@/lib/regions";

import { CheckoutShell, Field, Section } from "@/components/checkout/CheckoutShell";
import { CheckoutTimer } from "@/components/checkout/CheckoutTimer";
import { TicketsStep } from "@/components/checkout/TicketsStep";
import {
  DetailsStep,
  cartUnits,
  unitFieldSpecs,
  type AttendeeState,
  type BillingState,
} from "@/components/checkout/DetailsStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import {
  addToBasket,
  applyCoupon,
  checkSecretCode,
  clearCartData,
  createCart,
  createPaymentIntent,
  fetchTotals,
  registerForEvent,
  removeCartUnit,
  removeCoupon,
  reserveTickets,
  saveAttendeeFields,
  saveBillingFields,
  saveOrder,
  updateTicketMeta,
  uploadVehiclePhoto,
  useCheckoutInfo,
  useCheckoutTickets,
  verifyCart,
  CheckoutError,
  type CartData,
  type CartTotals,
  type CouponRow,
  type SaveOrderResult,
} from "@/lib/checkout/api";

/**
 * Public ticket checkout - the Next.js remake of the classic
 * /uk/get-tickets/event.php flow, on the account app's design system.
 *
 *   /get-tickets/[eventEid]              (eventEid = make_crypt event id)
 *
 * Steps: tickets → details → payment → thank-you, with the same
 * behaviours as the PHP original: cart tokens, 60-minute stock
 * reservation, coupons (?coupon= auto-apply), secret codes (?code=),
 * car-club prefill (?cname=), post-order redirect (?complete=),
 * free-order shortcut, and registration-only events (ticket_type 1).
 * All money logic stays on the PHP side via /api/checkout.
 */

const WP_ORIGIN = (
  process.env.NEXT_PUBLIC_CHECKOUT_WP_ORIGIN ?? "https://www.carevents.com"
).replace(/\/$/, "");

const CHECKOUT_MINUTES = 60;

type Step =
  | "tickets"
  | "details"
  | "payment"
  | "thankyou"
  | "timeout"
  | "register"
  | "registered";

const EMPTY_BILLING: BillingState = {
  billing_first_name: "",
  billing_last_name: "",
  billing_email: "",
  billing_phone: "",
};

const EMPTY_ATTENDEE: AttendeeState = {
  attendee_display: false,
  attendee_name: "",
  attendee_vehicle: "",
};

const EMAIL_RE = /\S+@\S+\.\S+/;

/**
 * Reflect an applied discount/secret code in the address bar so the
 * URL can be copied and shared (the shared link then auto-applies).
 * history.replaceState on purpose: React state stays the source of
 * truth and no navigation/re-render is triggered.
 */
function setUrlParam(key: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(null, "", url.toString());
}

export default function GetTicketsPage({
  params,
}: {
  params: Promise<{ eventEid: string }>;
}) {
  const { eventEid } = use(params);
  const search = useSearchParams();
  const cname = search?.get("cname") ?? "";
  const couponParam = (search?.get("coupon") ?? "").trim();
  const codeParam = (search?.get("code") ?? "").trim();
  const completeUrl = search?.get("complete") ?? "";
  const showCarApplication = search?.get("show_car_application") ?? "";
  const boxOfficeParam = search?.get("boxoffice") === "1";

  // Box-office mode: an organiser placing an order from the dashboard,
  // with payment skipped. Requires the dashboard session cookie on top
  // of the flag - and the real authorisation happens server-side (the
  // backend verifies the token organises this event before completing
  // without payment). Set in an effect so the server render matches
  // the first client render.
  const [isBoxOffice, setIsBoxOffice] = useState(false);
  useEffect(() => {
    setIsBoxOffice(boxOfficeParam && !!readTokenClient());
  }, [boxOfficeParam]);

  const confirm = useConfirm();
  const info = useCheckoutInfo(eventEid);
  const event = info.data?.event;
  const region = resolveRegion(event?.site);

  // ── Cart token bootstrap ──────────────────────────────────────────
  const tokenKey = `ccnext_token_${eventEid}`;
  const [cartToken, setCartToken] = useState<string | null>(null);
  useEffect(() => {
    if (!eventEid) return;
    let cancelled = false;
    (async () => {
      const existing = localStorage.getItem(tokenKey);
      if (existing) {
        try {
          const { valid } = await verifyCart(existing);
          if (valid) {
            if (!cancelled) setCartToken(existing);
            return;
          }
        } catch {
          // fall through to a fresh token
        }
      }
      try {
        const created = await createCart(eventEid);
        localStorage.setItem(tokenKey, created.cartToken);
        if (!cancelled) setCartToken(created.cartToken);
      } catch {
        // Surfaced when the user tries to check out.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventEid, tokenKey]);

  // ── Step + cart state ─────────────────────────────────────────────
  const [step, setStep] = useState<Step>("tickets");
  const [secretCode, setSecretCode] = useState(codeParam);
  const [preCoupon, setPreCoupon] = useState<CouponRow | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartData>({});
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [payTotal, setPayTotal] = useState(0);
  const [order, setOrder] = useState<{
    enc: string;
    number: string | null;
    processing: boolean;
  } | null>(null);

  const [billing, setBilling] = useState<BillingState>(EMPTY_BILLING);
  const [attendee, setAttendee] = useState<AttendeeState>(EMPTY_ATTENDEE);
  const [heardAbout, setHeardAbout] = useState("");
  const [futureUpdates, setFutureUpdates] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingUnit, setRemovingUnit] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);

  const ticketsQuery = useCheckoutTickets(
    eventEid,
    cartToken,
    secretCode,
    "",
    cname,
  );
  const tickets = useMemo(
    () => ticketsQuery.data?.tickets ?? [],
    [ticketsQuery.data],
  );

  // Registration-only events skip the ticket flow entirely - same as
  // event.php force-redirecting to ?step=attendee.
  useEffect(() => {
    if (event?.ticket_type === "1" && step === "tickets") {
      setStep("register");
    }
  }, [event?.ticket_type, step]);

  // ?coupon= auto-apply: validate once the cart token exists so the
  // ticket list can show struck-through prices before checkout.
  const autoCouponTried = useRef(false);
  useEffect(() => {
    if (!cartToken || !couponParam || autoCouponTried.current) return;
    autoCouponTried.current = true;
    applyCoupon(cartToken, couponParam, { preCheckout: true, eventEid })
      .then((r) => {
        if (r.coupon) setPreCoupon(r.coupon);
      })
      .catch(() => {
        // Invalid auto-coupons fail silently, like the classic cart page.
      });
  }, [cartToken, couponParam, eventEid]);

  // ── Per-unit ticket-holder meta ───────────────────────────────────
  // Values keyed "pid|index|field"; syncedMeta mirrors what the PHP
  // cart row last accepted so we only send diffs.
  const [unitMeta, setUnitMeta] = useState<Record<string, string>>({});
  const syncedMeta = useRef<Record<string, string>>({});
  const metaKey = (pid: string, index: number, field: string) =>
    `${pid}|${index}|${field}`;

  const unitValue = useCallback(
    (pid: string, index: number, field: string): string => {
      const k = metaKey(pid, index, field);
      if (k in unitMeta) return unitMeta[k];
      if (field === "car_club" && cname) return cname;
      return "";
    },
    [unitMeta, cname],
  );

  const syncUnitField = useCallback(
    async (pid: string, index: number, field: string) => {
      if (!cartToken) return;
      const k = metaKey(pid, index, field);
      const value =
        k in unitMeta ? unitMeta[k] : field === "car_club" && cname ? cname : "";
      if (syncedMeta.current[k] === value) return;
      try {
        await updateTicketMeta(cartToken, pid, field, value, index);
        syncedMeta.current[k] = value;
      } catch {
        // Re-tried by the pre-order flush.
      }
    },
    [cartToken, unitMeta, cname],
  );

  /** Set + sync a unit field with an explicit value in one step -
   *  used by checkboxes and photo removal, where change-then-blur in
   *  the same event would sync the previous render's value. */
  const commitUnitField = useCallback(
    (pid: string, index: number, field: string, value: string) => {
      const k = metaKey(pid, index, field);
      setUnitMeta((m) => ({ ...m, [k]: value }));
      if (!cartToken) return;
      updateTicketMeta(cartToken, pid, field, value, index)
        .then(() => {
          syncedMeta.current[k] = value;
        })
        .catch(() => {
          // Re-tried by the pre-order flush.
        });
    },
    [cartToken],
  );

  /** Upload a vehicle photo to Cloudflare, then store its URL in the
   *  unit's cart meta so it lands in the order metadata. */
  const handleUploadPhoto = useCallback(
    async (pid: string, index: number, file: File) => {
      if (!cartToken) throw new CheckoutError("Please try again in a moment.");
      const url = await uploadVehiclePhoto(eventEid, file);
      const k = metaKey(pid, index, "vehicle_photo");
      setUnitMeta((m) => ({ ...m, [k]: url }));
      await updateTicketMeta(cartToken, pid, "vehicle_photo", url, index);
      syncedMeta.current[k] = url;
      setFieldErrors((e) => {
        const { [`${pid}:${index}:vehicle_photo`]: _gone, ...rest } = e;
        return rest;
      });
    },
    [cartToken, eventEid],
  );

  /** Push every non-empty, unsynced unit field before building the order. */
  const flushUnitMeta = useCallback(async () => {
    if (!cartToken) return;
    for (const unit of cartUnits(cart, tickets)) {
      for (const spec of unitFieldSpecs(unit.ticket)) {
        const k = metaKey(unit.pid, unit.index, spec.field);
        const value = unitValue(unit.pid, unit.index, spec.field);
        if (value && syncedMeta.current[k] !== value) {
          await updateTicketMeta(cartToken, unit.pid, spec.field, value, unit.index);
          syncedMeta.current[k] = value;
        }
      }
    }
  }, [cart, tickets, cartToken, unitValue]);

  // ── Tickets step handlers ─────────────────────────────────────────
  const handleQuantityChange = (pid: string, qty: number) => {
    setQuantities((q) => ({ ...q, [pid]: Math.max(0, qty) }));
  };

  const handleApplyCouponPre = async (code: string) => {
    if (!cartToken) throw new CheckoutError("Please try again in a moment.");
    const res = await applyCoupon(cartToken, code, {
      preCheckout: true,
      eventEid,
    });
    if (!res.coupon) throw new CheckoutError("Invalid coupon code.");
    setPreCoupon(res.coupon);
    setUrlParam("coupon", res.coupon.coupon_code);
  };

  const handleRemoveCouponPre = () => {
    setPreCoupon(null);
    setUrlParam("coupon", null);
  };

  const handleApplySecret = async (code: string) => {
    if (!cartToken) throw new CheckoutError("Please try again in a moment.");
    await checkSecretCode(cartToken, code, eventEid);
    setSecretCode(code);
    setUrlParam("code", code);
  };

  const handleRemoveSecret = () => {
    setSecretCode("");
    setUrlParam("code", null);
  };

  const handleCheckout = async () => {
    if (!cartToken) {
      setTicketsError(
        "We couldn't start a checkout session. Please refresh the page.",
      );
      return;
    }
    const items = tickets
      .filter((t) => !t.isSection && (quantities[t.pid] ?? 0) > 0)
      .map((t) => ({ pid: t.pid, qty: quantities[t.pid] }));
    if (!items.length) return;

    setCheckingOut(true);
    setTicketsError(null);
    try {
      const res = await addToBasket(
        eventEid,
        cartToken,
        items,
        preCoupon?.coupon_code ?? "",
      );
      if (res.status === "maxqty") {
        setTicketsError(
          `This event allows a maximum of ${res.max_qty} items per order.`,
        );
        return;
      }
      const added = res.added_tickets ?? {};
      setCart(added);

      try {
        await reserveTickets(cartToken);
      } catch (e) {
        // Couldn't hold the stock (e.g. sold out since page load) -
        // roll the cart back and let the user re-pick.
        await clearCartData(cartToken).catch(() => {});
        setCart({});
        setTicketsError(
          e instanceof Error ? e.message : "Couldn't reserve those tickets.",
        );
        ticketsQuery.refetch();
        return;
      }

      const t = await fetchTotals(cartToken);
      setTotals(t.totals);
      setDeadline(Date.now() + CHECKOUT_MINUTES * 60 * 1000);
      setStep("details");
      window.scrollTo(0, 0);
    } catch (e) {
      setTicketsError(
        e instanceof Error ? e.message : "Something went wrong. Please retry.",
      );
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Details step handlers ─────────────────────────────────────────
  const showAttendee = useMemo(
    () =>
      cartUnits(cart, tickets).some((u) => u.ticket.flags.attendance),
    [cart, tickets],
  );

  const refreshTotals = useCallback(async () => {
    if (!cartToken) return;
    try {
      const t = await fetchTotals(cartToken);
      setTotals(t.totals);
    } catch {
      // keep the previous totals visible
    }
  }, [cartToken]);

  const handleRemoveUnit = async (pid: string, index: number) => {
    if (!cartToken || removingUnit) return;
    const ticket = tickets.find((t) => t.pid === pid);
    const ok = await confirm({
      title: "Remove this ticket?",
      message: ticket ? `${ticket.name} will be removed from your order.` : undefined,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    setRemovingUnit(true);
    try {
      const res = await removeCartUnit(cartToken, pid, index);
      const newCart = res.cart_data ?? {};
      setCart(newCart);
      // Server-side the meta array was spliced, so local indexes for
      // this ticket are stale - reseed both maps from the cart row.
      setUnitMeta((prev) => {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (!k.startsWith(`${pid}|`)) next[k] = v;
        }
        const line = newCart[pid];
        if (line) {
          line.meta.forEach((m, i) => {
            for (const [field, value] of Object.entries(m)) {
              if (value) next[metaKey(pid, i, field)] = value;
            }
          });
        }
        return next;
      });
      for (const k of Object.keys(syncedMeta.current)) {
        if (k.startsWith(`${pid}|`)) delete syncedMeta.current[k];
      }
      const line = newCart[pid];
      if (line) {
        line.meta.forEach((m, i) => {
          for (const [field, value] of Object.entries(m)) {
            if (value) syncedMeta.current[metaKey(pid, i, field)] = value;
          }
        });
      }

      if (res.cart_empty || Object.keys(newCart).length === 0) {
        setStep("tickets");
        setQuantities({});
        setTotals(null);
        setDeadline(null);
      } else {
        await refreshTotals();
      }
    } catch (e) {
      setDetailsError(
        e instanceof Error ? e.message : "Couldn't remove that ticket.",
      );
    } finally {
      setRemovingUnit(false);
    }
  };

  const handleApplyCouponCheckout = async (code: string) => {
    if (!cartToken) throw new CheckoutError("Please try again in a moment.");
    if (!EMAIL_RE.test(billing.billing_email)) {
      throw new CheckoutError(
        "Please fill in your email address above first - codes can be limited per customer.",
      );
    }
    setCouponBusy(true);
    try {
      await applyCoupon(cartToken, code, { email: billing.billing_email });
      setUrlParam("coupon", code.toUpperCase());
      await refreshTotals();
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRemoveCoupon = async (code: string) => {
    if (!cartToken) return;
    setCouponBusy(true);
    try {
      await removeCoupon(cartToken, code);
      if (preCoupon?.coupon_code?.toUpperCase() === code.toUpperCase()) {
        setPreCoupon(null);
      }
      setUrlParam("coupon", null);
      await refreshTotals();
    } catch {
      // totals refresh below will still show the true state
    } finally {
      setCouponBusy(false);
    }
  };

  const validateDetails = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!billing.billing_first_name.trim())
      errors.billing_first_name = "Required";
    if (!billing.billing_last_name.trim())
      errors.billing_last_name = "Required";
    if (!billing.billing_phone.trim()) errors.billing_phone = "Required";
    if (!EMAIL_RE.test(billing.billing_email))
      errors.billing_email = "Enter a valid email address";
    for (const unit of cartUnits(cart, tickets)) {
      for (const spec of unitFieldSpecs(unit.ticket)) {
        if (spec.kind === "checkbox") continue;
        if (!unitValue(unit.pid, unit.index, spec.field).trim()) {
          errors[`${unit.pid}:${unit.index}:${spec.field}`] =
            spec.kind === "photo"
              ? "Please upload a photo of your vehicle"
              : "Required";
        }
      }
    }
    if (showAttendee) {
      if (!attendee.attendee_name.trim()) errors.attendee_name = "Required";
      if (!attendee.attendee_vehicle.trim())
        errors.attendee_vehicle = "Required";
    }
    // Box office: the admin is entering someone else's order - no
    // terms checkbox to tick, and the vehicle photo is optional.
    if (isBoxOffice) {
      for (const key of Object.keys(errors)) {
        if (key.endsWith(":vehicle_photo")) delete errors[key];
      }
    } else if (!termsAccepted) {
      errors.terms = "Please accept the terms & conditions to continue.";
    }
    return errors;
  };

  const buildOrderForm = (): Record<string, string> => {
    const form: Record<string, string> = {
      ...billing,
      cc_source: "",
      heard_about: heardAbout,
      terms_conditions: "1",
      attendee_details_required: showAttendee ? "1" : "0",
      payment_method: "stripe",
      payment_method_title: "Credit Card",
    };
    // Never opt a customer into marketing from a box-office order -
    // they weren't the one ticking the box.
    if (futureUpdates && !isBoxOffice) form.future_updates = "1";
    if (showAttendee) {
      form.attendee_display = attendee.attendee_display ? "checked" : "";
      form.attendee_name = attendee.attendee_name;
      form.attendee_vehicle = attendee.attendee_vehicle;
    }
    if (showCarApplication) form.show_car_ticket = showCarApplication;
    return form;
  };

  const finishOrder = (res: SaveOrderResult, processing: boolean) => {
    const enc = res.order_id ?? "";
    localStorage.removeItem(tokenKey);
    setDeadline(null);
    if (completeUrl && !isBoxOffice) {
      const sep = completeUrl.includes("?") ? "&" : "?";
      window.location.href =
        `${completeUrl}${sep}order_id=${encodeURIComponent(enc)}` +
        `&download_url=${encodeURIComponent(`${WP_ORIGIN}/controller/download/?order=${enc}`)}`;
      return;
    }
    setOrder({ enc, number: res.order_number ?? null, processing });
    setStep("thankyou");
    window.scrollTo(0, 0);
  };

  const handleContinue = async () => {
    if (!cartToken) return;
    const errors = validateDetails();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setDetailsError("Please complete the highlighted fields.");
      return;
    }
    setDetailsError(null);
    setSubmitting(true);
    try {
      await saveBillingFields(cartToken, { ...billing });
      if (showAttendee) {
        await saveAttendeeFields(cartToken, {
          attendee_display: attendee.attendee_display ? "checked" : "",
          attendee_name: attendee.attendee_name,
          attendee_vehicle: attendee.attendee_vehicle,
        });
      }
      await flushUnitMeta();

      const form = buildOrderForm();

      // Box office: no payment step at all - one call places the
      // order as completed. The proxy attaches the dashboard session
      // token and the backend verifies it organises this event.
      if (isBoxOffice) {
        const done = await saveOrder(
          cartToken,
          eventEid,
          "free",
          "succeeded",
          form,
          { boxOffice: true },
        );
        finishOrder(done, false);
        return;
      }

      // Same order as the classic flow: a pending order row exists
      // before any money moves, so the PaymentIntent and order can
      // reference each other.
      await saveOrder(cartToken, eventEid, "", "pending", form);

      const t = await fetchTotals(cartToken);
      setTotals(t.totals);

      if (t.totals.total <= 0) {
        const done = await saveOrder(cartToken, eventEid, "free", "succeeded", form);
        finishOrder(done, false);
        return;
      }

      const intent = await createPaymentIntent(
        cartToken,
        eventEid,
        event?.site ?? "uk",
      );
      setClientSecret(intent.clientSecret);
      setPayTotal(intent.total || t.totals.total);
      setStep("payment");
      window.scrollTo(0, 0);
    } catch (e) {
      setDetailsError(
        e instanceof Error ? e.message : "Something went wrong. Please retry.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentResult = async (pi: PaymentIntent) => {
    if (!cartToken) return;
    const res = await saveOrder(
      cartToken,
      eventEid,
      pi.id,
      pi.status,
      buildOrderForm(),
    );
    if (pi.status === "succeeded" || pi.status === "processing") {
      if (res.status === "success") {
        finishOrder(res, pi.status === "processing");
      }
    }
  };

  // ── Leaving / timeout ─────────────────────────────────────────────
  const resetToTickets = useCallback(async () => {
    if (cartToken) await clearCartData(cartToken).catch(() => {});
    setCart({});
    setQuantities({});
    setTotals(null);
    setDeadline(null);
    setClientSecret(null);
    setUnitMeta({});
    syncedMeta.current = {};
    setFieldErrors({});
    setDetailsError(null);
    setStep("tickets");
    ticketsQuery.refetch();
  }, [cartToken, ticketsQuery]);

  const handleTimerExpire = useCallback(() => {
    setDeadline(null);
    setStep("timeout");
    if (cartToken) clearCartData(cartToken).catch(() => {});
    setCart({});
    setQuantities({});
    setTotals(null);
    setClientSecret(null);
  }, [cartToken]);

  const handleTimerBack = async () => {
    if (step === "payment") {
      setStep("details");
      return;
    }
    const ok = await confirm({
      title: "Leave checkout?",
      message: "Your reserved tickets will be released.",
      confirmLabel: "Leave",
      danger: true,
    });
    if (ok) await resetToTickets();
  };

  // ── Registration-only events ──────────────────────────────────────
  const [regForm, setRegForm] = useState(EMPTY_ATTENDEE);
  const [regBusy, setRegBusy] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!cartToken || regBusy) return;
    setRegBusy(true);
    setRegError(null);
    try {
      await registerForEvent(cartToken, eventEid, {
        attendee_name: regForm.attendee_name,
        attendee_vehicle: regForm.attendee_vehicle,
        attendee_display: regForm.attendee_display ? "checked" : "",
      });
      setStep("registered");
      window.scrollTo(0, 0);
    } catch (err) {
      setRegError(
        err instanceof Error ? err.message : "Registration failed. Please retry.",
      );
    } finally {
      setRegBusy(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  if (info.isLoading) {
    return (
      <CheckoutShell>
        <p className="text-sm text-ink-500">Loading…</p>
      </CheckoutShell>
    );
  }

  if (info.error || !event) {
    return (
      <CheckoutShell>
        <h1 className="text-xl font-bold mb-2">Couldn&apos;t load this event</h1>
        <p className="text-sm text-ink-600">
          {info.error?.message ||
            "The link may be wrong or the event may have been removed."}
        </p>
      </CheckoutShell>
    );
  }

  const header = (
    <header className="mb-7 text-center">
      {event.tickets_logo && (
        <img
          src={event.tickets_logo}
          alt={event.title}
          className="max-h-24 max-w-[240px] w-auto h-auto rounded-xl mb-5 object-contain mx-auto"
        />
      )}
      <p className="text-[11px] uppercase tracking-[0.18em] text-gold-600 font-bold mb-2">
        {step === "register" || step === "registered"
          ? "Event Registration"
          : "Get Tickets"}
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight mb-3 leading-[1.05]">
        {event.title}
      </h1>
      {event.start_date && (
        <p className="text-sm font-semibold text-ink-700 mb-2">
          {formatRegionDateRange(event.start_date, event.end_date, region)}
          {event.start_time && ` · ${event.start_time}`}
        </p>
      )}
      {event.location && (
        <p className="text-sm text-ink-600">{event.location}</p>
      )}
    </header>
  );

  return (
    <CheckoutShell>
      <SubmitOverlay
        show={submitting || checkingOut}
        label={checkingOut ? "Reserving your tickets…" : "Preparing your order…"}
      />

      {isBoxOffice && step !== "thankyou" && (
        <div className="mb-5 p-3 rounded-xl bg-gold-50 border border-gold-200 text-sm text-gold-700 font-semibold">
          Box office mode — you&apos;re placing this order as the organiser.
          Payment is skipped and the order completes immediately.
        </div>
      )}

      {(step === "details" || step === "payment") && deadline && (
        <CheckoutTimer
          deadline={deadline}
          onExpire={handleTimerExpire}
          onBack={handleTimerBack}
        />
      )}

      {step === "tickets" && (
        <>
          {header}
          {ticketsQuery.isLoading ? (
            <Section title="Tickets">
              <p className="text-sm text-ink-500">Loading tickets…</p>
            </Section>
          ) : ticketsQuery.error ? (
            <Section title="Tickets">
              <p className="text-sm text-red-600">
                {ticketsQuery.error.message}
              </p>
            </Section>
          ) : (
            <TicketsStep
              tickets={tickets}
              vatMultiplier={info.data?.display_vat_multiplier ?? 1}
              region={region}
              cname={cname}
              cartLimit={event.max_items_per_order}
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
              coupon={preCoupon}
              onApplyCoupon={handleApplyCouponPre}
              onRemoveCoupon={handleRemoveCouponPre}
              onApplySecret={handleApplySecret}
              secretActive={!!secretCode}
              onRemoveSecret={handleRemoveSecret}
              onCheckout={handleCheckout}
              checkingOut={checkingOut}
              error={ticketsError}
            />
          )}
          <p className="mt-6 text-center text-xs text-ink-400">
            Powered by {event.company_name}
          </p>
        </>
      )}

      {step === "details" && (
        <DetailsStep
          event={event}
          region={region}
          tickets={tickets}
          cart={cart}
          cname={cname}
          billing={billing}
          onBillingChange={(field, value) =>
            setBilling((b) => ({ ...b, [field]: value }))
          }
          attendee={attendee}
          onAttendeeChange={setAttendee}
          showAttendee={showAttendee}
          heardAbout={heardAbout}
          onHeardAboutChange={setHeardAbout}
          futureUpdates={futureUpdates}
          onFutureUpdatesChange={setFutureUpdates}
          termsAccepted={termsAccepted}
          onTermsChange={setTermsAccepted}
          unitValue={unitValue}
          onUnitChange={(pid, index, field, value) =>
            setUnitMeta((m) => ({ ...m, [metaKey(pid, index, field)]: value }))
          }
          onUnitBlur={syncUnitField}
          onUnitCommit={commitUnitField}
          onUploadPhoto={handleUploadPhoto}
          onRemoveUnit={handleRemoveUnit}
          removingUnit={removingUnit}
          totals={totals}
          couponBusy={couponBusy}
          onApplyCoupon={handleApplyCouponCheckout}
          onRemoveCoupon={handleRemoveCoupon}
          fieldErrors={fieldErrors}
          onContinue={handleContinue}
          submitting={submitting}
          error={detailsError}
          boxOffice={isBoxOffice}
        />
      )}

      {step === "payment" && clientSecret && info.data && (
        <div className="space-y-5">
          <PaymentStep
            publishableKey={info.data.stripe.publishable_key}
            stripeAccount={info.data.stripe.account}
            clientSecret={clientSecret}
            total={payTotal}
            region={region}
            onResult={handlePaymentResult}
          />
          <p className="text-center text-sm text-ink-500">
            Paying{" "}
            <strong className="text-ink-900">
              {formatRegionCurrency(payTotal, region)}
            </strong>{" "}
            for {event.title}
          </p>
        </div>
      )}

      {step === "thankyou" && order && (
        <div className="flex flex-col items-center text-center py-6">
          {!order.processing && <ConfettiBurst />}
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-gold-500 text-white mb-5 shadow-sm shadow-gold-500/30">
            <CheckIcon />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight mb-3">
            {order.number ? `Order #${order.number} received` : "Order received"}
          </h1>
          {order.processing ? (
            <p className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 max-w-md">
              Your payment is processing. We&apos;ll email your tickets as soon
              as it completes.
            </p>
          ) : (
            <p className="text-sm text-ink-700 leading-relaxed max-w-md">
              Thank you for your order. Your tickets have been emailed to you
              and are available any time in your {event.company_name} account.
            </p>
          )}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            {!order.processing && order.enc && (
              <a
                href={`${WP_ORIGIN}/t/${order.enc}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition"
              >
                Download Tickets
              </a>
            )}
            {isBoxOffice ? (
              <a
                href={`/events/${encodeURIComponent(eventEid)}?site=${event.site}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-ink-900 hover:bg-ink-700 text-white font-bold rounded-xl transition"
              >
                Back to Dashboard
                <ArrowRightIcon />
              </a>
            ) : (
              <a
                href={event.permalink}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-ink-900 hover:bg-ink-700 text-white font-bold rounded-xl transition"
              >
                Back to Event
                <ArrowRightIcon />
              </a>
            )}
          </div>
        </div>
      )}

      {step === "timeout" && (
        <>
          {header}
          <Section title="Time limit reached">
            <p className="text-sm text-ink-600">
              Your ticket reservation expired, so we released the tickets for
              other buyers. Don&apos;t worry - you can start again.
            </p>
            <button
              type="button"
              onClick={resetToTickets}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition"
            >
              Back to Tickets
            </button>
          </Section>
        </>
      )}

      {step === "register" && (
        <>
          {header}
          <form onSubmit={handleRegister}>
            <Section title="Register for this event">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Name" required>
                  <input
                    className="input"
                    value={regForm.attendee_name}
                    onChange={(e) =>
                      setRegForm((f) => ({
                        ...f,
                        attendee_name: e.target.value,
                      }))
                    }
                    required
                  />
                </Field>
                <Field label="Vehicle" required>
                  <input
                    className="input"
                    value={regForm.attendee_vehicle}
                    onChange={(e) =>
                      setRegForm((f) => ({
                        ...f,
                        attendee_vehicle: e.target.value,
                      }))
                    }
                    required
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-gold-500"
                  checked={regForm.attendee_display}
                  onChange={(e) =>
                    setRegForm((f) => ({
                      ...f,
                      attendee_display: e.target.checked,
                    }))
                  }
                />
                Display my attendance publicly
              </label>
              {regError && (
                <p className="text-sm text-red-600" role="alert">
                  {regError}
                </p>
              )}
              <button
                type="submit"
                disabled={regBusy}
                className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
              >
                {regBusy && <ButtonSpinner />}
                {regBusy ? "Registering…" : "Register"}
              </button>
            </Section>
          </form>
        </>
      )}

      {step === "registered" && (
        <div className="flex flex-col items-center text-center py-6">
          <ConfettiBurst />
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-gold-500 text-white mb-5 shadow-sm shadow-gold-500/30">
            <CheckIcon />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight mb-3">
            You&apos;re registered!
          </h1>
          <p className="text-sm text-ink-700 leading-relaxed max-w-md">
            See you at <strong>{event.title}</strong>.
          </p>
          <a
            href={event.permalink}
            className="mt-7 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition"
          >
            Back to Event
            <ArrowRightIcon />
          </a>
        </div>
      )}
    </CheckoutShell>
  );
}
