"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useClubEdit } from "./ClubEditContext";
import { useUpdateClub } from "@/lib/clubEdit";

/**
 * Shared save controller for the club editor chrome.
 *
 * Three controls all "save" - the topbar's Update Club button, the
 * mobile bottombar's last-step CTA, and the publish step's own button.
 * They share ONE mutation instance through this provider so the status
 * pill, spinners, and error message stay in sync no matter which control
 * fired. (Calling `useUpdateClub()` in each component would give each its
 * own independent mutation state, which is exactly the thing that makes a
 * "Saving…" pill sit next to an idle button.)
 */
export type ClubSavePhase = "idle" | "saving" | "saved" | "error";

interface ClubSaveContextValue {
  /** Persist the current record. Never throws - read `error` instead. */
  save: () => Promise<void>;
  phase: ClubSavePhase;
  isSaving: boolean;
  error: string | null;
}

const ClubSaveContext = createContext<ClubSaveContextValue | null>(null);

export function ClubSaveProvider({ children }: { children: ReactNode }) {
  const { buildPayload, markSaved } = useClubEdit();
  const mutation = useUpdateClub();
  const [justSaved, setJustSaved] = useState(false);

  // The "Saved ✓" flash is on a timer; clear it if the user navigates
  // away mid-flash so we don't setState on an unmounted provider.
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const { mutateAsync } = mutation;

  const save = useCallback(async () => {
    setJustSaved(false);
    try {
      await mutateAsync(buildPayload());
      markSaved();
      setJustSaved(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setJustSaved(false), 2500);
    } catch {
      // Surfaced through `error` / `phase` on the status pill.
    }
  }, [mutateAsync, buildPayload, markSaved]);

  // `justSaved` (not mutation.isSuccess) drives the saved state, so the
  // pill flashes "Saved" and settles back to idle rather than claiming
  // "Saved" forever after one successful write.
  const phase: ClubSavePhase = mutation.isPending
    ? "saving"
    : mutation.isError
      ? "error"
      : justSaved
        ? "saved"
        : "idle";

  const value = useMemo<ClubSaveContextValue>(
    () => ({
      save,
      phase,
      isSaving: mutation.isPending,
      error: mutation.error?.message ?? null,
    }),
    [save, phase, mutation.isPending, mutation.error],
  );

  return (
    <ClubSaveContext.Provider value={value}>
      {children}
    </ClubSaveContext.Provider>
  );
}

export function useClubSave(): ClubSaveContextValue {
  const ctx = useContext(ClubSaveContext);
  if (!ctx) {
    throw new Error("useClubSave must be used inside <ClubSaveProvider>");
  }
  return ctx;
}
