/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  useState,
  use,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useRef,
  useEffect,
} from "react";

import { useSearchParams } from "next/navigation";
import {
  APPLY_THEME_PARAM,
  applyShellClass,
  parseApplyTheme,
} from "@/lib/applyTheme";
import { ApiError } from "@/lib/apiClient";
import {
  formatRegionCurrency,
  formatRegionShortDate,
  regionFromSite,
  type Region,
} from "@/lib/regions";
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
 * panel - no redirect, since end users may have arrived via QR or
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
  phone: "",
  carMake: "",
  carModel: "",
  carYear: "",
  carReg: "",
  carColor: "",
  attendingWithClub: "no",
  carClub: "",
  instagram: "",
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
  // Currency and date order for the event's own site. The public
  // endpoint doesn't send a site block yet, so this resolves to the
  // API's default region until it does.
  const region = regionFromSite(data?.site);
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
    // found" - 404s, network failures, and validation rejections all
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
  if (!data.show_cars_enabled) {
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-1">{data.event_title}</h1>
        <p className="text-sm text-ink-600">
          Show car applications aren't open for this event.
        </p>
      </PageShell>
    );
  }
  if (data.categories.length === 0) {
    return (
      <PageShell>
        <h1 className="text-xl font-bold mb-1">{data.event_title}</h1>
        <p className="text-sm text-ink-600">
          The organiser hasn't published any show car categories yet. Check back
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
            Thanks for applying to display your car at{" "}
            <strong>{data.event_title}</strong>. The organiser will review your
            application and email you with next steps - typically within a few
            days.
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
    // - keeping it tied to submit means a user who picks a file
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
      <header className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold-600 font-bold mb-2">
          Show Car Application
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight mb-3 leading-[1.05]">
          {data.event_title}
        </h1>
        <p className="text-sm text-ink-600 leading-relaxed">
          Apply to display your car at this event. Approved applicants will be
          emailed next steps.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section step={1} title="Category">
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
                  {c.name} - {categoryAvailabilityLabel(c, region)}
                </option>
              ))}
            </select>
          </Field>
          {selected && (
            <SelectedCategoryDetails category={selected} region={region} />
          )}
        </Section>

        <Section step={2} title="Your details">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" required>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={update("email")}
              />
            </Field>
            <Field label="Phone number" required>
              <input
                className="input"
                type="tel"
                required
                value={form.phone}
                onChange={update("phone")}
              />
            </Field>
          </div>
        </Section>

        <Section step={3} title="Your car">
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

          {/* Car club - the name field only appears once "Yes" is
              picked, and is cleared again on switching back to "No"
              so a stale club name can't be submitted. */}
          <Field label="Are you attending with a car club?" required>
            <div className="flex gap-3">
              {(["no", "yes"] as const).map((opt) => (
                <label
                  key={opt}
                  className={[
                    "flex-1 cursor-pointer rounded-lg border-2 px-4 py-2.5 text-center text-sm font-semibold capitalize transition",
                    form.attendingWithClub === opt
                      ? "border-gold-500 bg-gold-50 text-gold-700"
                      : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="attendingWithClub"
                    className="sr-only"
                    value={opt}
                    checked={form.attendingWithClub === opt}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        attendingWithClub: opt,
                        carClub: opt === "yes" ? f.carClub : "",
                      }))
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
          </Field>

          {form.attendingWithClub === "yes" && (
            <Field label="Car club name" required>
              <input
                className="input"
                type="text"
                required
                value={form.carClub}
                onChange={update("carClub")}
              />
            </Field>
          )}

          <Field label="Instagram username">
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-ink-400"
              >
                @
              </span>
              <input
                className="input"
                style={{ paddingLeft: 30 }}
                type="text"
                value={form.instagram}
                onChange={(e) =>
                  // Strip a leading @ so the prefix isn't doubled up.
                  setForm((f) => ({
                    ...f,
                    instagram: e.target.value.replace(/^@+/, ""),
                  }))
                }
                placeholder="yourhandle"
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-500">
              Your Instagram handle, without the @.
            </p>
          </Field>

          <Field label="Notes (optional)">
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={update("notes")}
              placeholder="Anything the organiser should know - build details, special access requirements, etc."
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
          className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 active:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm shadow-gold-500/20 transition inline-flex items-center justify-center gap-2"
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

/**
 * Public event page on the main site.
 *
 * The /event-show-cars-public payload gives us `event_id` but no
 * permalink, so we use WordPress' canonical post URL - it 302s to the
 * pretty permalink, which means we don't need the slug and can't
 * produce a broken link if the organiser renames the event. Same
 * shape the editor's Preview button uses.
 */
const CAREVENTS_BASE =
  process.env.NEXT_PUBLIC_CAREVENTS_URL || "https://www.carevents.com/uk";

function eventPageUrl(eventId: number): string {
  return `${CAREVENTS_BASE}/?post_type=events&p=${eventId}`;
}

/**
 * One-shot gold-and-black confetti burst, fired on mount.
 *
 * Hand-rolled on a canvas rather than pulling in a confetti package -
 * this is ~60 lines and the public apply pages are the only thing
 * that needs it, so a dependency (and its bundle cost on a page users
 * hit once) isn't worth it.
 *
 * Particles fire radially from just above centre with an upward bias,
 * then fall under gravity and fade out. The canvas unmounts itself
 * once the last particle is done so it isn't left sitting over the
 * page swallowing nothing.
 */
function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Respect reduced-motion - a full-screen particle explosion is
    // exactly the kind of thing that setting exists for.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cap DPR at 2 - beyond that we're paying for pixels nobody can
    // see on a 200-frame animation.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const COLORS = [
      "#e8c06a", // gold
      "#b89855", // gold, deeper
      "#f4dfa8", // gold, pale
      "#bd7420", // gold, burnt
      "#141414", // black
      "#2e2e2e", // off-black
    ];
    const COUNT = 150;
    const MAX_LIFE = 190;
    const originX = width / 2;
    const originY = height * 0.34;

    const particles = Array.from({ length: COUNT }, (_, i) => {
      // Even angular spread with a jitter, so the burst reads as a
      // ring rather than clumping wherever Math.random happened to go.
      const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.3;
      const speed = 4 + Math.random() * 9;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        w: 5 + Math.random() * 5,
        h: 8 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: COLORS[i % COLORS.length] as string,
      };
    });

    let frame = 0;
    let raf = 0;

    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.vy += 0.19; // gravity
        p.vx *= 0.99; // air drag
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        // Hold full opacity for most of the run, then fade over the
        // last quarter so it ends softly instead of blinking out.
        const fadeFrom = MAX_LIFE * 0.75;
        ctx.globalAlpha =
          frame < fadeFrom ? 1 : 1 - (frame - fadeFrom) / (MAX_LIFE - fadeFrom);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (frame < MAX_LIFE) {
        raf = window.requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
    />
  );
}

