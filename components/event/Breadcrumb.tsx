"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ChevLeftIcon } from "@/components/ui/Icons";

/**
 * Back link at the top of an event view.
 *
 * Normally "Back to Events" (the full list). An occurrence opened from
 * its series' Upcoming / Past table arrives with `?parent=<ref>&ptab=`
 * (see OccurrenceTable), and then the link goes back to that series
 * with the same tab open - the full list was the wrong place to land
 * after managing one date of a recurring event.
 *
 * Hidden inside the app's web container — the app's own header already has a
 * back button, and two of them pointing different ways is worse than one.
 * Done in CSS off the layout's `data-app-container`, not with a JS check
 * here: this renders inside a client component, so testing a cookie would
 * paint the breadcrumb and then remove it. The layout knows server-side, so
 * the markup is right on the first paint. Both variants below keep the
 * same `.breadcrumb` wrapper so that rule covers them.
 *
 * `useSearchParams` needs a Suspense boundary of its own because this
 * also renders inside the page's loading fallback.
 */
export function Breadcrumb() {
  return (
    <Suspense fallback={<BackToEvents />}>
      <BreadcrumbInner />
    </Suspense>
  );
}

function BreadcrumbInner() {
  const searchParams = useSearchParams();
  const parent = (searchParams?.get("parent") ?? "").trim();
  const ptab = searchParams?.get("ptab") === "past" ? "past" : "upcoming";

  // A ref is a region prefix plus a base64 id. Anything else is not a
  // link this component minted, so fall back rather than build a path
  // out of it.
  if (parent && /^[A-Za-z0-9+/=]+$/.test(parent)) {
    return (
      <div className="breadcrumb">
        <Link href={`/events/${encodeURIComponent(parent)}?tab=${ptab}`}>
          <ChevLeftIcon /> Back to Series
        </Link>
      </div>
    );
  }
  return <BackToEvents />;
}

function BackToEvents() {
  return (
    <div className="breadcrumb">
      <Link href="/events">
        <ChevLeftIcon /> Back to Events
      </Link>
    </div>
  );
}
