import type React from "react";

/**
 * Makes a whole table row open its record, so users don't have to hunt
 * for the three-dot menu just to view something.
 *
 *   <tr {...clickableRow(() => router.push(`/orders/${id}`))}>
 *
 * Clicks that land on anything interactive inside the row (the actions
 * menu, a link, a checkbox) are left alone - those keep their own
 * behaviour. Text selection is also respected: dragging to highlight a
 * customer email doesn't navigate on mouse-up.
 *
 * The row is keyboard-reachable and responds to Enter / Space, and
 * `role="link"` tells assistive tech it navigates.
 */

/**
 * Anything matching this inside the row keeps its own click handling.
 * `[data-row-action]` is the escape hatch for wrappers that aren't
 * natively interactive (e.g. a dropdown built from divs).
 */
const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  '[role="button"]',
  '[role="menu"]',
  '[role="menuitem"]',
  "[data-row-action]",
].join(", ");

function hitsInteractive(target: EventTarget | null, row: Element): boolean {
  if (!(target instanceof Element)) return false;
  const hit = target.closest(INTERACTIVE_SELECTOR);
  return hit !== null && row.contains(hit);
}

/** True while the user has a text selection - don't navigate on mouse-up. */
function hasSelection(): boolean {
  if (typeof window === "undefined") return false;
  const sel = window.getSelection();
  return sel !== null && sel.toString().trim().length > 0;
}

export function clickableRow(
  onOpen: () => void,
  options: { label?: string } = {},
): React.HTMLAttributes<HTMLTableRowElement> {
  return {
    role: "link",
    tabIndex: 0,
    "aria-label": options.label,
    style: { cursor: "pointer" },
    onClick: (e) => {
      if (hitsInteractive(e.target, e.currentTarget)) return;
      if (hasSelection()) return;
      onOpen();
    },
    onKeyDown: (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (hitsInteractive(e.target, e.currentTarget)) return;
      e.preventDefault();
      onOpen();
    },
  };
}
