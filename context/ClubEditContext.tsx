"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_CLUB,
  toClubUpdateBody,
  type ClubAdministrator,
  type ClubCategory,
  type ClubEditData,
  type ClubUpdateBody,
  type MembershipQuestion,
} from "@/lib/clubEditTypes";

/**
 * Club edit state.
 *
 * Holds the whole club record for the wizard so every step edits one
 * source of truth and nothing is lost when moving between steps. Built
 * API-first: `hydrate()` takes exactly what the load endpoint returns,
 * and `buildPayload()` emits exactly what the save endpoint expects -
 * so wiring later is swapping the stubs in the page for real calls.
 *
 * Dirty tracking compares against the last hydrated snapshot, so the
 * UI can warn on unsaved changes and skip no-op saves.
 */

interface ClubEditContextValue {
  club: ClubEditData;
  categories: ClubCategory[];
  isDirty: boolean;

  /** Replace state from a load response (also resets the dirty baseline). */
  hydrate: (club: ClubEditData, categories: ClubCategory[]) => void;
  /** Shallow-merge a partial update. */
  patch: (partial: Partial<ClubEditData>) => void;
  /** Update a single field (type-safe on key/value). */
  setField: <K extends keyof ClubEditData>(
    key: K,
    value: ClubEditData[K],
  ) => void;

  // Collection helpers - the fiddly bits the panels shouldn't re-implement.
  toggleCategory: (id: number) => void;
  setAllCategories: (selected: boolean) => void;
  addQuestion: () => void;
  updateQuestion: (key: string, question: string) => void;
  removeQuestion: (key: string) => void;
  addAdministrator: (admin: ClubAdministrator) => void;
  removeAdministrator: (id: number) => void;

  /** Mark the current state as saved (post-save baseline reset). */
  markSaved: () => void;
  /** Payload for the save endpoint. */
  buildPayload: () => ClubUpdateBody;
}

const ClubEditContext = createContext<ClubEditContextValue | null>(null);

export function ClubEditProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: ClubEditData;
}) {
  const [club, setClub] = useState<ClubEditData>(initial ?? EMPTY_CLUB);
  const [categories, setCategories] = useState<ClubCategory[]>([]);
  // Baseline for dirty comparison - the last hydrated/saved snapshot.
  const [baseline, setBaseline] = useState<string>(
    JSON.stringify(initial ?? EMPTY_CLUB),
  );

  const hydrate = useCallback(
    (next: ClubEditData, nextCategories: ClubCategory[]) => {
      setClub(next);
      setCategories(nextCategories);
      setBaseline(JSON.stringify(next));
    },
    [],
  );

  const patch = useCallback((partial: Partial<ClubEditData>) => {
    setClub((c) => ({ ...c, ...partial }));
  }, []);

  const setField = useCallback(
    <K extends keyof ClubEditData>(key: K, value: ClubEditData[K]) => {
      setClub((c) => ({ ...c, [key]: value }));
    },
    [],
  );

  const toggleCategory = useCallback((id: number) => {
    setClub((c) => ({
      ...c,
      categoryIds: c.categoryIds.includes(id)
        ? c.categoryIds.filter((x) => x !== id)
        : [...c.categoryIds, id],
    }));
  }, []);

  const setAllCategories = useCallback(
    (selected: boolean) => {
      setClub((c) => ({
        ...c,
        categoryIds: selected ? categories.map((cat) => cat.id) : [],
      }));
    },
    [categories],
  );

  const addQuestion = useCallback(() => {
    setClub((c) => ({
      ...c,
      membershipQuestions: [
        ...c.membershipQuestions,
        { key: newKey(), question: "" },
      ],
    }));
  }, []);

  const updateQuestion = useCallback((key: string, question: string) => {
    setClub((c) => ({
      ...c,
      membershipQuestions: c.membershipQuestions.map((q) =>
        q.key === key ? { ...q, question } : q,
      ),
    }));
  }, []);

  const removeQuestion = useCallback((key: string) => {
    setClub((c) => ({
      ...c,
      membershipQuestions: c.membershipQuestions.filter((q) => q.key !== key),
    }));
  }, []);

  const addAdministrator = useCallback((admin: ClubAdministrator) => {
    setClub((c) =>
      c.administrators.some((a) => a.id === admin.id)
        ? c // already an admin - no duplicates
        : { ...c, administrators: [...c.administrators, admin] },
    );
  }, []);

  const removeAdministrator = useCallback((id: number) => {
    setClub((c) => ({
      ...c,
      administrators: c.administrators.filter((a) => a.id !== id),
    }));
  }, []);

  const markSaved = useCallback(() => {
    setBaseline(JSON.stringify(club));
  }, [club]);

  const buildPayload = useCallback(() => toClubUpdateBody(club), [club]);

  const isDirty = useMemo(
    () => JSON.stringify(club) !== baseline,
    [club, baseline],
  );

  const value = useMemo<ClubEditContextValue>(
    () => ({
      club,
      categories,
      isDirty,
      hydrate,
      patch,
      setField,
      toggleCategory,
      setAllCategories,
      addQuestion,
      updateQuestion,
      removeQuestion,
      addAdministrator,
      removeAdministrator,
      markSaved,
      buildPayload,
    }),
    [
      club,
      categories,
      isDirty,
      hydrate,
      patch,
      setField,
      toggleCategory,
      setAllCategories,
      addQuestion,
      updateQuestion,
      removeQuestion,
      addAdministrator,
      removeAdministrator,
      markSaved,
      buildPayload,
    ],
  );

  return (
    <ClubEditContext.Provider value={value}>
      {children}
    </ClubEditContext.Provider>
  );
}

export function useClubEdit(): ClubEditContextValue {
  const ctx = useContext(ClubEditContext);
  if (!ctx) {
    throw new Error("useClubEdit must be used inside <ClubEditProvider>");
  }
  return ctx;
}

/** Stable-enough row key for repeater rows. */
function newKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
