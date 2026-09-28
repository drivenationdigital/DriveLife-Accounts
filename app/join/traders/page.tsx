"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/apiClient";
import { useRegister, registerErrorField, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import {
  useBusinessOptions,
  useCreateBusiness,
  useUpdateBusiness,
  useTradersCheckout,
  useTradersSync,
  type BusinessTradersDirectory,
} from "@/lib/myBusinesses";
import { businessEditPath } from "@/lib/siteRoutes";
import { parseRef } from "@/lib/siteRef";
import { REGION_LIST, DEFAULT_REGION_KEY, resolveRegion, type RegionKey } from "@/lib/regions";
import { PaymentMarks } from "@/components/ui/PaymentMarks";

/**
 * /join/traders - the public landing page for event traders.
 *
 * One page does the whole thing: create a CarEvents account (or sign
 * in), list the business, and pay for the Event Traders directory
 * membership through Stripe Checkout. Stripe sends the visitor back
 * here (?traders=success&session_id=…&bid=…) and the final step records
 * the membership and hands them on to the dashboard.
 *
 * The business is created as a DRAFT, and it's published the moment
 * the membership is confirmed, so a paid trader is live straight away
 * and can polish the profile from the dashboard afterwards.
 */

type Step = "account" | "business" | "pay" | "done";

const STORAGE_KEY = "ce:join-traders";

interface Saved {
  bid: string;
  site: RegionKey;
  title: string;
}

function readSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    return parsed && parsed.bid ? parsed : null;
  } catch {
    return null;
  }
}

function writeSaved(saved: Saved | null) {
  try {
    if (saved) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable - the flow still works within the page
  }
}

/**
 * The marketing sections render on the server (they're static); only
 * the three-step flow needs the query string and the auth cookie, so
 * it alone sits under the Suspense boundary and renders client-side.
 */
export default function JoinTradersPage() {
  return (
    <div className="min-h-screen bg-ink-50 text-ink-900">
      <Header />
      <Hero />
      <PaymentStrip />
      <HowItWorks />

      <section id="join" className="scroll-mt-6 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
              Join the directory
            </p>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl">
              Three quick steps
            </h2>
          </div>
          <Suspense fallback={<FlowSkeleton />}>
            <JoinFlow />
          </Suspense>
          <p className="mt-4 text-center text-xs text-ink-400">
            Payments are handled by Stripe. CarEvents.com never sees your card details.
          </p>
        </div>
      </section>

      <Faq />

      <footer className="border-t border-ink-200 bg-white px-4 py-8 text-center text-xs text-ink-400">
        <p>
          © {new Date().getFullYear()} CarEvents.com ·{" "}
          <a href="https://www.carevents.com" className="hover:text-ink-700">carevents.com</a> ·{" "}
          <Link href="/login" className="hover:text-ink-700">Sign in to your account</Link>
        </p>
      </footer>
    </div>
  );
}

function FlowSkeleton() {
  return (
    <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-ink-100" aria-hidden />
  );
}

/**
 * Where to start. Runs once, in a lazy state initialiser: this subtree
 * is client-rendered (useSearchParams under Suspense), so reading
 * sessionStorage and the auth cookie here is safe.
 */
function initialState(
  outcome: string | null,
  bidParam: string | null,
  isAuthenticated: boolean,
): { step: Step; site: RegionKey; saved: Saved | null } {
  const fromUrl = bidParam ? parseRef(bidParam) : null;
  const stored = typeof window !== "undefined" ? readSaved() : null;
  const saved: Saved | null =
    fromUrl && fromUrl.id
      ? { bid: fromUrl.id, site: resolveRegion(fromUrl.site).key, title: stored?.title ?? "" }
      : stored;
  const site = saved?.site ?? DEFAULT_REGION_KEY;
  let step: Step = "account";
  if (outcome === "success" && saved) step = "done";
  else if (outcome === "cancelled" && saved) step = "pay";
  else if (saved && isAuthenticated) step = "pay";
  else if (isAuthenticated) step = "business";
  return { step, site, saved };
}

