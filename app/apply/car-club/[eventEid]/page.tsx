/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  useState,
  use,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { ApiError } from "@/lib/apiClient";
import {
  useCarClubPublic,
  useSubmitCarClubApplication,
  isCarClubOpenToday,
  type CarClubApplicationBody,
} from "@/lib/carClubApply";

/**
 * Public car club application form.
 *
 *   /apply/car-club/[eventEid]
 *
 * Mirrors the show car apply page but for clubs: one application
 * track per event (no category dropdown), club-shaped fields, and a
 * capacity/window gate driven by the event's car club settings.
 *
 * Next.js 15: route params are a Promise, unwrapped with React.use().
 */

type FormState = Omit<CarClubApplicationBody, "eventEid">;

const INITIAL_FORM: FormState = {
  clubName: "",
  clubWebsite: "",
  clubInstagram: "",
  clubTiktok: "",
  contactName: "",
  email: "",
  contactPhone: "",
  memberCount: "",
  notes: "",
};

export default function CarClubApplyPage({
  params,
}: {
  params: Promise<{ eventEid: string }>;
}) {
  const { eventEid } = use(params);
  const { data, isLoading, error } = useCarClubPublic(eventEid);
  const submit = useSubmitCarClubApplication();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  if (isLoading) {
    return (
      <PageShell>
        <p className="text-sm text-ink-500">Loading…</p>
      </PageShell>
    );
  }

  if (error || !data) {
    const message = error
      ? error instanceof ApiError
        ? error.status === 404
          ? "We couldn't find this event. The link may be wrong or the event may have been removed."
          : error.message || "Couldn't load this event."
        : error.message || "Couldn't load this event."
      : "Couldn't load this event.";
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-2">Couldn't load this event</h1>
        <p className="text-sm text-ink-600">{message}</p>
        {process.env.NODE_ENV !== "production" && error && (
          <pre className="mt-4 p-3 text-xs bg-ink-50 border border-ink-200 rounded overflow-auto text-ink-700">
            {error instanceof ApiError
              ? `Status ${error.status}\n${error.message}`
              : ((error as Error).stack ?? String(error))}
          </pre>
        )}
      </PageShell>
    );
  }

  if (!data.car_clubs_enabled) {
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-1">{data.event_title}</h1>
        <p className="text-sm text-ink-600">
          Car club applications aren't open for this event.
        </p>
      </PageShell>
    );
  }

  if (submit.isSuccess) {
    return (
      <PageShell>
        <h1 className="text-2xl font-bold mb-2">Application received</h1>
        <p className="text-sm text-ink-700">
          Thanks for applying to bring <strong>{form.clubName}</strong> to{" "}
          <strong>{data.event_title}</strong>. The organiser will review your
          application and email you with next steps.
        </p>
      </PageShell>
    );
  }

  const open = isCarClubOpenToday(data);
  const full = !!data.is_full;
  const closedReason = full
    ? "This event has reached its car club capacity."
    : !open
      ? "Car club applications for this event are currently closed."
      : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (closedReason) return;
    try {
      await submit.mutateAsync({ ...form, eventEid });
    } catch {
      // surfaced below the button via submit.error
    }
  };

  const update =
    (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };

  const submitError = submit.error
    ? submit.error instanceof ApiError
      ? submit.error.message
      : submit.error.message || "Something went wrong. Please try again."
    : null;

  return (
    <PageShell>
      <header className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold-600 font-bold mb-2">
          Car Club Application
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight mb-3 leading-[1.05]">
          {data.event_title}
        </h1>
        {data.event_location && (
          <p className="text-sm text-ink-600 mb-2">{data.event_location}</p>
        )}
        {data.event_info && (
          <div
            className="text-sm text-ink-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: data.event_info }}
          />
        )}
        {data.require_ticket && typeof data.ticket_cost === "number" && (
          <p className="text-sm text-ink-700 mt-3 inline-flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2">
            Approved clubs purchase tickets at £{data.ticket_cost.toFixed(2)}{" "}
            per vehicle.
          </p>
        )}
      </header>

      {closedReason && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          {closedReason}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section step={1} title="Car club information">
          <Field label="Car Club Name" required>
            <input
              className="input"
              value={form.clubName}
              onChange={update("clubName")}
              required
            />
          </Field>

          <Field label="Description (Optional)">
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={update("notes")}
              placeholder="Brief description of your car club"
            />
          </Field>

          <Field label="Website Link (Optional)">
            <input
              className="input"
              type="url"
              value={form.clubWebsite}
              onChange={update("clubWebsite")}
              placeholder="https://yourclub.com"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Instagram (Optional)">
              <input
                className="input"
                value={form.clubInstagram}
                onChange={update("clubInstagram")}
                placeholder="@yourclub"
              />
            </Field>
            <Field label="TikTok (Optional)">
              <input
                className="input"
                value={form.clubTiktok}
                onChange={update("clubTiktok")}
                placeholder="@yourclub"
              />
            </Field>
          </div>
        </Section>

        <Section step={2} title="Contact information">
          <Field label="Contact Name" required>
            <input
              className="input"
              value={form.contactName}
              onChange={update("contactName")}
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Contact Email" required>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={update("email")}
                required
              />
            </Field>
            <Field label="Contact Telephone Number" required>
              <input
                className="input"
                type="tel"
                value={form.contactPhone}
                onChange={update("contactPhone")}
                required
              />
            </Field>
          </div>

          <Field label="Approximate Number of Car Spaces Needed" required>
            <input
              className="input"
              type="number"
              min={1}
              max={
                typeof data.remaining === "number" ? data.remaining : undefined
              }
              value={form.memberCount}
              onChange={update("memberCount")}
              required
            />
            <p className="text-xs text-ink-500 mt-1">
              Estimated number of display spaces your club will need
              {typeof data.remaining === "number" && (
                <>
                  {" "}
                  · <strong>{data.remaining}</strong> space
                  {data.remaining === 1 ? "" : "s"} remaining
                </>
              )}
            </p>
            {typeof data.remaining === "number" &&
              Number(form.memberCount) > data.remaining && (
                <p className="text-xs text-red-600 mt-1" role="alert">
                  That's more than the {data.remaining} space
                  {data.remaining === 1 ? "" : "s"} left for this event.
                </p>
              )}
          </Field>
        </Section>

        {submitError && (
          <p className="text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={
            submit.isPending ||
            !!closedReason ||
            (typeof data.remaining === "number" &&
              Number(form.memberCount) > data.remaining)
          }
          className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
        >
          {submit.isPending && (
            <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden />
          )}
          {submit.isPending ? "Submitting…" : "Submit Car Club Application"}
        </button>
      </form>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="apply-shell min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40 py-8 sm:py-14 px-4">
      <style>{`
        .apply-shell .input,
        .apply-shell input.input,
        .apply-shell select.input,
        .apply-shell textarea.input {
          width: 100%;
          padding: 11px 14px;
          font-size: 15px;
          line-height: 1.4;
          color: var(--ink, #1f1d18);
          background: #fafafa;
          border: 1px solid #dedcd5;
          border-radius: 10px;
          outline: none;
          transition: border-color .15s, box-shadow .15s, background .15s;
          -webkit-appearance: none;
          appearance: none;
        }
        .apply-shell textarea.input { min-height: 88px; resize: vertical; }
        .apply-shell .input::placeholder { color: #a8a59c; }
        .apply-shell .input:hover { border-color: #cfccc3; }
        .apply-shell .input:focus {
          background: #fff;
          border-color: var(--gold-deep, #bd7420);
          box-shadow: 0 0 0 3px rgba(189,116,32,.15);
        }
        .apply-shell select.input {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a877e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
        }
      `}</style>
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );
}

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm ring-1 ring-ink-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-ink-100">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold-500 text-white text-xs font-bold shrink-0">
          {step}
        </span>
        <h2 className="text-base font-bold text-ink-900 tracking-tight">
          {title}
        </h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-ink-500 inline-flex items-center gap-1">
        {label}
        {required && (
          <span className="text-gold-600 text-sm leading-none">*</span>
        )}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
