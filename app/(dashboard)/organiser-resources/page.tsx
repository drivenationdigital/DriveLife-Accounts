"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Organiser resources - hub for the extras an organiser can use when
 * planning an event. Two entries for now:
 *   - Templates and documents (coming soon)
 *   - Event Exhibitor Directory
 */

interface Resource {
  title: string;
  description: string;
  href?: string;
  badge?: string;
  icon: ReactNode;
}

const RESOURCES: Resource[] = [
  {
    title: "Event Exhibitor Directory",
    description:
      "Find food, drink and retail exhibitors for your next event. Browse traders by category and get in touch directly.",
    href: "/organiser-resources/exhibitors",
    icon: <StoreIcon />,
  },
  {
    title: "Templates and documents",
    description:
      "Risk assessments, trader agreements, marshal briefings and more - ready-made documents to run a safe, well-organised event.",
    badge: "Coming soon",
    icon: <DocumentIcon />,
  },
];

export default function OrganiserResourcesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-600">
          Organising
        </p>
        <h1 className="page-title mt-1">Event Resources</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-500">
          Tools and directories to help you plan, staff and stock your next
          event.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {RESOURCES.map((res) => {
          const inner = (
            <>
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-50 to-gold-100 text-gold-600 transition ${
                  res.href ? "group-hover:from-gold-500 group-hover:to-gold-600 group-hover:text-white" : ""
                }`}
              >
                {res.icon}
              </span>
              <h2 className="mt-4 text-lg font-bold text-ink-900">{res.title}</h2>
              <p className="mt-1 text-sm text-ink-500">{res.description}</p>
              {res.badge ? (
                <span className="mt-4 inline-flex items-center rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {res.badge}
                </span>
              ) : (
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-600">
                  Browse
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
              )}
            </>
          );

          const cls =
            "group flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-ink-100 transition";

          return res.href ? (
            <Link key={res.title} href={res.href} className={`${cls} hover:-translate-y-1 hover:shadow-md`}>
              {inner}
            </Link>
          ) : (
            <div key={res.title} className={`${cls} opacity-75`} aria-disabled>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0" />
      <path d="M5 11v10h14V11" />
      <path d="M10 21v-6h4v6" />
    </svg>
  );
}
