"use client";

import { useMemo } from "react";
import { useEventCreate } from "@/context/EventCreateContext";
import { resolveRegion, type Region } from "./regions";
import {
  adjacentSteps,
  visibleSteps,
  type EventCreateStep,
  type EventCreateStepKey,
} from "./eventCreateSteps";

/**
 * The editor's step list for the event being edited.
 *
 * Which steps exist depends on the event's region: a listing-only
 * region has no ticketing, so Tickets, Discounts, Show cars, Car clubs
 * and Traders aren't part of its wizard at all. Every piece of chrome
 * (sidebar, tab bar, bottom bar) and every panel footer reads the list
 * through here, so they can't disagree about how many steps there are
 * or which one comes next.
 *
 * Region comes off the create/edit state, which is populated from the
 * `?site=` param the editor was opened with.
 */
export function useEventSteps(): {
  region: Region;
  steps: EventCreateStep[];
  stepCount: number;
  adjacent: (key: EventCreateStepKey) => {
    prev: EventCreateStepKey | null;
    next: EventCreateStepKey | null;
  };
  stepNumber: (key: EventCreateStepKey) => number;
} {
  const { state } = useEventCreate();
  const region = resolveRegion(state.site);

  const steps = useMemo(
    () => visibleSteps(region.ticketing),
    [region.ticketing],
  );

  return {
    region,
    steps,
    stepCount: steps.length,
    adjacent: (key) => adjacentSteps(key, steps),
    // Derived, never hardcoded in the panels: hiding the five ticketing
    // steps renumbers everything after them, so "Step 5 of 5" has to
    // mean Publish on a listing-only region where it means Tickets on a
    // ticketed one.
    stepNumber: (key) => {
      const idx = steps.findIndex((s) => s.key === key);
      return idx >= 0 ? idx + 1 : 1;
    },
  };
}

/**
 * Just the region for the event being edited.
 *
 * The date pickers and drawers sit several levels below the panels and
 * only need the locale, so they read it directly rather than being
 * passed a prop through every intermediate component.
 */
export function useEventRegion(): Region {
  const { state } = useEventCreate();
  return resolveRegion(state.site);
}
