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
  useShowCarPublic,
  useSubmitShowCarApplication,
  isCategoryOpenToday,
  categoryAvailabilityLabel,
  uploadShowCarPhoto,
  type ShowCarApplicationBody,
  type ShowCarPublicCategory,
} from "@/lib/showCarApply";

/**
 * Public show-car application form.
 *
 *   /apply/show-car/[eventEid]
 *
 * Route param is the encrypted event id (same one used everywhere
 * else). The page fetches event title + categories, renders a
 * dropdown + the standard applicant/car fields, and posts to
 * /event-show-car-apply.
 *
 * After a successful submit the form is replaced by a "thanks"
 * panel — no redirect, since end users may have arrived via QR or
 * direct link and there's no canonical "back" route to send them
 * to. Organisers will email next steps once they review.
 *
 * Submit flow with photo:
 *   1. If a file was attached, upload to Cloudflare first
 *      (uploadShowCarPhoto handles the two-step CF dance).
 *   2. POST the application body with the resulting CF URL in
 *      photoUrl, or empty string when no photo.
 *
 * Either step can fail; both error paths surface inline above the
 * button and re-enable submit so the user can retry.
 *
 * Next.js 15 note: route params are now a Promise on the server and
 * must be unwrapped via `React.use()` in client components. Doing
 * this silences the "params is a Promise" warning and avoids the
 * value coming through as something unusable in stricter Next builds.
 */

type FormState = Omit<ShowCarApplicationBody, "eventEid">;

const INITIAL_FORM: FormState = {
  ticketEid: "",
  firstName: "",
  lastName: "",
  email: "",
  carMake: "",
  carModel: "",
  carYear: "",
  carReg: "",
  carColor: "",
  notes: "",
  photoUrl: "",
};

