"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  useEventCreate,
  type MarketingOrganiserInfo,
} from "@/context/EventCreateContext";
import {
  MarketingProviderLogo,
  MarketingProviderLogos,
} from "@/components/ui/MarketingLogos";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/apiClient";
import {
  useEventMarketingLists,
  useSaveEventMarketing,
} from "@/lib/eventMarketing";
import {
  MARKETING_PROVIDER_LABELS,
  useMarketingLists,
  useMarketingSettings,
  type MarketingList,
} from "@/lib/marketingSettings";
import { resolveRegion } from "@/lib/regions";
import { pushStepUrl } from "@/lib/stepNav";
import { saveLabelForStatus, useEditorSave } from "@/lib/useEditorSave";
import { useEventSteps } from "@/lib/useEventSteps";

import { PanelHeader } from "../PanelHeader";

/**
 * Step 10 - Marketing.
 *
 * Two independent controls, each of which autosaves the moment it
 * changes on an event that already exists (a promo request should reach
 * the team without waiting for the organiser to hit Save; a list pick
 * takes effect for the next buyer). On a brand-new event they ride up
 * with the first save like every other field.
 *
 *   1. "Promote this event with us" - a tick that emails the
 *      CarEvents.com team to book a call (Email / SMS / push promotion).
 *
 *   2. The Brevo / Mailchimp list this event's opted-in contacts join,
 *      overriding the account-wide default chosen under Settings. The
 *      account is the event's PRIMARY organiser's (the same account the
 *      checkout charges through), so a co-organiser sees the owner's
 *      lists. Without a connected account the card becomes a nudge to
 *      link one in Settings.
 */
export function MarketingPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { stepCount, adjacent, stepNumber } = useEventSteps();
  const { prev, next } = adjacent("marketing");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    pushStepUrl(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section
      className="panel is-active"
      data-panel="marketing"
      role="tabpanel"
    >
      <PanelHeader
        stepNumber={stepNumber("marketing")}
        totalSteps={stepCount}
        title="Marketing"
        subtitle="Get the word out, and decide where the people who opt in to hear from you end up."
      />

      <PromoteCard />
      <MailingListCard />

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

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * A link to /settings that won't silently drop unsaved edits.
 *
 * Leaving the editor discards whatever hasn't been saved, and the
 * "Link Brevo or Mailchimp" nudge is the one place this panel sends
 * people away mid-edit. With unsaved changes the click turns into a
 * prompt: save first (the same action as the Save button, so a draft
 * stays a draft) and then go, or stay and keep editing. Clean state,
 * modifier clicks and middle clicks navigate as a normal link.
 */
function SettingsLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { state } = useEventCreate();
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const { run, isSaving } = useEditorSave();

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!state.isDirty) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (isSaving) return;

    const saveLabel = saveLabelForStatus(
      state.status,
      state.livePostStatus === "publish",
    );
    const ok = await confirm({
      title: "Save your event first?",
      message:
        "You have unsaved changes on this event. Leaving for Settings now would lose them - save first, or stay here and keep editing.",
      confirmLabel: `${saveLabel} & go to Settings`,
      cancelLabel: "Stay here",
    });
    if (!ok) return;

    try {
      await run();
      router.push("/settings");
    } catch (err) {
      toast.error(
        errorMessage(err, "Couldn't save the event. Your changes are still here."),
      );
    }
  };

  return (
    <Link
      href="/settings"
      className={className}
      onClick={(e) => void onClick(e)}
    >
      {children}
    </Link>
  );
}

/** Autosave helper shared by both cards: only when the event exists. */
function useMarketingAutosave() {
  const { state } = useEventCreate();
  const saver = useSaveEventMarketing();
  const eid = state.encryptedId;
  const site = resolveRegion(state.site).key;
  return {
    canAutosave: Boolean(eid),
    isSaving: saver.isPending,
    save: (marketing: Parameters<typeof saver.save>[2]) =>
      eid ? saver.save(eid, site, marketing) : Promise.resolve(null),
  };
}

