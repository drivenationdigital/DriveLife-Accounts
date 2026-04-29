"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

import { useEventCreate } from "@/context/EventCreateContext";
import { EVENT_TYPES, type EventTypeId } from "@/lib/eventTypes";
import { useCreateEvent } from "@/lib/queries";

/**
 * Two-step create-event wizard.
 *
 * Step keys live in the URL (`?step=type` | `?step=title`) so back/
 * forward buttons work and the URL is shareable in dev. Defaults to
 * `type` when absent.
 *
 * Flow:
 *   1. type  — pick General / Dev Club / Venue. Stored on the
 *              shared EventCreateContext so the editor can read it.
 *   2. title — type a title. On Next, fires the create-event mutation
 *              and on success redirects to /events/new?eid=… with
 *              the type + title already on the context.
 *
 * Why the context handover?
 *   The editor mounts inside the same (editor) route group as this
 *   page — they share one EventCreateProvider. That means values
 *   dispatched here are immediately readable on the editor page,
 *   no extra fetch needed. The eid query param plus loaded context
 *   gives us the seamless feel.
 */
export default function CreateEventPage() {
  // useSearchParams must live inside a Suspense boundary in Next 14.
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") === "title" ? "title" : "type";
  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4">
      <div className="mx-auto max-w-5xl flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar rail — visible on lg+, only on step 1 to mirror the
            mockup. The rail is purely informational; clicking it does
            nothing because the wizard is linear. */}
        {step === "type" && <CreateRail />}

        <div className={`flex-1 ${step === "title" ? "max-w-xl mx-auto w-full" : ""}`}>
          {step === "type" ? <TypeStep /> : <TitleStep />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sidebar rail (step 1 only)
// ============================================================

function CreateRail() {
  return (
    <aside className="lg:w-56 lg:shrink-0">
      <p className="text-base font-semibold text-ink-900 mb-3">Create Event</p>
      <div className="rounded-xl bg-white p-1">
        <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-gold-50">
          <span className="w-7 h-7 rounded-full bg-gold-500 text-white inline-flex items-center justify-center text-xs">
            <i className="fa-solid fa-chevron-right" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-ink-900">Get Started</span>
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// Step 1 — choose event type
// ============================================================

function TypeStep() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local mirror of the picked type — we only commit to context on
  // Next so the user can change their mind without affecting the
  // editor's pre-existing state until they confirm.
  const [picked, setPicked] = useState<EventTypeId>(state.eventType);

  const goNext = () => {
    dispatch({ type: "SET_FIELD", key: "eventType", value: picked });
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", "title");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <section className="bg-white rounded-2xl border border-ink-200 p-6 sm:p-10">
      <header className="text-center mb-6">
        <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">
          Create Event
        </p>
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900">
          Choose Event Type
        </h1>
        <div className="mt-4 mx-auto h-px w-full bg-ink-200" />
      </header>

      <div className="space-y-3">
        {EVENT_TYPES.map((opt) => {
          const active = opt.id === picked;
          const cls = [
            "w-full text-left p-5 rounded-xl border-2 transition flex items-start gap-3",
            active
              ? "border-gold-500 bg-gold-50"
              : "border-ink-200 hover:border-ink-300 bg-white",
          ].join(" ");
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPicked(opt.id)}
              aria-pressed={active}
              className={cls}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-900">{opt.label}</p>
                <p className="text-sm text-ink-500 mt-0.5">{opt.description}</p>
              </div>
              {active && (
                <span
                  className="w-6 h-6 rounded-full bg-gold-500 text-white inline-flex items-center justify-center text-xs shrink-0"
                  aria-hidden
                >
                  <i className="fa-solid fa-check" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={goNext}
          className="px-8 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition"
        >
          Next Step
        </button>
      </div>
    </section>
  );
}

// ============================================================
// Step 2 — name your event + create
// ============================================================

function TitleStep() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const createEvent = useCreateEvent();

  // Local mirror — same reasoning as the type step. Initial value
  // comes from context so going Back+Next preserves what was typed.
  const [title, setTitle] = useState(state.title);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", "type");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Please enter a title.");
      return;
    }
    setError(null);

    // Commit to context BEFORE the request fires, so on a slow
    // network the editor (which we navigate to next) has the title
    // ready and the field doesn't appear blank.
    dispatch({ type: "SET_FIELD", key: "title", value: trimmed });

    try {
      const result = await createEvent.mutateAsync({
        title: trimmed,
        event_type: state.eventType,
      });
      // Stash the encrypted id on context so the editor knows it's
      // working with a server-side draft (vs the demo template).
      dispatch({
        type: "SET_FIELD",
        key: "encryptedId",
        value: result.encrypted_id,
      });
      // Navigate. We use `replace` so the user can't hit Back into
      // the title step and trigger a duplicate create.
      router.replace(`/events/new?eid=${encodeURIComponent(result.encrypted_id)}`);
    } catch (err) {
      // ApiError carries the WP-side message verbatim.
      setError(
        err instanceof Error
          ? err.message
          : "Could not create the event. Please try again.",
      );
    }
  };

  const submitting = createEvent.isPending;

  return (
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

      {error && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={submitting}
          className="px-6 py-3 text-sm font-semibold text-white bg-ink-900 hover:bg-black rounded-lg transition disabled:opacity-50"
        >
          Go Back
        </button>
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

      {/* Small footer link back to dashboard if they change their mind. */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-xs text-ink-500 hover:text-ink-900 transition"
        >
          Cancel and return to dashboard
        </Link>
      </div>
    </section>
  );
}