export default function ShowCarApplyPage({
  params,
}: {
  params: Promise<{ eventEid: string }>;
}) {
  const { eventEid } = use(params);
  const { data, isLoading, error } = useShowCarPublic(eventEid);
  const submit = useSubmitShowCarApplication();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // Photo state is held separately from the form body so we can
  // upload during submit (rather than on file select) and keep the
  // form body URL-only at all times.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // ----- Loading + error states ----------------------------------
  if (isLoading) {
    return (
      <PageShell>
        <p className="text-sm text-ink-500">Loading…</p>
      </PageShell>
    );
  }
  if (error || !data) {
    // Surface the actual error message rather than a blanket "not
    // found" — 404s, network failures, and validation rejections all
    // reach this branch and the user (and we, debugging) needs to be
    // able to tell them apart.
    const message = error
      ? error instanceof ApiError
        ? error.status === 404
          ? "We couldn't find this event. The link may be wrong or the event may have been removed."
          : error.message || "Couldn't load this event."
        : error.message || "Couldn't load this event."
      : "Couldn't load this event.";
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-2">Couldnt load this event</h1>
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
  if (!data.show_cars_enabled) {
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-1">{data.event_title}</h1>
        <p className="text-sm text-ink-600">
          Show car applications arent open for this event.
        </p>
      </PageShell>
    );
  }
  if (data.categories.length === 0) {
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-1">{data.event_title}</h1>
        <p className="text-sm text-ink-600">
          The organiser hasn&apos;t published any show car categories yet. Check back
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
          Thanks for applying to display your car at{" "}
          <strong>{data.event_title}</strong>. The organiser will review your
          application and email you with next steps — typically within a few
          days.
        </p>
      </PageShell>
    );
  }

  // ----- Selected category context -------------------------------
  const selected = data.categories.find(
    (c) => c.encrypted_id === form.ticketEid,
  );

  // ----- Submit --------------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ticketEid) return;

    // Upload photo first (if attached) so we have a CF URL to put
    // in the body. We deliberately don't pre-upload on file select
    // — keeping it tied to submit means a user who picks a file
    // then bails doesn't leave an orphan CF image behind. (They
    // still can if upload succeeds but submit fails; that's the
    // small cost of doing this client-side without a "draft"
    // model.)
    let photoUrl = "";
    if (photoFile) {
      setPhotoUploading(true);
      setPhotoError(null);
      try {
        photoUrl = await uploadShowCarPhoto({
          eventEid,
          file: photoFile,
        });
      } catch (err) {
        setPhotoError(
          err instanceof Error ? err.message : "Couldn't upload that photo.",
        );
        setPhotoUploading(false);
        return; // bail before posting the application
      }
      setPhotoUploading(false);
    }

    try {
      await submit.mutateAsync({ ...form, eventEid, photoUrl });
    } catch {
      // error surfaces below the submit button via submit.error.
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoError(null);
    setPhotoFile(file);
    // Free the previous preview before swapping in the new one so
    // we don't leak blob URLs as the user picks repeatedly.
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
  };

  const update =
    (field: keyof FormState) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };

  const submitError = submit.error
    ? submit.error instanceof ApiError
      ? submit.error.message
      : submit.error.message || "Something went wrong. Please try again."
    : null;

  // ----- Form ----------------------------------------------------
  return (
    <PageShell>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-ink-500 mb-1">
          Show Car Application
        </p>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">
          {data.event_title}
        </h1>
        <p className="text-sm text-ink-600">
          Apply to display your car at this event. Approved applicants will be
          emailed next steps.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Category">
          <Field label="Show car category" required>
            <select
              required
              className="input"
              value={form.ticketEid}
              onChange={update("ticketEid")}
            >
              <option value="">Select a category</option>
              {data.categories.map((c) => (
                <option
                  key={c.encrypted_id}
                  value={c.encrypted_id}
                  disabled={c.is_full || !isCategoryOpenToday(c)}
                >
                  {c.name} — {categoryAvailabilityLabel(c)}
                </option>
              ))}
            </select>
          </Field>
          {selected && <SelectedCategoryDetails category={selected} />}
        </Section>

        <Section title="Your details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name" required>
              <input
                className="input"
                type="text"
                required
                value={form.firstName}
                onChange={update("firstName")}
              />
            </Field>
            <Field label="Last name" required>
              <input
                className="input"
                type="text"
                required
                value={form.lastName}
                onChange={update("lastName")}
              />
            </Field>
          </div>
          <Field label="Email" required>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
            />
          </Field>
        </Section>

        <Section title="Your car">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Make" required>
              <input
                className="input"
                type="text"
                required
                value={form.carMake}
                onChange={update("carMake")}
              />
            </Field>
            <Field label="Model" required>
              <input
                className="input"
                type="text"
                required
                value={form.carModel}
                onChange={update("carModel")}
              />
            </Field>
            <Field label="Year" required>
              <input
                className="input"
                type="text"
                inputMode="numeric"
                required
                value={form.carYear}
                onChange={update("carYear")}
              />
            </Field>
            <Field label="Registration" required>
              <input
                className="input"
                type="text"
                required
                value={form.carReg}
                onChange={update("carReg")}
              />
            </Field>
            <Field label="Colour">
              <input
                className="input"
                type="text"
                value={form.carColor}
                onChange={update("carColor")}
              />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={update("notes")}
              placeholder="Anything the organiser should know — build details, special access requirements, etc."
            />
          </Field>

          <Field label="Photo (optional)">
            {!photoPreview ? (
              <label className="block cursor-pointer border-2 border-dashed border-ink-300 rounded-lg p-6 text-center hover:border-gold-400 transition">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
                <i
                  className="fa-solid fa-camera text-2xl text-ink-400 mb-2"
                  aria-hidden
                />
                <p className="text-sm text-ink-600">
                  Click to upload a photo of your car
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  JPG, PNG, or WEBP. Max ~10MB.
                </p>
              </label>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  disabled={photoUploading}
                  className="absolute top-2 right-2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}
            {photoError && (
              <p className="text-sm text-red-600 mt-2" role="alert">
                {photoError}
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
            photoUploading ||
            !form.ticketEid ||
            !selected ||
            selected.is_full ||
            !isCategoryOpenToday(selected)
          }
          className="w-full py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition inline-flex items-center justify-center gap-2"
        >
          {(submit.isPending || photoUploading) && (
            <i className="fa-solid fa-spinner fa-spin text-xs" aria-hidden />
          )}
          {photoUploading
            ? "Uploading photo…"
            : submit.isPending
              ? "Submitting…"
              : "Submit application"}
        </button>
      </form>
    </PageShell>
  );
}

// ============================================================
// Subcomponents
// ============================================================

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

function SelectedCategoryDetails({
  category,
}: {
  category: ShowCarPublicCategory;
}) {
  return (
    <div className="mt-3 p-3 bg-ink-50 border border-ink-100 rounded-lg space-y-1.5">
      {category.description && (
        <p className="text-sm text-ink-700">{category.description}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
        <span>
          {category.require_ticket
            ? `£${category.ticket_cost.toFixed(2)} on approval`
            : "Free entry on approval"}
        </span>
        {category.spaces_remaining !== null && (
          <span>{category.spaces_remaining} spaces remaining</span>
        )}
        {category.applications_close && (
          <span>Applications close {category.applications_close}</span>
        )}
      </div>
    </div>
  );
}
