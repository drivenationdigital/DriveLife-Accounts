"use client";

import { useUI } from "@/context/UIContext";
import { MenuIcon, PlusIcon } from "@/components/ui/Icons";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "./UserMenu";
import { Logo } from "./Logo";

export function TopBar() {
  const { toggleSidebar, openCreateModal } = useUI();

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
        <Logo />
      </div>

      <div className="topbar-right">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
