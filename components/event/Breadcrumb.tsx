import Link from "next/link";
import { ChevLeftIcon } from "@/components/ui/Icons";

/**
 * Hidden inside the app's web container — the app's own header already has a
 * back button, and two of them pointing different ways is worse than one.
 *
 * Done in CSS off the layout's `data-app-container`, not with a JS check
 * here: this renders inside a client component, so testing a cookie would
 * paint the breadcrumb and then remove it. The layout knows server-side, so
 * the markup is right on the first paint.
 */
export function Breadcrumb() {
  return (
    <div className="breadcrumb">
      <Link href="/events">
        <ChevLeftIcon /> Back to Events
      </Link>
    </div>
  );
}
