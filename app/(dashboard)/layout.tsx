import { EventProvider } from "@/context/EventContext";
import { UIProvider } from "@/context/UIContext";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar, SidebarOverlay } from "@/components/layout/Sidebar";
import { CreateModal } from "@/components/modals/CreateModal";
import { DetailModal } from "@/components/modals/DetailModal";

/**
 * Layout for the authenticated dashboard area. Middleware ensures anyone
 * reaching here has a token - but components that need the user can still
 * read `useAuth()` from the root AuthProvider.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EventProvider>
      <UIProvider>
        <TopBar />
        <SidebarOverlay />
        <div className="app">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
        <CreateModal />
        <DetailModal />
      </UIProvider>
    </EventProvider>
  );
}
