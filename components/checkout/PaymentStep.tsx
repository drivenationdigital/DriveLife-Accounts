"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { APPLY_THEME_PARAM, parseApplyTheme } from "@/lib/applyTheme";
import { formatRegionCurrency, type Region } from "@/lib/regions";
import { ButtonSpinner } from "@/components/apply/ApplyIcons";
import { loadScript } from "@/lib/checkout/loadScript";
import {
  capturePaypalOrder,
  createPaypalOrder,
  squarePay,
  type CheckoutProvider,
  type PaymentProviderId,
  type PaypalProvider,
  type SquareProvider,
  type StripeProvider,
} from "@/lib/checkout/api";
import { Section } from "./CheckoutShell";

/**
 * Step 3 - payment.
 *
 * One tab per method the backend says this event accepts. Stripe is
 * unchanged from the classic checkout: a PaymentIntent created
 * server-side (create.php, on the organiser's Connect account when
 * they have one), confirmed here with the Payment Element and
 * redirect:"if_required".
 *
 * PayPal, Square and Mollie work differently by design. They are
 * plain merchant charges on the organiser's own account - no Connect,
 * no application fee - and the charge happens server-side in
 * get-tickets/next/paypal.php, square.php and mollie.php. The browser
 * ever handles an approval artefact (a PayPal order id, a Square
 * single-use token); it never sees or sends an amount, and the PHP
 * side prices the cart itself.
 *
 * Mollie is the exception to "one tab, one form": it has no inline
 * card entry, so its panel is a button that hands off to Mollie's
 * hosted page. Picking the result back up on return belongs to the
 * page, which owns the order form that has to survive the navigation.
 *
 * The in-page methods converge on one callback, onPaid(provider,
 * transactionId, status), using Stripe's status vocabulary - so the
 * completion path does not branch on payment method.
 *
 * At most one card method is ever offered. The backend allows an
 * organiser only one of Stripe / Square / Mollie, so the buyer chooses
 * between "Card" and "PayPal", never between card processors.
 */

// ── SDK globals ──────────────────────────────────────────────────────
// Hand-written and deliberately minimal: both SDKs arrive as script
// tags at runtime, and pulling in their full type packages for the
// handful of calls below would be more surface than it's worth.

interface PaypalButtonsInstance {
  render: (target: HTMLElement) => Promise<void>;
  close?: () => void;
}

interface PaypalNamespace {
  Buttons?: (options: {
    style?: Record<string, string | number>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (err: unknown) => void;
  }) => PaypalButtonsInstance;
}

interface SquareCard {
  attach: (target: string) => Promise<void>;
  tokenize: () => Promise<{
    status: string;
    token?: string;
    errors?: { message?: string }[];
  }>;
  destroy?: () => Promise<void>;
}

interface SquarePayments {
  card: (options?: Record<string, unknown>) => Promise<SquareCard>;
  verifyBuyer: (
    source: string,
    details: Record<string, unknown>,
  ) => Promise<{ token?: string } | null>;
}

interface SquareNamespace {
  payments: (applicationId: string, locationId: string) => SquarePayments;
}

declare global {
  interface Window {
    paypal?: PaypalNamespace;
    Square?: SquareNamespace;
  }
}

// ── Shared shapes ────────────────────────────────────────────────────

/** Everything a provider panel needs to identify the cart it charges. */
export interface PaymentContext {
  cartToken: string;
  eventEid: string;
  /** Region key - the PHP endpoints resolve currency from it. */
  site: string;
}

/** Name and email improve Square's SCA (3-D Secure) success rate. */
export interface BillingContact {
  firstName: string;
  lastName: string;
  email: string;
}

export type PaidHandler = (
  provider: PaymentProviderId,
  transactionId: string,
  status: string,
) => Promise<void>;

