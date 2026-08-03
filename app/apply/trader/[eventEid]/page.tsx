/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  useState,
  use,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { ConfettiBurst } from "@/components/apply/ConfettiBurst";
import { ApiError } from "@/lib/apiClient";
import { eventPageUrl } from "@/lib/eventPageUrl";
import {
  useTraderPublic,
  useSubmitTraderApplication,
  isTraderCategoryOpenToday,
  traderCategoryAvailabilityLabel,
  type TraderApplicationBody,
} from "@/lib/traderApply";

/**
 * Public trader application form.
 *
 *   /apply/trader/[eventEid]
 *
 * Mirrors the show car apply page: a category dropdown plus business
 * + contact fields. Free-only for now. Next.js 15: params is a
 * Promise, unwrapped with React.use().
 */

type FormState = Omit<TraderApplicationBody, "eventEid">;

const INITIAL_FORM: FormState = {
  categoryEid: "",
  businessName: "",
  description: "",
  pitchSize: "",
  powerRequired: false,
  powerDetails: "",
  website: "",
  instagram: "",
  tiktok: "",
  contactName: "",
  email: "",
  contactPhone: "",
  notes: "",
};

export default function TraderApplyPage({
  params,
}: {
  params: Promise<{ eventEid: string }>;
}) {
  const { eventEid } = use(params);
  const { data, isLoading, error } = useTraderPublic(eventEid);
  const submit = useSubmitTraderApplication();
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

  if (!data.traders_enabled) {
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-1">{data.event_title}</h1>
        <p className="text-sm text-ink-600">
          Trader applications aren't open for this event.
        </p>
      </PageShell>
    );
  }

  const categories = data.categories ?? [];
  if (categories.length === 0) {
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-1">{data.event_title}</h1>
        <p className="text-sm text-ink-600">
          The organiser hasn't published any trader categories yet. Check back
          soon.
        </p>
      </PageShell>
    );
  }

  if (submit.isSuccess) {
    return (
      <PageShell>
        <ConfettiBurst />
        <div className="flex flex-col items-center text-center py-6">
          <span className="flex items-center justify-center w-16 h-16 rounded-full bg-gold-500 text-white mb-5 shadow-sm shadow-gold-500/30">
            <i className="fa-solid fa-check text-2xl" aria-hidden />
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight mb-3">
            Application received
          </h1>
          <p className="text-sm text-ink-700 leading-relaxed max-w-md">
            Thanks for applying to trade at <strong>{data.event_title}</strong>.
            The organiser will review your application and email you with next
            steps.
          </p>
          <a
            href={eventPageUrl(data.event_id)}
            className="mt-7 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition"
          >
            Continue
            <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
          </a>
        </div>
      </PageShell>
    );
  }

  const selected = categories.find((c) => c.encrypted_id === form.categoryEid);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.categoryEid) return;
    try {
      await submit.mutateAsync({ ...form, eventEid });
    } catch {
      // surfaced below the button via submit.error
    }
  };

  const update =
    (field: keyof FormState) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value =
        e.target instanceof HTMLInputElement && e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
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
          Trader Application
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight mb-3 leading-[1.05]">
          {data.event_title}
        </h1>
        <p className="text-sm text-ink-600 leading-relaxed">
          Apply for a trade stand at this event. Approved traders will be
          emailed next steps.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section step={1} title="Category">
          <Field label="Trader category" required>
            <select
              className="input"
              value={form.categoryEid}
              onChange={update("categoryEid")}
              required
            >
              <option value="">Select a category…</option>
              {categories.map((c) => {
                const open = isTraderCategoryOpenToday(c);
                const disabled = c.is_full || !open;
                return (
                  <option
                    key={c.encrypted_id}
                    value={c.encrypted_id}
                    disabled={disabled}
                  >
                    {c.name}
                    {traderCategoryAvailabilityLabel(c)}
                    {!open ? " · closed" : ""}
                  </option>
                );
              })}
            </select>
          </Field>
          {selected?.description && (
            <p className="text-xs text-ink-500 mt-1">{selected.description}</p>
          )}
        </Section>

        <Section step={2} title="Business details">
          <Field label="Business name" required>
            <input
              className="input"
              value={form.businessName}
              onChange={update("businessName")}
              required
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={update("description")}
              placeholder="What you sell / offer"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Pitch size" required>
              <input
                className="input"
                value={form.pitchSize}
                onChange={update("pitchSize")}
                placeholder="e.g. 3m x 3m"
                required
              />
            </Field>
            <Field label="Website (optional)">
              <input
                className="input"
                type="url"
                value={form.website}
                onChange={update("website")}
                placeholder="https://…"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.powerRequired}
              onChange={update("powerRequired")}
            />
            I need access to power
          </label>
          {form.powerRequired && (
            <Field label="Power details (optional)">
              <input
                className="input"
                value={form.powerDetails}
                onChange={update("powerDetails")}
                placeholder="e.g. 1x 13A socket"
              />
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Instagram (optional)">
              <input
                className="input"
                value={form.instagram}
                onChange={update("instagram")}
                placeholder="@yourbusiness"
              />
            </Field>
            <Field label="TikTok (optional)">
              <input
                className="input"
                value={form.tiktok}
                onChange={update("tiktok")}
                placeholder="@yourbusiness"
              />
            </Field>
          </div>
        </Section>

        <Section step={3} title="Contact">
          <Field label="Contact name" required>
            <input
              className="input"
              value={form.contactName}
              onChange={update("contactName")}
              required
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email" required>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={update("email")}
                required
              />
            </Field>
            <Field label="Telephone" required>
              <input
                className="input"
                type="tel"
                value={form.contactPhone}
                onChange={update("contactPhone")}
                required
              />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={update("notes")}
              placeholder="Anything else the organiser should know"
            />
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
            !form.categoryEid ||
            !selected ||
            selected.is_full ||
            !isTraderCategoryOpenToday(selected)
          }
          className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
        >
          {submit.isPending && (
            <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden />
          )}
          {submit.isPending ? "Submitting…" : "Submit Trader Application"}
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
