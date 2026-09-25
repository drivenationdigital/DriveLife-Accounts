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
import {
  MARKETING_PROVIDER_LABELS,
  useConnectMarketing,
  useDisconnectMarketing,
  useMarketingLists,
  useMarketingSettings,
  useSaveMarketingList,
  type MarketingList,
  type MarketingProvider,
} from "@/lib/marketingSettings";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";

/**
 * Settings & Integrations - dashboard settings page (UI only).
 * Sections: Payment Settings (Stripe), Website Widgets
 * (embed - starting point, full feature TBD), Help & Support.
 */

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {/* Payment Settings */}
      <Section title="Payment Settings">
        <div className="space-y-4">
          {/* TEMPORARY: the processor note stays hidden via display:none
              because it tells organisers buyers can pay with PayPal, which
              isn't offered until 30 Sep 2026. Remove the wrapper div once
              PayPal is switched on. The note stays mounted and functional. */}
          <div style={{ display: "none" }}>
            <CardProcessorNote />
          </div>
          <StripeCard />
          <SquareCard />
          <MollieCard />
          {/* PayPal shows as a "coming soon" placeholder until
              30 Sep 2026 - swap it back for <PaypalCard /> to enable. */}
          <PaypalComingSoonCard />
        </div>
      </Section>

      {/* Email marketing */}
      <Section title="Email marketing settings">
        <EmailMarketingCard />
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
        PayPal integration available from 30th October 2026
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

// ─── Email marketing card ─────────────────────────────────────────────

const PROVIDER_HELP: Record<
  MarketingProvider,
  { where: string; url: string; listNoun: string }
> = {
  brevo: {
    where: "Brevo → SMTP & API → API keys",
    url: "https://app.brevo.com/settings/keys/api",
    listNoun: "list",
  },
  mailchimp: {
    where: "Mailchimp → Account & billing → Extras → API keys",
    url: "https://admin.mailchimp.com/account/api/",
    listNoun: "audience",
  },
};

const marketingInputCls =
  "w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-2.5 text-sm text-ink-700 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20";

/**
 * Link a Brevo or Mailchimp account with an API key, then choose the
 * list new contacts go to. Buyers who tick "Keep me updated about
 * future events from this event organiser" at checkout are added to
 * that list by the backend after the order completes.
 *
 * Two states: a connect form (provider + key) until a key has been
 * verified, then the connected banner with the list chooser. The key
 * itself never comes back from the server - only its last four
 * characters - so reconnecting means pasting it again.
 */
