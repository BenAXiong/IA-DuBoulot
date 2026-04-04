"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileAvatar } from "@/components/dashboard/parent/profile-avatar";
import { DocumentLanguageSync } from "@/components/i18n/document-language-sync";
import { AppToolbarControls } from "@/components/layout/app-toolbar-controls";
import { withUiLanguage } from "@/lib/i18n/ui-language";
import type { AppUserRecord } from "@/lib/server/auth/types";
import type { StudentDashboardSnapshot } from "@/lib/server/student-dashboard/types";
import type { ListConversationSummary } from "@/lib/server/conversations/types";

type StudentAppShellProps = {
  children: React.ReactNode;
  appUser: AppUserRecord;
  snapshot: StudentDashboardSnapshot;
  conversations: ListConversationSummary[];
};

type StudentView = "homework" | "maps" | "tests";

type SubjectGroup = {
  subjectTag: string;
  count: number;
  conversations: ListConversationSummary[];
};

function getStudentShellCopy(languageCode: AppUserRecord["preferred_ui_language"]) {
  switch (languageCode) {
    case "en":
      return {
        brand: "banban",
        sidebarTitle: "Learner workspace",
        homework: "Homework",
        maps: "Maps",
        tests: "Tests",
        mapsHint: "Knowledge maps coming soon",
        testsHint: "Quiz mode coming soon",
        addSubject: "Add subject",
        noSubjects: "No subject yet",
        recentChats: "Recent chats",
        openSettings: "Profile & settings",
        signOut: "Sign out",
        signOutPending: "Signing out...",
        trialPlan: "Starter plan",
        familyPlan: "Family plan",
        pageTitles: {
          homework: "Homework",
          maps: "Maps",
          tests: "Tests",
          conversation: "Conversation",
          history: "History",
          settings: "Profile",
          fallback: "Learner workspace",
        },
        stealthBar: "Calm learner view",
      };
    case "zh":
      return {
        brand: "banban",
        sidebarTitle: "學習者工作區",
        homework: "作業",
        maps: "地圖",
        tests: "測驗",
        mapsHint: "知識地圖即將推出",
        testsHint: "測驗模式即將推出",
        addSubject: "新增科目",
        noSubjects: "還沒有科目",
        recentChats: "最近對話",
        openSettings: "個人檔案與設定",
        signOut: "登出",
        signOutPending: "登出中...",
        trialPlan: "入門方案",
        familyPlan: "Family 方案",
        pageTitles: {
          homework: "作業",
          maps: "地圖",
          tests: "測驗",
          conversation: "對話",
          history: "歷程",
          settings: "個人檔案",
          fallback: "學習者工作區",
        },
        stealthBar: "專注學習視圖",
      };
    default:
      return {
        brand: "banban",
        sidebarTitle: "Espace élève",
        homework: "Devoirs",
        maps: "Cartes",
        tests: "Tests",
        mapsHint: "Cartes de connaissances à venir",
        testsHint: "Mode quiz à venir",
        addSubject: "Ajouter une matière",
        noSubjects: "Aucune matière pour l'instant",
        recentChats: "Discussions récentes",
        openSettings: "Profil et réglages",
        signOut: "Déconnexion",
        signOutPending: "Déconnexion...",
        trialPlan: "Accès Starter",
        familyPlan: "Accès Family",
        pageTitles: {
          homework: "Devoirs",
          maps: "Cartes",
          tests: "Tests",
          conversation: "Discussion",
          history: "Historique",
          settings: "Profil",
          fallback: "Espace élève",
        },
        stealthBar: "Vue élève épurée",
      };
  }
}

function readActiveView(value: string | null): StudentView {
  if (value === "maps" || value === "tests") {
    return value;
  }

  return "homework";
}

