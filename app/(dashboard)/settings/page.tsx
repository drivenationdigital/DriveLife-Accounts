"use client";

import { useEffect, useRef, useState } from "react";

import { useAccount, useDisconnectStripe } from "@/lib/account";
import {
  MollieLogo,
  PaypalLogo,
  SquareLogo,
  StripeLogo,
} from "@/components/ui/PaymentLogos";
import {
  useDisconnectPaymentProvider,
  usePaymentProviders,
  useMollieConnectUrl,
  usePaypalConnectUrl,
  useSquareConnectUrl,
} from "@/lib/paymentProviders";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";

/**
 * Settings & Integrations - dashboard settings page (UI only).
 * Sections: Payment Settings (Stripe), Website Widgets
 * (embed - starting point, full feature TBD), Help & Support.
 */

/**
 * While the new payment providers are still being tested, only this
 * user sees them. Everyone else gets Stripe exactly as before.
 *
 * A UI gate, NOT a security control - the API routes behind these cards
 * are still reachable by anyone who calls them directly. It exists to
 * stop organisers finding half-tested payment options, not to protect
 * anything. Remove it once Square, Mollie and PayPal are signed off.
 */
const PAYMENT_PROVIDER_PREVIEW_USER_ID = 1;

export default function SettingsPage() {
  const { data } = useAccount();
  // Default to hidden: while the account query is still loading, and if
  // it ever fails, an organiser should see the old Stripe-only page
  // rather than a flash of options they can't use yet.
  const showNewProviders =
    data?.account.id === PAYMENT_PROVIDER_PREVIEW_USER_ID;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {/* Payment Settings */}
      <Section title="Payment Settings">
        <div className="space-y-4">
          {/* TEMPORARY: everything except Stripe is hidden via display:none
              while only Stripe is offered. The cards stay mounted and fully
              functional - remove these two wrapper divs to show them again.
              The processor note is hidden too because it references Square/
              Mollie/PayPal. */}
          <div style={{ display: "none" }}>
            {showNewProviders && <CardProcessorNote />}
          </div>
          <StripeCard />
          <div style={{ display: "none" }}>
            {showNewProviders && (
              <>
                <SquareCard />
                <MollieCard />
                {/* PayPal temporarily hidden until 30 Sep 2026 - swap the
                    placeholder back for <PaypalCard /> to re-enable. */}
                <PaypalComingSoonCard />
              </>
            )}
          </div>
        </div>
      </Section>

      {/* Website Widgets */}
      {/* <Section title="Website Widgets">
        <p className="mb-4 text-sm text-ink-500">
          Embed your club, venue, or event application pages on your own website
          - visitors can apply without leaving your site. Copy the snippet below
          to get started.
        </p>
        <EmbedBox />
      </Section> */}

      {/* Help & Support */}
      <Section title="Help &amp; Support">
        <Card>
          <h3 className="text-lg font-bold text-ink-900">Need a hand?</h3>
          <p className="mt-1 text-sm text-ink-500">
            If you need any help or support, email us at{" "}
            <a
              href="mailto:info@carevents.com"
              className="font-semibold text-gold-600 hover:underline"
            >
              info@carevents.com
            </a>
            .
          </p>
        </Card>
      </Section>
    </div>
  );
}

// ─── Stripe integration card ──────────────────────────────────────────

/**
 * Stripe Connect status + actions. Linked-ness comes from the account
 * query (`stripe_connected`, i.e. whether the user's stripe_account_id
 * profile field is set):
 *
 *   loading   → neutral "checking" line, no buttons (prevents a flash
 *               of "Connect" for users who are already linked)
 *   linked    → green confirmation + Disconnect (with confirm dialog)
 *   unlinked  → the original Connect to Stripe OAuth button
 */
