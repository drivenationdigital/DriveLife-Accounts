import type { Metadata } from "next";
import "./globals.css";

import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import NextTopLoader from "nextjs-toploader";
import { ToastProvider } from "@/context/ToastContext";
import { ActionProvider } from "@/context/ActionContext";
import { LoadingSplash } from "@/components/layout/LoadingSplash";

/**
 * `?loading=1` on any URL: switch the white loading screen (#ce-splash
 * below) on before the page paints. The script runs inline immediately
 * after the overlay element, which sits FIRST in <body>, so the overlay
 * is showing before any of the page behind it has even been parsed.
 * LoadingSplash takes it down again once the page has loaded (min 2s).
 *
 * The flag is an attribute on the overlay div itself, not on <html>:
 * React 19 strips every attribute from the <html>/<head>/<body>
 * singletons when it hydrates them, so a flag set there vanished the
 * moment the app booted. Ordinary elements keep their extra attributes.
 */
const SPLASH_BOOT =
  "try{if(/[?&]loading=1(?=&|$)/.test(location.search)){document.getElementById('ce-splash').setAttribute('data-on','')}}catch(e){}";

export const metadata: Metadata = {
  title: "My Account - CarEvents.com",
  description: "Manage your car events, orders, show cars, clubs and traders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Geist:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Loading screen for ?loading=1 - hidden unless it carries
            data-on (set by SPLASH_BOOT, which must stay directly after
            it). First in <body> on purpose: see SPLASH_BOOT. Plain
            <img>: the SVG has its own <style> block, which must not be
            inlined. suppressHydrationWarning covers the attribute the
            boot script adds before React hydrates. */}
        <div id="ce-splash" aria-hidden="true" suppressHydrationWarning>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon-1.svg" alt="" width={187} height={159} />
        </div>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_BOOT }} />
        <NextTopLoader
          color="#bd7420" // your --gold-deep
          height={3}
          showSpinner={false} // just the bar, no corner spinner
          shadow="0 0 10px #bd7420, 0 0 5px #bd7420"
        />
        <QueryProvider>
          <AuthProvider>
            <ConfirmProvider>
              <ToastProvider>
                <ActionProvider>{children}</ActionProvider>
              </ToastProvider>
            </ConfirmProvider>
          </AuthProvider>
          {/* Inside QueryProvider: it waits for in-flight queries. */}
          <LoadingSplash />
        </QueryProvider>
      </body>
    </html>
  );
}