function buildSubjectGroups(
  conversations: ListConversationSummary[],
): SubjectGroup[] {
  const groups = new Map<string, ListConversationSummary[]>();

  for (const conversation of conversations) {
    const key = conversation.subject_tag.trim() || "General";
    const existing = groups.get(key) ?? [];
    existing.push(conversation);
    groups.set(key, existing);
  }

  return Array.from(groups.entries())
    .map(([subjectTag, subjectConversations]) => ({
      subjectTag,
      count: subjectConversations.length,
      conversations: subjectConversations,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.subjectTag.localeCompare(right.subjectTag);
    });
}

function buildPageTitle(input: {
  pathname: string;
  view: StudentView;
  selectedSubject: string | null;
  copy: ReturnType<typeof getStudentShellCopy>;
}) {
  if (input.pathname.startsWith("/app/conversations/")) {
    return input.selectedSubject ?? input.copy.pageTitles.conversation;
  }

  if (input.pathname.startsWith("/app/history")) {
    return input.copy.pageTitles.history;
  }

  if (input.pathname.startsWith("/app/settings")) {
    return input.copy.pageTitles.settings;
  }

  if (input.selectedSubject) {
    return input.selectedSubject;
  }

  if (input.view === "maps") {
    return input.copy.pageTitles.maps;
  }

  if (input.view === "tests") {
    return input.copy.pageTitles.tests;
  }

  if (input.pathname.startsWith("/app/new")) {
    return input.copy.pageTitles.homework;
  }

  return input.copy.pageTitles.fallback;
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4.75 10.75 12 5l7.25 5.75v8a1 1 0 0 1-1 1h-3.5v-5.25h-5.5V19.75h-3.5a1 1 0 0 1-1-1v-8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4.75 6.5 9.5 4.75l5 1.75 4.75-1.75v12.75L14.5 19.25l-5-1.75-4.75 1.75V6.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M9.5 4.75v12.75M14.5 6.5v12.75"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TestIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8.25 4.75h7.5M10 4.75v4.5l-4.5 7a4.75 4.75 0 0 0 4 7h5a4.75 4.75 0 0 0 4-7l-4.5-7v-4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect
        height="14.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
        width="14.5"
        x="4.75"
        y="4.75"
      />
      <path d="M10.5 4.75v14.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function StudentAppShell({
  children,
  appUser,
  snapshot,
  conversations,
}: StudentAppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const languageCode = appUser.preferred_ui_language;
  const copy = getStudentShellCopy(languageCode);
  const activeView = readActiveView(searchParams.get("view"));
  const selectedSubject = searchParams.get("subject")?.trim() || null;
  const subjectGroups = useMemo(
    () => buildSubjectGroups(conversations),
    [conversations],
  );
  const pageTitle = buildPageTitle({
    pathname,
    view: activeView,
    selectedSubject,
    copy,
  });
  const planLabel =
    snapshot.usage.quota.planKind === "paid"
      ? copy.familyPlan
      : copy.trialPlan;

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[color:var(--line)] px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] font-[family-name:var(--font-heading)] text-sm font-semibold">
            bb
          </div>
          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <p className="brand-wordmark text-sm text-[color:var(--foreground)]">
                {copy.brand}
              </p>
              <p className="text-xs text-[color:var(--ink-soft)]">
                {copy.sidebarTitle}
              </p>
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] transition hover:-translate-y-0.5"
          onClick={() => setSidebarCollapsed((value) => !value)}
          type="button"
        >
          <span className="sr-only">Toggle sidebar</span>
          <PanelIcon />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="grid gap-2">
          <Link
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
              activeView === "homework"
                ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
            }`}
            href="/app?view=homework"
            onClick={() => setSidebarOpen(false)}
          >
            <HomeIcon />
            {!sidebarCollapsed ? <span>{copy.homework}</span> : null}
          </Link>

          {!sidebarCollapsed ? (
            <div className="grid gap-2 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                  {copy.homework}
                </p>
                <Link
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-base"
                  href="/app/new"
                  onClick={() => setSidebarOpen(false)}
                  title={copy.addSubject}
                >
                  +
                </Link>
              </div>

              {subjectGroups.length === 0 ? (
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.noSubjects}
                </p>
              ) : (
                <div className="grid gap-1">
                  {subjectGroups.map((group) => {
                    const isActive = selectedSubject === group.subjectTag;

                    return (
                      <div className="grid gap-1" key={group.subjectTag}>
                        <Link
                          className={`flex items-center justify-between rounded-[1rem] px-3 py-2 text-sm transition ${
                            isActive
                              ? "bg-[color:var(--surface-raised)] text-[color:var(--foreground)]"
                              : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
                          }`}
                          href={`/app?view=homework&subject=${encodeURIComponent(group.subjectTag)}`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className="truncate">{group.subjectTag}</span>
                          <span className="text-xs text-[color:var(--ink-muted)]">
                            {group.count}
                          </span>
                        </Link>

                        {isActive && group.conversations.length > 0 ? (
                          <div className="ml-3 grid gap-1 border-l border-[color:var(--line)] pl-3">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                              {copy.recentChats}
                            </p>
                            {group.conversations.slice(0, 6).map((conversation) => (
                              <Link
                                className={`truncate rounded-[0.95rem] px-2 py-2 text-sm transition ${
                                  pathname === `/app/conversations/${conversation.id}`
                                    ? "bg-[color:var(--surface)] text-[color:var(--foreground)]"
                                    : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
                                }`}
                                href={`/app/conversations/${conversation.id}?subject=${encodeURIComponent(group.subjectTag)}`}
                                key={conversation.id}
                                onClick={() => setSidebarOpen(false)}
                              >
                                {conversation.title}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          <Link
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
              activeView === "maps"
                ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
            }`}
            href="/app?view=maps"
            onClick={() => setSidebarOpen(false)}
          >
            <MapIcon />
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p>{copy.maps}</p>
                <p className="truncate text-xs text-[color:var(--ink-muted)]">
                  {copy.mapsHint}
                </p>
              </div>
            ) : null}
          </Link>

          <Link
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
              activeView === "tests"
                ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
            }`}
            href="/app?view=tests"
            onClick={() => setSidebarOpen(false)}
          >
            <TestIcon />
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p>{copy.tests}</p>
                <p className="truncate text-xs text-[color:var(--ink-muted)]">
                  {copy.testsHint}
                </p>
              </div>
            ) : null}
          </Link>
        </div>
      </nav>

      <div className="border-t border-[color:var(--line)] px-3 py-4">
        <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
          <div className="flex items-center gap-3">
            <ProfileAvatar name={appUser.display_name} />
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate font-medium">{appUser.display_name}</p>
                <p className="truncate text-sm text-[color:var(--ink-soft)]">
                  {planLabel}
                </p>
              </div>
            ) : null}
          </div>

          {!sidebarCollapsed ? (
            <>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                href="/app/settings"
                onClick={() => setSidebarOpen(false)}
              >
                {copy.openSettings}
              </Link>
              <SignOutButton
                label={copy.signOut}
                pendingLabel={copy.signOutPending}
                redirectHref={withUiLanguage("/auth", languageCode)}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[color:var(--background)]" lang={languageCode}>
      <DocumentLanguageSync languageCode={languageCode} />

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            className="flex-1 bg-black/45"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
          <aside className="relative h-full w-[18.5rem] border-l border-[color:var(--line)] bg-[color:var(--surface)] shadow-2xl">
            {content}
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <aside className="hidden border-r border-[color:var(--line)] bg-[color:var(--surface)] md:flex md:w-[18.5rem] md:flex-col">
          {content}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[color:var(--background)]/88 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] md:hidden"
                  onClick={() => setSidebarOpen(true)}
                  type="button"
                >
                  <span className="sr-only">Open sidebar</span>
                  <MenuIcon />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pageTitle}</p>
                  <p className="truncate text-xs text-[color:var(--ink-muted)]">
                    {copy.stealthBar}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <AppToolbarControls
                  appUser={appUser}
                  languageCode={languageCode}
                  variant="minimal"
                />
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
