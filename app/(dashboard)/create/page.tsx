"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Create Something — hub page offering the things a user can create
 * (Event, Car Club, Venue). Linked from the Settings "Create
 * Something" nav card.
 */

interface CreateOption {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

const OPTIONS: CreateOption[] = [
  {
    title: "Event",
    description: "List a car meet, show, or track day and sell tickets.",
    href: "/events/create",
    icon: <CalendarIcon />,
  },
  {
    title: "Car Club",
    description: "Start a club and let members apply to join.",
    href: "/clubs/create",
    icon: <CarIcon />,
  },
  {
    title: "Venue",
    description: "Add a car-friendly venue for others to discover.",
    href: "/venue/create",
    icon: <BuildingIcon />,
  },
];

export default function CreateHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
          Create Something
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink-900 md:text-3xl">
          What would you like to add?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Choose what you’d like to create. You can always edit or remove it
          later from your dashboard.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {OPTIONS.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="group flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-ink-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-50 to-gold-100 text-gold-600 transition group-hover:from-gold-500 group-hover:to-gold-600 group-hover:text-white">
              {opt.icon}
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink-900">{opt.title}</h2>
            <p className="mt-1 text-sm text-ink-500">{opt.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-600">
              Create
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition group-hover:translate-x-0.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l1.5-4.5A2 2 0 018.4 7h7.2a2 2 0 011.9 1.5L19 13" />
      <path d="M4 17h16v-3a1 1 0 00-1-1H5a1 1 0 00-1 1z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <line x1="9" y1="7" x2="9" y2="7.01" />
      <line x1="15" y1="7" x2="15" y2="7.01" />
      <line x1="9" y1="11" x2="9" y2="11.01" />
      <line x1="15" y1="11" x2="15" y2="11.01" />
      <path d="M10 21v-4h4v4" />
    </svg>
  );
}
