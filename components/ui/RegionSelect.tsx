"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { REGION_LIST, resolveRegion, type RegionKey } from "@/lib/regions";

/**
 * Controlled country picker, shared by the create-event, create-club and
 * create-venue screens.
 *
 * A custom listbox rather than a native `<select>` because the options
 * carry flag artwork, and a native option can only hold text. (Emoji
 * flags aren't a way round it - Windows ships no flag glyphs, so they
 * render as bare letters, which is why CountryFlag draws SVG.) It stays
 * one row whatever the region count, unlike a stack of radio cards.
 *
 * Follows the ARIA listbox pattern: the trigger owns the label and
 * expanded state, arrow keys move the active option, Enter/Space
 * commits, Escape closes without changing anything, and focus returns
 * to the trigger on close.
 *
 * Stateless by design - the three create flows keep the chosen region
 * in different places (wizard context for events, local state for clubs
 * and venues), so ownership stays with the caller.
 */
export function RegionSelect({
  value,
  onChange,
  label = "Country",
  hint,
  disabled = false,
}: {
  value: RegionKey;
  onChange: (key: RegionKey) => void;
  label?: string;
  /** Optional line under the control. */
  hint?: string;
  disabled?: boolean;
}) {
  const selectedIndex = Math.max(
    0,
    REGION_LIST.findIndex((r) => r.key === value),
  );
  // resolveRegion rather than REGION_LIST[i] so an unknown key still
  // renders something sensible instead of blanking the trigger.
  const selected = resolveRegion(value);

  const [open, setOpen] = useState(false);
  // Which option the keyboard is on. Separate from the selection - the
  // user can arrow past options without committing to them.
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const uid = useId();
  const labelId = `region-label-${uid}`;
  const listId = `region-list-${uid}`;

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const choose = (key: RegionKey) => {
    onChange(key);
    close();
  };

  const openList = (startAt = selectedIndex) => {
    if (disabled) return;
    setActiveIndex(startAt);
    setOpen(true);
  };

  // Move DOM focus onto the active option so screen readers announce it
  // and the browser scrolls it into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.focus();
  }, [open, activeIndex]);

  // Click outside closes without committing. Not routed through close()
  // - pulling focus back to the trigger would fight whatever the user
  // just clicked on.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openList();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openList(REGION_LIST.length - 1);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % REGION_LIST.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + REGION_LIST.length) % REGION_LIST.length);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(REGION_LIST.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(REGION_LIST[activeIndex]!.key);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        // Let focus leave naturally, but don't leave the list hanging open.
        setOpen(false);
        break;
    }
  };

  return (
    <div>
      <span id={labelId} style={labelStyle}>
        {label}
      </span>

      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${labelId} ${listId}-value`}
          aria-controls={open ? listId : undefined}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onTriggerKeyDown}
          style={{
            ...triggerStyle,
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <CountryFlag country={selected.country} label={selected.label} />
          <span id={`${listId}-value`} style={{ flex: 1, textAlign: "left" }}>
            {selected.label}
          </span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            style={listStyle}
          >
            {REGION_LIST.map((region, i) => {
              const isSelected = region.key === value;
              return (
                <li
                  key={region.key}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onClick={() => choose(region.key)}
                  onMouseEnter={() => setActiveIndex(i)}
                  style={{
                    ...optionStyle,
                    background:
                      i === activeIndex
                        ? "var(--ink-50, #faf9f7)"
                        : "transparent",
                  }}
                >
                  <CountryFlag country={region.country} label={region.label} />
                  <span style={{ flex: 1 }}>{region.label}</span>
                  {isSelected && <CheckIcon />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
// Inline rather than utility classes: this renders on both the
// inline-styled create-event screen and the Tailwind-styled club/venue
// screens, so it carries its own look instead of inheriting either.

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--ink, #1f1d18)",
  marginBottom: 6,
};

const triggerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  borderRadius: 10,
  border: "1px solid var(--border, #ecebe6)",
  background: "var(--ink-50, #faf9f7)",
  padding: "12px 14px",
  fontSize: 14,
  color: "var(--ink, #1f1d18)",
};

const listStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  zIndex: 50,
  margin: 0,
  padding: "4px 0",
  listStyle: "none",
  borderRadius: 10,
  border: "1px solid var(--border, #ecebe6)",
  background: "#fff",
  boxShadow: "0 12px 32px rgba(31,29,24,0.16)",
  // Keeps the popup from running off-screen once there are many regions.
  maxHeight: 280,
  overflowY: "auto",
};

const optionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  fontSize: 14,
  color: "var(--ink, #1f1d18)",
  cursor: "pointer",
  outline: "none",
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted, #6b6860)",
  marginTop: 6,
};

// ─── Icons ────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        flexShrink: 0,
        color: "var(--muted, #6b6860)",
        transform: open ? "rotate(180deg)" : undefined,
        transition: "transform 120ms",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0, color: "var(--gold, #c9a227)" }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
