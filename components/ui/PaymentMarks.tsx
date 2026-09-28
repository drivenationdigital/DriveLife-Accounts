"use client";

/**
 * Payment trust marks shown next to the Event Traders "Join now" button
 * and on the /join/traders landing page: the card schemes and wallets
 * Stripe Checkout accepts, plus "Powered by Stripe".
 *
 * Official artwork lives in public/logos/payments/ (SVG, each brand's
 * published logo). Plain <img> tags, like MarketingLogos.tsx - the
 * middleware passes image paths through untouched.
 *
 * Distinct from components/ui/PaymentLogos.tsx, which holds the
 * provider marks (Stripe/Square/Mollie/PayPal) for the Settings page
 * and the checkout's CardBrandStrip.
 *
 * `variant="chips"` puts each mark on a white chip (40px tall), the
 * treatment the organiser landing page uses on its dark payment strip.
 */

const MARKS: Array<{ src: string; alt: string; width: number }> = [
  { src: "/logos/payments/visa.svg", alt: "Visa", width: 44 },
  { src: "/logos/payments/mastercard.svg", alt: "Mastercard", width: 36 },
  { src: "/logos/payments/applepay.svg", alt: "Apple Pay", width: 44 },
  { src: "/logos/payments/googlepay.svg", alt: "Google Pay", width: 48 },
];

export function PaymentMarks({
  className = "",
  size = "md",
  variant = "plain",
}: {
  className?: string;
  /** `sm` for under a button, `md` for a landing-page row. */
  size?: "sm" | "md";
  variant?: "plain" | "chips";
}) {
  if (variant === "chips") {
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-3 ${className}`}
        aria-label="Accepted payment methods"
      >
        {MARKS.map((m) => (
          <span
            key={m.alt}
            className="inline-flex h-10 min-w-[88px] items-center justify-center rounded-md bg-white px-4"
            title={m.alt}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.src} alt={m.alt} style={{ height: 20, width: "auto" }} loading="lazy" />
          </span>
        ))}
        <span className="mx-1.5 h-7 w-px bg-[#333]" aria-hidden />
        <span
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#555]"
          title="Stripe"
        >
          Powered by
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/payments/stripe.svg" alt="Stripe" style={{ height: 20, width: "auto" }} loading="lazy" />
        </span>
      </div>
    );
  }

  const h = size === "sm" ? 18 : 24;
  const scale = size === "sm" ? 0.78 : 1;
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}
      aria-label="Accepted payment methods"
    >
      {MARKS.map((m) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={m.alt}
          src={m.src}
          alt={m.alt}
          title={m.alt}
          height={h}
          style={{ height: h, width: "auto", maxWidth: m.width * scale + 12 }}
          className="inline-block"
          loading="lazy"
        />
      ))}
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        Powered by
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/payments/stripe.svg"
          alt="Stripe"
          title="Stripe"
          style={{ height: size === "sm" ? 16 : 20, width: "auto" }}
          className="inline-block"
          loading="lazy"
        />
      </span>
    </div>
  );
}
