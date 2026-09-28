/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useBusinessEdit } from "@/context/BusinessEditContext";
import { useToast } from "@/context/ToastContext";
import { useAction } from "@/context/ActionContext";
import {
  useTradersCancel,
  useTradersCheckout,
  useTradersPortal,
  useTradersResume,
  useTradersSync,
} from "@/lib/myBusinesses";
import { resolveRegion, formatRegionDate, DATE_STYLES } from "@/lib/regions";
import { PaymentMarks } from "@/components/ui/PaymentMarks";

/**
 * Step 5 - Event traders.
 *
 * Membership of the Event Traders directory is a Stripe subscription
 * (£20 / $20 a year, auto-renewing). "Join now" sends the browser to a
 * Stripe-hosted Checkout page; Stripe returns to this step with
 * `?traders=success&session_id=…`, which we hand to /business-traders-sync
 * so the membership is recorded straight away (webhooks and a daily
 * cron keep it current after that). Members can cancel renewal (the
 * listing stays until the paid period ends), resume it, or open Stripe's
 * billing portal for cards and invoices.
 *
 * When Stripe isn't configured for the region the panel falls back to
 * the "ask the team to get in touch" tick, which emails info@.
 */
export function EventTradersPanel() {
  const { business, set, setTraders, saveTradersRequest, tradersSaving } =
    useBusinessEdit();
  const toast = useToast();
  const runAction = useAction();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const checkout = useTradersCheckout();
  const sync = useTradersSync();
  const cancel = useTradersCancel();
  const resume = useTradersResume();
  const portal = useTradersPortal();

  const region = resolveRegion(business.site);
  const traders = business.traders;
  const sub = traders.subscription;
  const [redirecting, setRedirecting] = useState(false);

  // ── Return from Stripe Checkout ───────────────────────────────────
  const handledReturn = useRef<string | null>(null);
  const outcome = searchParams.get("traders");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!business.bid || !outcome) return;
    const key = `${outcome}:${sessionId ?? ""}`;
    if (handledReturn.current === key) return;
    handledReturn.current = key;

    const clean = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("traders");
      params.delete("session_id");
      params.set("step", "traders");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    if (outcome === "success") {
      sync
        .mutateAsync({
          bid: business.bid,
          site: business.site,
          sessionId: sessionId ?? undefined,
        })
        .then((res) => {
          setTraders(res.tradersDirectory);
          if (res.tradersDirectory.member) {
            toast.success("You're in! Your business is now listed in the Event Traders directory.");
          } else {
            toast.info("Payment received - your membership will show here once Stripe confirms it.");
          }
        })
        .catch((err: unknown) => {
          toast.error(
            err instanceof Error
              ? err.message
              : "We couldn't confirm your membership yet. It will update automatically.",
          );
        })
        .finally(clean);
    } else if (outcome === "cancelled") {
      toast.info("Checkout cancelled - you haven't been charged.");
      clean();
    } else {
      clean();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.bid, outcome, sessionId]);

  // ── Actions ───────────────────────────────────────────────────────
  const onJoin = async () => {
    setRedirecting(true);
    try {
      const res = await checkout.mutateAsync({ bid: business.bid, site: business.site });
      window.location.assign(res.url);
    } catch (err) {
      setRedirecting(false);
      toast.error(err instanceof Error ? err.message : "Couldn't start the checkout.");
    }
  };

  const onCancel = async () => {
    const res = await runAction({
      confirm: {
        title: "Cancel your renewal?",
        message: sub?.current_period_end
          ? `Your listing stays live until ${fmt(sub.current_period_end, region)} and won't renew after that. You can resume renewal any time before then.`
          : "Your listing stays live until the end of the period you've paid for and won't renew after that.",
        confirmLabel: "Cancel renewal",
        cancelLabel: "Keep membership",
        danger: true,
      },
      loadingLabel: "Cancelling renewal...",
      successTitle: "Renewal cancelled",
      successMessage: "Your listing stays live until the end of the paid period.",
      errorTitle: "Couldn't cancel the renewal",
      run: () => cancel.mutateAsync({ bid: business.bid, site: business.site }),
    });
    if (res) setTraders(res.tradersDirectory);
  };

  const onResume = async () => {
    try {
      const res = await resume.mutateAsync({ bid: business.bid, site: business.site });
      setTraders(res.tradersDirectory);
      toast.success("Renewal resumed - your membership will renew automatically.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't resume the renewal.");
    }
  };

  const onPortal = async () => {
    try {
      const res = await portal.mutateAsync({ bid: business.bid, site: business.site });
      window.location.assign(res.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open billing.");
    }
  };

  const onRequestToggle = async (checked: boolean) => {
    const previous = traders.requested;
    set("traders", { ...traders, requested: checked });
    try {
      await saveTradersRequest(checked);
      toast.success(
        checked
          ? "Thanks - the CarEvents.com team will be in touch shortly."
          : "Request withdrawn.",
      );
    } catch (err) {
      set("traders", { ...traders, requested: previous });
      toast.error(err instanceof Error ? err.message : "Couldn't save your request.");
    }
  };

  const busy = sync.isPending || cancel.isPending || resume.isPending || portal.isPending;
  const periodEnd = sub?.current_period_end ? fmt(sub.current_period_end, region) : "";
  const expires = traders.expires ? fmt(traders.expires, region) : "";
  const isActiveSub = Boolean(sub && ["active", "trialing", "past_due"].includes(sub.status));

  return (
    <div className="mb-8">
      {/* Pitch */}
      <div className="bg-white border border-ink-200 rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-store text-gold-600" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-ink-900">
                Join the Event Traders directory
              </h3>
              <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gold-700">
                {traders.price_label}
              </span>
            </div>
            <p className="text-sm text-ink-600 mt-2">
              <strong className="text-ink-900">Does your business trade at events?</strong>{" "}
              Join our Event Traders directory to be discovered by more event
              organisers around the country. Organisers search the directory
              when they're planning their next event - to find food, drink,
              retail and service exhibitors - so a listing puts your business
              in front of the people booking the pitches, and helps generate
              more business for you.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              <Point>Searchable by every event organiser on CarEvents.com</Point>
              <Point>Listed under your categories with your profile, photos and contact details</Point>
              <Point>Organisers contact you directly about trading at their events</Point>
              <Point>
                One flat fee of {traders.amount_label} a year, renewed automatically - cancel any time
              </Point>
            </ul>
          </div>
        </div>

        {/* Syncing after Stripe */}
        {sync.isPending && (
          <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-700 flex items-center gap-2" role="status">
            <i className="fa-solid fa-spinner fa-spin text-gold-600" aria-hidden />
            Confirming your membership with Stripe…
          </div>
        )}

        {/* Member with a subscription */}
        {!sync.isPending && isActiveSub && sub && (
          <div
            className={`mt-5 rounded-xl border px-4 py-4 text-sm ${
              sub.status === "past_due"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : sub.cancel_at_period_end
                  ? "border-ink-200 bg-ink-50 text-ink-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
            role="status"
          >
            {sub.status === "past_due" ? (
              <>
                <p className="font-semibold">
                  <i className="fa-solid fa-triangle-exclamation mr-1.5" aria-hidden />
                  We couldn't take your renewal payment
                </p>
                <p className="mt-0.5 text-xs">
                  Stripe will retry over the next few days. Update your card to keep your listing live.
                </p>
              </>
            ) : sub.cancel_at_period_end ? (
              <>
                <p className="font-semibold">
                  <i className="fa-solid fa-circle-pause mr-1.5" aria-hidden />
                  Renewal cancelled - listed until {periodEnd || "the end of your paid period"}
                </p>
                <p className="mt-0.5 text-xs">
                  Your business drops out of the directory after that date. Changed your mind? Resume below.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">
                  <i className="fa-solid fa-circle-check mr-1.5" aria-hidden />
                  You're listed in the Event Traders directory
                </p>
                <p className="mt-0.5 text-xs">
                  {periodEnd
                    ? `Renews automatically on ${periodEnd} for ${sub.amount_label}. We'll email you a week before.`
                    : `Renews automatically each year for ${sub.amount_label}.`}
                </p>
              </>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {sub.cancel_at_period_end ? (
                <button
                  type="button"
                  onClick={() => void onResume()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gold-600 disabled:opacity-50"
                >
                  <i className="fa-solid fa-rotate-right" aria-hidden /> Resume renewal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void onCancel()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                >
                  Cancel renewal
                </button>
              )}
              {traders.portal_available && (
                <button
                  type="button"
                  onClick={() => void onPortal()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
                >
                  <i className="fa-regular fa-credit-card" aria-hidden />
                  {sub.status === "past_due" ? "Update payment method" : "Manage billing & invoices"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Listed by the team, no subscription */}
        {!sync.isPending && !isActiveSub && traders.member && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
            <p className="font-semibold">
              <i className="fa-solid fa-circle-check mr-1.5" aria-hidden />
              You're listed in the Event Traders directory
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              {expires ? `Your listing runs until ${expires}.` : "Your listing is active."}{" "}
              Keep your profile, categories and contact details up to date so organisers can find you.
            </p>
          </div>
        )}

        {/* Not a member: join (Stripe) or request (fallback) */}
        {!sync.isPending && !isActiveSub && !traders.member && traders.stripe_enabled && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => void onJoin()}
              disabled={redirecting || checkout.isPending || !business.bid}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i
                className={`text-xs ${redirecting || checkout.isPending ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-lock"}`}
                aria-hidden
              />
              {redirecting || checkout.isPending
                ? "Taking you to Stripe…"
                : `Join now - ${traders.amount_label} a year`}
            </button>
            <p className="mt-2 text-xs text-ink-500">
              Secure card payment by Stripe. Renews automatically every year;
              we'll email you a week before each renewal and you can cancel
              from this page at any time.
            </p>
            <PaymentMarks size="sm" className="mt-3" />
            {sub && sub.status === "canceled" && sub.ended_at && (
              <p className="mt-2 text-xs text-ink-500">
                Your previous membership ended on {fmt(sub.ended_at, region)}. Rejoining starts a new annual membership.
              </p>
            )}
          </div>
        )}

        {!sync.isPending && !isActiveSub && !traders.member && !traders.stripe_enabled && (
          <>
            <label className="mt-5 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-gold-600 focus:ring-gold-500"
                checked={traders.requested}
                disabled={tradersSaving || !business.bid}
                onChange={(e) => void onRequestToggle(e.target.checked)}
              />
              <span className="text-sm text-ink-800">
                Yes - I'd like to join the Event Traders directory ({traders.price_label})
              </span>
            </label>
            {traders.requested && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                <p className="font-semibold">
                  Thanks! The CarEvents.com team will be in touch to arrange your membership.
                </p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  {traders.requested_at
                    ? `Requested on ${fmt(traders.requested_at, region)}. `
                    : ""}
                  Your business appears in the organisers' directory once your membership is confirmed.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-ink-500">
        Not a trader? No problem - skip this step. Your business still appears
        in the public Businesses directory on CarEvents.com once it's published.
      </p>
    </div>
  );
}

function fmt(value: string, region: ReturnType<typeof resolveRegion>): string {
  // API dates are "YYYY-MM-DD HH:MM:SS" (UTC) or "YYYY-MM-DD".
  const iso = value.includes(" ") ? value.replace(" ", "T") + "Z" : value;
  return formatRegionDate(iso, region, DATE_STYLES.full) || value;
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[9px] font-bold text-white">
        <i className="fa-solid fa-check" aria-hidden />
      </span>
      <span>{children}</span>
    </li>
  );
}
