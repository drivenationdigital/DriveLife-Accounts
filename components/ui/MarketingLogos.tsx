/**
 * Email marketing provider logos - the official Brevo wordmark and the
 * Mailchimp Freddie + wordmark, supplied by Mark on 2026-09-26.
 *
 * Served as transparent PNGs from public/logos (the middleware lets
 * image paths through untouched, and the CarEvents logos are plain
 * <img> tags the same way). Both are trimmed to their artwork so a
 * shared height lines them up; the intrinsic width/height attributes
 * keep the layout from jumping while they load.
 */

const LOGOS = {
  brevo: { src: "/logos/brevo.png", alt: "Brevo", width: 900, height: 266 },
  mailchimp: {
    src: "/logos/mailchimp.png",
    alt: "Mailchimp",
    width: 900,
    height: 242,
  },
} as const;

function ProviderImg({
  provider,
  className,
}: {
  provider: keyof typeof LOGOS;
  className?: string;
}) {
  const logo = LOGOS[provider];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      className={className}
      decoding="async"
      draggable={false}
    />
  );
}

export function BrevoLogo({ className }: { className?: string }) {
  return <ProviderImg provider="brevo" className={className} />;
}

export function MailchimpLogo({ className }: { className?: string }) {
  return <ProviderImg provider="mailchimp" className={className} />;
}

/** The logo for whichever provider is connected. */
export function MarketingProviderLogo({
  provider,
  className,
}: {
  provider: "brevo" | "mailchimp" | null | undefined;
  className?: string;
}) {
  if (provider === "brevo") return <BrevoLogo className={className} />;
  if (provider === "mailchimp") return <MailchimpLogo className={className} />;
  return null;
}

/** Both logos side by side - for "works with Brevo or Mailchimp" copy. */
export function MarketingProviderLogos({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${className ?? ""}`}
    >
      <BrevoLogo className="h-6 w-auto" />
      <MailchimpLogo className="h-6 w-auto" />
    </div>
  );
}
