"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type StudentView = "homework" | "maps" | "tests" | "forward";

type SubjectGroup = {
  subjectTag: string;
  count: number;
  conversations: ListConversationSummary[];
};

function getStudentShellCopy(languageCode: AppUserRecord["preferred_ui_language"]) {
  switch (languageCode) {
    case "en":
      return {
        dashboard: "Dashboard",
        homework: "Homework",
        forward: "Forward",
        maps: "Maps",
        tests: "Tests",
        forwardHint: "Preview what comes next",
        mapsHint: "Knowledge maps, later",
        testsHint: "Quiz mode, later",
        addSubject: "Add subject",
        noSubjects: "No subject yet",
        profileSettings: "Profile & settings",
        signOut: "Sign out",
        signOutPending: "Signing out...",
        trialPlan: "Starter plan",
        familyPlan: "Family plan",
        pageTitles: {
          homework: "Homework",
          selectSubject: "Select a subject",
          forward: "Forward",
          maps: "Maps",
          tests: "Tests",
          conversation: "Conversation",
          history: "History",
          settings: "Profile",
          fallback: "Homework",
        },
      };
    case "zh":
      return {
        dashboard: "總覽",
        homework: "作業",
        forward: "Forward",
        maps: "地圖",
        tests: "測驗",
        forwardHint: "預覽接下來會學什麼",
        mapsHint: "知識地圖，之後推出",
        testsHint: "測驗模式，之後推出",
        addSubject: "新增科目",
        noSubjects: "還沒有科目",
        profileSettings: "個人檔案與設定",
        signOut: "登出",
        signOutPending: "登出中...",
        trialPlan: "入門方案",
        familyPlan: "Family 方案",
        pageTitles: {
          homework: "作業",
          selectSubject: "選擇科目",
          forward: "Forward",
          maps: "地圖",
          tests: "測驗",
          conversation: "對話",
          history: "歷程",
          settings: "個人檔案",
          fallback: "作業",
        },
      };
    default:
      return {
        dashboard: "Tableau",
        homework: "Devoirs",
        forward: "Forward",
        maps: "Cartes",
        tests: "Tests",
        forwardHint: "Voir ce qui vient ensuite",
        mapsHint: "Cartes, plus tard",
        testsHint: "Quiz, plus tard",
        addSubject: "Ajouter une matière",
        noSubjects: "Aucune matière pour l'instant",
        profileSettings: "Profil et réglages",
        signOut: "Déconnexion",
        signOutPending: "Déconnexion...",
        trialPlan: "Accès Starter",
        familyPlan: "Accès Family",
        pageTitles: {
          homework: "Devoirs",
          selectSubject: "Choisis une matière",
          forward: "Forward",
          maps: "Cartes",
          tests: "Tests",
          conversation: "Discussion",
          history: "Historique",
          settings: "Profil",
          fallback: "Devoirs",
        },
      };
  }
}

