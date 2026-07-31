"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useUI } from "@/context/UIContext";
import { cx } from "@/lib/utils";
import {
  DashboardIcon,
  TicketIcon,
  BookmarkIcon,
  CalendarIcon,
  CarIcon,
  BuildingIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/Icons";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
  href?: string;
  onClick?: () => void;
}

function NavItem({ icon, label, active, badge, href, onClick }: NavItemProps) {
  const className = cx("nav-item", active && "active");
  const content = (
    <>
      <span className="nav-icon">{icon}</span>
      {label}
      {badge !== undefined && <span className="nav-badge">{badge}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <div className={className} onClick={onClick}>
      {content}
    </div>
  );
}

export function Sidebar() {
  const { closeSidebar } = useUI();
  const pathname = usePathname();
  // Local state for items that don't have routes yet.
  const [activeKey, setActiveKey] = useState<string>("");

  const handleClick = (key: string) => {
    setActiveKey(key);
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 900px)").matches
    ) {
      closeSidebar();
    }
  };

  const isDashboard = pathname === "/";
  const isMyTickets =
    pathname === "/my-tickets" || pathname.startsWith("/my-tickets/");
  const isSavedEvents =
    pathname === "/saved-events" || pathname.startsWith("/saved-events/");
  const isClubs =
    pathname === "/clubs" || pathname.startsWith("/clubs/");
  const isVenues =
    pathname === "/venues" || pathname.startsWith("/venues/");
  const isSettings =
    pathname === "/settings" || pathname.startsWith("/settings/");
  const isEvents =
    pathname === "/events" || pathname.startsWith("/events/");
  const isAccount = pathname === "/account";

  return (
    <aside className="sidebar">
      <div className="nav-section">
        <NavItem
          icon={<DashboardIcon />}
          label="Dashboard"
          href="/"
          active={isDashboard}
          onClick={() => handleClick("")}
        />
      </div>

      <div className="nav-section">
        <div className="nav-label">Attending</div>
        <NavItem
          icon={<TicketIcon />}
          label="My Tickets"
          href="/my-tickets"
          active={isMyTickets}
          onClick={() => handleClick("")}
        />
        <NavItem
          icon={<BookmarkIcon />}
          label="Saved Events"
          href="/saved-events"
          active={isSavedEvents}
          onClick={() => handleClick("")}
        />
      </div>

      <div className="nav-section">
        <div className="nav-label">Organising</div>
        <NavItem
          icon={<CalendarIcon />}
          label="My Events"
          href="/events"
          active={isEvents}
          onClick={() => handleClick("")}
        />
        <NavItem
          icon={<CarIcon />}
          label="My Clubs"
          href="/clubs"
          active={isClubs}
          onClick={() => handleClick("")}
        />
        <NavItem
          icon={<BuildingIcon />}
          label="My Venues"
          href="/venues"
          active={isVenues}
          onClick={() => handleClick("")}
        />
      </div>

      <div className="nav-divider" />

      <div className="nav-section">
        <div className="nav-label">Account</div>
        <NavItem
          icon={<SettingsIcon />}
          label="Settings"
          href="/settings"
          active={isSettings}
          onClick={() => handleClick("")}
        />
        <NavItem
          icon={<UserIcon />}
          label="My Account"
          href="/account"
          active={isAccount}
          onClick={() => handleClick("")}
        />
      </div>
    </aside>
  );
}

export function SidebarOverlay() {
  const { closeSidebar } = useUI();
  return <div className="sidebar-overlay" onClick={closeSidebar} />;
}