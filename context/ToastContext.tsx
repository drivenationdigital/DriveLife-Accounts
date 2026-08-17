"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Minimal toast system - success/error/info messages that auto-dismiss.
 *
 * Mount <ToastProvider> once (alongside your ConfirmProvider, inside the
 * dashboard layout), then call useToast():
 *
 *   const toast = useToast();
 *   toast.success("Order cancelled.");
 *   toast.error("Couldn't cancel the order.");
 *
 * Self-contained + inline-styled so it renders without global CSS.
 */

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, kind, message }]);
      // Errors linger a little longer than successes.
      const ttl = kind === "error" ? 6000 : 3500;
      setTimeout(() => remove(id), ttl);
    },
    [remove],
  );

  const api = useRef<ToastApi>({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  });
  // Keep closures fresh (push identity is stable via useCallback deps).
  api.current = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: "calc(100vw - 40px)",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => remove(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 10,
              background: "#fff",
              border: "1px solid var(--border, #ecebe6)",
              borderLeft: `4px solid ${accent(t.kind)}`,
              boxShadow: "0 8px 24px rgba(31,29,24,0.14)",
              fontSize: 14,
              color: "var(--ink, #1f1d18)",
              cursor: "pointer",
              minWidth: 240,
            }}
          >
            <span aria-hidden style={{ color: accent(t.kind), display: "inline-flex" }}>
              {icon(t.kind)}
            </span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a <ToastProvider>");
  }
  return ctx;
}

function accent(kind: ToastKind): string {
  if (kind === "success") return "#3f7d4e";
  if (kind === "error") return "var(--danger, #c0492f)";
  return "var(--gold-deep, #bd7420)";
}

function icon(kind: ToastKind) {
  if (kind === "success") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    );
  }
  if (kind === "error") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
  );
}
