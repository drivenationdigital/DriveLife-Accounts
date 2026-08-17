"use client";

import { cx } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Numbered pagination with ellipsis - keeps at most ~7 visible buttons.
 * Shows: prev · 1 … (current-1) current (current+1) … last · next
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "16px 24px",
        borderTop: "1px solid var(--border)",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      <PageButton
        disabled={disabled || page === 1}
        onClick={() => onPageChange(page - 1)}
        label="‹ Prev"
      />

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            style={{
              padding: "6px 8px",
              color: "var(--muted)",
              fontSize: 13,
            }}
          >
            …
          </span>
        ) : (
          <PageButton
            key={p}
            disabled={disabled}
            active={p === page}
            onClick={() => onPageChange(p)}
            label={String(p)}
          />
        )
      )}

      <PageButton
        disabled={disabled || page === totalPages}
        onClick={() => onPageChange(page + 1)}
        label="Next ›"
      />
    </div>
  );
}

function PageButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(active && "active")}
      style={{
        padding: "6px 12px",
        minWidth: 36,
        border: "1px solid var(--border)",
        borderRadius: 6,
        background: active ? "var(--ink)" : "var(--surface)",
        color: active ? "var(--surface)" : "var(--ink)",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

/**
 * Returns an array like [1, '…', 4, 5, 6, '…', 10] for rendering.
 * Always shows page 1, current-1, current, current+1, last, with ellipses
 * where needed. Adapts gracefully at the edges.
 */
function buildPageList(current: number, total: number): (number | "…")[] {
  const result: (number | "…")[] = [];

  // For <= 7 pages, just show them all.
  if (total <= 7) {
    for (let i = 1; i <= total; i++) result.push(i);
    return result;
  }

  const showLeftEllipsis = current > 4;
  const showRightEllipsis = current < total - 3;

  result.push(1);
  if (showLeftEllipsis) result.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) result.push(i);

  if (showRightEllipsis) result.push("…");
  result.push(total);
  return result;
}
