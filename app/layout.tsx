import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import { RouteViewTracker } from "@/components/telemetry/route-view-tracker";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "IA DuBoulot",
  description:
    "A supervised AI homework coach for students, parents, and tutors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <Suspense fallback={null}>
          <RouteViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