function JoinFlow() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  // Returning from Stripe? The ref rides in ?bid=, the outcome in ?traders=.
  const outcome = searchParams.get("traders");
  const bidParam = searchParams.get("bid");
  const sessionId = searchParams.get("session_id");

  const [initial] = useState(() => initialState(outcome, bidParam, isAuthenticated));
  const [step, setStep] = useState<Step>(initial.step);
  const [site, setSite] = useState<RegionKey>(initial.site);
  const [saved, setSaved] = useState<Saved | null>(initial.saved);

  // Back from Stripe: land on the flow, not the top of the marketing page.
  useEffect(() => {
    if (!outcome) return;
    document.getElementById("join")?.scrollIntoView({ block: "start" });
  }, [outcome]);

  const options = useBusinessOptions(site);
  const priceLabel = options.data?.traders_directory.price_label ?? (site === "us" ? "$20 per year" : "£20 per year");

  return (
    <>
          <StepRail step={step} />

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
            <div className="p-6 sm:p-8">
              {step === "account" && (
                <AccountStep onDone={() => setStep("business")} />
              )}
              {step === "business" && (
                <BusinessStep
                  site={site}
                  onSiteChange={setSite}
                  signedInAs={user?.display_name ?? user?.email ?? ""}
                  onDone={(s) => {
                    setSaved(s);
                    writeSaved(s);
                    setStep("pay");
                  }}
                />
              )}
              {step === "pay" && saved && (
                <PayStep
                  saved={saved}
                  priceLabel={priceLabel}
                  cancelled={outcome === "cancelled"}
                  onStartOver={() => {
                    setSaved(null);
                    writeSaved(null);
                    setStep("business");
                  }}
                />
              )}
              {step === "pay" && !saved && (
                <BusinessStep
                  site={site}
                  onSiteChange={setSite}
                  signedInAs={user?.display_name ?? user?.email ?? ""}
                  onDone={(s) => {
                    setSaved(s);
                    writeSaved(s);
                    setStep("pay");
                  }}
                />
              )}
              {step === "done" && saved && (
                <DoneStep saved={saved} sessionId={sessionId} onFinished={() => writeSaved(null)} />
              )}
            </div>
          </div>
    </>
  );
}

// ─── Marketing sections ───────────────────────────────────────────────

function Header() {
  return (
    <header className="border-b border-ink-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="https://www.carevents.com" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo2-2.svg" alt="CarEvents.com" className="h-8 w-auto" />
        </a>
        <Link href="/login" className="text-sm font-semibold text-ink-600 hover:text-ink-900">
          Sign in
        </Link>
      </div>
    </header>
  );
}

/**
 * Hero - the same layout as carevents.com/uk/event-organisers: full-bleed
 * photo, dark gradient overlay, centred heading + copy + two buttons,
 * and a note line pinned to the bottom edge. The photo is the organiser
 * page's hero.jpg, copied into public/images/.
 */
function Hero() {
  return (
    <section
      className="relative flex min-h-[560px] items-center justify-center overflow-hidden bg-[#111] bg-cover bg-no-repeat px-6 pb-24 pt-20 text-center text-white sm:py-24"
      style={{ backgroundImage: "url(/images/join-traders-hero.jpg)", backgroundPosition: "center 40%" }}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,.45)_55%,rgba(0,0,0,.75)_100%)]"
        aria-hidden
      />
      <div className="relative flex max-w-[820px] flex-col items-center gap-[22px]">
        <h1 className="font-display text-[clamp(34px,5vw,64px)] font-bold leading-[1.08] text-white [text-wrap:balance]">
          Get your business in front of event organisers
        </h1>
        <p className="max-w-[640px] text-base leading-[1.7] text-white/90 [text-wrap:pretty]">
          Trade at car shows, meets and festivals? List your food, drink,
          retail or service business in the CarEvents.com Event Traders
          directory and be found by the organisers booking pitches for
          their next event.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3.5">
          <a
            href="#join"
            className="inline-block rounded bg-[#B8975A] px-[34px] py-4 text-[15px] font-semibold leading-[1.2] text-white transition hover:bg-[#a8874c]"
          >
            Join the directory
          </a>
          <a
            href="#how"
            className="inline-block rounded border-2 border-white/75 bg-transparent px-8 py-[14px] text-[15px] font-semibold leading-[1.2] text-white transition hover:border-white hover:bg-white/15"
          >
            How it works
          </a>
        </div>
      </div>
      <p className="absolute inset-x-0 bottom-6 px-6 text-center text-sm font-medium leading-snug text-white/90">
        £20 a year in the UK · $20 a year in the USA · renews annually, cancel any time
      </p>
    </section>
  );
}

/** Dark strip under the hero, like the organiser page's "Get paid your
 *  way" band, showing what Stripe Checkout accepts. */
