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
        <h1 className="text-2xl font-bold mb-2">Application received</h1>
        <p className="text-sm text-ink-700">
          Thanks for applying to trade at <strong>{data.event_title}</strong>.
          The organiser will review your application and email you with next
          steps.
        </p>
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
      <h1 className="text-2xl font-bold mb-1">Trader Application</h1>
      <p className="text-sm text-ink-600 mb-6">{data.event_title}</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title="Category">
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

        <Section title="Business details">
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

        <Section title="Contact">
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
          className="w-full py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition inline-flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-ink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink-900 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
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
      <span className="text-xs uppercase tracking-wider font-semibold text-ink-500">
        {label}
        {required && " *"}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
