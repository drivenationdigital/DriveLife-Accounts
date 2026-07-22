import { notFound } from "next/navigation";
import { EmbedShell } from "@/components/embed/EmbedShell";
import CarClubApplyPage from "@/app/apply/car-club/[eventEid]/page";

/**
 * Dynamic embeddable application form.
 *
 *   /embed/[type]/[identifier]
 *
 * One route for every embeddable form. `type` is gated to an allowlist
 * (start: just "car-club"); anything else 404s. Each allowed type maps
 * to the form component that renders it, wrapped in EmbedShell (no
 * dashboard chrome + auto-resize).
 *
 * The wrapped apply pages expect their own param name (eventEid), so we
 * remap identifier → the shape each page wants. All forms are anonymous
 * and post to their public endpoints, so nothing depends on a session
 * inside the frame.
 *
 * Adding a type later = add it to EMBED_TYPES + a case in renderForm.
 * Framing is allowed on /embed/* via next.config headers.
 */

// Allowlisted embed types. Unknown types 404.
const EMBED_TYPES = ["car-club"] as const;
type EmbedType = (typeof EMBED_TYPES)[number];

function isEmbedType(value: string): value is EmbedType {
  return (EMBED_TYPES as readonly string[]).includes(value);
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ type: string; identifier: string }>;
}) {
  const { type, identifier } = await params;

  if (!isEmbedType(type)) {
    notFound();
  }

  return <EmbedShell>{renderForm(type, identifier)}</EmbedShell>;
}

/** Map an allowed embed type + identifier to its form component. */
function renderForm(type: EmbedType, identifier: string) {
  switch (type) {
    case "car-club":
      // The apply page wants params: Promise<{ eventEid }>.
      return (
        <CarClubApplyPage params={Promise.resolve({ eventEid: identifier })} />
      );
    default:
      // Exhaustiveness guard — a new EmbedType without a case fails here.
      return assertNever(type);
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled embed type: ${String(x)}`);
}
