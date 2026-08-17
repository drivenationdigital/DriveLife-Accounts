"use client";

import { useEffect, useRef } from "react";

/**
 * Reports the embedded content's height to the parent frame so the host
 * page can size the iframe to fit - no inner scrollbars. Pairs with the
 * host-side embed.js listener.
 *
 * Returns a ref to attach to the element that should be measured.
 *
 * Measuring is deliberately NOT `documentElement.scrollHeight`: that value
 * is floored at the iframe's viewport height, so once the parent applies a
 * height we report it back plus padding, and the frame ratchets taller on
 * every tick. Measuring the content element's own border-box breaks that
 * loop - the element's height depends on its content, not on how tall the
 * parent made the frame. (Viewport units inside the embed are neutralised
 * in globals.css for the same reason.)
 *
 * Sends { type: "drivelife-embed:height", height } on mount and whenever
 * the measured box actually changes size. Safe no-op when not framed.
 */

/** Floor, so a mid-load empty frame doesn't collapse to nothing. */
const DEFAULT_MIN_HEIGHT = 240;
/** Ceiling. Past this the iframe keeps its own scrollbar rather than growing. */
const DEFAULT_MAX_HEIGHT = 5000;
/** Ignore sub-pixel churn - reacting to it is what sustains a resize loop. */
const HEIGHT_EPSILON = 2;

export function useEmbedAutoResize(options?: {
  minHeight?: number;
  maxHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const minHeight = options?.minHeight ?? DEFAULT_MIN_HEIGHT;
  const maxHeight = options?.maxHeight ?? DEFAULT_MAX_HEIGHT;

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only meaningful inside a frame.
    if (window.parent === window) return;

    const el = ref.current;
    if (!el) return;

    let lastSent = -1;
    let frame = 0;

    const measure = () => {
      const raw = Math.ceil(el.getBoundingClientRect().height);
      const height = Math.min(maxHeight, Math.max(minHeight, raw));

      // Dead-band: only talk to the parent when the number really moved.
      if (Math.abs(height - lastSent) < HEIGHT_EPSILON) return;
      lastSent = height;

      window.parent.postMessage(
        { type: "drivelife-embed:height", height },
        "*", // any host may embed; height is non-sensitive
      );
    };

    // Coalesce bursts (validation errors, step swaps) into one post per frame.
    const post = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    post();

    const ro = new ResizeObserver(post);
    ro.observe(el);

    window.addEventListener("resize", post);
    window.addEventListener("load", post);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", post);
      window.removeEventListener("load", post);
    };
  }, [minHeight, maxHeight]);

  return ref;
}
