"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useEventSteps } from "@/lib/useEventSteps";
import type { EventCreateStepKey } from "@/lib/eventCreateSteps";

import { PanelHeader } from "./PanelHeader";

/**
 * What a recurring event's editor shows in place of the ticketing and
 * application forms.
 *
 * A recurring event is published as one listing per date, so tickets,
 * show cars, car clubs and traders all belong to an individual date
 * rather than to the series. Configuring them once on the series would
 * imply every date is identical - same allocation, same application
 * window, same categories - which is exactly what an organiser running
 * a monthly meet doesn't want. So the series editor points them at the
 * per-date editors instead of collecting settings it can't honour.
 *
 * The forms are replaced rather than disabled: a disabled form reads as
 * "not yet", and here the answer is "not here".
 */

export type PerDateFeature = "tickets" | "showCars" | "carClubs" | "traders";

const FEATURE_COPY: Record<PerDateFeature, { title: string; noun: string }> = {
  tickets: {
    title: "Tickets are set up on each date",
    noun: "tickets",
  },
  showCars: {
    title: "Show car applications are set up on each date",
    noun: "show car applications",
  },
  carClubs: {
    title: "Car club applications are set up on each date",
    noun: "car club applications",
  },
  traders: {
    title: "Trader applications are set up on each date",
    noun: "trader applications",
  },
};

/**
 * The callout on its own.
 *
 * Used inline by the Tickets panel, which keeps its mode picker above
 * it - "sell through CarEvents" is still a decision about the series,
 * it's only the ticket list itself that lives per date.
 */
export function PerDateNotice({ feature }: { feature: PerDateFeature }) {
  const { title, noun } = FEATURE_COPY[feature];
  return (
    // Same gold callout the Dates panel uses to explain the recurring
    // schedule, so the two read as one explanation split across steps.
    <div className="flex items-start gap-3 p-4 bg-gold-50 border border-gold-200 rounded-xl mb-4">
      <i
        className="fa-solid fa-circle-info text-gold-600 mt-0.5"
        aria-hidden
      />
      <div className="text-sm">
        <p className="font-semibold text-gold-900">{title}</p>
        <p className="text-gold-800 mt-1">
          This event repeats, so every date is published as its own event
          listing. Once the series is published, open a date from the
          series&apos; Upcoming Events tab and set up its {noun} there - each
          date can have its own.
        </p>
      </div>
    </div>
  );
}

/**
 * A whole wizard step reduced to the notice.
 *
 * The three application steps have nothing left once their forms go, so
 * they hand the entire panel over rather than wrapping their bodies in
 * a conditional. Header and Back / Continue still render, so the step
 * stays a normal part of the wizard and the step numbering is
 * unaffected.
 */
export function PerDatePanel({
  step,
  title,
  subtitle,
  feature,
}: {
  step: EventCreateStepKey;
  title: string;
  subtitle: string;
  feature: PerDateFeature;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { stepCount, adjacent, stepNumber } = useEventSteps();
  const { prev, next } = adjacent(step);

  // Same navigation the panels do themselves - the step lives in the
  // URL so Back / Continue are just a search-param change.
  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="panel is-active" data-panel={step} role="tabpanel">
      <PanelHeader
        stepNumber={stepNumber(step)}
        totalSteps={stepCount}
        title={title}
        subtitle={subtitle}
      />

      <PerDateNotice feature={feature} />

      <div className="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button
          type="button"
          onClick={() => prev && goTo(prev)}
          className="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back
        </button>
        <button
          type="button"
          onClick={() => next && goTo(next)}
          className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      </div>
    </section>
  );
}
