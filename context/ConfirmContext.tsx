"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Reusable confirm dialog. Replaces native confirm() with a styled,
 * promise-based dialog so call sites read almost identically:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete this entry?", ... })) { ... }
 *
 * One <ConfirmProvider> near the app root powers every confirm in the
 * tree. The promise resolves true on confirm, false on cancel/dismiss.
 */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red styling for destructive actions (delete, cancel order). */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface DialogState extends ConfirmOptions {
  open: boolean;
}

const CLOSED: DialogState = { open: false, title: "" };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(CLOSED);
  // Holds the resolve fn for the in-flight confirm() promise.
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setState({ open: true, ...options });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setState((s) => ({ ...s, open: false }));
  }, []);

  // Esc cancels, Enter confirms while the dialog is open.
  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        settle(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        settle(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.open, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div
          className="modal-backdrop open"
          onClick={(e) => {
            if (e.target === e.currentTarget) settle(false);
          }}
        >
          <div
            className="modal confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmTitle"
            aria-describedby={state.message ? "confirmMessage" : undefined}
            style={{
              maxWidth: 400,
              width: "calc(100% - 32px)",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div
              className="confirm-modal-body"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {state.danger && (
                <div
                  className="confirm-modal-icon danger"
                  aria-hidden
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background:
                      "color-mix(in srgb, var(--danger, #c0492f) 14%, transparent)",
                    color: "var(--danger, #c0492f)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                    flex: "0 0 auto",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
              )}
              <h3
                id="confirmTitle"
                className="confirm-modal-title"
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--ink, #1f1d18)",
                  margin: "0 0 6px",
                }}
              >
                {state.title}
              </h3>
              {state.message && (
                <p
                  id="confirmMessage"
                  className="confirm-modal-message"
                  style={{
                    fontSize: 14,
                    color: "var(--muted, #6b6860)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {state.message}
                </p>
              )}
            </div>

            <div
              className="confirm-modal-actions"
              style={{ display: "flex", gap: 10, marginTop: 22 }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => settle(false)}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {state.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                className={`btn ${state.danger ? "btn-danger" : "btn-primary"}`}
                onClick={() => settle(true)}
                autoFocus
                style={
                  {
                        flex: 1,
                        justifyContent: "center",
                        background: "var(--gold-deep, #bd7420)",
                        color: "#fff",
                        border: "1px solid var(--gold-deep, #bd7420)",
                      }
                }
              >
                {state.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a <ConfirmProvider>");
  }
  return ctx;
}
