"use client";

import { useState } from "react";
import Link from "next/link";

import { useAccount, useDisconnectStripe } from "@/lib/account";
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
        <StripeCard />
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
                Ticket payments for your events are paid out to your
                connected Stripe account.
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
