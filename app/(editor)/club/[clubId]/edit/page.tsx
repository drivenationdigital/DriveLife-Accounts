"use client";

import { Suspense, use, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { ClubEditProvider, useClubEdit } from "@/context/ClubEditContext";
import { ClubSaveProvider, useClubSave } from "@/context/ClubSaveContext";
import { ClubEditorTopBar } from "@/components/club-edit/ClubEditorTopBar";
import { ClubEditorSidebar } from "@/components/club-edit/ClubEditorSidebar";
import { ClubEditorTabBar } from "@/components/club-edit/ClubEditorTabBar";
import { ClubEditorBottomBar } from "@/components/club-edit/ClubEditorBottomBar";
import { PanelHeader } from "@/components/event-create/PanelHeader";
import { BasicDetailsPanel } from "@/components/club-edit/panels/BasicDetailsPanel";
import { ClubProfilePanel } from "@/components/club-edit/panels/ClubProfilePanel";
import { ClubDescriptionPanel } from "@/components/club-edit/panels/ClubDescriptionPanel";
import { MembershipQuestionsPanel } from "@/components/club-edit/panels/MembershipQuestionsPanel";
import { ClubTermsPanel } from "@/components/club-edit/panels/ClubTermsPanel";
import { ClubAdministratorsPanel } from "@/components/club-edit/panels/ClubAdministratorsPanel";
import { PublishPanel } from "@/components/club-edit/panels/PublishPanel";
import {
  CLUB_EDIT_STEP_COUNT,
  DEFAULT_CLUB_STEP,
  adjacentClubSteps,
  getClubStep,
  type ClubEditStepKey,
} from "@/lib/clubEditSteps";
import { defaultClubTerms } from "@/lib/clubEditTypes";
import { useClubEditQuery } from "@/lib/clubEdit";
import { useDeleteClub } from "@/lib/myClubs";
import { useAction } from "@/context/ActionContext";

/**
 * Edit Club.
 *
 * Layout mirrors the event editor at /events/new:
 *   [TopBar - full width, sticky]
 *   [Sidebar (lg+) | [TabBar (mobile) → main content]]
 *   [BottomBar (mobile, sticky)]
 *
 * Sidebar and TabBar both render - each is gated by its own media-query
 * classes (hidden lg:flex / lg:hidden), so CSS alone decides which is
 * visible and no window-size measuring happens in JS.
 *
 * State lives in ClubEditContext so every step edits one record and
 * nothing is lost moving between steps. The active step is URL-driven
 * (`?step=`) rather than local state, so steps are deep-linkable and
 * browser back/forward works - same as the event editor.
 */
export default function EditClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = use(params);
  return (
    <ClubEditProvider>
      <ClubSaveProvider>
        <Suspense fallback={<ClubEditorSkeleton />}>
          <EditClubEditor clubId={clubId} />
        </Suspense>
      </ClubSaveProvider>
    </ClubEditProvider>
  );
}

function EditClubEditor({ clubId }: { clubId: string }) {
  const { hydrate } = useClubEdit();
  const { data, isLoading, error } = useClubEditQuery(clubId);

  useEffect(() => {
    if (!data) return;
    // Clubs with no terms yet start from the default, personalised with
    // the club name. Applied before hydrate so it's part of the dirty
    // baseline - opening the page doesn't show "Unsaved changes".
    hydrate(
      {
        ...data.club,
        terms: data.club.terms.trim() || defaultClubTerms(data.club.title),
      },
      data.options.categories,
    );
  }, [data, hydrate]);

  if (error) return <ClubEditorErrorState error={error} />;
  if (isLoading || !data) return <ClubEditorSkeleton />;

  return (
    <>
      <ClubEditorTopBar />
      <div className="lg:flex">
        <ClubEditorSidebar />
        <div className="lg:flex-1 lg:min-w-0">
          <ClubEditorTabBar />
          <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16">
            <ActivePanel clubId={clubId} />
          </main>
        </div>
      </div>
      <ClubEditorBottomBar />
    </>
  );
}

/**
 * Active panel + its chrome.
 *
 * The event editor has each panel render its own PanelHeader and its own
 * desktop "Continue" row. The club panels are pure field content, so the
 * header and footer are rendered once here off the step config instead -
 * same markup, less duplication across seven files.
 */
function ActivePanel({ clubId }: { clubId: string }) {
  const searchParams = useSearchParams();
  const step = getClubStep(searchParams.get("step") ?? DEFAULT_CLUB_STEP);

  return (
    <section className="panel is-active" data-panel={step.key} role="tabpanel">
      <PanelHeader
        stepNumber={step.number}
        totalSteps={CLUB_EDIT_STEP_COUNT}
        title={step.title}
        subtitle={step.subtitle}
      />

      {step.key === "basic" && <BasicDetailsPanel />}
      {step.key === "profile" && <ClubProfilePanel />}
      {step.key === "description" && <ClubDescriptionPanel />}
      {step.key === "questions" && <MembershipQuestionsPanel />}
      {step.key === "terms" && <ClubTermsPanel />}
      {step.key === "admins" && <ClubAdministratorsPanel />}
      {step.key === "publish" && <PublishPanel />}

      <PanelFooter stepKey={step.key} clubId={clubId} />
    </section>
  );
}

