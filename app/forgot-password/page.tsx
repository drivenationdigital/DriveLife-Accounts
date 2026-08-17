"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/apiClient";
import { useRequestPasswordReset } from "@/lib/auth";
import { AuthShell, AuthAltPanel } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one"
      footer={
        <AuthAltPanel
          prompt="Remembered it?"
          actionLabel="Back to sign in"
          href="/login"
        />
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

function ForgotPasswordForm() {
  const request = useRequestPasswordReset();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const busy = request.isPending;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    try {
      const res = await request.mutateAsync({ email: email.trim() });
      // The route answers identically whether or not the address is
      // registered, so there is no failure branch - only a transport
      // fault reaches the catch below.
      setSent(
        res.message ??
          "If an account exists for that email, a reset link is on its way.",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Couldn't send the reset email. Please try again.");
      }
    }
  };

  if (sent) {
    return (
      <div className="section-body">
        {/* Wording comes from the server, which deliberately says the
            same thing whether or not the address is registered - the
            endpoint must not become a way to check which emails have
            accounts. */}
        <div className="auth-notice" role="status">
          {sent} The link expires in 24 hours and can only be used once.
        </div>
        <button
          type="button"
          className="btn btn-secondary auth-submit"
          onClick={() => {
            setSent(null);
            setError(null);
          }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="section-body">
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
          autoFocus
          disabled={busy}
          className="auth-input"
        />
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary auth-submit"
        disabled={busy}
      >
        {busy ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
