"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useEventCreate } from "@/context/EventCreateContext";
import type { OrganiserEventsResponse } from "@/lib/apiTypes";
import { lockBodyScroll } from "@/lib/bodyScrollLock";
import { usePaymentProviders } from "@/lib/paymentProviders";
import { useOrganiserEvents } from "@/lib/queries";
import { useEventRegion } from "@/lib/useEventSteps";

/**
 * One-off nudge shown in the event editor: "you're setting up your
 * first event and nothing is connected to take payments - link a
 * Stripe, Square or Mollie account and you can sell tickets here."
 *
 * Shown when ALL of these hold:
 *   - the event's region has ticketing at all (a listing-only region
 *     has nothing to sell);
 *   - the organiser has no payment provider connected - neither Stripe
 *     Connect nor Square, Mollie or PayPal;
 *   - this is their first event: the account owns no OTHER event, past
 *     or upcoming, in any status. The editor's own event already exists
 *     on the server by the time this renders (the create wizard makes
 *     the draft shell before navigating here) and is excluded by id -
 *     whether a dateless shell is counted by the list route or not
 *     therefore makes no difference;
 *   - they haven't dismissed it before. Dismissal is remembered per
 *     account in localStorage - either button counts, and it never
 *     comes back on this browser. Cleared site data means one more
 *     showing at most, which is fine for a nudge.
 *
 * Rendered as a dismissible dialog rather than a banner because it
 * should be seen once and then get out of the way - the editor has
 * enough chrome already.
 */

const STORAGE_PREFIX = "ce:sell-tickets-prompt:";

/** Whether this account dismissed the prompt on this browser before.
 *  False on the server and wherever storage is blocked (private mode,
 *  strict settings) - the worst case there is seeing it once more. */
function readDismissed(storageKey: string | null): boolean {
  if (!storageKey || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

/** How many events in a list page belong to someone other than the
 *  editor's own event. The current event can appear at most once, so
 *  the server total minus that one is exact whenever it's on the page,
 *  and still ≥ 1 (all that matters) whenever it isn't. */
function othersCount(
  res: OrganiserEventsResponse,
  currentEid: string | null,
): number {
  const currentOnPage =
    currentEid !== null &&
    res.events.some((e) => e.encrypted_id === currentEid);
  return Math.max(0, res.pagination.total - (currentOnPage ? 1 : 0));
}

export function SellTicketsPrompt() {
  const { user } = useAuth();
  const { state } = useEventCreate();
  const region = useEventRegion();
  const providers = usePaymentProviders();
  // Two tiny pages of the organiser's list - upcoming and past - are
  // enough to answer "is there any event here other than this one".
  // The dashboard summary was no use for this: it counts published,
  // upcoming events only, so a new draft is invisible to it and an
  // organiser with a history of past shows looks brand new.
  const upcoming = useOrganiserEvents({ per_page: 2, filter_eventdate: 1 });
  const past = useOrganiserEvents({ per_page: 2, filter_eventdate: 2 });

  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : null;

  // Read once per account rather than in an effect: the value is
  // needed on the very render that could open the dialog, and there is
  // no server-side answer to wait for (on the server this is simply
  // "not dismissed", which never opens anything because the queries
  // above only resolve in the browser).
  const storedDismissed = useMemo(() => readDismissed(storageKey), [storageKey]);
  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissed = storedDismissed || dismissedNow;

  const dismiss = useCallback(() => {
    setDismissedNow(true);
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Nothing to do - it just won't be remembered.
    }
  }, [storageKey]);

  const noProvider = providers.data
    ? !providers.data.stripe_connected &&
      !providers.data.providers.square.connected &&
      !providers.data.providers.mollie.connected &&
      !providers.data.providers.paypal.connected
    : false;

  const firstEvent =
    upcoming.data && past.data
      ? othersCount(upcoming.data, state.encryptedId) +
          othersCount(past.data, state.encryptedId) ===
        0
      : false;

  const open =
    !!storageKey && !dismissed && region.ticketing && noProvider && firstEvent;

  // Lock the page behind the dialog and close on Escape while it's up.
  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-ink-900/60 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sellTicketsTitle"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Dark hero, echoing the welcome flow - the gold glow marks
            this as a CarEvents moment rather than a system alert. */}
        <div
          className="relative px-7 pt-8 pb-7 text-center text-white"
          style={{
            background:
              "radial-gradient(circle 260px at top right, rgba(178,145,92,0.4) 0%, transparent 70%), #161513",
          }}
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-lg inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/30">
            <i className="fa-solid fa-ticket text-xl text-white" aria-hidden />
          </div>
          <h2
            id="sellTicketsTitle"
            className="font-display text-2xl leading-tight mb-2"
          >
            Sell tickets for your event?
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Sell them on the world&apos;s most popular car events platform.
            Just link your Stripe, Square or Mollie account and you&apos;re
            ready to take payments.
          </p>
        </div>

        <div className="px-7 py-6">
          <ul className="space-y-2.5 text-sm text-ink-700 mb-6">
            <li className="flex items-start gap-3">
              <i
                className="fa-solid fa-circle-check text-gold-500 mt-0.5"
                aria-hidden
              />
              <span>Payments go straight to your own account</span>
            </li>
            <li className="flex items-start gap-3">
              <i
                className="fa-solid fa-circle-check text-gold-500 mt-0.5"
                aria-hidden
              />
              <span>Card, Apple Pay and Google Pay at checkout</span>
            </li>
            <li className="flex items-start gap-3">
              <i
                className="fa-solid fa-circle-check text-gold-500 mt-0.5"
                aria-hidden
              />
              <span>Orders, attendees and check-in all in one place</span>
            </li>
          </ul>

          <Link
            href="/settings"
            onClick={dismiss}
            className="w-full py-3.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-xl transition shadow-sm"
          >
            <i className="fa-solid fa-link text-xs" aria-hidden />
            Connect a payment account
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="w-full mt-2 py-2.5 text-sm font-semibold text-ink-500 hover:text-ink-900 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