function PageShell({ children }: { children: ReactNode }) {
  // `?theme=dark` inverts the palette - see lib/applyTheme.ts. Read
  // here rather than passed down so the standalone page and the
  // embedded copy pick it up identically: the iframe's own src carries
  // the param, and useSearchParams reads whatever URL it was framed at.
  const theme = parseApplyTheme(useSearchParams()?.get(APPLY_THEME_PARAM));
  return (
    <div
      className={`${applyShellClass(theme)} min-h-screen bg-gradient-to-b from-ink-50 to-ink-100/40 py-8 sm:py-14 px-4`}
    >
      {/* Scoped input styling so the form looks right independent of
          the global .input rule. Targets inputs/selects/textareas
          inside this page only. */}
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

/**
 * A numbered section card. The form is a genuine sequence (choose a
 * category → your details → your car), so the numbers encode real
 * order rather than decorating. Gold index chip + title, soft card.
 */
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

function SelectedCategoryDetails({
  category,
  region,
}: {
  category: ShowCarPublicCategory;
  region: Region;
}) {
  return (
    <div className="mt-3 p-3 bg-ink-50 border border-ink-100 rounded-lg space-y-1.5">
      {category.description && (
        <p className="text-sm text-ink-700">{category.description}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
        <span>
          {category.require_ticket
            ? `${formatRegionCurrency(category.ticket_cost, region)} on approval`
            : "Free entry on approval"}
        </span>
        {category.spaces_remaining !== null && (
          <span>{category.spaces_remaining} spaces remaining</span>
        )}
        {category.applications_close && (
          <span>
            Applications close{" "}
            {formatRegionShortDate(category.applications_close, region, true)}
          </span>
        )}
      </div>
    </div>
  );
}
