"use client";

import { useUI } from "@/context/UIContext";
import { MenuIcon, PlusIcon } from "@/components/ui/Icons";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "./UserMenu";
import { Logo } from "./Logo";
import { useVisitorRegion } from "@/lib/useVisitorRegion";
import { careventsHomeUrl } from "@/lib/eventPageUrl";
import { REGIONS } from "@/lib/regions";

export function TopBar() {
  const { toggleSidebar, openCreateModal } = useUI();
  // Same region guess the sidebar's "Back to CarEvents.com" uses, so
  // the logo lands on the visitor's own homepage (US or /uk).
  const visitorRegion = useVisitorRegion();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-btn"
          aria-label="Toggle menu"
          onClick={toggleSidebar}
        >
          <MenuIcon />
        </button>
        <button type="button" className="btn-create" onClick={openCreateModal}>
          <PlusIcon />
          <span className="create-label">Create</span>
        </button>
      </div>

      <div className="topbar-center">
        <a
          className="topbar-logo-link"
          href={careventsHomeUrl(REGIONS[visitorRegion])}
          aria-label="Go to CarEvents.com"
        >
          <Logo />
        </a>
      </div>

      <div className="topbar-right">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
