"use client";

import { useEffect, useState } from "react";

/**
 * Countdown banner shown while a checkout holds reserved stock.
 *
 * Mirrors the classic checkout's 60-minute limit: when it hits zero
 * the parent clears the cart and shows the timeout screen. Rendering
 * is purely presentational - the deadline lives with the parent so it
 * survives step changes.
 */
export function CheckoutTimer({
  deadline,
  onExpire,
  onBack,
}: {
  deadline: number;
  onExpire: () => void;
  onBack: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.floor((deadline - now) / 1000));

  // Fire the expiry exactly once, from an effect rather than render.
  useEffect(() => {
    if (deadline - now <= 0) onExpire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining === 0]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const urgent = remaining < 300;

  return (
    <div className="sticky top-3 z-40 mb-5">
      <div className="flex items-center justify-between gap-3 bg-white/90 backdrop-blur rounded-xl shadow-sm ring-1 ring-ink-100 px-4 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-ink-600 hover:text-ink-900 transition inline-flex items-center gap-1.5"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <p className="text-sm text-ink-600">
          Tickets reserved for{" "}
          <span
            className={`font-bold tabular-nums ${urgent ? "text-red-600" : "text-ink-900"}`}
          >
            {mm}:{ss}
          </span>
        </p>
      </div>
    </div>
  );
}
