"use client";

import { resolveRegion, type RegionKey } from "@/lib/regions";
import { parseRef } from "@/lib/siteRef";
import { Suspense, use, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  BusinessEditProvider,
  useBusinessEdit,
} from "@/context/BusinessEditContext";
import { useAction } from "@/context/ActionContext";
import { BusinessEditorTopBar } from "@/components/business-edit/BusinessEditorTopBar";
import { BusinessEditorSidebar } from "@/components/business-edit/BusinessEditorSidebar";
import { BusinessEditorTabBar } from "@/components/business-edit/BusinessEditorTabBar";
import { BusinessEditorBottomBar } from "@/components/business-edit/BusinessEditorBottomBar";
import { PanelHeader } from "@/components/event-create/PanelHeader";
import { BasicDetailsPanel } from "@/components/business-edit/panels/BasicDetailsPanel";
import { BusinessProfilePanel } from "@/components/business-edit/panels/BusinessProfilePanel";
import { BusinessDescriptionPanel } from "@/components/business-edit/panels/BusinessDescriptionPanel";
import { OwnersPanel } from "@/components/business-edit/panels/OwnersPanel";
import { EventTradersPanel } from "@/components/business-edit/panels/EventTradersPanel";
import { PublishPanel } from "@/components/business-edit/panels/PublishPanel";
import {
  BUSINESS_EDIT_STEP_COUNT,
  DEFAULT_BUSINESS_STEP,
  adjacentBusinessSteps,
  getBusinessStep,
  type BusinessEditStepKey,
} from "@/lib/businessEditSteps";
import { useBusinessEditQuery, useDeleteBusiness } from "@/lib/myBusinesses";

/**
 * Edit Business. Same layout as the venue and club editors:
 *   [TopBar - full width, sticky]
 *   [Sidebar (lg+) | [TabBar (mobile) → main content]]
 *   [BottomBar (mobile, sticky)]
 *
 * The route param is a ref ("uk{bid}"), split once here.
 */
export default function EditBusinessPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId: businessRef } = use(params);
  const { id: businessId, site: refSite } = parseRef(businessRef);
  return (
    <BusinessEditProvider>
      <Suspense fallback={<BusinessEditorSkeleton />}>
        <EditBusinessEditor businessId={businessId} refSite={refSite} />
      </Suspense>
    </BusinessEditProvider>
  );
}

function EditBusinessEditor({
  businessId,
  refSite,
}: {
  businessId: string;
  refSite: RegionKey | null;
}) {
  const { hydrate } = useBusinessEdit();
  const urlSite = useSearchParams().get("site");
  const site = resolveRegion(refSite ?? urlSite).key;
  const { data, isLoading, error } = useBusinessEditQuery(businessId, site);

  useEffect(() => {
    if (!data) return;
    hydrate(data.business);
  }, [data, hydrate]);

  if (error) return <BusinessEditorErrorState error={error} />;
  if (isLoading || !data) return <BusinessEditorSkeleton />;

  return (
    <>
      <BusinessEditorTopBar />
      <div className="lg:flex">
        <BusinessEditorSidebar />
        <div className="lg:flex-1 lg:min-w-0">
          <BusinessEditorTabBar />
          <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16">
            <ActivePanel />
          </main>
        </div>
      </div>
      <BusinessEditorBottomBar />
    </>
  );
}

function ActivePanel() {
  const searchParams = useSearchParams();
  const step = getBusinessStep(searchParams.get("step") ?? DEFAULT_BUSINESS_STEP);

  return (
    <section className="panel is-active" data-panel={step.key} role="tabpanel">
      <PanelHeader
        stepNumber={step.number}
        totalSteps={BUSINESS_EDIT_STEP_COUNT}
        title={step.title}
        subtitle={step.subtitle}
      />

      {step.key === "basic" && <BasicDetailsPanel />}
      {step.key === "profile" && <BusinessProfilePanel />}
      {step.key === "description" && <BusinessDescriptionPanel />}
      {step.key === "owners" && <OwnersPanel />}
      {step.key === "traders" && <EventTradersPanel />}
      {step.key === "publish" && <PublishPanel />}

      <PanelFooter stepKey={step.key} />
    </section>
  );
}

function PanelFooter({ stepKey }: { stepKey: BusinessEditStepKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isDirty, isSaving, save, saveError, validateStep } = useBusinessEdit();

  const { prev, next } = adjacentBusinessSteps(stepKey);

  const goToStep = (key: BusinessEditStepKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onContinue = () => {
    if (!next) return;
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
            Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
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
                isSaving ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-floppy-disk"
              }`}
              aria-hidden
            />
            {isSaving ? "Saving…" : "Update Business"}
          </button>
        )}
      </div>

      {saveError && (
        <p className="mt-3 text-sm text-red-500 sm:text-right">{saveError}</p>
      )}

      {stepKey === "publish" && <DeleteBusinessButton />}
    </>
  );
}

function DeleteBusinessButton() {
  const { business } = useBusinessEdit();
  const router = useRouter();
  const runAction = useAction();
  const deleteBusiness = useDeleteBusiness();
  const site = resolveRegion(business.site).key;

  const handleDelete = async () => {
    const res = await runAction({
      confirm: {
        title: "Delete this business?",
        message: business.traders.subscription && business.traders.member
          ? "This removes the listing. Your Event Traders directory membership will be cancelled too. Are you sure?"
          : "This will remove the business listing. This can't be undone from here. Are you sure?",
        confirmLabel: "Delete Business",
        cancelLabel: "Keep Business",
        danger: true,
      },
      loadingLabel: "Deleting business...",
      successTitle: "Business deleted",
      successMessage: "It's been removed from your businesses.",
      errorTitle: "Couldn't delete the business",
      run: () => deleteBusiness.mutateAsync({ bid: business.bid, site }),
    });
    if (res) router.push("/businesses");
  };

  return (
    <div className="mt-6 text-center sm:text-right">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleteBusiness.isPending}
        className="text-xs font-semibold uppercase tracking-wide text-ink-500 underline underline-offset-4 transition hover:text-red-500 disabled:opacity-50"
      >
        Delete Business
      </button>
    </div>
  );
}

function BusinessEditorSkeleton() {
  return (
    <>
      <div className="h-14 border-b border-ink-200 bg-white flex items-center px-4 gap-3">
        <span className="skeleton-shimmer h-6 w-6 rounded-md" />
        <span className="skeleton-shimmer h-4 w-40 rounded" />
        <span className="ml-auto skeleton-shimmer h-8 w-28 rounded-lg" />
      </div>

      <div className="lg:flex">
        <aside className="hidden lg:block lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <span className="skeleton-shimmer h-7 w-7 rounded-full" />
              <span
                className={`skeleton-shimmer h-3.5 ${
                  ["w-32", "w-24", "w-36", "w-28", "w-30", "w-20"][i % 6]
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
                  <span className={`skeleton-shimmer h-3 ${labelW} rounded mb-2 block`} />
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

function BusinessEditorErrorState({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-ink-200 p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <i className="fa-solid fa-triangle-exclamation text-red-500" aria-hidden />
        </div>
        <h1 className="font-display text-xl text-ink-900 mb-2">
          Couldn’t load this business
        </h1>
        <p className="text-sm text-ink-500 mb-6">{error.message}</p>
        <a
          href="/businesses"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back to businesses
        </a>
      </div>
    </div>
  );
}
