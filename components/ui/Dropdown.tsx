"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import { cx } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown subcomponents must be inside <Dropdown>");
  return ctx;
}

export function Dropdown({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: Event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  const value = useMemo<DropdownContextValue>(
    () => ({ open, toggle, close, containerRef }),
    [open, toggle, close],
  );

  return (
    <DropdownContext.Provider value={value}>
      <div
        ref={containerRef}
        className={cx("dropdown", open && "open", className)}
      >
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({
  children,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const { toggle } = useDropdown();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
    >
      {children}
    </button>
  );
}

export function DropdownMenu({
  children,
  className,
  role = "menu",
}: {
  children: ReactNode;
  className?: string;
  role?: string;
}) {
  return (
    <div className={cx("dropdown-menu", className)} role={role}>
      {children}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger,
  disabled,
  as = "button",
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  as?: "button" | "a";
  href?: string;
}) {
  const { close } = useDropdown();
  const handle = (e: MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (as === "button") e.preventDefault();
    onClick?.();
    close();
  };
  const className = cx(
    "dropdown-menu-item",
    danger && "danger",
    disabled && "disabled",
  );
  const disabledStyle = disabled
    ? { opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" as const }
    : undefined;
  if (as === "a") {
    return (
      <a
        href={disabled ? undefined : (href ?? "#")}
        className={className}
        onClick={handle}
        aria-disabled={disabled || undefined}
        style={disabledStyle}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={handle}
      disabled={disabled}
      style={disabledStyle}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="dropdown-menu-sep" />;
}
