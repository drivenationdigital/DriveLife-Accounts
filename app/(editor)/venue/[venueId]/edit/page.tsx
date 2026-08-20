"use client";

import { resolveRegion, type RegionKey } from "@/lib/regions";
import { parseRef } from "@/lib/siteRef";
import { Suspense, use, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { VenueEditProvider, useVenueEdit } from "@/context/VenueEditContext";
import { useAction } from "@/context/ActionContext";
import { VenueEditorTopBar } from "@/components/venue-edit/VenueEditorTopBar";
import { VenueEditorSidebar } from "@/components/venue-edit/VenueEditorSidebar";
import { VenueEditorTabBar } from "@/components/venue-edit/VenueEditorTabBar";
import { VenueEditorBottomBar } from "@/components/venue-edit/VenueEditorBottomBar";
import { PanelHeader } from "@/components/event-create/PanelHeader";
import { BasicDetailsPanel } from "@/components/venue-edit/panels/BasicDetailsPanel";
import { VenueProfilePanel } from "@/components/venue-edit/panels/VenueProfilePanel";
import { VenueDescriptionPanel } from "@/components/venue-edit/panels/VenueDescriptionPanel";
import { PublishPanel } from "@/components/venue-edit/panels/PublishPanel";
import {
  VENUE_EDIT_STEP_COUNT,
  DEFAULT_VENUE_STEP,
  adjacentVenueSteps,
  getVenueStep,
  type VenueEditStepKey,
} from "@/lib/venueEditSteps";
import { useVenueEditQuery, useDeleteVenue } from "@/lib/myVenues";

/**
 * Edit Venue.
 *
 * Layout mirrors the event editor at /events/new and the club editor at
 * /club/[clubId]/edit:
 *   [TopBar - full width, sticky]
 *   [Sidebar (lg+) | [TabBar (mobile) → main content]]
 *   [BottomBar (mobile, sticky)]
 *
 * Sidebar and TabBar both render - each is gated by its own media-query
 * classes (hidden lg:flex / lg:hidden), so CSS alone decides which is
 * visible and no window-size measuring happens in JS.
 *
 * Form state, validation and the save mutation all live in
 * VenueEditContext, so the chrome and the panels agree about what's
 * dirty, what's invalid, and whether a save is in flight. The active step
 * is URL-driven (`?step=`), so steps are deep-linkable and browser
 * back/forward works.
 */
export default function EditVenuePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  // The route param is a ref - "uk{vid}" - so the region can't get
  // separated from the vid it belongs to. Split once, here, and pass
  // the two halves down; nothing below re-reads the URL.
  const { venueId: venueRef } = use(params);
  const { id: venueId, site: refSite } = parseRef(venueRef);
  return (
    <VenueEditProvider>
      <Suspense fallback={<VenueEditorSkeleton />}>
        <EditVenueEditor venueId={venueId} refSite={refSite} />
      </Suspense>
    </VenueEditProvider>
  );
}

function EditVenueEditor({
  venueId,
  refSite,
}: {
  venueId: string;
  /** Region from the ref, or null on a link that carried none. */
  refSite: RegionKey | null;
}) {
  const { hydrate } = useVenueEdit();
  // Region the vid belongs to. Encrypted ids repeat across regions, so
  // it goes up on the load and on every mutation below. `?site=` is
  // honoured as a fallback for links minted before refs; resolveRegion
  // then falls back to UK - the same blog the API would have picked for
  // an omitted site, so old links behave as before.
  const urlSite = useSearchParams().get("site");
  const site = resolveRegion(refSite ?? urlSite).key;
  const { data, isLoading, error } = useVenueEditQuery(venueId, site);

  useEffect(() => {
    if (!data) return;
    hydrate(data.venue);
  }, [data, hydrate]);

  if (error) return <VenueEditorErrorState error={error} />;
  if (isLoading || !data) return <VenueEditorSkeleton />;

  return (
    <>
      <VenueEditorTopBar />
      <div className="lg:flex">
        <VenueEditorSidebar />
        <div className="lg:flex-1 lg:min-w-0">
          <VenueEditorTabBar />
          <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16">
            <ActivePanel />
          </main>
        </div>
      </div>
      <VenueEditorBottomBar />
    </>
  );
}

/**
 * Active panel + its chrome.
 *
 * As in the club editor, the PanelHeader and the desktop CTA row are
 * rendered once here off the step config rather than repeated inside
 * every panel - the panels stay pure field content.
 */
