import { execSync } from "node:child_process";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import "katex/dist/katex.min.css";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import { RouteViewTracker } from "@/components/telemetry/route-view-tracker";
import { ThemeScript } from "@/components/theme/theme-script";
import {
  APP_UI_LANGUAGE_COOKIE_NAME,
  resolveUiLanguageCode,
} from "@/lib/i18n/ui-language";
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

function resolveBuildCommitLabel() {
  const envCommit =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  if (envCommit && envCommit.trim().length > 0) {
    return envCommit.trim().slice(0, 7);
  }

  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const commitLabel = resolveBuildCommitLabel();
  const cookieStore = await cookies();
  const languageCode = resolveUiLanguageCode(
    cookieStore.get(APP_UI_LANGUAGE_COOKIE_NAME)?.value,
  );

  return (
    <html lang={languageCode} suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        <ThemeScript />
        <div className="pointer-events-none fixed bottom-2 right-3 z-[70] translate-y-[10px] select-none text-[0.68rem] font-medium tracking-[0.18em] text-[color:var(--ink-muted)] opacity-55">
          {commitLabel}
        </div>
        <Suspense fallback={null}>
          <RouteViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