function StripeCard() {
  const { data, isLoading } = useAccount();
  const disconnect = useDisconnectStripe();
  const confirm = useConfirm();
  const toast = useToast();

  const connected = Boolean(data?.account.stripe_connected);

  const onDisconnect = async () => {
    if (disconnect.isPending) return;
    const ok = await confirm({
      title: "Disconnect Stripe?",
      message:
        "You won't be able to collect card payments for your events until you connect a Stripe account again.",
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!ok) return;
    try {
      await disconnect.mutateAsync();
      toast.success("Stripe account disconnected.");
    } catch {
      toast.error("Couldn't disconnect Stripe. Please try again.");
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-ink-900">Stripe Integration</h3>
        <StripeLogo className="h-6 w-auto shrink-0" />
      </div>

      {isLoading ? (
        <p className="mt-1 text-sm text-ink-400">
          Checking your Stripe connection…
        </p>
      ) : connected ? (
        <>
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Your Stripe account is connected
              </p>
              <p className="mt-0.5 text-sm text-emerald-800/80">
                Ticket payments for your events are paid out to your connected
                Stripe account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnect.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disconnect.isPending ? "Disconnecting…" : "Disconnect Stripe"}
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-500">
            Connect your Stripe account to collect payments when creating car
            events.
          </p>
          <button
            onClick={() => {
              window.location.href =
                "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_Ln2o2ZGab16J09GztcAtEnWt1JJd94HS&scope=read_write";
            }}
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-gold-500/20 transition hover:from-gold-600 hover:to-gold-700"
          >
            Connect to Stripe
          </button>
        </>
      )}
    </Card>
  );
}

// ─── PayPal / Square credential cards ─────────────────────────────────

/**
 * PayPal and Square are connected by pasting API credentials rather
 * than through an OAuth handshake like Stripe. That is a deliberate
 * consequence of how they are used: these are the organiser's own
 * merchant accounts taking the full amount, with no platform split, so
 * there is no partner relationship for the platform to broker.
 *
 * The server validates every credential against the provider before it
 * saves, so a rejected save carries a specific reason - surface it
 * rather than a generic error. Stored secrets are never returned, so
 * the secret inputs start empty and an empty value on save means
 * "leave the stored one alone".
 */

function ConnectedBanner({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <CheckIcon />
      </span>
      <div>
        <p className="text-sm font-semibold text-emerald-900">{title}</p>
        <p className="mt-0.5 text-sm text-emerald-800/80">{detail}</p>
      </div>
    </div>
  );
}

const CARD_PROCESSOR_NAMES: Record<string, string> = {
  stripe: "Stripe",
  square: "Square",
  mollie: "Mollie",
};

/**
 * Explains the one-card-processor rule before an organiser runs into it
 * as a rejected connect, and names the one currently in use. Buyers see
 * a single "Card" option, so exactly one of Stripe, Square or Mollie can
 * sit behind it. PayPal is separate and sits alongside whichever they
 * choose.
 */
function CardProcessorNote() {
  const { data, isLoading } = usePaymentProviders();
  if (isLoading || !data) return null;

  const active = CARD_PROCESSOR_NAMES[data.card_processor] ?? "Stripe";

  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
      <p className="text-sm text-ink-700">
        Buyers see two options at checkout: <strong>Card</strong> and{" "}
        <strong>PayPal</strong>. Card payments can run through Stripe, Square
        or Mollie - but only one at a time, so connecting a new one means
        disconnecting the current one first.
      </p>
      <p className="mt-2 text-sm text-ink-600">
        Card payments currently go through{" "}
        <strong className="text-ink-900">{active}</strong>
        {data.card_processor === "stripe" && !data.stripe_connected && (
          <> (the CarEvents platform account)</>
        )}
        .
      </p>
    </div>
  );
}

/**
 * Reads the `?<provider>=connected|cancelled|error` outcome the connect
 * callbacks append, shows it once, and strips it from the URL so a
 * refresh can't replay the toast.
 *
 * Deliberately reads `window.location` rather than useSearchParams so
 * this page stays statically rendered.
 */
function useConnectReturn(param: string, name: string) {
  const toast = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get(param);
    if (!outcome) return;
    handled.current = true;

    if (outcome === "connected") {
      toast.success(`${name} connected.`);
    } else if (outcome === "cancelled") {
      toast.error(`${name} connection cancelled.`);
    } else {
      // "incomplete" and "error" both carry a specific reason from the
      // provider - showing it beats a generic failure.
      toast.error(
        params.get(`${param}_message`) ||
          `Couldn't connect ${name}. Please try again.`,
      );
    }

    params.delete(param);
    params.delete(`${param}_message`);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : ""),
    );
  }, [param, name, toast]);
}

/**
 * One provider card: Connect, or a green banner and Disconnect.
 *
 * There is deliberately no manual credential entry. Organisers connect
 * through the provider's own consent flow and never handle an API key -
 * finding one was the barrier this whole feature exists to remove. The
 * backend still honours credentials pasted before this existed, but the
 * only way forward from here is Connect.
 */
