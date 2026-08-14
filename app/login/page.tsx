"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginFailureFrom, type LoginFailure } from "@/lib/auth";
import {
  AuthShell,
  AuthAltPanel,
  AuthBackToSite,
} from "@/components/auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Manage your events, clubs and venues"
      footer={
        <>
          <AuthAltPanel
            prompt="New to CarEvents?"
            actionLabel="Create an account"
            href="/register"
          />
          <AuthBackToSite />
        </>
      }
    >
      <Suspense fallback={<div className="section-body" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

/**
 * Where to land after signing in.
 *
 * `returnTo` comes off the query string, so it's attacker-controllable:
 * `?returnTo=https://evil.example` would otherwise send a
 * freshly-authenticated user straight off-site. Only same-origin
 * absolute paths are allowed through - anything else falls back to the
 * dashboard root.
 *
 * `//evil.example` and `/\evil.example` are the cases worth naming:
 * both are protocol-relative URLs that browsers treat as another host,
 * despite starting with a slash.
 */
function safeReturnTo(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

function LoginForm() {
  const { signIn } = useAuth();
  const search = useSearchParams();
  const returnTo = safeReturnTo(search?.get("returnTo"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LoginFailure | null>(null);
  const [busy, setBusy] = useState(false);

  // Same convention as the register form: a failure the server pinned
  // to a field renders beside that input, everything else in the
  // banner below the form.
  const fieldError = (field: "email" | "password") =>
    error?.field === field ? error.message : null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn({ email: email.trim(), password });
      // A full document load, not router.replace.
      //
      // Route gating happens in middleware, which only runs on a real
      // request. A client-side navigation can be served from Next's
      // router cache - including a cached redirect from when this user
      // was signed out - so middleware never re-runs, never sees the
      // token that was just written, and the user sits on the sign-in
      // screen until they reload by hand. Reproduces on the production
      // build and not in dev, where that cache is effectively off.
      //
      // The reload also gives the new session a clean QueryClient,
      // rather than one holding the previous user's cached data.
      window.location.assign(returnTo);
      // Deliberately no setBusy(false) here. The navigation is async and
      // this page stays on screen until the new document arrives;
      // re-enabling the button in that window invites a second submit.
    } catch (err) {
      // The server's error code decides the wording and which input it
      // belongs to - a locked account, an unverified one and a rate
      // limit each need their own answer, and none of them are fixed
      // by retyping a password.
      setError(loginFailureFrom(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="section-body">
      <div className="auth-field">
        <label htmlFor="email" className="auth-label">
          Email or username
        </label>
        <input
          id="email"
          type="text"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
          aria-invalid={Boolean(fieldError("email"))}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          className={`auth-input${fieldError("email") ? " has-error" : ""}`}
        />
        {fieldError("email") && (
          <p id="email-error" className="auth-field-error" role="alert">
            {fieldError("email")}
          </p>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="password" className="auth-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={busy}
          aria-invalid={Boolean(fieldError("password"))}
          aria-describedby={
            fieldError("password") ? "password-error" : undefined
          }
          className={`auth-input${fieldError("password") ? " has-error" : ""}`}
        />
        {fieldError("password") && (
          <p id="password-error" className="auth-field-error" role="alert">
            {fieldError("password")}
          </p>
        )}
      </div>

      {/* Form-level failures - a disabled account, a rate limit, or a
          transport error. Anything pinned to an input renders above. */}
      {error && error.field === null && (
        <div className="auth-error" role="alert">
          {error.message}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary auth-submit"
        disabled={busy}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <div className="auth-below-submit">
        <Link href="/forgot-password" className="auth-inline-link">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