// ============================================================
// 1. Promote this event with us
// ============================================================

function PromoteCard() {
  const { state, dispatch } = useEventCreate();
  const toast = useToast();
  const { canAutosave, isSaving, save } = useMarketingAutosave();

  const onToggle = async (checked: boolean) => {
    const previous = state.promoRequested;
    const wasDirty = state.isDirty;
    dispatch({ type: "SET_FIELD", key: "promoRequested", value: checked });
    if (!canAutosave) return;
    try {
      await save({ promo_requested: checked });
      const requestedAt = checked ? new Date().toISOString() : null;
      // The tick is on the server now. When nothing else was pending,
      // HYDRATE (which clears the dirty flag) so the topbar doesn't
      // claim unsaved changes; otherwise leave the flag to the real save.
      if (wasDirty) {
        dispatch({ type: "SET_FIELD", key: "promoRequestedAt", value: requestedAt });
      } else {
        dispatch({
          type: "HYDRATE",
          partial: { promoRequested: checked, promoRequestedAt: requestedAt },
        });
      }
      if (checked) {
        toast.success("Thanks - the CarEvents.com team will be in touch shortly.");
      } else {
        toast.info("Promotion request withdrawn.");
      }
    } catch (err) {
      dispatch({ type: "SET_FIELD", key: "promoRequested", value: previous });
      toast.error(errorMessage(err, "Couldn't save your request. Please try again."));
    }
  };

  const requestedOn = formatRequestedAt(state.promoRequestedAt);

  return (
    <div className="bg-white border border-ink-200 rounded-xl p-5 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-bullhorn text-gold-600 text-sm" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink-900">
            Promote this event with us
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Book a call with the CarEvents.com team to promote your event to
            our audience via Email, SMS and Push Notification.
          </p>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-gold-600 focus:ring-gold-500"
          checked={state.promoRequested}
          disabled={isSaving}
          onChange={(e) => void onToggle(e.target.checked)}
        />
        <span className="text-sm text-ink-800">
          Yes - I&apos;d like the CarEvents.com team to get in touch about
          promoting this event
        </span>
      </label>

      {state.promoRequested && (
        <div
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          <p className="font-semibold">
            Thanks! We&apos;ll be in touch shortly to book a call.
          </p>
          <p className="mt-0.5 text-xs text-emerald-700">
            {canAutosave
              ? requestedOn
                ? `Requested on ${requestedOn}.`
                : "Your request has been sent to the CarEvents.com team."
              : "Your request is sent to the CarEvents.com team when you save this event."}
          </p>
        </div>
      )}
    </div>
  );
}

