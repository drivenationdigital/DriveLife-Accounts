import "./editor.css";

import { EventCreateProvider } from "@/context/EventCreateContext";

/**
 * Layout for the (editor) route group.
 *
 * Different from the (dashboard) layout: the editor has its own chrome
 * (its own topbar with Preview/Publish actions, its own sidebar with
 * step navigation), so we don't render the main app TopBar/Sidebar.
 *
 * Auth is still enforced — the middleware in the project root checks
 * the JWT cookie on every protected path, including this one.
 *
 * `editor.css` is imported here (not in the page) so the styles are
 * scoped to this route group at build time. Next.js dedupes CSS imports,
 * so it only ships once across all editor pages.
 *
 * Font Awesome 6 is pulled from a CDN here and only here — the rest of
 * the app uses its own SVG icon set (components/ui/Icons.tsx), so we
 * avoid adding a ~500KB stylesheet to every page. The link tag rendered
 * inside a layout gets hoisted into <head> by Next 14's React 18, so
 * this works the same as if it were in the root layout. When we
 * eventually swap the editor's `<i class="fa-...">` markers for inline
 * SVGs, this whole `<link>` block (and the preconnect) goes away.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EventCreateProvider>
      {/* Preconnect lets the browser open the TLS connection to cdnjs
          ahead of the stylesheet request, shaving ~100–300ms off the
          first icon paint on cold loads. */}
      <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      <div className="event-editor min-h-screen bg-ink-50 text-ink-900 font-sans">
        {children}
      </div>
    </EventCreateProvider>
  );
}
