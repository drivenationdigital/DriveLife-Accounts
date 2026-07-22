"use client";

import { useEffect } from "react";

/**
 * Reports this document's height to the parent frame so the host page
 * can size the iframe to fit — no inner scrollbars. Pairs with the
 * host-side embed.js listener.
 *
 * Sends { type: "drivelife-embed:height", height } on mount, on resize,
 * and whenever the DOM mutates (validation errors, step changes, the
 * success screen swapping in, etc.). Safe no-op when not framed.
 */
export function useEmbedAutoResize() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only meaningful inside a frame.
    if (window.parent === window) return;

    const post = () => {
      const height = Math.ceil(
        document.documentElement.scrollHeight ||
          document.body.scrollHeight ||
          0,
      );
      window.parent.postMessage(
        { type: "drivelife-embed:height", height },
        "*", // any host may embed; height is non-sensitive
      );
    };

    post();

    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);

    const mo = new MutationObserver(post);
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    window.addEventListener("resize", post);
    window.addEventListener("load", post);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", post);
      window.removeEventListener("load", post);
    };
  }, []);
}
