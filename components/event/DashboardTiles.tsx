"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarIcon,
  TicketIcon,
  CarIcon,
  BuildingIcon,
} from "@/components/ui/Icons";

interface Tile {
  label: string;
  href: string;
  icon: ReactNode;
}

const TILES: Tile[] = [
  { label: "My Events", href: "/events", icon: <CalendarIcon /> },
  { label: "My Tickets", href: "/my-tickets", icon: <TicketIcon /> },
  { label: "My Clubs", href: "/clubs", icon: <CarIcon /> },
  { label: "My Venues", href: "/venues", icon: <BuildingIcon /> },
];

export function DashboardTiles() {
  return (
    <div className="dash-tiles-wrap">
      <h1 className="dash-tiles-heading">Your Dashboard</h1>
      <div className="dash-tiles">
        {TILES.map((tile) => (
          <Link key={tile.href} href={tile.href} className="dash-tile">
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
