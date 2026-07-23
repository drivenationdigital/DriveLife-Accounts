/* eslint-disable react/no-unescaped-entities */
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ClubEditProvider, useClubEdit } from "@/context/ClubEditContext";
import { BasicDetailsPanel } from "@/components/club-edit/panels/BasicDetailsPanel";
import { ClubProfilePanel } from "@/components/club-edit/panels/ClubProfilePanel";
import { ClubDescriptionPanel } from "@/components/club-edit/panels/ClubDescriptionPanel";
import { MembershipQuestionsPanel } from "@/components/club-edit/panels/MembershipQuestionsPanel";
import { ClubTermsPanel } from "@/components/club-edit/panels/ClubTermsPanel";
import { ClubAdministratorsPanel } from "@/components/club-edit/panels/ClubAdministratorsPanel";
import { PublishPanel } from "@/components/club-edit/panels/PublishPanel";
import { defaultClubTerms } from "@/lib/clubEditTypes";
import { useClubEditQuery, useUpdateClub } from "@/lib/clubEdit";

/**
 * Edit Club — multi-step wizard.
 *
 * State lives in ClubEditContext so every step edits one record and
 * nothing is lost moving between steps. Built API-first: swap the
 * hydrate stub below for the load endpoint, and the save handler for
 * the update endpoint — the payload builder is already in place.
 */

const STEPS = [
  { key: "basic", label: "Basic Details", title: "Basic Details" },
  { key: "profile", label: "Club Profile", title: "Your club profile" },
  {
    key: "description",
    label: "Club Description",
    title: "Describe your club",
  },
  {
    key: "questions",
    label: "Membership Questions",
    title: "Membership questions",
  },
  { key: "terms", label: "Club Terms", title: "Club terms" },
  { key: "admins", label: "Club Administrators", title: "Club administrators" },
  { key: "publish", label: "Publish", title: "Save and Publish" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export default function EditClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = use(params);
  return (
    <ClubEditProvider>
      <EditClubWizard clubId={clubId} />
    </ClubEditProvider>
  );
}

function EditClubWizard({ clubId }: { clubId: string }) {
  const { club, isDirty, hydrate, buildPayload, markSaved } = useClubEdit();
  const [step, setStep] = useState<StepKey>("basic");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // ── Load ────────────────────────────────────────────────────────
  const { data, isLoading, error } = useClubEditQuery(clubId);
  const updateClub = useUpdateClub();

  useEffect(() => {
    if (!data) return;
    // Clubs with no terms yet start from the default, personalised with
    // the club name. Applied before hydrate so it's part of the dirty
    // baseline — opening the page doesn't show "Unsaved changes".
    hydrate(
      {
        ...data.club,
        terms: data.club.terms.trim() || defaultClubTerms(data.club.title),
      },
      data.options.categories,
    );
  }, [data, hydrate]);

  const saving = updateClub.isPending;
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const current = STEPS[stepIndex];

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.key);
  };
  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.key);
  };

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError(null);
    try {
      await updateClub.mutateAsync(buildPayload());
      markSaved();
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Couldn't save your changes.",
      );
    }
  };

  // Load / error states — don't render an empty wizard over no data.
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-ink-100">
            <p className="text-sm text-ink-500">Loading club…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-ink-100">
            <p className="text-sm font-semibold text-red-500">
              Couldn't load this club.
            </p>
            <p className="mt-1 text-sm text-ink-500">{error.message}</p>
            <Link
              href="/clubs"
              className="mt-6 inline-block rounded-xl bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
            >
              Back to clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 md:px-6">
        {/* Step nav */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="mb-6">
            <Link
              href="/clubs"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400 transition hover:text-gold-600"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to clubs
            </Link>
            <h2 className="mt-2 text-lg font-extrabold text-ink-900">
              Edit Club
            </h2>
            {isDirty && (
              <p className="mt-1 text-[11px] font-semibold text-gold-600">
                Unsaved changes
              </p>
            )}
          </div>

          <nav className="space-y-1.5">
            {STEPS.map((s, i) => {
              const active = s.key === step;
              const done = i < stepIndex;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStep(s.key)}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition",
                    active
                      ? "bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-sm shadow-gold-500/25"
                      : "text-ink-500 hover:bg-white hover:text-ink-800 hover:shadow-sm",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition",
                      active
                        ? "bg-white/25 text-white"
                        : done
                          ? "bg-gold-100 text-gold-700"
                          : "bg-ink-100 text-ink-400",
                    ].join(" ")}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Update Club"}
          </button>
          {justSaved && (
            <p className="mt-2 text-center text-xs font-semibold text-green-600">
              Saved ✓
            </p>
          )}
          {saveError && (
            <p className="mt-2 text-center text-xs font-semibold text-red-500">
              {saveError}
            </p>
          )}
        </aside>

        {/* Panel */}
        <main className="flex-1">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />
            <div className="p-8 md:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
                Edit Club
              </p>
              <h1 className="mt-1 text-center text-2xl font-extrabold text-ink-900 md:text-3xl">
                {current.title}
              </h1>
              <div className="mx-auto mt-6 mb-8 h-px w-full bg-gradient-to-r from-transparent via-ink-100 to-transparent" />

              {step === "basic" && <BasicDetailsPanel />}
              {step === "profile" && <ClubProfilePanel />}
              {step === "description" && <ClubDescriptionPanel />}
              {step === "questions" && <MembershipQuestionsPanel />}
              {step === "terms" && <ClubTermsPanel />}
              {step === "admins" && <ClubAdministratorsPanel />}
              {step === "publish" && <PublishPanel />}

              <div className="mt-10 flex items-center justify-center gap-3">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="rounded-xl bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
                  >
                    Go Back
                  </button>
                )}
                {step !== "publish" ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Update Club"}
                  </button>
                )}
              </div>

              {step === "publish" && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-wide text-ink-500 underline underline-offset-4 hover:text-red-500"
                  >
                    Delete Club
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
