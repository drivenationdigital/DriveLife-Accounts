import type { Metadata } from "next";
import "./globals.css";

import { QueryProvider } from "@/context/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ConfirmProvider } from "@/context/ConfirmContext";

export const metadata: Metadata = {
  title: "CarEvents",
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
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
