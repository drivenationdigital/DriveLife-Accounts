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
import { createPortal } from "react-dom";

import { useConfirm, type ConfirmOptions } from "./ConfirmContext";

/**
 * One consistent flow for every action that changes something on the
 * server:
 *
 *   click -> "Are you sure?" -> full-screen loader -> centred result
 *   notification with a gold dismiss button
 *
 * Before this existed each call site wired its own confirm + inline
 * "Sending..." label + corner toast, which was easy to miss. Now:
 *
 *   const runAction = useAction();
 *
 *   await runAction({
 *     confirm: { title: "Resend the confirmation email?", ... },
 *     loadingLabel: "Sending confirmation email...",
 *     successTitle: "Confirmation email sent",
 *     run: () => resend.mutateAsync({ oid }),
 *   });
 *
 * Returns the action's resolved value on success, or `undefined` if the
 * user cancelled at the confirm step or the action threw. Callers that
 * need to branch (navigate on success, say) can just check for
 * undefined - the error has already been shown to the user by then.
 *
 * Success notifications fade out on their own after a few seconds;
 * errors stay put until dismissed, so a failure is never missed.
 */

export interface RunActionOptions<T> {
  /**
   * Confirmation step. Omit for actions that don't warrant one (they go
   * straight to the loader).
   */
  confirm?: ConfirmOptions;
  /** Copy under the spinner. */
  loadingLabel?: string;
  /** Heading on the success notification. */
  successTitle?: string;
  /** Optional detail line under the success heading. */
  successMessage?: string;
  /** Heading on the failure notification. */
  errorTitle?: string;
  /** Used when the thrown error carries no message of its own. */
  errorMessage?: string;
  /** Label on the gold dismiss button. */
  dismissLabel?: string;
  /**
   * Skip the result notification entirely (the caller shows its own UI,
   * e.g. a page that navigates away immediately). The loader and
   * confirm step still run.
   */
  silentSuccess?: boolean;
  /** The actual work. */
  run: () => Promise<T>;
}

type RunAction = <T>(options: RunActionOptions<T>) => Promise<T | undefined>;

const ActionContext = createContext<RunAction | null>(null);

/** How long a success notification stays up before fading itself out. */
const SUCCESS_TTL_MS = 4000;

type Result = {
  kind: "success" | "error";
  title: string;
  message?: string;
  dismissLabel: string;
};

export function ActionProvider({ children }: { children: ReactNode }) {
  const confirm = useConfirm();
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoClose = useCallback(() => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearAutoClose();
    setResult(null);
  }, [clearAutoClose]);

  // Tidy up if the provider unmounts mid-countdown.
  useEffect(() => clearAutoClose, [clearAutoClose]);

  const showResult = useCallback(
    (next: Result) => {
      clearAutoClose();
      setResult(next);
      // Successes self-dismiss; errors wait for the user.
      if (next.kind === "success") {
        autoCloseTimer.current = setTimeout(() => {
          autoCloseTimer.current = null;
          setResult(null);
        }, SUCCESS_TTL_MS);
      }
    },
    [clearAutoClose],
  );

  const runAction = useCallback<RunAction>(
    async (options) => {
      const {
        confirm: confirmOptions,
        loadingLabel: label = "Working...",
        successTitle = "Done",
        successMessage,
        errorTitle = "Something went wrong",
        errorMessage = "Please try again.",
        dismissLabel = "Done",
        silentSuccess = false,
        run,
      } = options;

      if (confirmOptions) {
        const ok = await confirm(confirmOptions);
        if (!ok) return undefined;
      }

      // Clear any lingering notification so the loader isn't stacked
      // underneath a stale one.
      clearAutoClose();
      setResult(null);
      setLoadingLabel(label);

      try {
        const value = await run();
        setLoadingLabel(null);
        if (!silentSuccess) {
          showResult({
            kind: "success",
            title: successTitle,
            message: successMessage,
            dismissLabel,
          });
        }
        return value;
      } catch (err) {
        setLoadingLabel(null);
        showResult({
          kind: "error",
          title: errorTitle,
          message: err instanceof Error && err.message ? err.message : errorMessage,
          dismissLabel: "Close",
        });
        return undefined;
      }
    },
    [confirm, clearAutoClose, showResult],
  );

  return (
    <ActionContext.Provider value={runAction}>
      {children}
      <ActionOverlays
        loadingLabel={loadingLabel}
        result={result}
        onDismiss={dismiss}
      />
    </ActionContext.Provider>
  );
}

export function useAction(): RunAction {
  const ctx = useContext(ActionContext);
  if (!ctx) {
    throw new Error("useAction must be used within an <ActionProvider>");
  }
  return ctx;
}

// ============================================================
// Overlays
// ============================================================

/**
 * Both overlays are portalled to <body> and sit above the confirm
 * dialog's z-index (100), so a confirm that's still animating out never
 * covers the loader.
 */
function ActionOverlays({
  loadingLabel,
  result,
  onDismiss,
}: {
  loadingLabel: string | null;
  result: Result | null;
  onDismiss: () => void;
}) {
  // Lock body scroll while either overlay is up.
  const blocking = loadingLabel !== null || result !== null;
  useEffect(() => {
    if (!blocking) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [blocking]);

  // Esc dismisses the notification (never the loader - the request is
  // still in flight and there's nothing to cancel).
  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, onDismiss]);

  if (typeof document === "undefined") return null;
  if (!blocking) return null;

  return createPortal(
    <>
      {loadingLabel !== null && <FullScreenLoader label={loadingLabel} />}
      {result && <ResultNotification result={result} onDismiss={onDismiss} />}
    </>,
    document.body,
  );
}

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div style={overlayStyle(200)} role="status" aria-live="polite">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <Spinner />
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function ResultNotification({
  result,
  onDismiss,
}: {
  result: Result;
  onDismiss: () => void;
}) {
  const isError = result.kind === "error";
  const accent = isError ? "var(--danger, #c0492f)" : "#3f7d4e";

  return (
    <div
      style={overlayStyle(300)}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="actionResultTitle"
        style={{
          maxWidth: 400,
          width: "calc(100% - 32px)",
          padding: 28,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `color-mix(in srgb, ${accent} 14%, transparent)`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {isError ? <AlertIcon /> : <CheckIcon />}
        </div>

        <h3
          id="actionResultTitle"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--ink, #1f1d18)",
            margin: "0 0 6px",
          }}
        >
          {result.title}
        </h3>

        {result.message && (
          <p
            style={{
              fontSize: 14,
              color: "var(--muted, #6b6860)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {result.message}
          </p>
        )}

        <button
          type="button"
          onClick={onDismiss}
          autoFocus
          style={{
            marginTop: 24,
            minWidth: 140,
            padding: "11px 22px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            background: "var(--gold-deep, #bd7420)",
            color: "#fff",
            border: "1px solid var(--gold-deep, #bd7420)",
          }}
        >
          {result.dismissLabel}
        </button>
      </div>
    </div>
  );
}

function overlayStyle(zIndex: number): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(22, 21, 19, 0.62)",
    zIndex,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    animation: "modalFadeIn 0.18s ease",
  };
}

function Spinner() {
  return (
    <>
      <span
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.25)",
          borderTopColor: "var(--gold, #d99a3f)",
          display: "block",
          animation: "actionSpin 0.8s linear infinite",
        }}
      />
      <style>{"@keyframes actionSpin{to{transform:rotate(360deg)}}"}</style>
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
