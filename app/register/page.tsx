"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/apiClient";
import {
  useRegister,
  registerErrorField,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth";
import { AuthShell, AuthAltPanel } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create an account"
      subtitle="List events, run a club, or manage a venue"
      footer={
        <AuthAltPanel
          prompt="Already have an account?"
          actionLabel="Sign in"
          href="/login"
        />
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}

/** Where a failure is shown: on a specific input, or the form banner. */
type FieldError = { field: "email" | "password" | null; message: string };

function RegisterForm() {
  const { adoptSession } = useAuth();
  const register = useRegister();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<FieldError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const busy = register.isPending;
  // The server owns the wording, so the same message renders wherever
  // its code points - beside a field, or in the banner.
  const fieldError = (field: "email" | "password") =>
    error?.field === field ? error.message : null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);

    // Checked here as well as by the browser: the server has no view of
    // the confirm field, so this mismatch can only be caught client-side.
    if (password !== confirm) {
      setError({ field: "password", message: "Those passwords don't match." });
      return;
    }

    try {
      const res = await register.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });

      // A rejected signup arrives as HTTP 200 with success:false, so
      // this branch - not a catch - is where "email already taken" and
      // friends land. Without it a failure would read as a success.
      if (!res.success) {
        setError({
          field: registerErrorField(res.code),
          message: res.message,
        });
        return;
      }

      // Registration signs the user in, returning the same token
      // envelope as /next-dash-login - adopt it rather than posting the
      // credentials again.
      if (res.requires_verification) {
        setNotice(
          "Account created. Check your email for a confirmation link, then sign in.",
        );
        return;
      }

      adoptSession(res);
      // Hard navigation, not router.replace: middleware gates on the
      // auth cookie, and a client-side push can outrun the cookie
      // becoming visible to it and bounce straight back to /login.
      window.location.href = "/";
    } catch (err) {
      // Only genuine transport/server faults reach here - a 500, or the
      // network dropping. Expected validation failures come back as 200.
      setError({
        field: null,
        message:
          err instanceof ApiError
            ? err.message
            : "Couldn't create your account. Please try again.",
      });
    }
  };

  // Registration succeeded but sign-in is gated - the form has nothing
  // left to do, so replace it with the confirmation.
  if (notice) {
    return (
      <div className="section-body">
        <div className="auth-notice" role="status">
          {notice}
        </div>
        <Link href="/login" className="btn btn-primary auth-submit">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="section-body" noValidate>
      <div className="auth-row">
        <div className="auth-field">
          <label htmlFor="first-name" className="auth-label">
            First name
          </label>
          <input
            id="first-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={busy}
            className="auth-input"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="last-name" className="auth-label">
            Last name
          </label>
          <input
            id="last-name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={busy}
            className="auth-input"
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="email" className="auth-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
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
            {/* The one failure with an obvious next step, so offer it. */}
            {register.data &&
              !register.data.success &&
              register.data.code === "email_exists" && (
                <>
                  {" "}
                  <Link href="/login" className="auth-inline-link">
                    Sign in
                  </Link>
                </>
              )}
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          disabled={busy}
          aria-invalid={Boolean(fieldError("password"))}
          aria-describedby={
            fieldError("password") ? "password-error" : "password-hint"
          }
          className={`auth-input${fieldError("password") ? " has-error" : ""}`}
        />
        {fieldError("password") ? (
          <p id="password-error" className="auth-field-error" role="alert">
            {fieldError("password")}
          </p>
        ) : (
          <p id="password-hint" className="auth-hint">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="confirm-password" className="auth-label">
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={busy}
          className="auth-input"
        />
      </div>

      {/* Anything not tied to a single input - missing_fields,
          registration_failed, or a transport error. */}
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
        {busy ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
