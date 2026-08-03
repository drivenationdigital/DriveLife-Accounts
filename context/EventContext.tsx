"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { EventData } from "./types";
import { mockEventData } from "@/data/mockEvent";

interface EventContextValue {
  data: EventData;
  setData: React.Dispatch<React.SetStateAction<EventData>>;
}

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: EventData;
}) {
  // When `initialData` is provided (e.g. from the event detail page that
  // fetches via TanStack), treat it as the source of truth - re-renders of
  // the parent will flow through. Otherwise fall back to internal state
  // seeded with the mock fixture for routes that haven't been wired up yet.
  const [fallback, setFallback] = useState<EventData>(mockEventData);

  const data = initialData ?? fallback;
  const setData = initialData ? (setFallback /* no-op for controlled mode */) : setFallback;

  const value = useMemo(() => ({ data, setData }), [data, setData]);
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvent(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent must be used within <EventProvider>");
  return ctx;
}

// Convenience hooks so components don't need to destructure data.* everywhere.
export const useEventData = () => useEvent().data;
