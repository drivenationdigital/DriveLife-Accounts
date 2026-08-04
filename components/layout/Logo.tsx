/**
 * Top bar logo.
 *
 * Two assets, one shown at a time - `.logo-wordmark` on desktop and
 * `.logo-mark` (icon only) under 600px. The swap is CSS-driven in
 * globals.css, so both are always in the DOM.
 *
 * Referenced as files rather than inlined: both SVGs carry their own
 * <style> block with generic class names (.st0, .st1, ...), which
 * would leak into the page and collide with each other if the markup
 * were pasted inline. Loading them via <img> keeps each one's styles
 * scoped to its own document.
 *
 * Plain <img> rather than next/image - these are static SVGs sized by
 * CSS height with width:auto, which next/image's required width/height
 * props fight against, and there's nothing for the optimiser to do to
 * an SVG anyway.
 */
export function Logo() {
  return (
    <div className="topbar-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="logo-mark"
        src="/logo-icon-1.svg"
        alt="CarEvents"
        width={187}
        height={159}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="logo-wordmark"
        src="/logo2-2.svg"
        alt="CarEvents"
        width={538}
        height={95}
      />
    </div>
  );
}
