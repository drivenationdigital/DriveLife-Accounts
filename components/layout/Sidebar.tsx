"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useUI } from "@/context/UIContext";
import { cx } from "@/lib/utils";
import { careventsHomeUrl } from "@/lib/eventPageUrl";
import { REGIONS } from "@/lib/regions";
import { useVisitorRegion } from "@/lib/useVisitorRegion";
import {
  ArrowLeftIcon,
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
  /** Leaves the app - rendered as a plain anchor so the browser does a
   *  real navigation rather than Next trying to route it internally. */
  external?: boolean;
  /** Extra class alongside `nav-item`, for variants like the back link. */
  variant?: string;
}

function NavItem({
  icon,
  label,
  active,
  badge,
  href,
  onClick,
  external,
  variant,
}: NavItemProps) {
  const className = cx("nav-item", variant, active && "active");
  const content = (
    <>
      <span className="nav-icon">{icon}</span>
      {label}
      {badge !== undefined && <span className="nav-badge">{badge}</span>}
    </>
  );

  if (href && external) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {content}
      </a>
    );
  }
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
  // Best guess at where the visitor is, so "Back to CarEvents.com"
  // lands on their own region's site rather than always the UK one.
  // A guess is fine here - the worst case is the other homepage - but
  // it must never be reused for anything that touches data.
  const visitorRegion = useVisitorRegion();
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
      {/* Back out to the public site. Sits above the divider, separate
          from the dashboard's own destinations - it's an exit, not a
          nav item, so it never takes the active state. */}
      <div className="nav-section">
        <NavItem
          icon={<ArrowLeftIcon />}
          label="Back to CarEvents.com"
          href={careventsHomeUrl(REGIONS[visitorRegion])}
          external
          variant="nav-item-back"
          onClick={() => handleClick("")}
        />
      </div>
      <div className="nav-divider" style={{ marginTop: 0 }} />

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
          icon={<BookmarkIcon />}
          label="Saved Events"
          href="/saved-events"
          active={isSavedEvents}
          onClick={() => handleClick("")}
        />
        
        <NavItem
          icon={<TicketIcon />}
          label="My Tickets"
          href="/my-tickets"
          active={isMyTickets}
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