function ProviderConnectCard({
  name,
  logo,
  isLoading,
  connected,
  connectedTitle,
  connectedDetail,
  description,
  blockedBy = null,
  warning = null,
  footnote = null,
  onConnect,
  connecting,
  onDisconnect,
  disconnecting,
}: {
  name: string;
  /** Brand logo shown opposite the card title. */
  logo?: React.ReactNode;
  isLoading: boolean;
  connected: boolean;
  connectedTitle: string;
  connectedDetail: string;
  description: React.ReactNode;
  /** Another card processor already owns the Card slot. */
  blockedBy?: string | null;
  warning?: React.ReactNode;
  footnote?: React.ReactNode;
  onConnect: () => void;
  connecting: boolean;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-ink-900">{name}</h3>
        {logo}
      </div>

      {isLoading ? (
        <p className="mt-1 text-sm text-ink-400">
          Checking your {name} connection…
        </p>
      ) : connected ? (
        <>
          <ConnectedBanner title={connectedTitle} detail={connectedDetail} />
          {warning}
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disconnecting ? "Disconnecting…" : `Disconnect ${name}`}
          </button>
          {footnote}
        </>
      ) : blockedBy ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {blockedBy} is currently handling card payments. Disconnect it first
          to switch to {name}.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-500">{description}</p>
          <button
            type="button"
            onClick={onConnect}
            disabled={connecting}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-gold-500/20 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connecting ? `Opening ${name}…` : `Connect ${name}`}
          </button>
        </>
      )}
    </Card>
  );
}

/** Shared Connect/Disconnect wiring for the three connect flows. */
function useProviderActions(
  provider: "square" | "mollie" | "paypal",
  name: string,
  connectUrl: {
    isPending: boolean;
    mutateAsync: (b: { return_to: string }) => Promise<{ url: string }>;
  },
  disconnectMessage: string,
) {
  const disconnect = useDisconnectPaymentProvider();
  const confirm = useConfirm();
  const toast = useToast();

  const onConnect = async () => {
    if (connectUrl.isPending) return;
    try {
      // Come back to this page so the card reflects the new state.
      const returnTo = `${window.location.origin}${window.location.pathname}`;
      const { url } = await connectUrl.mutateAsync({ return_to: returnTo });
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : `Couldn't start the ${name} connection.`,
      );
    }
  };

  const onDisconnect = async () => {
    if (disconnect.isPending) return;
    const ok = await confirm({
      title: `Disconnect ${name}?`,
      message: disconnectMessage,
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!ok) return;
    try {
      await disconnect.mutateAsync({ provider });
      toast.success(`${name} disconnected.`);
    } catch {
      toast.error(`Couldn't disconnect ${name}. Please try again.`);
    }
  };

  return { onConnect, onDisconnect, disconnecting: disconnect.isPending };
}

function SquareCard() {
  const { data, isLoading } = usePaymentProviders();
  const connectUrl = useSquareConnectUrl();
  const status = data?.providers.square;
  useConnectReturn("square", "Square");

  const { onConnect, onDisconnect, disconnecting } = useProviderActions(
    "square",
    "Square",
    connectUrl,
    "Card payments for your events will go back to Stripe until you connect another provider.",
  );

  const connected = Boolean(status?.connected);
  const blockedBy = connected
    ? null
    : data?.providers.mollie.connected
      ? "Mollie"
      : data?.stripe_connected
        ? "Stripe"
        : null;

  return (
    <ProviderConnectCard
      name="Square"
      logo={<SquareLogo className="h-6 w-6 shrink-0" />}
      isLoading={isLoading}
      connected={connected}
      connectedTitle={`Square is connected (${status?.environment})`}
      connectedDetail={`Location ${status?.location_id}. Ticket payments go straight to this Square account in full - no platform fee is deducted at checkout.`}
      description="Connect your Square account to take card payments at your checkout. You'll approve the connection on Square and come straight back."
      blockedBy={blockedBy}
      onConnect={onConnect}
      connecting={connectUrl.isPending}
      onDisconnect={onDisconnect}
      disconnecting={disconnecting}
    />
  );
}

