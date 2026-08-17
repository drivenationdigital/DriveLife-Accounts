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

/**
 * The icon mark in white + gold, for dark backgrounds (the welcome
 * modal hero). Inlined rather than loaded as a file because the fills
 * differ from the shipped asset and are set per-path here - there's no
 * <style> block to leak, unlike the SVGs referenced above.
 */
export function LogoMarkLight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 210.4 170.4"
      role="img"
      aria-label="CarEvents"
    >
      <path
        fill="#ffffff"
        d="M89.3,83.5h39.2c.2,0,.4-.1.4-.3l16.9-39.3c.1-.3,0-.7-.4-.7h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7Z"
      />
      <path
        fill="#ffffff"
        d="M41,83.2l16.9-39.3c.1-.3,0-.7-.4-.7H18c-.2,0-.4.1-.4.3L.9,82.8c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3Z"
      />
      <path
        fill="#ffffff"
        d="M171.1,85.9h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3l16.9-39.3c.1-.3,0-.7-.4-.7Z"
      />
      <path
        fill="#b2915c"
        d="M66.9,125.8l16.9-39.3c.1-.3,0-.7-.4-.7h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3Z"
      />
      <path
        fill="#b2915c"
        d="M109.7,128.5h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3l16.9-39.3c.1-.3,0-.7-.4-.7Z"
      />
      <path
        fill="#b2915c"
        d="M208.2.6h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3L208.6,1.2c.1-.3,0-.7-.4-.7Z"
      />
    </svg>
  );
}
