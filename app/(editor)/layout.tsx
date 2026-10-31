import "./editor.css";

import { cookies } from "next/headers";

import { EventCreateProvider } from "@/context/EventCreateContext";
import { appContainerFromCookies } from "@/lib/appReturn";

/**
 * Layout for the (editor) route group.
 *
 * Different from the (dashboard) layout: the editor has its own chrome
 * (its own topbar with Preview/Publish actions, its own sidebar with
 * step navigation), so we don't render the main app TopBar/Sidebar.
 *
 * Auth is still enforced - the middleware in the project root checks
 * the JWT cookie on every protected path, including this one.
 *
 * `editor.css` is imported here (not in the page) so the styles are
 * scoped to this route group at build time. Next.js dedupes CSS imports,
 * so it only ships once across all editor pages.
 *
 * Font Awesome 6 is pulled from a CDN here and only here - the rest of
 * the app uses its own SVG icon set (components/ui/Icons.tsx), so we
 * avoid adding a ~500KB stylesheet to every page. The link tag rendered
 * inside a layout gets hoisted into <head> by Next 14's React 18, so
 * this works the same as if it were in the root layout. When we
 * eventually swap the editor's `<i class="fa-...">` markers for inline
 * SVGs, this whole `<link>` block (and the preconnect) goes away.
 */
export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Marks the editor as running inside the app's web container, the same
  // way the dashboard layout does. The editor is its own route group with
  // its own layout, so it did not inherit that — which meant the CSS that
  // hides dashboard escape routes reached every page except the editor,
  // where the "Cancel and return to dashboard" link lives.
  //
  // Server-side, so the first paint is already correct. A JS check would
  // render the link and then take it away.
  //
  // `data-app-mode="manager"` marks the Event Manager flow, where the
  // editor's "back" is the event overview or the events list rather than
  // the app - see lib/appReturn.ts.
  const cookieStore = await cookies();
  const { inApp, manager } = appContainerFromCookies(
    (name) => cookieStore.get(name)?.value,
  );

  return (
    <EventCreateProvider>
      {/* Preconnect lets the browser open the TLS connection to cdnjs
          ahead of the stylesheet request, shaving ~100-300ms off the
          first icon paint on cold loads. */}
      <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      <div
        className="event-editor min-h-screen bg-ink-50 text-ink-900 font-sans"
        data-app-container={inApp ? "" : undefined}
        data-app-mode={manager ? "manager" : undefined}
      >
        {children}
      </div>
    </EventCreateProvider>
  );
}
