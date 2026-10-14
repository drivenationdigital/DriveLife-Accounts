"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookmarkIcon,
  CalendarIcon,
  TicketIcon,
  CarIcon,
  BuildingIcon,
  StoreIcon,
  FlagIcon,
  FolderIcon,
  SettingsIcon,
} from "@/components/ui/Icons";

interface Tile {
  label: string;
  href: string;
  icon: ReactNode;
  /** Shown on phones only. Desktop keeps two rows of four. */
  mobileOnly?: boolean;
}

const TILES: Tile[] = [
  { label: "Saved Events", href: "/saved-events", icon: <BookmarkIcon /> },
  { label: "My Events", href: "/events", icon: <CalendarIcon /> },
  { label: "Tickets", href: "/my-tickets", icon: <TicketIcon /> },
  { label: "Clubs", href: "/clubs", icon: <CarIcon /> },
  { label: "Venues", href: "/venues", icon: <BuildingIcon /> },
  { label: "Tracks", href: "/tracks", icon: <FlagIcon /> },
  { label: "Businesses", href: "/businesses", icon: <StoreIcon /> },
  { label: "Resources", href: "/organiser-resources", icon: <FolderIcon />, mobileOnly: true },
  { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
];

export function DashboardTiles() {
  return (
    <div className="dash-tiles-wrap">
      <div className="dash-tiles">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`dash-tile${tile.mobileOnly ? " dash-tile-mobile-only" : ""}`}
          >
            <span className="dash-tile-icon" aria-hidden>
              {tile.icon}
            </span>
            <span className="dash-tile-label">{tile.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
