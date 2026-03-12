import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import { RouteViewTracker } from "@/components/telemetry/route-view-tracker";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  fallback: ["PingFang TC", "Microsoft JhengHei", "sans-serif"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const headingFont = Space_Grotesk({
  fallback: ["PingFang TC", "Microsoft JhengHei", "sans-serif"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "IA DuBoulot",
  description:
    "A calm, supervised AI homework coach for students, parents, and tutors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        <ThemeScript />
        <Suspense fallback={null}>
          <RouteViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