function formatRequestedAt(value: string | null): string {
  if (!value) return "";
  // The API stores "YYYY-MM-DD HH:MM:SS" (UTC); the panel writes an ISO
  // string after an autosave. Either way a Date parses it.
  const d = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// 2. Mailing list for this event
// ============================================================

function MailingListCard() {
  const { state, dispatch } = useEventCreate();
  const toast = useToast();
  const { canAutosave, isSaving, save } = useMarketingAutosave();

  // A hydrated event carries its primary organiser's connection state.
  // A brand-new event hasn't been saved yet, so its organiser is the
  // signed-in user - fall back to their own settings.
  const own = useMarketingSettings();
  const organiser: MarketingOrganiserInfo | null =
    state.marketingOrganiser ??
    (own.data
      ? {
          id: 0,
          name: "",
          isSelf: true,
          connected: own.data.settings.connected,
          provider: own.data.settings.provider,
          providerLabel: own.data.settings.provider_label,
          accountName: own.data.settings.account_name,
          defaultListId: own.data.settings.list_id,
          defaultListName: own.data.settings.list_name,
        }
      : null);

  const providerLabel =
    organiser?.providerLabel ||
    (organiser?.provider ? MARKETING_PROVIDER_LABELS[organiser.provider] : "");
  const listNoun = organiser?.provider === "mailchimp" ? "audience" : "list";

  // ---- Lists on the account ----
  // Fetched once per connection (event + organiser + provider) and read
  // straight off the mutation, so a reconnect with another provider
  // refetches and there is no state to keep in step with it.
  const eventLists = useEventMarketingLists();
  const ownLists = useMarketingLists();
  const eid = state.encryptedId;
  const site = resolveRegion(state.site).key;
  const connectionKey = organiser?.connected
    ? `${eid ?? "new"}:${organiser.id}:${organiser.provider}`
    : null;

  const lists: MarketingList[] | null = eid
    ? (eventLists.data?.lists ?? null)
    : (ownLists.data?.lists ?? null);
  const listsErr = eid ? eventLists.error : ownLists.error;
  const listsError = listsErr
    ? errorMessage(listsErr, `Couldn't load your ${providerLabel} ${listNoun}s.`)
    : null;
  const loadingLists = eid ? eventLists.isPending : ownLists.isPending;

  const loadLists = () => {
    if (eid) eventLists.mutate({ eid, site });
    else ownLists.mutate();
  };

  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!connectionKey) {
      loadedFor.current = null;
      return;
    }
    if (loadedFor.current === connectionKey) return;
    loadedFor.current = connectionKey;
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionKey]);

  const onPick = async (listId: string) => {
    const previousId = state.marketingListId;
    const previousName = state.marketingListName;
    const wasDirty = state.isDirty;
    const chosen = lists?.find((l) => l.id === listId);
    const name = listId ? chosen?.name ?? "" : "";
    dispatch({ type: "SET_FIELD", key: "marketingListId", value: listId });
    dispatch({ type: "SET_FIELD", key: "marketingListName", value: name });
    if (!canAutosave) return;
    try {
      await save({ list_id: listId, list_name: name });
      // Same dirty-flag handling as the promo tick above.
      if (!wasDirty) {
        dispatch({
          type: "HYDRATE",
          partial: { marketingListId: listId, marketingListName: name },
        });
      }
      toast.success(
        listId
          ? `Contacts from this event will be added to "${name || listId}".`
          : organiser?.defaultListName
            ? `This event now uses your default ${listNoun}, "${organiser.defaultListName}".`
            : `This event now uses your default ${listNoun}.`,
      );
    } catch (err) {
      dispatch({ type: "SET_FIELD", key: "marketingListId", value: previousId });
      dispatch({ type: "SET_FIELD", key: "marketingListName", value: previousName });
      toast.error(errorMessage(err, `Couldn't save the ${listNoun}. Please try again.`));
    }
  };

  const savedListId = state.marketingListId;
  const defaultLabel = organiser?.defaultListName
    ? `Use my default ${listNoun} (${organiser.defaultListName})`
    : `Use my default ${listNoun} (none chosen in Settings yet)`;

  return (
    <div className="bg-white border border-ink-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-envelope-open-text text-gold-600 text-sm" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink-900">
              Mailing list for this event
            </h3>
            {organiser?.connected && organiser.provider && (
              <span
                className="inline-flex items-center gap-2 shrink-0"
                title={`${providerLabel} connected`}
              >
                <MarketingProviderLogo
                  provider={organiser.provider}
                  className="h-6 w-auto"
                />
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                  Connected
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-0.5">
            Everyone who opts in to hear from you when buying tickets or
            applying with a show car, car club or trader stand is added to
            your email marketing {listNoun}.
          </p>
        </div>
      </div>

      {organiser === null ? (
        <p className="mt-4 text-sm text-ink-400">
          {own.isError
            ? "Couldn't check your email marketing connection. Refresh the page to try again."
            : "Checking your email marketing connection…"}
        </p>
      ) : !organiser.connected ? (
        <NotConnectedNotice organiser={organiser} />
      ) : (
        <div className="mt-4 space-y-3">
          {!organiser.isSelf && organiser.name && (
            <p className="rounded-lg bg-ink-50 border border-ink-200 px-3 py-2 text-xs text-ink-600">
              These {listNoun}s come from{" "}
              <strong className="text-ink-800">{organiser.name}</strong>
              &apos;s {providerLabel} account - the event&apos;s primary
              organiser.
            </p>
          )}

          <label
            htmlFor="event-marketing-list"
            className="block text-sm font-semibold text-ink-900"
          >
            Add this event&apos;s contacts to
          </label>

          {lists === null && !listsError ? (
            <p className="text-sm text-ink-400">
              Loading your {providerLabel} {listNoun}s…
            </p>
          ) : listsError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p>{listsError}</p>
              <button
                type="button"
                onClick={loadLists}
                disabled={loadingLists}
                className="mt-2 text-sm font-semibold text-amber-900 underline disabled:opacity-60"
              >
                {loadingLists ? "Retrying…" : "Try again"}
              </button>
            </div>
          ) : (
            <select
              id="event-marketing-list"
              className="input"
              value={savedListId}
              disabled={isSaving}
              onChange={(e) => void onPick(e.target.value)}
            >
              <option value="">{defaultLabel}</option>
              {lists?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.contacts > 0 ? ` (${l.contacts.toLocaleString()})` : ""}
                </option>
              ))}
              {/* A saved list the fetch didn't return (deleted on the
                  provider, or beyond the page limit) still shows so the
                  organiser can see what is set. */}
              {savedListId && !lists?.some((l) => l.id === savedListId) && (
                <option value={savedListId}>
                  {state.marketingListName || savedListId} (not found on{" "}
                  {providerLabel})
                </option>
              )}
            </select>
          )}

          {savedListId ? (
            <p className="text-xs text-ink-500">
              Contacts from this event go to{" "}
              <strong className="text-ink-700">
                {state.marketingListName || savedListId}
              </strong>{" "}
              instead of your default {listNoun}.
            </p>
          ) : state.marketingInheritedListName ? (
            <p className="text-xs text-ink-500">
              This date follows the series setting:{" "}
              <strong className="text-ink-700">
                {state.marketingInheritedListName}
              </strong>
              . Pick a {listNoun} above to change it for this date only.
            </p>
          ) : organiser.defaultListName ? (
            <p className="text-xs text-ink-500">
              Contacts from this event go to your default {listNoun},{" "}
              <strong className="text-ink-700">{organiser.defaultListName}</strong>
              . Change the default under{" "}
              <SettingsLink className="font-semibold text-gold-600 hover:underline">
                Settings
              </SettingsLink>
              .
            </p>
          ) : (
            <p className="text-xs font-semibold text-amber-700">
              No default {listNoun} is set yet - pick one here, or choose a
              default under{" "}
              <SettingsLink className="underline">
                Settings
              </SettingsLink>
              , otherwise nobody is added.
            </p>
          )}

          {!canAutosave && (
            <p className="text-xs text-ink-400">
              Your choice is saved with the event.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NotConnectedNotice({
  organiser,
}: {
  organiser: MarketingOrganiserInfo;
}) {
  if (!organiser.isSelf && organiser.name) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">No email marketing account linked</p>
        <p className="mt-1 text-xs">
          Marketing lists for this event come from{" "}
          <strong>{organiser.name}</strong>&apos;s account - the event&apos;s
          primary organiser. They can link Brevo or Mailchimp under
          Settings to start collecting this event&apos;s contacts.
        </p>
        <MarketingProviderLogos className="mt-4" />
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50 p-4">
      <p className="text-sm font-semibold text-ink-900">
        Take control of your event data
      </p>
      <p className="mt-1 text-xs text-ink-600">
        Link Brevo or Mailchimp and everyone who opts in when buying tickets
        or applying with a show car, car club or trader stand is added to
        your mailing list automatically. You can then choose which list
        each event feeds right here.
      </p>
      <MarketingProviderLogos className="mt-5" />
      <SettingsLink
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 hover:bg-gold-600 px-4 py-2 text-sm font-semibold text-white transition"
      >
        Link Brevo or Mailchimp{" "}
        <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
      </SettingsLink>
    </div>
  );
}