function errorText(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function PanelError({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-red-600" role="alert">
      {children}
    </p>
  );
}

// ── Stripe ───────────────────────────────────────────────────────────

function StripeForm({
  total,
  region,
  onPaid,
}: {
  total: number;
  region: Region;
  onPaid: PaidHandler;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const { paymentIntent, error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) {
        setMessage(
          error.type === "card_error" || error.type === "validation_error"
            ? (error.message ?? "Your payment was not successful.")
            : "An unexpected error occurred. Please try again.",
        );
        return;
      }
      if (paymentIntent) {
        if (paymentIntent.status === "requires_payment_method") {
          setMessage("Your payment was not successful, please try again.");
        }
        await onPaid("stripe", paymentIntent.id, paymentIntent.status);
      }
    } catch {
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement
        options={{
          paymentMethodOrder: ["card", "apple_pay", "google_pay"],
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />
      {message && <PanelError>{message}</PanelError>}
      <button
        type="submit"
        disabled={!stripe || !elements || busy}
        className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
      >
        {busy && <ButtonSpinner />}
        {busy ? "Processing…" : `Pay ${formatRegionCurrency(total, region)}`}
      </button>
      <p className="text-xs text-ink-500 text-center">
        Payments are processed securely by Stripe.
      </p>
    </form>
  );
}

function StripePanel({
  provider,
  clientSecret,
  total,
  region,
  dark,
  onPaid,
}: {
  provider: StripeProvider;
  clientSecret: string | null;
  total: number;
  region: Region;
  dark: boolean;
  onPaid: PaidHandler;
}) {
  // loadStripe must not be re-run per render, and the Connect account
  // has to match the account the intent was created on or
  // confirmPayment rejects the client secret.
  const stripePromise = useMemo(
    () =>
      loadStripe(
        provider.publishable_key,
        provider.account ? { stripeAccount: provider.account } : undefined,
      ),
    [provider.publishable_key, provider.account],
  );

  const options = useMemo(
    () => ({
      clientSecret: clientSecret ?? "",
      appearance: {
        theme: (dark ? "night" : "stripe") as "night" | "stripe",
        variables: {
          colorPrimary: "#b89855",
          borderRadius: "10px",
          fontFamily:
            "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif",
        },
      },
    }),
    [clientSecret, dark],
  );

  if (!clientSecret) {
    return (
      <PanelError>
        Card payment couldn&apos;t be prepared for this order. Please choose
        another method or go back and try again.
      </PanelError>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeForm total={total} region={region} onPaid={onPaid} />
    </Elements>
  );
}

// ── PayPal ───────────────────────────────────────────────────────────

function PaypalPanel({
  provider,
  ctx,
  onPaid,
}: {
  provider: PaypalProvider;
  ctx: PaymentContext;
  onPaid: PaidHandler;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // The Buttons instance is created once and keeps whatever closures
  // it was built with. Routing every callback through a ref means it
  // always sees the current cart token and handler rather than the
  // ones that existed at mount. Updated in an effect rather than
  // during render - the buttons only ever read it from a user gesture,
  // which is always after the commit.
  const live = useRef({ ctx, onPaid });
  useEffect(() => {
    live.current = { ctx, onPaid };
  }, [ctx, onPaid]);

  useEffect(() => {
    let cancelled = false;
    let instance: PaypalButtonsInstance | null = null;

    // Sandbox versus live is decided by the client id itself, not the
    // URL. `card` funding is disabled because cards are already
    // covered by the Stripe and Square tabs - offering a third card
    // form inside PayPal just splits the buyer's attention.
    const url =
      "https://www.paypal.com/sdk/js" +
      `?client-id=${encodeURIComponent(provider.client_id)}` +
      `&currency=${encodeURIComponent(provider.currency)}` +
      "&intent=capture&components=buttons&disable-funding=card";

    loadScript(url)
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const buttons = window.paypal?.Buttons;
        if (!buttons) {
          setMessage(
            "PayPal is unavailable right now. Please try another method.",
          );
          return;
        }

        instance = buttons({
          style: {
            layout: "vertical",
            shape: "rect",
            color: "gold",
            label: "paypal",
            height: 48,
          },
          createOrder: async () => {
            setMessage(null);
            const { ctx: current } = live.current;
            try {
              const res = await createPaypalOrder(
                current.cartToken,
                current.eventEid,
                current.site,
              );
              return res.orderId;
            } catch (e) {
              // PayPal turns a rejected createOrder into a generic
              // onError, so surface the real reason ourselves first.
              setMessage(
                errorText(
                  e,
                  "Could not start the PayPal payment. Please try again.",
                ),
              );
              throw e;
            }
          },
          onApprove: async (data) => {
            setBusy(true);
            setMessage(null);
            try {
              const { ctx: current, onPaid: paid } = live.current;
              const res = await capturePaypalOrder(
                current.cartToken,
                current.eventEid,
                data.orderID,
                current.site,
              );
              await paid("paypal", res.transactionId, res.paymentStatus);
            } catch (e) {
              setMessage(
                errorText(
                  e,
                  "PayPal could not complete this payment. Please try again.",
                ),
              );
            } finally {
              if (!cancelled) setBusy(false);
            }
          },
          // A cancelled popup is a normal thing to do, not an error.
          onCancel: () => setMessage(null),
          onError: () =>
            setMessage(
              "PayPal could not complete this payment. Please try again or use another method.",
            ),
        });

        instance
          .render(containerRef.current)
          .then(() => {
            if (!cancelled) setReady(true);
          })
          .catch(() => {
            if (!cancelled) setMessage("Could not display the PayPal buttons.");
          });
      })
      .catch(() => {
        if (!cancelled) {
          setMessage(
            "Couldn't load PayPal. Please check your connection or use another method.",
          );
        }
      });

    return () => {
      cancelled = true;
      // close() detaches PayPal's iframes; without it a remount
      // renders a second set of buttons into the same container.
      try {
        instance?.close?.();
      } catch {
        // PayPal throws if it already tore itself down - harmless.
      }
    };
  }, [provider.client_id, provider.currency]);

  return (
    <div className="space-y-4">
      {!ready && !message && (
        <p className="text-sm text-ink-500">Loading PayPal…</p>
      )}
      {/* Kept mounted whatever the state: PayPal renders into this
          node and re-creating it would orphan the iframes. */}
      <div
        ref={containerRef}
        className={busy ? "opacity-50 pointer-events-none" : ""}
      />
      {busy && (
        <p className="text-sm text-ink-500 inline-flex items-center gap-2">
          <ButtonSpinner />
          Confirming your payment…
        </p>
      )}
      {message && <PanelError>{message}</PanelError>}
      <p className="text-xs text-ink-500 text-center">
        You&apos;ll confirm the payment in a PayPal window, then return here.
      </p>
    </div>
  );
}

// ── Square ───────────────────────────────────────────────────────────

function SquarePanel({
  provider,
  ctx,
  total,
  region,
  dark,
  billing,
  onPaid,
}: {
  provider: SquareProvider;
  ctx: PaymentContext;
  total: number;
  region: Region;
  dark: boolean;
  billing: BillingContact | null;
  onPaid: PaidHandler;
}) {
  const cardRef = useRef<SquareCard | null>(null);
  const paymentsRef = useRef<SquarePayments | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Square attaches by selector, so the container needs a real id.
  // useId's value contains colons, which are invalid in a CSS selector
  // unless escaped - strip them rather than rely on the SDK escaping.
  const containerId = `square-card-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    let cancelled = false;
    // Held locally as well as in the ref: cleanup can fire while
    // attach() is still in flight, at which point the ref hasn't been
    // set yet and the instance would leak. React's StrictMode mounts
    // effects twice in development, so that race happens every time -
    // and the second attach into a container that still holds the
    // first card is exactly what makes Square throw.
    let card: SquareCard | null = null;

    const url =
      provider.environment === "production"
        ? "https://web.squarecdn.com/v1/square.js"
        : "https://sandbox.web.squarecdn.com/v1/square.js";

    (async () => {
      await loadScript(url);
      if (cancelled) return;

      if (!window.Square) {
        setMessage(
          "Square is unavailable right now. Please try another method.",
        );
        return;
      }

      const payments = window.Square.payments(
        provider.application_id,
        provider.location_id,
      );
      paymentsRef.current = payments;

      // Square renders the card inputs inside its own iframe, so the
      // page's CSS can't reach them - the theme has to be passed in.
      //
      // No fontFamily on purpose. Square validates it as a single
      // family name and rejects a CSS stack outright, and because the
      // fields live in a cross-origin iframe our @font-face for Geist
      // isn't loaded in there anyway - naming it would fall back to
      // Square's default regardless. Colours are what actually carry
      // the theme across.
      card = await payments.card({
        style: {
          input: {
            color: dark ? "#f5f5f5" : "#111827",
          },
          ".input-container": {
            borderColor: dark ? "#3f3f46" : "#d4d4d8",
            borderRadius: "10px",
          },
          ".input-container.is-focus": { borderColor: "#b89855" },
          ".input-container.is-error": { borderColor: "#dc2626" },
          ".message-text.is-error": { color: "#dc2626" },
        },
      });

      if (cancelled) return;

      // A CSS selector, not the element. The SDK runs its own
      // querySelector on this string, so handing it a DOM node throws.
      await card.attach(`#${containerId}`);
      if (cancelled) return;

      cardRef.current = card;
      setReady(true);
    })().catch((e) => {
      if (cancelled) return;
      // Square's failures are specific and actionable - a mismatched
      // application/location pair, an app id from the other
      // environment, a non-HTTPS origin. Saying only "couldn't load"
      // throws all of that away, so pass its own words through.
      console.error("[checkout] Square card setup failed", e);
      setMessage(
        errorText(e, "Couldn't load the Square card form.") +
          " Please try another method.",
      );
    });

    return () => {
      cancelled = true;
      const instance = cardRef.current ?? card;
      instance?.destroy?.().catch(() => {
        // Already gone - nothing to clean up.
      });
      cardRef.current = null;
    };
  }, [
    provider.application_id,
    provider.location_id,
    provider.environment,
    dark,
    containerId,
  ]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const card = cardRef.current;
    const payments = paymentsRef.current;
    if (!card || !payments || busy) return;

    setBusy(true);
    setMessage(null);
    try {
      const tokenised = await card.tokenize();
      if (tokenised.status !== "OK" || !tokenised.token) {
        setMessage(
          tokenised.errors?.[0]?.message ??
            "Please check your card details and try again.",
        );
        return;
      }

      // Strong Customer Authentication. Square requires the resulting
      // token for UK/EEA cards and ignores it elsewhere, so we always
      // try - but a failure here is not fatal on its own: the payment
      // call below will reject it if the card actually needed it.
      let verificationToken = "";
      try {
        const verified = await payments.verifyBuyer(tokenised.token, {
          amount: total.toFixed(2),
          currencyCode: provider.currency,
          intent: "CHARGE",
          // Square wants this key present even when we know nothing
          // about the buyer; omitting it entirely makes verifyBuyer
          // throw rather than degrade.
          billingContact: {
            givenName: billing?.firstName ?? "",
            familyName: billing?.lastName ?? "",
            email: billing?.email ?? "",
          },
        });
        verificationToken = verified?.token ?? "";
      } catch {
        // Fall through with an empty token.
      }

      const res = await squarePay(
        ctx.cartToken,
        ctx.eventEid,
        tokenised.token,
        verificationToken,
        ctx.site,
      );
      await onPaid("square", res.transactionId, res.paymentStatus);
    } catch (e) {
      setMessage(
        errorText(e, "Your payment was not successful. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div id={containerId} />
      {!ready && !message && (
        <p className="text-sm text-ink-500">Loading card form…</p>
      )}
      {message && <PanelError>{message}</PanelError>}
      <button
        type="submit"
        disabled={!ready || busy}
        className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
      >
        {busy && <ButtonSpinner />}
        {busy ? "Processing…" : `Pay ${formatRegionCurrency(total, region)}`}
      </button>
      <p className="text-xs text-ink-500 text-center">
        Payments are processed securely by Square.
      </p>
    </form>
  );
}

// ── Mollie ───────────────────────────────────────────────────────────

/**
 * Mollie has no inline card form - the buyer completes the payment on
 * Mollie's hosted page and comes back. So this panel is a single
 * button plus an honest warning that they are about to leave, rather
 * than card fields that pretend otherwise.
 *
 * The redirect itself, and picking the result back up on return, is
 * the page's job: it owns the order form that has to survive the
 * navigation.
 */
function MolliePanel({
  total,
  region,
  onRedirect,
}: {
  total: number;
  region: Region;
  onRedirect: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const go = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await onRedirect();
      // On success the browser is navigating away - deliberately stay
      // busy so the button can't be pressed twice while it unloads.
    } catch (e) {
      setMessage(
        errorText(e, "Could not start the payment. Please try again."),
      );
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-600">
        You&apos;ll be taken to our payment provider to enter your card details
        securely, then brought straight back to complete your order.
      </p>
      {message && <PanelError>{message}</PanelError>}
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
      >
        {busy && <ButtonSpinner />}
        {busy ? "Redirecting…" : `Pay ${formatRegionCurrency(total, region)}`}
      </button>
      <p className="text-xs text-ink-500 text-center">
        Payments are processed securely by Mollie.
      </p>
    </div>
  );
}

// ── Step ─────────────────────────────────────────────────────────────

export function PaymentStep({
  providers,
  clientSecret,
  total,
  region,
  ctx,
  billing,
  onPaid,
  onMollieRedirect,
}: {
  /** Enabled methods, in the order the backend wants them shown. */
  providers: CheckoutProvider[];
  /** Stripe's intent secret; null when Stripe isn't usable here. */
  clientSecret: string | null;
  total: number;
  region: Region;
  ctx: PaymentContext;
  billing: BillingContact | null;
  onPaid: PaidHandler;
  /** Starts the Mollie hand-off; only called for that provider. */
  onMollieRedirect: () => Promise<void>;
}) {
  const dark =
    parseApplyTheme(useSearchParams()?.get(APPLY_THEME_PARAM)) === "dark";

  const [selected, setSelected] = useState<PaymentProviderId | null>(null);

  // Default to the first method the backend offers, and correct the
  // selection if the list changes underneath us (an organiser can
  // disconnect a provider mid-session).
  const active =
    providers.find((p) => p.id === selected) ?? providers[0] ?? null;

  if (!active) {
    return (
      <Section title="Payment">
        <PanelError>
          No payment method is available for this event. Please contact the
          organiser.
        </PanelError>
      </Section>
    );
  }

  return (
    <Section title="Payment">
      {providers.length > 1 && (
        <div
          role="tablist"
          aria-label="Payment method"
          className="flex flex-wrap gap-2 mb-5"
        >
          {providers.map((p) => {
            const isActive = p.id === active.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelected(p.id)}
                className={
                  "px-4 py-2.5 rounded-xl text-sm font-semibold border transition " +
                  (isActive
                    ? "border-gold-500 bg-gold-500/10 text-gold-600"
                    : "border-ink-200 text-ink-600 hover:border-ink-300")
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {active.id === "stripe" && (
        <StripePanel
          provider={active}
          clientSecret={clientSecret}
          total={total}
          region={region}
          dark={dark}
          onPaid={onPaid}
        />
      )}
      {active.id === "paypal" && (
        <PaypalPanel provider={active} ctx={ctx} onPaid={onPaid} />
      )}
      {active.id === "mollie" && (
        <MolliePanel
          total={total}
          region={region}
          onRedirect={onMollieRedirect}
        />
      )}
      {active.id === "square" && (
        <SquarePanel
          provider={active}
          ctx={ctx}
          total={total}
          region={region}
          dark={dark}
          billing={billing}
          onPaid={onPaid}
        />
      )}
    </Section>
  );
}
