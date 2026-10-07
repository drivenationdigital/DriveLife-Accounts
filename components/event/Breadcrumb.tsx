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
