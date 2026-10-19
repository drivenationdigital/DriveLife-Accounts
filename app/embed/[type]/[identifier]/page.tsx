import { notFound } from "next/navigation";
import { EmbedShell } from "@/components/embed/EmbedShell";
import CarClubApplyPage from "@/app/apply/car-club/[eventEid]/page";
import ShowCarApplyPage from "@/app/apply/show-car/[eventEid]/page";
import TraderApplyPage from "@/app/apply/trader/[eventEid]/page";
import GetTicketsPage from "@/app/get-tickets/[eventEid]/page";

/**
 * Dynamic embeddable application form.
 *
 *   /embed/[type]/[identifier]
 *
 * One route for every embeddable form. `type` is gated to an allowlist
 * ("car-club", "show-cars", "trader", "checkout"); anything else 404s.
 * A few aliases are folded onto their canonical type first (see
 * EMBED_TYPE_ALIASES). Each allowed type maps to the form component that
 * renders it, wrapped in EmbedShell (no dashboard chrome + auto-resize).
 *
 * The wrapped apply pages expect their own param name (eventEid), so we
 * remap identifier → the shape each page wants. All forms are anonymous
 * and post to their public endpoints, so nothing depends on a session
 * inside the frame.
 *
 * Adding a type later = add it to EMBED_TYPES + a case in renderForm.
 * "checkout" is the ticket checkout itself (Tickets step → Link or embed
 * checkout).
 * Framing is allowed on /embed/* via next.config headers.
 */

// Allowlisted embed types. Unknown types 404.
const EMBED_TYPES = ["car-club", "show-cars", "trader", "checkout"] as const;
type EmbedType = (typeof EMBED_TYPES)[number];

function isEmbedType(value: string): value is EmbedType {
  return (EMBED_TYPES as readonly string[]).includes(value);
}

// Alternative spellings accepted in the URL, folded onto a canonical type
// BEFORE the allow-list check. The organiser-facing snippet
// (components/event-create/ApplicationLinksCard.tsx) is built from the
// ApplyFormKind "show-car" (lib/applyFormUrl.ts), so that is what
// organisers have already pasted into their own sites - it has to keep
// working alongside the canonical "show-cars".
const EMBED_TYPE_ALIASES: Record<string, EmbedType> = {
  "show-car": "show-cars",
};

/** The canonical EmbedType for a URL segment, or null when it is not one. */
function resolveEmbedType(value: string): EmbedType | null {
  const canonical = EMBED_TYPE_ALIASES[value] ?? value;
  return isEmbedType(canonical) ? canonical : null;
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ type: string; identifier: string }>;
}) {
  const { type: rawType, identifier } = await params;

  const type = resolveEmbedType(rawType);
  if (!type) {
    notFound();
  }

  return <EmbedShell>{renderForm(type, identifier)}</EmbedShell>;
}

/** Map an allowed embed type + identifier to its form component. */
function renderForm(type: EmbedType, identifier: string) {
  // All apply pages expect params: Promise<{ eventEid }>.
  const params = Promise.resolve({ eventEid: identifier });
  switch (type) {
    case "car-club":
      return <CarClubApplyPage params={params} />;
    case "show-cars":
      return <ShowCarApplyPage params={params} />;
    case "trader":
      return <TraderApplyPage params={params} />;
    case "checkout":
      // The ticket checkout, framed on an organiser's own site. The
      // page notices it is framed (window.parent) where behaviour has
      // to differ - Mollie's hosted page opens in the top window.
      return <GetTicketsPage params={params} />;
    default:
      // Exhaustiveness guard - a new EmbedType without a case fails here.
      return assertNever(type);
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled embed type: ${String(x)}`);
}
