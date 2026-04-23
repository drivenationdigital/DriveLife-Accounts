"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/apiClient";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 20,
      }}
    >
      <div
        className="section"
        style={{ width: "100%", maxWidth: 420, marginBottom: 0 }}
      >
        <div className="section-header" style={{ justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div className="section-title" style={{ fontSize: 26 }}>
              Sign in
            </div>
            <div className="section-subtitle">Admin dashboard access</div>
          </div>
        </div>
        <Suspense fallback={<div className="section-body" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search?.get("returnTo") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn({ email: email.trim(), password });
      router.replace(returnTo);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="section-body">
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="email" style={labelStyle}>
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
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label htmlFor="password" style={labelStyle}>
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
          style={inputStyle}
        />
      </div>

      {error && (
        <div
          style={{
            background: "var(--danger-soft)",
            color: "var(--danger)",
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={busy}
        style={{ width: "100%", justifyContent: "center", padding: 12 }}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--muted)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 14,
  background: "var(--surface)",
  color: "var(--ink)",
  fontFamily: "inherit",
};
