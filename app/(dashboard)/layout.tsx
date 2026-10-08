import { cookies } from "next/headers";

import { APP_RETURN_COOKIE } from "@/lib/appReturn";
import { EventProvider } from "@/context/EventContext";
import { UIProvider } from "@/context/UIContext";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar, SidebarOverlay } from "@/components/layout/Sidebar";
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
  // that make no sense inside a screen the app opened for one event.
  const inApp = Boolean((await cookies()).get(APP_RETURN_COOKIE)?.value);

  return (
    <EventProvider>
      <UIProvider>
        {!inApp && <TopBar />}
        {!inApp && <SidebarOverlay />}
        <div className="app" data-app-container={inApp ? "" : undefined}>
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
