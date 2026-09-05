"use client";

import { useEffect } from "react";

/**
 * "View responses" for the answers a buyer gave to a ticket's custom
 * checkout questions (editor: "Ask additional questions").
 *
 * `ResponsesLink` is the in-table trigger - a real <button> with
 * data-row-action so a clickableRow() row leaves it alone. The parent
 * owns the open state and renders `ResponsesModal` when set, the same
 * pattern as PhotoThumb + Lightbox.
 */

export interface ResponseAnswer {
  q: string;
  a: string;
}

export interface ResponseGroup {
  /** Heading for the group - the ticket the answers belong to. */
  title: string;
  answers: ResponseAnswer[];
}

export function ResponsesLink({
  label = "View responses",
  ariaLabel,
  onOpen,
}: {
  label?: string;
  ariaLabel?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-row-action
      aria-label={ariaLabel ?? label}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      style={{
        padding: 0,
        border: 0,
        background: "none",
        color: "var(--gold-deep, #bd7420)",
        font: "inherit",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: 2,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export function ResponsesModal({
  title,
  groups,
  onClose,
}: {
  title: string;
  groups: ResponseGroup[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(15, 14, 12, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 12px 48px rgba(0,0,0,0.35)",
          padding: "20px 22px 22px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--border, #e6e0d1)",
              background: "#fff",
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {groups.map((g, gi) => (
          <div
            key={`${g.title}-${gi}`}
            style={{
              paddingTop: gi === 0 ? 0 : 14,
              marginTop: gi === 0 ? 0 : 14,
              borderTop: gi === 0 ? 0 : "1px solid var(--border, #ecebe6)",
            }}
          >
            {groups.length > 1 && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--muted, #8a8375)",
                  marginBottom: 8,
                }}
              >
                {g.title}
              </div>
            )}
            <dl style={{ margin: 0 }}>
              {g.answers.map((qa, i) => (
                <div key={i} style={{ marginBottom: i === g.answers.length - 1 ? 0 : 10 }}>
                  <dt style={{ fontSize: 12.5, color: "var(--muted, #6b675f)" }}>
                    {qa.q}
                  </dt>
                  <dd
                    style={{
                      margin: "2px 0 0",
                      fontSize: 14,
                      color: "var(--ink-900, #1b1b1b)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {qa.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
