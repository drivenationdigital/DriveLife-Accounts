"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocationAutocomplete } from "@/components/event-create/LocationAutocomplete";
import { EditorTextarea } from "@/components/event-create/EditorTextarea";
import {
  useVenueEditQuery,
  useUpdateVenue,
  useUploadVenueImage,
  useDeleteVenue,
} from "@/lib/myVenues";
import { useConfirm } from "@/context/ConfirmContext";

/**
 * Edit Venue — multi-step wizard (UI only, no persistence yet).
 * Steps: Basic Details → Venue Profile → Venue Description → Publish.
 *
 * Styled with Tailwind + the app's gold/ink tokens. Local state holds
 * the field values and current step so the flow is clickable; wiring to
 * the API comes later.
 */

const STEPS = [
  { key: "basic", label: "Basic Details" },
  { key: "profile", label: "Venue Profile" },
  { key: "description", label: "Venue Description" },
  { key: "publish", label: "Publish" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface VenueForm {
  title: string;
  location: string;
  latitude: string;
  longitude: string;
  logo: string | null;
  cover: string | null;
  email: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  description: string;
  status: "publish" | "draft";
}

const EMPTY: VenueForm = {
  title: "",
  location: "",
  latitude: "",
  longitude: "",
  logo: null,
  cover: null,
  email: "",
  phone: "",
  website: "",
  facebook: "",
  instagram: "",
  description: "",
  status: "draft",
};

// Which fields each step validates (for gating "Next Step").
const STEP_FIELDS: Record<StepKey, (keyof VenueForm)[]> = {
  basic: ["title", "location"],
  profile: ["email", "website", "facebook", "instagram"],
  description: [],
  publish: [],
};

/** A URL is valid with or without the protocol (we prepend https:// to
 *  test), as long as it has a dotted hostname. */
function isValidUrl(raw: string): boolean {
  let candidate = raw.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const u = new URL(candidate);
    return !!u.hostname && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Returns an error message for a field, or null if valid. Optional
 *  fields pass when empty; title/location are required. */
function validateField(key: keyof VenueForm, value: string): string | null {
  const v = (value ?? "").trim();

  if (!v) {
    if (key === "title" || key === "location") return "This field is required.";
    return null; // optional fields are fine when blank
  }

  switch (key) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? null
        : "Enter a valid email address.";
    case "website":
      return isValidUrl(v) ? null : "Enter a valid website URL.";
    case "facebook":
      return isValidUrl(v) ? null : "Enter a valid Facebook page URL.";
    case "instagram": {
      const handle = v.replace(/^@+/, "");
      return /^[a-zA-Z0-9._]{1,30}$/.test(handle)
        ? null
        : "Use letters, numbers, periods and underscores only.";
    }
    default:
      return null;
  }
}

export default function EditVenuePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId: vid } = use(params);
  const router = useRouter();
  const confirm = useConfirm();

  const [step, setStep] = useState<StepKey>("basic");
  const [form, setForm] = useState<VenueForm>(EMPTY);
  const [touched, setTouched] = useState<
    Partial<Record<keyof VenueForm, boolean>>
  >({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // ── Load ────────────────────────────────────────────────────────
  const { data, isLoading, error } = useVenueEditQuery(vid);
  const updateVenue = useUpdateVenue();

  useEffect(() => {
    if (!data) return;
    const v = data.venue;
    setForm({
      title: v.title,
      location: v.location,
      latitude: v.latitude,
      longitude: v.longitude,
      logo: v.logo?.url ?? null,
      cover: v.coverImage?.url ?? null,
      email: v.email,
      phone: v.phone,
      website: v.website,
      facebook: v.facebook,
      instagram: v.instagram,
      description: v.description,
      status: v.status,
    });
  }, [data]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const set = <K extends keyof VenueForm>(key: K, value: VenueForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const markTouched = (key: keyof VenueForm) =>
    setTouched((t) => ({ ...t, [key]: true }));

  // Validate every relevant field; recomputed as the form changes.
  const errors = useMemo(() => {
    const e: Partial<Record<keyof VenueForm, string | null>> = {};
    (
      [
        "title",
        "location",
        "email",
        "website",
        "facebook",
        "instagram",
      ] as const
    ).forEach((k) => {
      e[k] = validateField(k, form[k]);
    });
    return e;
  }, [form]);

  const currentStepValid = STEP_FIELDS[step].every((f) => !errors[f]);

  const goNext = () => {
    // If the current step has invalid fields, reveal their errors and
    // stay put instead of advancing.
    if (!currentStepValid) {
      setTouched((t) => {
        const next = { ...t };
        STEP_FIELDS[step].forEach((f) => (next[f] = true));
        return next;
      });
      return;
    }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.key);
  };
  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.key);
  };

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError(null);
    // Block save while required fields are invalid; reveal their errors.
    const required = ["title", "location"] as const;
    if (required.some((f) => errors[f])) {
      setTouched((t) => ({ ...t, title: true, location: true }));
      setStep("basic");
      return;
    }
    try {
      await updateVenue.mutateAsync({
        vid,
        post_title: form.title.trim(),
        venue_location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        description: form.description,
        venue_email: form.email,
        venue_phone: form.phone,
        website: form.website,
        facebook: form.facebook,
        instagram: form.instagram,
        post_status: form.status,
      });
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Couldn't save your changes.",
      );
    }
  };

  const saving = updateVenue.isPending;

  // ── Delete ──────────────────────────────────────────────────────
  const deleteVenue = useDeleteVenue();

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this venue?",
      message:
        "This will remove the venue. This can't be undone from here. Are you sure?",
      confirmLabel: "Delete Venue",
      cancelLabel: "Keep Venue",
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteVenue.mutateAsync({ vid });
      router.push("/venues");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Couldn't delete the venue.",
      );
    }
  };

  // ── Image upload ────────────────────────────────────────────────
  const uploadVenueImage = useUploadVenueImage();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [uploadError, setUploadError] = useState<Record<string, string | null>>(
    {},
  );

  const handleUpload = async (
    group: "logo" | "cover",
    file: File,
    previewUrl: string,
  ) => {
    // Instant local preview.
    set(group === "logo" ? "logo" : "cover", previewUrl);
    setUploadError((e) => ({ ...e, [group]: null }));
    setUploadProgress((p) => ({ ...p, [group]: 0 }));

    const rawId = data?.venue.id;
    if (!rawId) {
      setUploadError((e) => ({ ...e, [group]: "Venue not loaded yet." }));
      return;
    }

    try {
      await uploadVenueImage.mutateAsync({
        venueId: rawId,
        encryptedId: vid,
        file,
        mediaGroup: group,
        onProgress: (percent) =>
          setUploadProgress((p) => ({ ...p, [group]: percent })),
      });
    } catch (err) {
      setUploadError((e) => ({
        ...e,
        [group]:
          err instanceof Error ? err.message : "Couldn't upload that image.",
      }));
    } finally {
      setUploadProgress((p) => {
        const next = { ...p };
        delete next[group];
        return next;
      });
    }
  };

  // Load / error states — don't render an empty wizard over no data.
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-ink-100">
            <p className="text-sm text-ink-500">Loading venue…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-ink-100">
            <p className="text-sm font-semibold text-red-500">
              Couldn&apos;t load this venue.
            </p>
            <p className="mt-1 text-sm text-ink-500">{error.message}</p>
            <Link
              href="/venues"
              className="mt-6 inline-block rounded-xl bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
            >
              Back to venues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 md:px-6">
        {/* Left step nav */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="mb-6">
            <Link
              href="/venues"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400 transition hover:text-gold-600"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to venues
            </Link>
            <h2 className="mt-2 text-lg font-extrabold text-ink-900">
              Edit Venue
            </h2>
          </div>
          <nav className="space-y-1.5">
            {STEPS.map((s, i) => {
              const active = s.key === step;
              const done = i < stepIndex;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStep(s.key)}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition",
                    active
                      ? "bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-sm shadow-gold-500/25"
                      : "text-ink-500 hover:bg-white hover:text-ink-800 hover:shadow-sm",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition",
                      active
                        ? "bg-white/25 text-white"
                        : done
                          ? "bg-gold-100 text-gold-700"
                          : "bg-ink-100 text-ink-400",
                    ].join(" ")}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Panel */}
        <main className="flex-1">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            {/* Gold accent bar */}
            <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />
            <div className="p-8 md:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
                Edit Venue
              </p>
              <h1 className="mt-1 text-center text-2xl font-extrabold text-ink-900 md:text-3xl">
                {step === "basic" && "Basic Details"}
                {step === "profile" && "Your venue profile"}
                {step === "description" && "Describe your venue"}
                {step === "publish" && "Save and Publish"}
              </h1>
              <div className="mx-auto mt-6 mb-8 h-px w-full bg-gradient-to-r from-transparent via-ink-100 to-transparent" />

              {step === "basic" && (
                <BasicStep
                  form={form}
                  set={set}
                  errors={errors}
                  touched={touched}
                  markTouched={markTouched}
                />
              )}
              {step === "profile" && (
                <ProfileStep
                  form={form}
                  set={set}
                  errors={errors}
                  touched={touched}
                  markTouched={markTouched}
                  onUpload={handleUpload}
                  uploadProgress={uploadProgress}
                  uploadError={uploadError}
                />
              )}
              {step === "description" && (
                <DescriptionStep form={form} set={set} />
              )}
              {step === "publish" && <PublishStep form={form} set={set} />}

              {/* Actions */}
              <div className="mt-10 flex items-center justify-center gap-3">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="rounded-xl bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
                  >
                    Go Back
                  </button>
                )}
                {step !== "publish" ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-8 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Update Venue"}
                  </button>
                )}
              </div>

              {(justSaved || saveError) && (
                <p
                  className={`mt-4 text-center text-xs font-semibold ${
                    saveError ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {saveError ?? "Saved ✓"}
                </p>
              )}

              {step === "publish" && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteVenue.isPending}
                    className="text-xs font-semibold uppercase tracking-wide text-ink-500 underline underline-offset-4 transition hover:text-red-500 disabled:opacity-50"
                  >
                    {deleteVenue.isPending ? "Deleting…" : "Delete Venue"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Shared field bits ────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-bold text-ink-900">
      {children}
      {required && <span className="ml-0.5 text-gold-600">*</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border bg-ink-50/40 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:bg-white focus:outline-none focus:ring-2";

function inputClasses(hasError?: boolean): string {
  return `${inputBase} ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-ink-200 focus:border-gold-500 focus:ring-gold-500/20"
  }`;
}

// Kept for the select in the Publish step.
const inputCls = inputClasses(false);

type FieldKey = keyof VenueForm;

interface StepProps {
  form: VenueForm;
  set: <K extends keyof VenueForm>(k: K, v: VenueForm[K]) => void;
  errors: Partial<Record<FieldKey, string | null>>;
  touched: Partial<Record<FieldKey, boolean>>;
  markTouched: (k: FieldKey) => void;
}

/** Text input with label, optional hint, and blur-triggered inline
 *  error. Error shows only once the field has been touched. */
function TextField({
  field,
  label,
  required,
  hint,
  placeholder,
  type,
  form,
  set,
  errors,
  touched,
  markTouched,
}: {
  field: FieldKey;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  type?: string;
} & StepProps) {
  const error = errors[field];
  const showError = Boolean(touched[field] && error);
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      {hint && <p className="-mt-1 mb-2 text-xs text-ink-400">{hint}</p>}
      <input
        className={inputClasses(showError)}
        value={String(form[field] ?? "")}
        onChange={(e) => set(field, e.target.value as VenueForm[typeof field])}
        onBlur={() => markTouched(field)}
        placeholder={placeholder}
        type={type}
        aria-invalid={showError}
      />
      {showError && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Step 1: Basic Details ────────────────────────────────────────────

function BasicStep({ form, set, errors, touched, markTouched }: StepProps) {
  const locError = Boolean(touched.location && errors.location);
  return (
    <div className="space-y-6">
      <div>
        <TextField
          field="title"
          label="Venue Title"
          required
          placeholder="Venue title"
          form={form}
          set={set}
          errors={errors}
          touched={touched}
          markTouched={markTouched}
        />
        <p className="mt-1 text-right text-xs text-ink-400">
          Max 60 characters
        </p>
      </div>
      <div>
        <FieldLabel required>Venue Location</FieldLabel>
        <LocationAutocomplete
          value={form.location}
          onValueChange={(text) => set("location", text)}
          onPlacePicked={(place) => {
            set("location", place.address || place.name);
            set("latitude", String(place.coords.lat));
            set("longitude", String(place.coords.lng));
            markTouched("location");
          }}
          placeholder="Search for the venue address"
        />
        {locError && (
          <p className="mt-1 text-xs text-red-500">{errors.location}</p>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Venue Profile ────────────────────────────────────────────

function ProfileStep({
  form,
  set,
  errors,
  touched,
  markTouched,
  onUpload,
  uploadProgress,
  uploadError,
}: StepProps & {
  onUpload: (group: "logo" | "cover", file: File, previewUrl: string) => void;
  uploadProgress: Record<string, number>;
  uploadError: Record<string, string | null>;
}) {
  const shared = { form, set, errors, touched, markTouched };
  return (
    <div className="space-y-6">
      <div>
        <ImageUploadRow
          title="Venue Logo"
          hint="Ideal size: 800px x 800px"
          preview={form.logo}
          onPick={(file, url) => onUpload("logo", file, url)}
        />
        <UploadStatus percent={uploadProgress.logo} error={uploadError.logo} />
      </div>
      <div>
        <ImageUploadRow
          title="Venue Cover Image"
          description="Add an image that best represents your venue."
          hint="Ideal size: 1100px (width) x 500px (height)"
          preview={form.cover}
          onPick={(file, url) => onUpload("cover", file, url)}
        />
        <UploadStatus
          percent={uploadProgress.cover}
          error={uploadError.cover}
        />
      </div>

      <div className="h-px w-full bg-ink-100" />

      <TextField
        field="email"
        label="Venue Email Address"
        hint="In case anyone wants to contact the venue directly"
        type="email"
        {...shared}
      />
      <div>
        <FieldLabel>Venue Phone Number</FieldLabel>
        <input
          className={inputCls}
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </div>
      <TextField
        field="website"
        label="Venue Website"
        placeholder="example.com"
        {...shared}
      />
      <TextField
        field="facebook"
        label="Facebook Page URL"
        placeholder="facebook.com/yourvenue"
        {...shared}
      />
      <TextField
        field="instagram"
        label="Instagram Username"
        placeholder="yourvenue"
        {...shared}
        markTouched={(k) => {
          // Normalise the handle on blur: drop any leading @.
          if (k === "instagram") {
            const cleaned = form.instagram.trim().replace(/^@+/, "");
            if (cleaned !== form.instagram) set("instagram", cleaned);
          }
          markTouched(k);
        }}
      />
    </div>
  );
}

function ImageUploadRow({
  title,
  description,
  hint,
  preview,
  onPick,
}: {
  title: string;
  description?: string;
  hint: string;
  preview: string | null;
  onPick: (file: File, previewUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;
    const url = URL.createObjectURL(file);
    onPick(file, url);
  };

  return (
    <div className="flex gap-4 rounded-2xl border border-gold-100 bg-gradient-to-br from-gold-50/60 to-transparent p-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-100 transition hover:ring-2 hover:ring-gold-400"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-gold-400">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </span>
        )}
      </button>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-ink-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-ink-500">{description}</p>
        )}
        <p className="mt-0.5 text-xs text-ink-400">{hint}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-gold-500/20 transition hover:from-gold-600 hover:to-gold-700"
        >
          {preview ? "Replace" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

// ─── Step 3: Venue Description ────────────────────────────────────────

function DescriptionStep({
  form,
  set,
}: {
  form: VenueForm;
  set: <K extends keyof VenueForm>(k: K, v: VenueForm[K]) => void;
}) {
  return (
    <div>
      <FieldLabel>Tell us more about your venue</FieldLabel>
      <EditorTextarea
        value={form.description}
        onChange={(value) => set("description", value)}
        placeholder="Describe the venue, facilities, parking, what makes it special…"
      />
    </div>
  );
}

// ─── Step 4: Publish ──────────────────────────────────────────────────

function PublishStep({
  form,
  set,
}: {
  form: VenueForm;
  set: <K extends keyof VenueForm>(k: K, v: VenueForm[K]) => void;
}) {
  const isPublished = form.status === "publish";
  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Venue Status</FieldLabel>
        <div className="relative">
          <select
            className={`${inputCls} appearance-none pr-10`}
            value={form.status}
            onChange={(e) =>
              set("status", e.target.value as VenueForm["status"])
            }
          >
            <option value="draft">Unpublished</option>
            <option value="publish">Published</option>
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400">
            ▾
          </span>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-ink-100 to-transparent" />

      <ul className="space-y-2.5 rounded-2xl border border-gold-100 bg-gradient-to-br from-gold-50/50 to-transparent p-5 text-sm text-ink-700">
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "Your venue is live and visible to everyone."
            : "Your venue is currently unpublished."}
        </li>
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "You can share it anywhere."
            : "You will be able to view and share it once it’s live."}
        </li>
      </ul>
    </div>
  );
}

function CheckDot() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-[10px] font-bold text-white">
      ✓
    </span>
  );
}

/** Progress bar / error line under a venue image row. */
function UploadStatus({
  percent,
  error,
}: {
  percent?: number;
  error?: string | null;
}) {
  if (error) {
    return <p className="mt-2 text-xs text-red-500">{error}</p>;
  }
  if (percent === undefined) return null;
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-400">Uploading… {percent}%</p>
    </div>
  );
}