function EmailMarketingCard() {
  const { data, isLoading, error: loadError } = useMarketingSettings();
  const connect = useConnectMarketing();
  const fetchLists = useMarketingLists();
  const saveList = useSaveMarketingList();
  const disconnect = useDisconnectMarketing();
  const confirm = useConfirm();
  const toast = useToast();

  const settings = data?.settings;
  const connected = Boolean(settings?.connected);
  const provider = settings?.provider ?? null;
  const providerLabel = provider ? MARKETING_PROVIDER_LABELS[provider] : "";

  // ---- Connect form ----
  const [formProvider, setFormProvider] = useState<MarketingProvider>("brevo");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ---- List chooser ----
  // `lists` is null until fetched for the current connection; the
  // connect response carries them so there is no second round-trip.
  const [lists, setLists] = useState<MarketingList[] | null>(null);
  const [listsError, setListsError] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string>("");
  const [listsFor, setListsFor] = useState<string | null>(null);

  // The saved choice seeds the dropdown once settings arrive (and again
  // after a disconnect/reconnect changes what is saved).
  const savedListId = settings?.list_id ?? "";
  const [seededFrom, setSeededFrom] = useState<string | null>(null);
  if (settings && seededFrom !== `${provider}:${savedListId}`) {
    setSeededFrom(`${provider}:${savedListId}`);
    setSelectedList(savedListId);
  }

  const loadLists = async () => {
    setListsError(null);
    try {
      const res = await fetchLists.mutateAsync();
      setLists(res.lists);
    } catch (err) {
      setListsError(
        err instanceof Error && err.message
          ? err.message
          : `Couldn't load your ${providerLabel} lists.`,
      );
    }
  };

  // Fetch the lists once per connection. Keyed on the provider + key
  // hint so a reconnect with a different key refetches.
  const connectionKey = connected
    ? `${provider}:${settings?.api_key_hint ?? ""}`
    : null;
  useEffect(() => {
    if (!connectionKey) {
      setLists(null);
      setListsFor(null);
      return;
    }
    if (listsFor === connectionKey) return;
    setListsFor(connectionKey);
    if (lists === null) void loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionKey]);

  const onConnect = async () => {
    setFormError(null);
    const key = apiKey.trim();
    if (!key) {
      setFormError(`Paste your ${MARKETING_PROVIDER_LABELS[formProvider]} API key.`);
      return;
    }
    try {
      const res = await connect.mutateAsync({ provider: formProvider, api_key: key });
      setApiKey("");
      setShowKey(false);
      setLists(res.lists);
      setListsFor(`${res.settings.provider}:${res.settings.api_key_hint}`);
      setListsError(res.lists_error);
      toast.success(`${MARKETING_PROVIDER_LABELS[formProvider]} connected.`);
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : `Couldn't connect ${MARKETING_PROVIDER_LABELS[formProvider]}.`,
      );
    }
  };

  const onSaveList = async () => {
    const chosen = lists?.find((l) => l.id === selectedList);
    try {
      await saveList.mutateAsync({
        list_id: selectedList,
        list_name: chosen?.name ?? "",
      });
      toast.success(
        selectedList
          ? `New contacts will be added to "${chosen?.name ?? selectedList}".`
          : "List cleared - no contacts will be added until you choose one.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't save the list. Please try again.",
      );
    }
  };

  const onDisconnect = async () => {
    if (disconnect.isPending) return;
    const ok = await confirm({
      title: `Disconnect ${providerLabel}?`,
      message:
        "New checkout contacts will no longer be added to your list. Contacts already on it are not affected.",
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!ok) return;
    try {
      await disconnect.mutateAsync();
      setLists(null);
      setListsFor(null);
      setSelectedList("");
      toast.success(`${providerLabel} disconnected.`);
    } catch {
      toast.error(`Couldn't disconnect ${providerLabel}. Please try again.`);
    }
  };

  const help = PROVIDER_HELP[formProvider];
  const listNoun = provider ? PROVIDER_HELP[provider].listNoun : "list";
  const listDirty = selectedList !== savedListId;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-ink-900">Email marketing</h3>
        {connected && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
            {providerLabel}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-500">
        Link Brevo or Mailchimp and every buyer who ticks{" "}
        <em>&ldquo;Keep me updated about future events from this event
        organiser&rdquo;</em>{" "}
        at checkout is added to the list you choose, with their name and
        phone number where given.
      </p>

      {isLoading ? (
        <p className="mt-3 text-sm text-ink-400">Checking your email marketing connection…</p>
      ) : loadError ? (
        <p className="mt-3 text-sm text-red-600">
          Couldn&apos;t load your email marketing settings. Refresh the page to
          try again.
        </p>
      ) : connected && settings ? (
        <>
          <ConnectedBanner
            title={`${providerLabel} is connected`}
            detail={`Account: ${settings.account_name || "unnamed"}. API key ending ${settings.api_key_hint || "…"}.`}
          />

          <div className="mt-5 space-y-2">
            <label
              htmlFor="marketing-list"
              className="block text-sm font-semibold text-ink-900"
            >
              Add new contacts to
            </label>
            {lists === null && !listsError ? (
              <p className="text-sm text-ink-400">
                Loading your {providerLabel} {listNoun}s…
              </p>
            ) : listsError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p>{listsError}</p>
                <button
                  type="button"
                  onClick={loadLists}
                  disabled={fetchLists.isPending}
                  className="mt-2 text-sm font-semibold text-amber-900 underline disabled:opacity-60"
                >
                  {fetchLists.isPending ? "Retrying…" : "Try again"}
                </button>
              </div>
            ) : lists && lists.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                There are no {listNoun}s on this {providerLabel} account yet.
                Create one in {providerLabel}, then{" "}
                <button
                  type="button"
                  onClick={loadLists}
                  className="font-semibold underline"
                >
                  refresh
                </button>
                .
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  id="marketing-list"
                  className={marketingInputCls}
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                >
                  <option value="">— No {listNoun} (don&apos;t add contacts) —</option>
                  {lists?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                      {l.contacts > 0 ? ` (${l.contacts.toLocaleString()})` : ""}
                    </option>
                  ))}
                  {/* A saved list the fetch didn't return (deleted on
                      the provider, or beyond the page limit) still
                      shows so the organiser can see what is set. */}
                  {savedListId &&
                    !lists?.some((l) => l.id === savedListId) && (
                      <option value={savedListId}>
                        {settings.list_name || savedListId} (not found on{" "}
                        {providerLabel})
                      </option>
                    )}
                </select>
                <button
                  type="button"
                  onClick={onSaveList}
                  disabled={!listDirty || saveList.isPending}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-2.5 text-sm font-bold text-white transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveList.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            )}

            {savedListId ? (
              <p className="text-xs text-ink-500">
                New contacts are currently added to{" "}
                <strong className="text-ink-700">
                  {settings.list_name || savedListId}
                </strong>
                .
              </p>
            ) : (
              <p className="text-xs font-semibold text-amber-700">
                Choose a {listNoun} and save to start adding contacts.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnect.isPending}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disconnect.isPending ? "Disconnecting…" : `Disconnect ${providerLabel}`}
          </button>
        </>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-900">
              Choose a platform
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(Object.keys(MARKETING_PROVIDER_LABELS) as MarketingProvider[]).map(
                (p) => {
                  const active = formProvider === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setFormProvider(p);
                        setFormError(null);
                      }}
                      aria-pressed={active}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-gold-500 bg-gold-50 ring-2 ring-gold-500/20"
                          : "border-ink-200 bg-white hover:border-gold-300"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-bold text-ink-900">
                          {MARKETING_PROVIDER_LABELS[p]}
                        </span>
                        <span className="block text-xs text-ink-500">
                          {p === "brevo"
                            ? "Contacts & lists"
                            : "Audiences"}
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          active
                            ? "border-gold-500 bg-gold-500 text-white"
                            : "border-ink-300 bg-white"
                        }`}
                        aria-hidden
                      >
                        {active && <CheckIcon />}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="marketing-api-key"
              className="mb-2 block text-sm font-semibold text-ink-900"
            >
              {MARKETING_PROVIDER_LABELS[formProvider]} API key
            </label>
            <div className="flex items-stretch gap-2">
              <input
                id="marketing-api-key"
                type={showKey ? "text" : "password"}
                className={`${marketingInputCls} font-mono`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  formProvider === "brevo" ? "xkeysib-…" : "…-us21"
                }
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="shrink-0 rounded-lg border border-ink-200 bg-white px-3 text-xs font-semibold text-ink-600 transition hover:bg-ink-50"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink-500">
              Create one under{" "}
              <a
                href={help.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold-600 hover:underline"
              >
                {help.where}
              </a>
              . It is stored encrypted and only ever used to add contacts to
              the {help.listNoun} you pick.
            </p>
          </div>

          {formError && (
            <p className="text-sm font-semibold text-red-600" role="alert">
              {formError}
            </p>
          )}

          <button
            type="button"
            onClick={onConnect}
            disabled={connect.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-gold-500/20 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connect.isPending
              ? `Checking with ${MARKETING_PROVIDER_LABELS[formProvider]}…`
              : `Connect ${MARKETING_PROVIDER_LABELS[formProvider]}`}
          </button>
        </div>
      )}
    </Card>
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