/**
 * Desktop CTA row. Mobile uses the sticky bottom bar instead, so this is
 * hidden below sm - matching the event panels' footer exactly.
 */
function PanelFooter({
  stepKey,
  clubId,
}: {
  stepKey: ClubEditStepKey;
  clubId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDirty } = useClubEdit();
  const { save, isSaving, error } = useClubSave();

  // ── Delete ──────────────────────────────────────────────────────
  const runAction = useAction();
  const deleteClub = useDeleteClub();

  const handleDelete = async () => {
    const res = await runAction({
      confirm: {
        title: "Delete this club?",
        message:
          "The club will be removed from your clubs. Contact support if you need it restored.",
        confirmLabel: "Delete Club",
        cancelLabel: "Keep Club",
        danger: true,
      },
      loadingLabel: "Deleting club...",
      successTitle: "Club deleted",
      successMessage: "It's been removed from your clubs.",
      errorTitle: "Couldn't delete the club",
      run: () => deleteClub.mutateAsync({ cid: clubId }),
    });
    if (res) router.push("/clubs");
  };

  const { prev, next } = adjacentClubSteps(stepKey);

  const goToStep = (key: ClubEditStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="hidden sm:flex items-center justify-end gap-3 pt-6 border-t border-ink-200">
        {prev && (
          <button
            type="button"
            onClick={() => goToStep(prev)}
            className="px-5 py-3 text-sm font-semibold text-ink-700 bg-ink-100 hover:bg-ink-200 rounded-lg transition inline-flex items-center gap-2"
          >
            <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back
          </button>
        )}
        {next ? (
          <button
            type="button"
            onClick={() => goToStep(next)}
            className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
          >
            Continue{" "}
            <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={save}
            disabled={isSaving || !isDirty}
            className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <i
              className={`text-xs ${
                isSaving
                  ? "fa-solid fa-spinner fa-spin"
                  : "fa-solid fa-floppy-disk"
              }`}
              aria-hidden
            />
            {isSaving ? "Saving…" : "Update Club"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-500 sm:text-right">{error}</p>
      )}

      {stepKey === "publish" && (
        <div className="mt-6 text-center sm:text-right">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteClub.isPending}
            className="text-xs font-semibold uppercase tracking-wide text-ink-500 underline underline-offset-4 hover:text-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleteClub.isPending ? "Deleting…" : "Delete Club"}
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Full-page skeleton shown while /club-edit is in flight. Mirrors the
 * editor's chrome so the layout doesn't shift when the real content
 * arrives - same shape as the event editor's EditorSkeleton, trimmed to
 * seven sidebar rows.
 *
 * Uses the `.skeleton-shimmer` class from editor.css, scoped under
 * .event-editor by the parent layout.
 */
function ClubEditorSkeleton() {
  return (
    <>
      {/* Topbar placeholder - matches ClubEditorTopBar's sticky h-14. */}
      <div className="h-14 border-b border-ink-200 bg-white flex items-center px-4 gap-3">
        <span className="skeleton-shimmer h-6 w-6 rounded-md" />
        <span className="skeleton-shimmer h-4 w-40 rounded" />
        <span className="ml-auto skeleton-shimmer h-8 w-28 rounded-lg" />
      </div>

      <div className="lg:flex">
        <aside className="hidden lg:block lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white p-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <span className="skeleton-shimmer h-7 w-7 rounded-full" />
              <span
                className={`skeleton-shimmer h-3.5 ${
                  ["w-32", "w-24", "w-36", "w-28"][i % 4]
                }`}
              />
            </div>
          ))}
        </aside>

        <div className="lg:flex-1 lg:min-w-0">
          <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16">
            <div className="mb-8">
              <span className="skeleton-shimmer h-3 w-20 rounded mb-3 block" />
              <span className="skeleton-shimmer h-8 w-64 rounded mb-3 block" />
              <span className="skeleton-shimmer h-4 w-full rounded block" />
            </div>

            <div className="space-y-6">
              {["w-20", "w-16", "w-24", "w-20"].map((labelW, i) => (
                <div key={i}>
                  <span
                    className={`skeleton-shimmer h-3 ${labelW} rounded mb-2 block`}
                  />
                  <span className="skeleton-shimmer h-11 w-full rounded-lg block" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

/**
 * Error state for the load endpoint. Keeps the editor chrome out of the
 * way so the user sees a focused message plus a way back - same treatment
 * as the event editor's EditorErrorState.
 */
function ClubEditorErrorState({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-ink-200 p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <i
            className="fa-solid fa-triangle-exclamation text-red-500"
            aria-hidden
          />
        </div>
        <h1 className="font-display text-xl text-ink-900 mb-2">
          Couldn’t load this club
        </h1>
        <p className="text-sm text-ink-500 mb-6">{error.message}</p>
        <a
          href="/clubs"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back to
          clubs
        </a>
      </div>
    </div>
  );
}
