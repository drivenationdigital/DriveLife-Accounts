import { cookies } from "next/headers";

import { APP_SPLASH_COOKIE, appContainerFromCookies } from "@/lib/appReturn";
import { EventProvider } from "@/context/EventContext";
import { UIProvider } from "@/context/UIContext";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar, SidebarOverlay } from "@/components/layout/Sidebar";
import { AppSplash } from "@/components/layout/AppSplash";
import { CreateModal } from "@/components/modals/CreateModal";
import { DetailModal } from "@/components/modals/DetailModal";
import { WelcomeModal } from "@/components/modals/WelcomeModal";

/**
 * Layout for the authenticated dashboard area. Middleware ensures anyone
 * reaching here has a token - but components that need the user can still
 * read `useAuth()` from the root AuthProvider.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inside the app's web container the page already has a header — the app's
  // own, with its logo and back button. Rendering ours underneath it gives
  // the user two headers and two back buttons that disagree, which is the
  // single most obvious way an embedded page announces that it is a website.
  //
  // The sidebar goes for the same reason: it navigates to dashboard pages
  // that make no sense inside a screen the app opened for one event — and
  // in the Event Manager flow (see lib/appReturn.ts) the middleware refuses
  // those pages outright, so a menu pointing at them would be a menu of
  // dead links.
  //
  // `data-app-mode="manager"` on top of `data-app-container` lets the CSS
  // bring back the links that step through that flow (Back to Events)
  // while the exits to the dashboard home stay hidden.
  const cookieStore = await cookies();
  const { inApp, manager } = appContainerFromCookies(
    (name) => cookieStore.get(name)?.value,
  );

  // The "Loading CarEvents.com Event Manager" screen on the page the app's
  // handoff lands on. Decided here, server-side, so the overlay is in the
  // first HTML and nothing of the page shows before it; the component takes
  // it down once the page is ready and clears the cookie.
  const splash = manager && cookieStore.get(APP_SPLASH_COOKIE)?.value === "1";

  return (
    <EventProvider>
      <UIProvider>
        {splash && <AppSplash />}
        {!inApp && <TopBar />}
        {!inApp && <SidebarOverlay />}
        <div
          className="app"
          data-app-container={inApp ? "" : undefined}
          data-app-mode={manager ? "manager" : undefined}
        >
          {!inApp && <Sidebar />}
          <main className="main">{children}</main>
        </div>
        <CreateModal />
        <DetailModal />
        {/* Renders itself only for accounts that have never picked a
            profile type, i.e. brand-new users. */}
        <WelcomeModal />
      </UIProvider>
    </EventProvider>
  );
}