function PaymentStrip() {
  return (
    <section className="flex flex-col items-center gap-3.5 bg-[#141414] px-6 py-[26px]">
      <span className="text-[11px] font-medium uppercase tracking-[.16em] text-[#8a8a8a]">
        Secure payment by Stripe
      </span>
      <PaymentMarks variant="chips" />
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, title: "Create your account", body: "Your free CarEvents.com account - or sign in if you already have one." },
    { n: 2, title: "Add your business", body: "Name, what you do and where you're based. Add photos and more later from your dashboard." },
    { n: 3, title: "Pay securely with Stripe", body: "Card, Apple Pay or Google Pay. You're listed the moment payment clears." },
  ];
  return (
    <section id="how" className="scroll-mt-6 bg-white px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">How it works</p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl">Listed in three steps</h2>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 font-bold text-white">
                {s.n}
              </span>
              <div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-500">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    {
      q: "Who is the directory for?",
      a: "Any business that trades at events: food and drink vendors, retail and merchandise stalls, detailers, photographers, service providers and more. Organisers search it when they need exhibitors.",
    },
    {
      q: "How much does it cost?",
      a: "£20 a year on the UK directory or $20 a year on the USA directory, paid by card through Stripe. It renews automatically each year and we email you a week before every renewal.",
    },
    {
      q: "Can I cancel?",
      a: "Yes. Cancel renewal from your dashboard at any time - your listing stays live until the end of the year you've paid for.",
    },
    {
      q: "What do organisers see?",
      a: "Your business profile: logo, cover photo, gallery, description, categories, opening hours and contact details. They contact you directly to arrange a pitch.",
    },
    {
      q: "I already have a CarEvents.com account.",
      a: "Great - sign in at the first step and we'll attach the business to your existing account.",
    },
  ];
  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-display text-3xl sm:text-4xl">Questions</h2>
        <dl className="mt-8 divide-y divide-ink-200 rounded-2xl bg-white shadow-sm ring-1 ring-ink-100">
          {items.map((it) => (
            <div key={it.q} className="p-5">
              <dt className="font-semibold">{it.q}</dt>
              <dd className="mt-1 text-sm text-ink-500">{it.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function StepRail({ step }: { step: Step }) {
  const order: Step[] = ["account", "business", "pay"];
  const labels: Record<Step, string> = { account: "Account", business: "Business", pay: "Payment", done: "Done" };
  const idx = step === "done" ? 3 : order.indexOf(step);
  return (
    <ol className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold">
      {order.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "todo";
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                state === "done"
                  ? "bg-emerald-500 text-white"
                  : state === "active"
                    ? "bg-gold-500 text-white"
                    : "bg-ink-200 text-ink-500"
              }`}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className={state === "todo" ? "text-ink-400" : "text-ink-800"}>{labels[s]}</span>
            {i < order.length - 1 && <span className="mx-1 h-px w-6 bg-ink-200" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Step 1: account ──────────────────────────────────────────────────

function AccountStep({ onDone }: { onDone: () => void }) {
  const { adoptSession, signIn } = useAuth();
  const register = useRegister();
  const [mode, setMode] = useState<"register" | "signin">("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ field: "email" | "password" | null; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        const res = await register.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
        });
        if (!res.success) {
          setError({ field: registerErrorField(res.code), message: res.message });
          return;
        }
        adoptSession(res);
      } else {
        await signIn({ email: email.trim(), password });
      }
      onDone();
    } catch (err) {
      setError({
        field: null,
        message:
          err instanceof ApiError
            ? err.status === 401
              ? "Incorrect email or password."
              : err.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (f: "email" | "password") => (error?.field === f ? error.message : null);

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xl font-bold">
          {mode === "register" ? "Create your account" : "Sign in"}
        </h3>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "register" ? "signin" : "register");
            setError(null);
          }}
          className="text-xs font-semibold text-gold-600 hover:text-gold-700"
        >
          {mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        {mode === "register"
          ? "Free, and it's where you'll manage your listing."
          : "We'll attach the business to your existing account."}
      </p>

      {mode === "register" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required />
          </Field>
          <Field label="Last name">
            <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required />
          </Field>
        </div>
      )}

      <div className="mt-4">
        <Field label="Email address" error={fieldError("email")}>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </Field>
      </div>
      <div className="mt-4">
        <Field
          label="Password"
          error={fieldError("password")}
          hint={mode === "register" ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
        >
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? MIN_PASSWORD_LENGTH : undefined}
            required
          />
        </Field>
      </div>

      {error && !error.field && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error.message}</p>
      )}

      <button type="submit" disabled={busy} className={primaryBtn + " mt-6 w-full"}>
        {busy ? "One moment…" : mode === "register" ? "Create account & continue" : "Sign in & continue"}
      </button>
      {mode === "signin" && (
        <p className="mt-3 text-center text-xs text-ink-400">
          <Link href="/forgot-password" className="hover:text-ink-700">Forgotten your password?</Link>
        </p>
      )}
    </form>
  );
}

// ─── Step 2: business ─────────────────────────────────────────────────

function BusinessStep({
  site,
  onSiteChange,
  signedInAs,
  onDone,
}: {
  site: RegionKey;
  onSiteChange: (s: RegionKey) => void;
  signedInAs: string;
  onDone: (saved: Saved) => void;
}) {
  const { signOut } = useAuth();
  const options = useBusinessOptions(site);
  const create = useCreateBusiness();
  const update = useUpdateBusiness();

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [categories, setCategories] = useState<string[]>(["event-traders-exhibitors"]);
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cats = options.data?.categories ?? [];
  const busy = create.isPending || update.isPending;

  const toggle = (slug: string) =>
    setCategories((c) => (c.includes(slug) ? c.filter((s) => s !== slug) : [...c, slug]));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!title.trim()) {
      setError("Please enter your business name.");
      return;
    }
    if (categories.length === 0) {
      setError("Pick at least one category so organisers can find you.");
      return;
    }
    try {
      const created = await create.mutateAsync({
        post_title: title.trim(),
        business_categories: categories,
        site,
      });
      await update.mutateAsync({
        bid: created.encrypted_id,
        site,
        tagline: tagline.trim(),
        website: website.trim(),
        business_phone: phone.trim(),
        business_categories: categories,
      });
      onDone({ bid: created.encrypted_id, site, title: title.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your business. Please try again.");
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-xl font-bold">Tell us about your business</h3>
        {signedInAs && (
          <span className="text-xs text-ink-400">
            Signed in as <strong className="text-ink-700">{signedInAs}</strong> ·{" "}
            <button type="button" onClick={signOut} className="font-semibold text-gold-600 hover:text-gold-700">
              Not you?
            </button>
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-500">
        Just the essentials for now - you can add photos, a description and
        opening hours from your dashboard.
      </p>

      <div className="mt-5">
        <Field label="Business name">
          <input className={inputCls} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Paddock Coffee Co." required />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Where do you mostly trade?" hint="This picks the directory you're listed in and the currency you pay in.">
          <div className="grid grid-cols-2 gap-2">
            {REGION_LIST.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => onSiteChange(r.key)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  site === r.key ? "border-gold-500 bg-gold-50 text-ink-900" : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
                }`}
                aria-pressed={site === r.key}
              >
                {r.label}
                <span className="block text-xs font-normal text-ink-400">
                  {r.key === "us" ? "$20 per year" : "£20 per year"}
                </span>
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="What do you do?" hint="Tick everything that applies.">
          <div className="grid max-h-64 grid-cols-1 gap-x-4 overflow-y-auto rounded-xl border border-ink-200 p-3 sm:grid-cols-2">
            {cats.length === 0 && (
              <p className="p-2 text-sm text-ink-400">{options.isLoading ? "Loading categories…" : "No categories available."}</p>
            )}
            {cats.map((c) => (
              <label key={c.slug} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300 text-gold-600 focus:ring-gold-500"
                  checked={categories.includes(c.slug)}
                  onChange={() => toggle(c.slug)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="One-line description" hint="Shown on your directory card.">
          <input className={inputCls} value={tagline} maxLength={140} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Speciality coffee and fresh doughnuts from a vintage Citroën van" />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Website (optional)">
          <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="example.com" />
        </Field>
        <Field label="Phone (optional)">
          <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>
      )}

      <button type="submit" disabled={busy} className={primaryBtn + " mt-6 w-full"}>
        {busy ? "Saving…" : "Continue to payment"}
      </button>
    </form>
  );
}

// ─── Step 3: pay ──────────────────────────────────────────────────────

function PayStep({
  saved,
  priceLabel,
  cancelled,
  onStartOver,
}: {
  saved: Saved;
  priceLabel: string;
  cancelled: boolean;
  onStartOver: () => void;
}) {
  const checkout = useTradersCheckout();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const region = resolveRegion(saved.site);

  const pay = async () => {
    setError(null);
    setRedirecting(true);
    try {
      const res = await checkout.mutateAsync({ bid: saved.bid, site: saved.site, returnTo: "join" });
      window.location.assign(res.url);
    } catch (err) {
      setRedirecting(false);
      setError(err instanceof Error ? err.message : "Couldn't start the checkout. Please try again.");
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold">Pay for your membership</h3>
      <p className="mt-1 text-sm text-ink-500">
        Secure checkout with Stripe. Your business goes live in the directory as soon as payment clears.
      </p>

      {cancelled && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
          Checkout was cancelled - you haven&apos;t been charged. Your business details are saved, so you can pay whenever you&apos;re ready.
        </p>
      )}

      <dl className="mt-5 divide-y divide-ink-100 rounded-xl border border-ink-200">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-ink-500">Business</dt>
          <dd className="font-semibold">{saved.title || "Your business"}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-ink-500">Directory</dt>
          <dd className="font-semibold">{region.label}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-ink-500">Event Traders membership</dt>
          <dd className="font-semibold">{priceLabel}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-ink-500">Renewal</dt>
          <dd className="text-ink-700">Automatic, yearly · reminder emailed 7 days before · cancel any time</dd>
        </div>
      </dl>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>
      )}

      <button type="button" onClick={() => void pay()} disabled={redirecting} className={primaryBtn + " mt-6 w-full"}>
        {redirecting ? "Taking you to Stripe…" : `Pay ${priceLabel.replace(" per year", "")} with Stripe`}
      </button>
      <PaymentMarks size="sm" className="mt-4 justify-center" />

      <p className="mt-5 text-center text-xs text-ink-400">
        Made a mistake?{" "}
        <button type="button" onClick={onStartOver} className="font-semibold text-gold-600 hover:text-gold-700">
          Edit the business details
        </button>{" "}
        · or{" "}
        <Link href={businessEditPath(saved.bid, saved.site)} className="font-semibold text-gold-600 hover:text-gold-700">
          finish in your dashboard
        </Link>
      </p>
    </div>
  );
}

// ─── Done ─────────────────────────────────────────────────────────────

function DoneStep({
  saved,
  sessionId,
  onFinished,
}: {
  saved: Saved;
  sessionId: string | null;
  onFinished: () => void;
}) {
  const sync = useTradersSync();
  const update = useUpdateBusiness();
  const [traders, setTraders] = useState<BusinessTradersDirectory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const res = await sync.mutateAsync({ bid: saved.bid, site: saved.site, sessionId: sessionId ?? undefined });
        setTraders(res.tradersDirectory);
        // A paid trader should be visible straight away - publish the
        // draft. Best effort; the dashboard's Publish step covers it.
        if (res.tradersDirectory.member) {
          try {
            await update.mutateAsync({ bid: saved.bid, site: saved.site, post_status: "publish" });
          } catch {
            // ignore - they can publish from the dashboard
          }
        }
        // The saved draft has done its job; the Stripe params stay in the
        // URL so a refresh simply re-runs the (idempotent) sync.
        onFinished();
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't confirm the payment yet.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = businessEditPath(saved.bid, saved.site);

  if (error) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-bold">Almost there</h3>
        <p className="mt-2 text-sm text-ink-500">{error}</p>
        <p className="mt-1 text-sm text-ink-500">
          If you completed payment, your membership will show in your dashboard within a few minutes.
        </p>
        <Link href={editor} className={primaryBtn + " mt-6 inline-block"}>Open your dashboard</Link>
      </div>
    );
  }

  if (!traders) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-ink-200 border-t-gold-500" aria-hidden />
        <p className="mt-4 text-sm text-ink-500">Confirming your payment with Stripe…</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </span>
      <h3 className="mt-4 text-2xl font-bold">
        {traders.member ? "You're in the Event Traders directory!" : "Payment received"}
      </h3>
      <p className="mt-2 text-sm text-ink-500">
        {traders.member
          ? `${saved.title || "Your business"} is now listed for event organisers. Next, add your logo, photos and a description so you stand out.`
          : "Stripe is still confirming the payment. Your listing will switch on automatically within a few minutes."}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={`${editor}?step=profile`} className={primaryBtn}>
          Complete your profile
        </Link>
        <Link href="/businesses" className="rounded-xl border border-ink-200 bg-white px-6 py-3 text-sm font-bold text-ink-700 transition hover:bg-ink-50">
          Go to my dashboard
        </Link>
      </div>
      <p className="mt-5 text-xs text-ink-400">
        A confirmation email is on its way. You can manage or cancel renewal from the Event traders step of your listing.
      </p>
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-ink-200 bg-ink-50/40 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20";
const primaryBtn =
  "rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-gold-500/25 transition hover:from-gold-600 hover:to-gold-700 disabled:cursor-not-allowed disabled:opacity-60";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-900">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600" role="alert">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
}

