"use client";

import { useCallback, useEffect, useRef } from "react";

import { useEventCreate } from "@/context/EventCreateContext";
import type { LatLng } from "@/context/EventCreateContext";
import {
  constrainToRegion,
  defaultTimezoneForRegion,
  isTimezoneValidForRegion,
  resolveTimezoneFromCoords,
} from "./timezones";
import { useEventRegion } from "./useEventSteps";

/**
 * Keeps the event's timezone in step with its region and address.
 *
 * The two inputs do different jobs. The region decides which zones are
 * even offerable and supplies a placeholder; the address decides which
 * one is actually right. A UK event is settled by the region alone. A
 * US one isn't - the country spans six zones, so the address is the
 * only thing that can finish the job.
 *
 * Both paths respect `timezoneIsAuto`: once the organiser has picked a
 * zone by hand, nothing here overwrites it.
 *
 * Returns `applyFromCoords`, which BasicsPanel calls when a place is
 * picked. Kept as an explicit call rather than an effect watching
 * `locationCoords` so the lookup fires on the user's action and not on
 * hydration, remount, or any other incidental way coords can appear.
 */
export function useAutoTimezone(): {
  applyFromCoords: (coords: LatLng) => void;
} {
  const { state, dispatch } = useEventCreate();
  const region = useEventRegion();

  const timezone = state.timezone;
  const isAuto = state.timezoneIsAuto;

  // Cancels an in-flight lookup when a newer address is picked, so a
  // slow first response can't land after a faster second one.
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  // The async callback below needs the state as it is when the lookup
  // RESOLVES, not as it was on the render that started it - the
  // organiser can open the Dates step and set a zone by hand while the
  // request is still in flight. Synced in an effect rather than during
  // render; it only has to be current by the time a network response
  // lands, which is many frames later.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ---- Region-level correction ----------------------------------
  // Runs when the region resolves (and on a fresh create, where the
  // initial state's Europe/London placeholder predates knowing it).
  // Only ever moves a still-automatic zone, and only when the current
  // one isn't offerable for the region - so it fixes a US event sitting
  // on Europe/London without disturbing a US event already on Central.
  useEffect(() => {
    if (!isAuto) return;
    if (isTimezoneValidForRegion(timezone, region)) return;
    const fallback = defaultTimezoneForRegion(region);
    if (fallback === timezone) return;
    dispatch({ type: "SET_FIELD", key: "timezone", value: fallback });
  }, [dispatch, isAuto, region, timezone]);

  const applyFromCoords = useCallback(
    (coords: LatLng) => {
      // A manual choice is final - don't even spend the API call.
      if (!isAuto) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      void resolveTimezoneFromCoords(region, coords, controller.signal).then(
        (result) => {
          if (controller.signal.aborted) return;
          // Re-check against current state, not the captured render.
          const { timezoneIsAuto, timezone: current } = stateRef.current;
          if (!timezoneIsAuto) return;
          const next = constrainToRegion(result.zone, region);
          if (next === current) return;
          dispatch({ type: "SET_FIELD", key: "timezone", value: next });
        },
      );
    },
    [dispatch, isAuto, region],
  );

  return { applyFromCoords };
}
