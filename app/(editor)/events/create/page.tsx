"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useEventCreate } from "@/context/EventCreateContext";
import { useCreateEvent } from "@/lib/queries";
import { eventEditorPath } from "@/lib/siteRoutes";
import { HostedByDropdown } from "@/components/event-create/HostedByDropdown";
import { RegionSelector } from "@/components/event-create/RegionSelector";
import { DEFAULT_REGION_KEY } from "@/lib/regions";

/**
 * Create-event entry screen.
 *
 * A single step: name the event and choose who it's hosted by. The old
 * "Choose Event Type" step is gone - the host (me / a club / a venue),
 * picked from the dropdown, now carries that meaning, and the legacy
 * event_type is derived from it at submit.
 *
 * On submit this fires the create-event mutation and, on success,
 * redirects into the editor at /events/new?eid=… with the title +
 * host already on the shared EventCreateContext (same provider, so the
 * editor reads them with no extra fetch).
 */
export default function CreateEventPage() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const createEvent = useCreateEvent();

  const [title, setTitle] = useState(state.title);
  const [error, setError] = useState<string | null>(null);

  // Derive the legacy event_type from the host selection. Kept in sync
  // with HOST_TYPE_TO_EVENT_TYPE in lib/eventMutations.ts.
  const eventTypeFromHost = (
    hostType: typeof state.hostType,
  ): "general" | "dev_club" | "venue_dover" =>
    hostType === "club"
      ? "dev_club"
      : hostType === "venue"
        ? "venue_dover"
        : "general";

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Please enter a title.");
      return;
    }
    setError(null);

    // Commit title to context before the request, so the editor (which
    // we navigate to next) has it ready on a slow network.
    dispatch({ type: "SET_FIELD", key: "title", value: trimmed });

    try {
      // Default rather than omit: the region drives locale, currency
      // and whether the editor shows any ticketing at all, so the rest
      // of the flow always wants a concrete answer.
      const site = state.site ?? DEFAULT_REGION_KEY;
      const result = await createEvent.mutateAsync({
        title: trimmed,
        event_type: eventTypeFromHost(state.hostType),
        host_type: state.hostType,
        host_id: state.hostId,
        site,
      });
      dispatch({
        type: "SET_FIELD",
        key: "encryptedId",
        value: result.encrypted_id,
      });
      dispatch({ type: "SET_FIELD", key: "site", value: site });
      // `replace` so Back can't re-trigger a duplicate create. The
      // region rides along so the editor loads and saves against the
      // right blog.
      router.replace(eventEditorPath(result.encrypted_id, site));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create the event. Please try again.",
      );
    }
  };

  const submitting = createEvent.isPending;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4">
      <div className="mx-auto max-w-xl w-full">
        <section className="bg-white rounded-2xl border border-ink-200 p-6 sm:p-10">
          <header className="text-center mb-6">
            <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">
              Create Event
            </p>
            <h1 className="font-display text-2xl sm:text-3xl text-ink-900">
              Name your event
            </h1>
            <div className="mt-4 mx-auto h-px w-full bg-ink-200" />
          </header>

          <div className="mb-2">
            <label
              htmlFor="ce-title"
              className="block text-sm font-semibold text-ink-900 mb-2"
            >
              Event Title
            </label>
            <input
              id="ce-title"
              type="text"
              className="input"
              placeholder="Event Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              maxLength={200}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>

          {/* Region first: clubs and venues are per-region, so the
              country decides what "Hosted by" can offer. Choosing it
              second would mean picking a host and then watching the
              choice reset. Create-time only - see RegionSelector. */}
          <RegionSelector />

          {/* Hosted-by dropdown - hides itself when "Me" is the only
              option (a user with no clubs/venues in this region never
              sees it). */}
          <HostedByDropdown />

          {error && (
            <p className="text-sm text-red-600 mt-2" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !title.trim()}
              className="px-6 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {submitting && (
                <i
                  className="fa-solid fa-circle-notch fa-spin text-xs"
                  aria-hidden
                />
              )}
              {submitting ? "Creating…" : "Next Step"}
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-xs text-ink-500 hover:text-ink-900 transition"
            >
              Cancel and return to dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
