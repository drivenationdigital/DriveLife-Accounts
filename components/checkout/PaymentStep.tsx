"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe, type PaymentIntent } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { APPLY_THEME_PARAM, parseApplyTheme } from "@/lib/applyTheme";
import { formatRegionCurrency, type Region } from "@/lib/regions";
import { ButtonSpinner } from "@/components/apply/ApplyIcons";
import { Section } from "./CheckoutShell";

/**
 * Step 3 - payment.
 *
 * Same Stripe flow as the classic checkout: a PaymentIntent created
 * server-side (create.php, on the organiser's Connect account when
 * they have one), confirmed here with the Payment Element and
 * redirect:"if_required" - the intent is created with redirects
 * disallowed, so card + wallets only, no return-URL round trip.
 */

function PaymentForm({
  total,
  region,
  onResult,
}: {
  total: number;
  region: Region;
  onResult: (intent: PaymentIntent) => Promise<void>;
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
        await onResult(paymentIntent);
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
      {message && (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      )}
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

export function PaymentStep({
  publishableKey,
  stripeAccount,
  clientSecret,
  total,
  region,
  onResult,
}: {
  publishableKey: string;
  stripeAccount: string | null;
  clientSecret: string;
  total: number;
  region: Region;
  onResult: (intent: PaymentIntent) => Promise<void>;
}) {
  const dark =
    parseApplyTheme(useSearchParams()?.get(APPLY_THEME_PARAM)) === "dark";

  // loadStripe must not be re-run per render, and the Connect account
  // has to match the account the intent was created on or
  // confirmPayment rejects the client secret.
  const stripePromise = useMemo(
    () =>
      loadStripe(
        publishableKey,
        stripeAccount ? { stripeAccount } : undefined,
      ),
    [publishableKey, stripeAccount],
  );

  const options = useMemo(
    () => ({
      clientSecret,
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

  return (
    <Section title="Payment">
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm total={total} region={region} onResult={onResult} />
      </Elements>
    </Section>
  );
}
