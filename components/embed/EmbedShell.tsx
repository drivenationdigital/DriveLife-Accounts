"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useEmbedAutoResize } from "@/lib/useEmbedAutoResize";

/**
 * The root layout paints `body` cream (var(--bg)) for the dashboard.
 * Inside an iframe that cream shows through the shell's padding as a
 * light ring around the form - glaring on a dark host page, and a
 * visible tint even on a white one. Clear it so the host's own
 * background shows through instead; modern browsers render an iframe
 * transparent when its document paints no background of its own.
 *
 * Inline rather than in globals.css so it is in the server-rendered
 * HTML and applies before hydration - no flash of cream. Unlayered, so
 * it beats the `@layer base` body rule regardless of specificity.
 */
const EMBED_ROOT_STYLE = "html, body { background: transparent !important; }";

/**
 * True for everything rendered inside EmbedShell (the /embed/* routes).
 * The same page components also serve the stand-alone checkout and
 * apply links, so they read this to drop what does not belong in a
 * frame on the organiser's own site - the event logo above the eyebrow,
 * since the host page already carries the organiser's branding.
 */
const EmbedContext = createContext(false);

export function useIsEmbedded(): boolean {
  return useContext(EmbedContext);
}

/**
 * Bare, frame-safe shell for embedded pages. No sidebar, no dashboard
 * chrome, transparent background so the host's page shows through the
 * padding around the card. Runs the auto-resize reporter so the iframe
 * sizes to content.
 */
export function EmbedShell({ children }: { children: ReactNode }) {
  const shellRef = useEmbedAutoResize();
  return (
    <div
      ref={shellRef}
      className="embed-shell min-h-0 bg-transparent p-3 md:p-4"
    >
      <style>{EMBED_ROOT_STYLE}</style>
      <EmbedContext.Provider value={true}>{children}</EmbedContext.Provider>
    </div>
  );
}