function formatSubjectDisplay(subject: string | null) {
  if (!subject) {
    return null;
  }

  const trimmed = subject.trim();
  if (!trimmed) {
    return null;
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function capitalizeSubjectLabel(subject: string) {
  return formatSubjectDisplay(subject) ?? subject;
}

function readActiveView(value: string | null): StudentView {
  if (value === "maps" || value === "tests" || value === "forward") {
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

function buildHeaderContent(input: {
  pathname: string;
  view: StudentView;
  selectedSubject: string | null;
  copy: ReturnType<typeof getStudentShellCopy>;
}) {
  if (input.pathname.startsWith("/app/settings")) {
    return {
      eyebrow: input.copy.pageTitles.settings,
      title: input.copy.pageTitles.settings,
    };
  }

  if (input.pathname.startsWith("/app/history")) {
    return {
      eyebrow: input.copy.pageTitles.homework,
      title: input.copy.pageTitles.history,
    };
  }

  if (input.pathname.startsWith("/app/conversations/")) {
    return {
      eyebrow: input.copy.pageTitles.homework,
      title:
        formatSubjectDisplay(input.selectedSubject) ??
        input.copy.pageTitles.conversation,
    };
  }

  if (input.selectedSubject) {
    return {
      eyebrow: input.copy.pageTitles.homework,
      title: formatSubjectDisplay(input.selectedSubject) ?? input.selectedSubject,
    };
  }

  if (input.view === "maps") {
    return {
      eyebrow: input.copy.pageTitles.maps,
      title: input.copy.pageTitles.maps,
    };
  }

  if (input.view === "forward") {
    return {
      eyebrow: input.copy.pageTitles.forward,
      title: input.copy.pageTitles.forward,
    };
  }

  if (input.view === "tests") {
    return {
      eyebrow: input.copy.pageTitles.tests,
      title: input.copy.pageTitles.tests,
    };
  }

  return {
    eyebrow: input.copy.pageTitles.homework,
    title: input.copy.pageTitles.selectSubject,
  };
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

function HomeworkIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4.75 7.75a2 2 0 0 1 2-2h3.1l1.35 1.5h6.05a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2v-9Z"
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

function ForwardIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M6 12h9.5M12.5 6.5 18 12l-5.5 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
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

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
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
  const [homeworkExpanded, setHomeworkExpanded] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const languageCode = appUser.preferred_ui_language;
  const copy = getStudentShellCopy(languageCode);
  const activeView = readActiveView(searchParams.get("view"));
  const selectedSubject = searchParams.get("subject")?.trim() || null;
  const subjectGroups = useMemo(
    () => buildSubjectGroups(conversations),
    [conversations],
  );
  const headerContent = buildHeaderContent({
    pathname,
    view: activeView,
    selectedSubject,
    copy,
  });
  const planLabel =
    snapshot.usage.quota.planKind === "paid"
      ? copy.familyPlan
      : copy.trialPlan;

  useEffect(() => {
    return () => {
      if (profileMenuCloseTimeoutRef.current) {
        clearTimeout(profileMenuCloseTimeoutRef.current);
      }
    };
  }, []);

  function openProfileMenu() {
    if (profileMenuCloseTimeoutRef.current) {
      clearTimeout(profileMenuCloseTimeoutRef.current);
      profileMenuCloseTimeoutRef.current = null;
    }

    setProfileMenuOpen(true);
  }

  function closeProfileMenuWithDelay() {
    if (profileMenuCloseTimeoutRef.current) {
      clearTimeout(profileMenuCloseTimeoutRef.current);
    }

    profileMenuCloseTimeoutRef.current = setTimeout(() => {
      setProfileMenuOpen(false);
      profileMenuCloseTimeoutRef.current = null;
    }, 400);
  }

  const content = (
      <div className="flex h-full flex-col">
      <div className="flex min-h-[3.25rem] items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="brand-mark inline-flex items-center justify-center rounded-[0.8rem] font-[family-name:var(--font-heading)] text-xs font-semibold text-white"
            style={{ height: "2.28rem", width: "2.28rem" }}
          >
            bb
          </div>
        </div>

        <button
          className="theme-toggle theme-toggle--minimal"
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
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
              activeView === "homework"
                ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
            }`}
            href="/app?view=homework"
            onClick={() => setSidebarOpen(false)}
          >
            <HomeIcon />
            {!sidebarCollapsed ? <span>{copy.dashboard}</span> : null}
          </Link>

          {!sidebarCollapsed ? (
            <div className="group grid gap-1">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <Link
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-[color:var(--foreground)]"
                    href="/app?view=homework"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <HomeworkIcon />
                    <span>{copy.homework}</span>
                  </Link>
                  <button
                    aria-expanded={homeworkExpanded}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--ink-muted)] transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                    onClick={() => setHomeworkExpanded((value) => !value)}
                    title={copy.homework}
                    type="button"
                  >
                    <span
                      className={`transition ${homeworkExpanded ? "rotate-90" : ""}`}
                    >
                      <ChevronIcon />
                    </span>
                  </button>
                </div>
                <Link
                  aria-label={copy.addSubject}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] opacity-0 transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)] group-hover:opacity-100 focus-visible:opacity-100"
                  href="/app?view=homework"
                  onClick={() => setSidebarOpen(false)}
                  title={copy.addSubject}
                >
                  <PlusIcon />
                </Link>
              </div>

              {homeworkExpanded ? (
                subjectGroups.length === 0 ? (
                  <p className="px-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                    {copy.noSubjects}
                  </p>
                ) : (
                  <div className="grid gap-1 pl-7">
                    {subjectGroups.map((group) => {
                      const isActive = selectedSubject === group.subjectTag;

                      return (
                        <Link
                          className={`flex items-center justify-between rounded-[1rem] px-3 py-1.5 text-sm transition ${
                            isActive
                              ? "text-[color:var(--foreground)]"
                              : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                          }`}
                          href={`/app?view=homework&subject=${encodeURIComponent(group.subjectTag)}`}
                          key={group.subjectTag}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className="truncate">
                            {capitalizeSubjectLabel(group.subjectTag)}
                          </span>
                          <span className="text-xs text-[color:var(--ink-muted)]">
                            {group.count}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>
          ) : null}

          <Link
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
              activeView === "forward"
                ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
            }`}
            href="/app?view=forward"
            onClick={() => setSidebarOpen(false)}
          >
            <ForwardIcon />
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p>{copy.forward}</p>
                <p className="truncate text-xs text-[color:var(--ink-muted)]">
                  {copy.forwardHint}
                </p>
              </div>
            ) : null}
          </Link>

          <Link
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
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
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
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

      <div className="px-3 py-3">
        <div
          className="relative"
          onMouseEnter={openProfileMenu}
          onMouseLeave={closeProfileMenuWithDelay}
        >
          {!sidebarCollapsed ? (
            <div
              className={`absolute bottom-full left-0 right-0 mb-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-3 shadow-[var(--shadow)] transition ${
                profileMenuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
              onMouseEnter={openProfileMenu}
              onMouseLeave={closeProfileMenuWithDelay}
            >
              <div className="grid gap-2">
                <Link
                  className="inline-flex min-h-11 items-center rounded-[1rem] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
                  href="/app/settings"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setSidebarOpen(false);
                  }}
                >
                  {copy.profileSettings}
                </Link>
                <SignOutButton
                  className="inline-flex min-h-11 items-center rounded-[1rem] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
                  label={copy.signOut}
                  pendingLabel={copy.signOutPending}
                  redirectHref={withUiLanguage("/auth", languageCode)}
                />
              </div>
            </div>
          ) : null}

          <button
            className="flex w-full items-center gap-3 rounded-[1.5rem] px-2.5 py-2 text-left transition hover:bg-[color:var(--surface-strong)]"
            onClick={() => {
              if (profileMenuOpen) {
                closeProfileMenuWithDelay();
                return;
              }

              openProfileMenu();
            }}
            type="button"
          >
            <ProfileAvatar name={appUser.display_name} />
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate font-medium">{appUser.display_name}</p>
                <p className="truncate text-sm text-[color:var(--ink-soft)]">
                  {planLabel}
                </p>
              </div>
            ) : null}
          </button>
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
        <aside className="hidden border-r border-[color:var(--line)] bg-[color:var(--surface)] md:sticky md:top-0 md:flex md:h-screen md:w-[18.5rem] md:flex-col md:self-start">
          {content}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 min-h-[3.25rem] border-b border-[color:var(--line)] bg-[color:var(--background)]/88 px-3 py-0 backdrop-blur sm:px-4">
            <div className="mx-auto flex min-h-[3.25rem] w-full max-w-7xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center">
                <div className="flex min-w-0 flex-col justify-center">
                  <p className="truncate text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                    {headerContent.eyebrow}
                  </p>
                  <p className="truncate text-sm font-medium">
                    {headerContent.title}
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

          <div className="flex-1 px-4 py-4 sm:px-5 lg:px-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