function MollieCard() {
  const { data, isLoading } = usePaymentProviders();
  const connectUrl = useMollieConnectUrl();
  const status = data?.providers.mollie;
  useConnectReturn("mollie", "Mollie");

  const { onConnect, onDisconnect, disconnecting } = useProviderActions(
    "mollie",
    "Mollie",
    connectUrl,
    "Card payments for your events will go back to Stripe until you connect another provider.",
  );

  const connected = Boolean(status?.connected);
  const blockedBy = connected
    ? null
    : data?.providers.square.connected
      ? "Square"
      : data?.stripe_connected
        ? "Stripe"
        : null;

  return (
    <ProviderConnectCard
      name="Mollie"
      logo={<MollieLogo className="h-5 w-auto shrink-0" />}
      isLoading={isLoading}
      connected={connected}
      connectedTitle={`Mollie is connected (${status?.environment})`}
      connectedDetail={`Profile ${status?.profile_id}. Ticket payments go straight to this Mollie account in full - no platform fee is deducted at checkout.`}
      description="Connect your Mollie account to take card payments at your checkout. Buyers pay on Mollie's secure page and return to complete their order."
      blockedBy={blockedBy}
      onConnect={onConnect}
      connecting={connectUrl.isPending}
      onDisconnect={onDisconnect}
      disconnecting={disconnecting}
    />
  );
}

function PaypalCard() {
  const { data, isLoading } = usePaymentProviders();
  const connectUrl = usePaypalConnectUrl();
  const status = data?.providers.paypal;
  useConnectReturn("paypal", "PayPal");

  const { onConnect, onDisconnect, disconnecting } = useProviderActions(
    "paypal",
    "PayPal",
    connectUrl,
    "Buyers will no longer see PayPal as a payment option on your events.",
  );

  const connected = Boolean(status?.connected);

  return (
    <ProviderConnectCard
      name="PayPal"
      logo={<PaypalLogo className="h-7 w-auto shrink-0" />}
      isLoading={isLoading}
      connected={connected}
      connectedTitle={`PayPal is connected (${status?.environment})`}
      connectedDetail={`Merchant ${status?.merchant_id}. Ticket payments go straight to this PayPal account in full - no platform fee is deducted at checkout.`}
      description="Connect your PayPal account to offer PayPal at your checkout. You'll sign in - or sign up - on PayPal and come straight back."
      warning={
        status?.needs_attention ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            PayPal can&apos;t receive payments for this account yet. Finish the
            outstanding steps in your PayPal account, then reconnect.
          </p>
        ) : null
      }
      footnote={
        status?.connect ? (
          // PayPal has no revoke API for partner referrals, so saying
          // "disconnected" without this would overstate what happened.
          <p className="mt-2 text-[11px] leading-snug text-ink-500">
            Disconnecting stops PayPal appearing at your checkout. To fully
            revoke access, also remove CarEvents from your PayPal account
            settings.
          </p>
        ) : null
      }
      onConnect={onConnect}
      connecting={connectUrl.isPending}
      onDisconnect={onDisconnect}
      disconnecting={disconnecting}
    />
  );
}

/**
 * Temporary stand-in for PaypalCard while the PayPal integration is
 * switched off ahead of its launch date. All the connect functionality
 * (PaypalCard and its hooks) is untouched - restore it by swapping this
 * back for <PaypalCard /> in the Payment Settings section.
 */
function PaypalComingSoonCard() {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-ink-900">PayPal</h3>
        <PaypalLogo className="h-7 w-auto shrink-0" />
      </div>
      <p className="mt-1 text-sm text-ink-500">
        PayPal integration available from 30th September 2026
      </p>
    </Card>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="mb-4 border-b border-ink-100 pb-2 text-lg font-extrabold text-ink-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100">
      {children}
    </div>
  );
}

function EmbedBox() {
  const [copied, setCopied] = useState(false);
  const snippet = `<iframe
  src="https://account.carevents.com/embed/{type}/{id}"
  width="100%"
  height="800"
  style="border:0;border-radius:12px"
  loading="lazy"
></iframe>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable - no-op; the code is still selectable.
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-ink-100">
      <div className="flex items-center justify-between bg-ink-900 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-300">
          Embed code
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-ink-50 px-4 py-4 text-xs leading-relaxed text-ink-700">
        <code>{snippet}</code>
      </pre>
      <p className="border-t border-ink-100 bg-white px-4 py-2.5 text-xs text-ink-400">
        Replace <code className="text-ink-600">{"{type}"}</code> with{" "}
        <code className="text-ink-600">club</code>,{" "}
        <code className="text-ink-600">venue</code>, or{" "}
        <code className="text-ink-600">show-car</code>, and{" "}
        <code className="text-ink-600">{"{id}"}</code> with your item’s id.
      </p>
    </div>
  );
}
