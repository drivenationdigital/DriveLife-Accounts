"use client";

import { useState } from "react";
import Link from "next/link";

import { useAccount, useDisconnectStripe } from "@/lib/account";
import {
  useDisconnectPaymentProvider,
  usePaymentProviders,
  useSavePaymentProvider,
} from "@/lib/paymentProviders";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";

/**
 * Settings & Integrations - dashboard settings page (UI only).
 * Sections: top nav cards, Payment Settings (Stripe), Website Widgets
 * (embed - starting point, full feature TBD), Help & Support.
 */

const NAV_CARDS = [
  {
    key: "events",
    label: "Event Manager",
    href: "/events",
    icon: <CalendarIcon />,
  },
  {
    key: "create",
    label: "Create Something",
    href: "/create",
    icon: <PlusIcon />,
  },
  {
    key: "settings",
    label: "Settings & Integrations",
    href: "/settings",
    icon: <GearCursorIcon />,
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {/* Top nav cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {NAV_CARDS.map((card) => {
          const active = card.key === "settings";
          return (
            <Link
              key={card.key}
              href={card.href}
              className={[
                "flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center transition",
                active
                  ? "bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-sm shadow-gold-500/25"
                  : "bg-white text-ink-700 ring-1 ring-ink-100 hover:shadow-md",
              ].join(" ")}
            >
              <span className={active ? "text-white" : "text-gold-600"}>
                {card.icon}
              </span>
              <span className="text-sm font-semibold">{card.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Payment Settings */}
      <Section title="Payment Settings">
        <div className="space-y-4">
          <CardProcessorNote />
          <StripeCard />
          <SquareCard />
          <MollieCard />
          <PaypalCard />
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
      <h3 className="text-lg font-bold text-ink-900">Stripe Integration</h3>

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

function CredentialField({
  label,
  hint,
  ...input
}: {
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <input
        {...input}
        className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-gold-500"
      />
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

function ProviderActions({
  connected,
  saving,
  disconnecting,
  onDisconnect,
}: {
  connected: boolean;
  saving: boolean;
  disconnecting: boolean;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        disabled={saving || disconnecting}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-gold-500/20 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Checking credentials…" : connected ? "Update" : "Connect"}
      </button>
      {connected && (
        <button
          type="button"
          onClick={onDisconnect}
          disabled={saving || disconnecting}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
      )}
    </div>
  );
}

const CARD_PROCESSOR_NAMES: Record<string, string> = {
  stripe: "Stripe",
  square: "Square",
  mollie: "Mollie",
};

/**
 * Explains the one-card-processor rule before an organiser runs into
 * it as a rejected save, and names the one currently in use. Buyers
 * see a single "Card" button, so exactly one processor can sit behind
 * it - Stripe, Square or Mollie. PayPal is separate and sits alongside
 * whichever they choose.
 */
function CardProcessorNote() {
  const { data, isLoading } = usePaymentProviders();
  if (isLoading || !data) return null;

  const active = CARD_PROCESSOR_NAMES[data.card_processor] ?? "Stripe";

  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
      <p className="text-sm text-ink-700">
        Buyers see two options at checkout: <strong>Card</strong> and{" "}
        <strong>PayPal</strong>. Card payments can run through Stripe, Square or
        Mollie - but only one at a time, so connecting a new one means
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

function MollieCard() {
  const { data, isLoading } = usePaymentProviders();
  const save = useSavePaymentProvider();
  const disconnect = useDisconnectPaymentProvider();
  const confirm = useConfirm();
  const toast = useToast();

  const status = data?.providers.mollie;
  const connected = Boolean(status?.connected);
  // Another processor already owns the Card button - say so here
  // rather than let them fill the form in and be refused on save.
  const blockedBy = !connected
    ? data?.providers.square.connected
      ? "Square"
      : data?.stripe_connected
        ? "Stripe"
        : null
    : null;

  const [apiKey, setApiKey] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (save.isPending) return;
    try {
      await save.mutateAsync({ provider: "mollie", api_key: apiKey });
      setApiKey("");
      toast.success("Mollie connected.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't save your Mollie API key.",
      );
    }
  };

  const onDisconnect = async () => {
    if (disconnect.isPending) return;
    const ok = await confirm({
      title: "Disconnect Mollie?",
      message:
        "Card payments for your events will go back to Stripe until you connect another provider.",
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!ok) return;
    try {
      await disconnect.mutateAsync({ provider: "mollie" });
      setApiKey("");
      toast.success("Mollie disconnected.");
    } catch {
      toast.error("Couldn't disconnect Mollie. Please try again.");
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-bold text-ink-900">Mollie</h3>

      {isLoading ? (
        <p className="mt-1 text-sm text-ink-400">
          Checking your Mollie connection…
        </p>
      ) : (
        <>
          {connected ? (
            <ConnectedBanner
              title={`Mollie is connected (${status?.environment})`}
              detail={`API key ending ${status?.api_key_hint || "****"}. Ticket payments go straight to this Mollie account in full - no platform fee is deducted at checkout.`}
            />
          ) : blockedBy ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {blockedBy} is currently handling card payments. Disconnect it
              first to switch to Mollie.
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-500">
              Paste a live or test API key from your{" "}
              <a
                href="https://my.mollie.com/dashboard/developers/api-keys"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold-600 hover:underline"
              >
                Mollie dashboard
              </a>
              . Buyers pay on Mollie&apos;s secure page and return to complete
              their order.
            </p>
          )}

          {!blockedBy && (
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <CredentialField
                label="API key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                hint={
                  connected
                    ? "Leave blank to keep the key already stored."
                    : "Starts with test_ or live_ - the key itself decides which mode you're in."
                }
                autoComplete="new-password"
              />
              <ProviderActions
                connected={connected}
                saving={save.isPending}
                disconnecting={disconnect.isPending}
                onDisconnect={onDisconnect}
              />
            </form>
          )}
        </>
      )}
    </Card>
  );
}

function PaypalCard() {
  const { data, isLoading } = usePaymentProviders();
  const save = useSavePaymentProvider();
  const disconnect = useDisconnectPaymentProvider();
  const confirm = useConfirm();
  const toast = useToast();

  const status = data?.providers.paypal;
  const connected = Boolean(status?.connected);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "live">("sandbox");

  // The stored client id isn't a secret, but the API only returns a
  // hint - prefill the environment (which it does return) and leave the
  // credential fields for the organiser to retype when changing them.
  const [synced, setSynced] = useState(false);
  if (status && !synced) {
    setEnvironment(status.environment);
    setSynced(true);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (save.isPending) return;
    try {
      await save.mutateAsync({
        provider: "paypal",
        environment,
        client_id: clientId,
        client_secret: clientSecret,
      });
      setClientSecret("");
      toast.success("PayPal connected.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't save your PayPal credentials.",
      );
    }
  };

  const onDisconnect = async () => {
    if (disconnect.isPending) return;
    const ok = await confirm({
      title: "Disconnect PayPal?",
      message:
        "Buyers will no longer see PayPal as a payment option on your events.",
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!ok) return;
    try {
      await disconnect.mutateAsync({ provider: "paypal" });
      setClientId("");
      setClientSecret("");
      toast.success("PayPal disconnected.");
    } catch {
      toast.error("Couldn't disconnect PayPal. Please try again.");
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-bold text-ink-900">PayPal</h3>

      {isLoading ? (
        <p className="mt-1 text-sm text-ink-400">
          Checking your PayPal connection…
        </p>
      ) : (
        <>
          {connected ? (
            <ConnectedBanner
              title={`PayPal is connected (${status?.environment})`}
              detail={`Client ID ending ${status?.client_id_hint || "****"}. Ticket payments go straight to this PayPal account in full - no platform fee is deducted at checkout.`}
            />
          ) : (
            <p className="mt-1 text-sm text-ink-500">
              Paste the credentials from a REST API app in your{" "}
              <a
                href="https://developer.paypal.com/dashboard/applications"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold-600 hover:underline"
              >
                PayPal developer dashboard
              </a>{" "}
              to offer PayPal at your checkout.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <CredentialField
              label="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder={connected ? "Enter a new client ID to replace" : ""}
              autoComplete="off"
            />
            <CredentialField
              label="Secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              hint={
                connected
                  ? "Leave blank to keep the secret already stored."
                  : undefined
              }
              autoComplete="new-password"
            />
            <label className="block">
              <span className="text-sm font-semibold text-ink-700">
                Environment
              </span>
              <select
                value={environment}
                onChange={(e) =>
                  setEnvironment(e.target.value as "sandbox" | "live")
                }
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-gold-500"
              >
                <option value="sandbox">Sandbox (testing)</option>
                <option value="live">Live (real payments)</option>
              </select>
            </label>
            <ProviderActions
              connected={connected}
              saving={save.isPending}
              disconnecting={disconnect.isPending}
              onDisconnect={onDisconnect}
            />
          </form>
        </>
      )}
    </Card>
  );
}

function SquareCard() {
  const { data, isLoading } = usePaymentProviders();
  const save = useSavePaymentProvider();
  const disconnect = useDisconnectPaymentProvider();
  const confirm = useConfirm();
  const toast = useToast();

  const status = data?.providers.square;
  const connected = Boolean(status?.connected);
  const blockedBy = !connected
    ? data?.providers.mollie.connected
      ? "Mollie"
      : data?.stripe_connected
        ? "Stripe"
        : null
    : null;

  const [applicationId, setApplicationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [locationId, setLocationId] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">(
    "sandbox",
  );

  const [synced, setSynced] = useState(false);
  if (status && !synced) {
    setEnvironment(status.environment);
    setLocationId(status.location_id);
    setSynced(true);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (save.isPending) return;
    try {
      await save.mutateAsync({
        provider: "square",
        environment,
        application_id: applicationId,
        location_id: locationId,
        access_token: accessToken,
      });
      setAccessToken("");
      toast.success("Square connected.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't save your Square credentials.",
      );
    }
  };

  const onDisconnect = async () => {
    if (disconnect.isPending) return;
    const ok = await confirm({
      title: "Disconnect Square?",
      message:
        "Buyers will no longer see Square as a payment option on your events.",
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!ok) return;
    try {
      await disconnect.mutateAsync({ provider: "square" });
      setApplicationId("");
      setAccessToken("");
      setLocationId("");
      toast.success("Square disconnected.");
    } catch {
      toast.error("Couldn't disconnect Square. Please try again.");
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-bold text-ink-900">Square</h3>

      {isLoading ? (
        <p className="mt-1 text-sm text-ink-400">
          Checking your Square connection…
        </p>
      ) : (
        <>
          {connected ? (
            <ConnectedBanner
              title={`Square is connected (${status?.environment})`}
              detail={`Application ID ending ${status?.application_id_hint || "****"}, location ${status?.location_id}. Ticket payments go straight to this Square account in full - no platform fee is deducted at checkout.`}
            />
          ) : blockedBy ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {blockedBy} is currently handling card payments. Disconnect it
              first to switch to Square.
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-500">
              Paste the credentials from your{" "}
              <a
                href="https://developer.squareup.com/apps"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold-600 hover:underline"
              >
                Square developer dashboard
              </a>{" "}
              to take card payments through Square at your checkout.
            </p>
          )}

          {!blockedBy && (
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <CredentialField
                label="Application ID"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder={
                  connected ? "Enter a new application ID to replace" : ""
                }
                autoComplete="off"
              />
              <CredentialField
                label="Access token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                hint={
                  connected
                    ? "Leave blank to keep the token already stored."
                    : undefined
                }
                autoComplete="new-password"
              />
              <CredentialField
                label="Location ID"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                hint="The location payments are taken against. We check it belongs to your account when you save."
                autoComplete="off"
              />
              <label className="block">
                <span className="text-sm font-semibold text-ink-700">
                  Environment
                </span>
                <select
                  value={environment}
                  onChange={(e) =>
                    setEnvironment(e.target.value as "sandbox" | "production")
                  }
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-gold-500"
                >
                  <option value="sandbox">Sandbox (testing)</option>
                  <option value="production">Production (real payments)</option>
                </select>
              </label>
              <ProviderActions
                connected={connected}
                saving={save.isPending}
                disconnecting={disconnect.isPending}
                onDisconnect={onDisconnect}
              />
            </form>
          )}
        </>
      )}
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
    <section className="mt-10">
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

// ─── Icons ────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function GearCursorIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l7 17 2-7 7-2z" />
    </svg>
  );
}
