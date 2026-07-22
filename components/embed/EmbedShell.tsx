"use client";

import type { ReactNode } from "react";
import { useEmbedAutoResize } from "@/lib/useEmbedAutoResize";

/**
 * Bare, frame-safe shell for embedded pages. No sidebar, no dashboard
 * chrome, transparent background so the host's page shows through the
 * card. Runs the auto-resize reporter so the iframe sizes to content.
 */
export function EmbedShell({ children }: { children: ReactNode }) {
  const shellRef = useEmbedAutoResize();
  return (
    <div
      ref={shellRef}
      className="embed-shell min-h-0 bg-transparent p-3 md:p-4"
    >
      {children}
    </div>
  );
}
