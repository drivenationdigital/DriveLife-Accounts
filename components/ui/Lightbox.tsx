"use client";

import { useEffect } from "react";

/**
 * Minimal image lightbox for the dashboard.
 *
 * Renders a full-screen dark backdrop with the image centred at its
 * natural aspect ratio. Closes on backdrop click, the × button, or
 * Escape. No zoom/gallery features - it exists so a thumbnail (e.g. a
 * checkout vehicle photo) can be inspected without leaving the page.
 *
 * Render conditionally: `{src && <Lightbox src={src} onClose={…} />}`.
 */
/**
 * Small clickable photo thumbnail that opens a Lightbox (the parent
 * owns the open/close state). A real <button>, so clickableRow() rows
 * leave it alone; stopPropagation is belt-and-braces on top.
 */
export function PhotoThumb({
  src,
  label,
  size = 28,
  onOpen,
}: {
  src: string;
  label: string;
  size?: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-row-action
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      style={{
        padding: 0,
        border: "1px solid var(--border, #e6e0d1)",
        borderRadius: 7,
        background: "none",
        cursor: "zoom-in",
        lineHeight: 0,
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: 6,
          display: "block",
        }}
      />
    </button>
  );
}

export function Lightbox({
  src,
  alt = "",
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Stop the page scrolling behind the overlay.
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
      aria-label={alt || "Photo"}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(15, 14, 12, 0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        cursor: "zoom-out",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.4)",
          color: "#fff",
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        ×
      </button>
      {/* Clicking the image itself shouldn't close - only backdrop/×. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "92vw",
          maxHeight: "88vh",
          borderRadius: 12,
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          cursor: "default",
        }}
      />
    </div>
  );
}