function ActivePanel() {
  const searchParams = useSearchParams();
  const step = getVenueStep(searchParams.get("step") ?? DEFAULT_VENUE_STEP);

  return (
    <section className="panel is-active" data-panel={step.key} role="tabpanel">
      <PanelHeader
        stepNumber={step.number}
        totalSteps={VENUE_EDIT_STEP_COUNT}
        title={step.title}
        subtitle={step.subtitle}
      />

      {step.key === "basic" && <BasicDetailsPanel />}
      {step.key === "profile" && <VenueProfilePanel />}
      {step.key === "description" && <VenueDescriptionPanel />}
      {step.key === "publish" && <PublishPanel />}

      <PanelFooter stepKey={step.key} />
    </section>
  );
}

/**
 * Desktop CTA row. Mobile uses the sticky bottom bar instead, so this is
 * hidden below sm - matching the event and club panels' footers.
 */
function PanelFooter({ stepKey }: { stepKey: VenueEditStepKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDirty, isSaving, save, saveError, validateStep } = useVenueEdit();

  const { prev, next } = adjacentVenueSteps(stepKey);

  const goToStep = (key: VenueEditStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onContinue = () => {
    if (!next) return;
    // Invalid fields reveal their errors and hold the user in place.
    if (!validateStep(stepKey)) return;
    goToStep(next);
  };

  const onSave = async () => {
    const jumpTo = await save();
    if (jumpTo) goToStep(jumpTo);
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
            onClick={onContinue}
            className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
          >
            Continue{" "}
            <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
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
            {isSaving ? "Saving…" : "Update Venue"}
          </button>
        )}
      </div>

      {saveError && (
        <p className="mt-3 text-sm text-red-500 sm:text-right">{saveError}</p>
      )}

      {stepKey === "publish" && <DeleteVenueButton />}
    </>
  );
}

/** Destructive action, kept out of the main CTA row and behind a
 *  confirm dialog. Same placement as the club editor's Delete Club. */
function DeleteVenueButton() {
  const { venue } = useVenueEdit();
  const router = useRouter();
  const runAction = useAction();
  const deleteVenue = useDeleteVenue();
  // The region comes off the loaded record, which useVenueEditQuery
  // stamps with the site it resolved the vid against. This button sits
  // several levels below the page component, and the vid alone would
  // resolve against the API's default region.
  const site = resolveRegion(venue.site).key;

  const handleDelete = async () => {
    const res = await runAction({
      confirm: {
        title: "Delete this venue?",
        message:
          "This will remove the venue. This can't be undone from here. Are you sure?",
        confirmLabel: "Delete Venue",
        cancelLabel: "Keep Venue",
        danger: true,
      },
      loadingLabel: "Deleting venue...",
      successTitle: "Venue deleted",
      successMessage: "It's been removed from your venues.",
      errorTitle: "Couldn't delete the venue",
      run: () => deleteVenue.mutateAsync({ vid: venue.vid, site }),
    });
    if (res) router.push("/venues");
  };

  return (
    <div className="mt-6 text-center sm:text-right">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleteVenue.isPending}
        className="text-xs font-semibold uppercase tracking-wide text-ink-500 underline underline-offset-4 transition hover:text-red-500 disabled:opacity-50"
      >
        Delete Venue
      </button>
    </div>
  );
}

/**
 * Full-page skeleton shown while /venue-edit is in flight. Mirrors the
 * editor's chrome so the layout doesn't shift when the real content
 * arrives - same shape as the event and club skeletons, trimmed to four
 * sidebar rows.
 *
 * Uses the `.skeleton-shimmer` class from editor.css, scoped under
 * .event-editor by the parent layout.
 */
function VenueEditorSkeleton() {
  return (
    <>
      {/* Topbar placeholder - matches VenueEditorTopBar's sticky h-14. */}
      <div className="h-14 border-b border-ink-200 bg-white flex items-center px-4 gap-3">
        <span className="skeleton-shimmer h-6 w-6 rounded-md" />
        <span className="skeleton-shimmer h-4 w-40 rounded" />
        <span className="ml-auto skeleton-shimmer h-8 w-28 rounded-lg" />
      </div>

      <div className="lg:flex">
        <aside className="hidden lg:block lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white p-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
 * as the event and club editors.
 */
function VenueEditorErrorState({ error }: { error: Error }) {
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
          Couldn’t load this venue
        </h1>
        <p className="text-sm text-ink-500 mb-6">{error.message}</p>
        <a
          href="/venues"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back to
          venues
        </a>
      </div>
    </div>
  );
}
