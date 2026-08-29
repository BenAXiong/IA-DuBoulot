"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileAvatar } from "@/components/dashboard/parent/profile-avatar";
import { DocumentLanguageSync } from "@/components/i18n/document-language-sync";
import { AppToolbarControls } from "@/components/layout/app-toolbar-controls";
import {
  addConversationListUpsertedListener,
  addConversationTitleUpdatedListener,
  readStoredConversationTitle,
  type ConversationTitleUpdatedDetail,
} from "@/lib/conversations/conversation-title-sync";
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

type StudentView = "dashboard" | "homework" | "maps" | "tests" | "forward";

type SubjectGroup = {
  subjectTag: string;
  count: number;
  activeCount: number;
  conversations: ListConversationSummary[];
};

const HOURGLASS_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M6 3h12M6 21h12M8 3v5a4 4 0 0 0 8 0V3M8 21v-5a4 4 0 0 1 8 0v5M8 8l8 8'/%3E%3C/svg%3E\") 12 12, wait";
const HOMEWORK_SUBJECT_SELECTED_EVENT = "iadb-homework-subject-selected";

function getStudentShellCopy(languageCode: AppUserRecord["preferred_ui_language"]) {
  switch (languageCode) {
    case "en":
      return {
        dashboard: "Dashboard",
        homework: "Homework",
        forward: "Forward",
        maps: "Recaps",
        tests: "Exams",
        explore: "Explore",
        forwardHint: "Peek into what's next",
        mapsHint: "Map your knowledge",
        testsHint: "Drill and improve your grades",
        exploreHint: "Dive deeper",
        addSubject: "Add subject",
        noSubjects: "No subject yet",
        profileSettings: "Profile & settings",
        signOut: "Sign out",
        signOutPending: "Signing out...",
        trialPlan: "Starter plan",
        familyPlan: "Family plan",
        comingSoon: "Coming soon!",
        expandSidebar: "Expand sidebar",
        collapseSidebar: "Collapse sidebar",
        pageTitles: {
          dashboard: "Dashboard",
          homework: "Homework",
          selectSubject: "Select a subject",
          forward: "Forward",
          maps: "Maps",
          tests: "Tests",
          conversation: "Conversation",
          history: "History",
          settings: "Profile and settings",
          fallback: "Homework",
        },
      };
    case "zh":
      return {
        dashboard: "總覽",
        homework: "作業",
        forward: "Forward",
        maps: "回顧",
        tests: "考試",
        explore: "探索",
        forwardHint: "先看看接下來會學什麼",
        mapsHint: "心智圖 - 整理你的知識",
        testsHint: "測驗 - 練習並提高成績",
        exploreHint: "深入探索你喜歡的主題",
        addSubject: "新增科目",
        noSubjects: "還沒有科目",
        profileSettings: "個人檔案與設定",
        signOut: "登出",
        signOutPending: "登出中...",
        trialPlan: "入門方案",
        familyPlan: "Family 方案",
        comingSoon: "即將推出！",
        expandSidebar: "展開側邊欄",
        collapseSidebar: "收合側邊欄",
        pageTitles: {
          dashboard: "總覽",
          homework: "作業",
          selectSubject: "選擇科目",
          forward: "Forward",
          maps: "地圖",
          tests: "測驗",
          conversation: "對話",
          history: "歷程",
          settings: "個人檔案與設定",
          fallback: "作業",
        },
      };
    default:
      return {
        dashboard: "Dashboard",
        homework: "Devoirs",
        forward: "Poursuivre",
        maps: "Récap",
        tests: "Tests",
        explore: "Explorer",
        forwardHint: "Pour aller plus loin",
        mapsHint: "Cartographie tes connaissances",
        testsHint: "Améliore tes notes",
        exploreHint: "Approfondis les sujets que tu aimes",
        addSubject: "Ajouter une matière",
        noSubjects: "Aucune matière pour l'instant",
        profileSettings: "Profil et réglages",
        signOut: "Déconnexion",
        signOutPending: "Déconnexion...",
        trialPlan: "Accès Starter",
        familyPlan: "Accès Family",
        comingSoon: "Bientôt disponible !",
        expandSidebar: "Déployer la barre latérale",
        collapseSidebar: "Réduire la barre latérale",
        pageTitles: {
          dashboard: "Dashboard",
          homework: "Devoirs",
          selectSubject: "Choisis une matière",
          forward: "Forward",
          maps: "Cartes",
          tests: "Tests",
          conversation: "Discussion",
          history: "Historique",
          settings: "Profil et réglages",
          fallback: "Devoirs",
        },
      };
  }
}

function writeHomeworkSubjectUrl(subjectTag: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set("view", "homework");

  if (subjectTag?.trim()) {
    url.searchParams.set("subject", subjectTag.trim());
  } else {
    url.searchParams.delete("subject");
  }

  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}?${url.searchParams.toString()}${url.hash}`,
  );
}

function isPlainPrimaryClick(event: React.MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
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

function readActiveView(
  value: string | null,
  selectedSubject: string | null,
): StudentView {
  if (
    value === "dashboard" ||
    value === "homework" ||
    value === "maps" ||
    value === "tests" ||
    value === "forward"
  ) {
    return value;
  }

  return selectedSubject ? "homework" : "dashboard";
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
      activeCount: subjectConversations.filter(
        (conversation) => conversation.status === "active",
      ).length,
      conversations: subjectConversations,
    }))
    .sort((left, right) => {
      if (right.activeCount !== left.activeCount) {
        return right.activeCount - left.activeCount;
      }

      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.subjectTag.localeCompare(right.subjectTag);
    });
}

function sortConversations(conversations: ListConversationSummary[]) {
  return [...conversations].sort((left, right) => {
    const leftDate =
      left.last_message_at ?? left.completed_at ?? left.created_at ?? "";
    const rightDate =
      right.last_message_at ?? right.completed_at ?? right.created_at ?? "";

    return rightDate.localeCompare(leftDate);
  });
}

function buildHeaderContent(input: {
  pathname: string;
  view: StudentView;
  selectedSubject: string | null;
  conversationTitle: string | null;
  copy: ReturnType<typeof getStudentShellCopy>;
}) {
  if (input.pathname.startsWith("/app/settings")) {
    return {
      eyebrow: input.copy.pageTitles.settings,
      title: null,
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
      eyebrow:
        formatSubjectDisplay(input.selectedSubject) ??
        input.copy.pageTitles.homework,
      title: input.conversationTitle,
    };
  }

  if (input.selectedSubject) {
    return {
      eyebrow: input.copy.pageTitles.homework,
      title: null,
    };
  }

  if (input.view === "dashboard") {
    return {
      eyebrow: input.copy.pageTitles.dashboard,
      title: null,
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
    title: null,
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
        d="M13.25 14.75c3.2-1.4 5.25-4.2 5.75-8.5.08-.67-.5-1.25-1.17-1.17-4.3.5-7.1 2.55-8.5 5.75l-3.08.92 2.5 2.5-1 3 3-.95 2.5 2.5.9-3.05Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
      <path
        d="M14.75 8.25h.01M6.5 17.5l-2 2M8 19l-1 1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.55"
      />
    </svg>
  );
}

function ExploreIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="7.25"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m14.5 9.5-1.35 3.65L9.5 14.5l1.35-3.65L14.5 9.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
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

function DisabledRailItem({
  collapsed,
  comingSoonLabel,
  icon,
  label,
  hint,
}: {
  collapsed: boolean;
  comingSoonLabel: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div
      aria-disabled="true"
      className={`group/disabled-rail ${
        collapsed ? "flex items-center justify-center" : "grid"
      } min-h-11 rounded-2xl px-3 py-2.5 text-sm font-medium text-[color:var(--ink-muted)] opacity-60`}
      style={{ cursor: HOURGLASS_CURSOR }}
      title={comingSoonLabel}
    >
      {collapsed ? (
        icon
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-3">
            {icon}
            <p className="truncate">{label}</p>
          </div>
          <p className="min-h-4 truncate pl-7 text-xs leading-4 text-[color:var(--ink-muted)] opacity-0 transition-opacity group-hover/disabled-rail:opacity-100">
            {hint}
          </p>
        </>
      )}
    </div>
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
  const [expandedSubjectTag, setExpandedSubjectTag] = useState<string | null>(null);
  const [optimisticHomeworkSubject, setOptimisticHomeworkSubject] = useState<
    string | null
  >(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [conversationHeaderOverrides, setConversationHeaderOverrides] = useState<
    Record<string, ConversationTitleUpdatedDetail>
  >({});
  const [shellConversations, setShellConversations] = useState(conversations);
  const profileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const languageCode = appUser.preferred_ui_language;
  const copy = getStudentShellCopy(languageCode);
  const selectedSubject = searchParams.get("subject")?.trim() || null;
  const activeView = readActiveView(searchParams.get("view"), selectedSubject);
  const visibleHomeworkSubject = optimisticHomeworkSubject ?? selectedSubject;
  const activeConversationId = pathname.startsWith("/app/conversations/")
    ? pathname.slice("/app/conversations/".length).split("/")[0] ?? null
    : null;
  const subjectGroups = useMemo(
    () => buildSubjectGroups(shellConversations),
    [shellConversations],
  );
  const activeConversation = useMemo(
    () =>
      activeConversationId
        ? shellConversations.find((conversation) => conversation.id === activeConversationId) ??
          null
        : null,
    [activeConversationId, shellConversations],
  );
  const storedConversationHeaderOverride = activeConversationId
    ? readStoredConversationTitle(activeConversationId)
    : null;
  const activeConversationSubject =
    visibleHomeworkSubject ??
    conversationHeaderOverrides[activeConversationId ?? ""]?.subjectTag ??
    storedConversationHeaderOverride?.subjectTag ??
    activeConversation?.subject_tag ??
    null;
  const activeConversationTitle =
    conversationHeaderOverrides[activeConversationId ?? ""]?.title?.trim() ??
    storedConversationHeaderOverride?.title?.trim() ??
    activeConversation?.title?.trim() ??
    null;

  useEffect(() => {
    setShellConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    setOptimisticHomeworkSubject(null);
  }, [pathname, selectedSubject]);

  useEffect(() => {
    return addConversationTitleUpdatedListener((detail) => {
      setConversationHeaderOverrides((current) => ({
        ...current,
        [detail.conversationId]: detail,
      }));
    });
  }, []);

  useEffect(() => {
    return addConversationListUpsertedListener((conversation) => {
      setShellConversations((current) => {
        const withoutCurrent = current.filter((item) => item.id !== conversation.id);
        return sortConversations([conversation, ...withoutCurrent]);
      });
    });
  }, []);
  const headerContent = buildHeaderContent({
    pathname,
    view: activeView,
    selectedSubject: activeConversationSubject,
    conversationTitle: activeConversationTitle,
    copy,
  });
  const isConversationRoute = pathname.startsWith("/app/conversations/");
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

  function handleHomeworkSubjectLinkClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    subjectTag: string | null,
  ) {
    if (
      pathname !== "/app" ||
      activeView !== "homework" ||
      !isPlainPrimaryClick(event)
    ) {
      return;
    }

    event.preventDefault();
    setSidebarOpen(false);
    setOptimisticHomeworkSubject(subjectTag);
    writeHomeworkSubjectUrl(subjectTag);
    window.dispatchEvent(
      new CustomEvent(HOMEWORK_SUBJECT_SELECTED_EVENT, {
        detail: { subjectTag },
      }),
    );
  }

  const desktopSidebarWidth = sidebarCollapsed ? "4.5rem" : "18.5rem";
  const desktopSidebarPadding = sidebarCollapsed ? "px-2" : "px-3";

  const content = (
      <div className="flex h-full flex-col">
      {sidebarCollapsed ? (
        <div className={`flex min-h-[3.25rem] items-center justify-center ${desktopSidebarPadding}`}>
          <button
            className="group relative inline-flex h-11 w-11 items-center justify-center rounded-[0.8rem]"
            onClick={() => setSidebarCollapsed(false)}
            type="button"
          >
            <span className="sr-only">{copy.expandSidebar}</span>
            <span className="brand-mark inline-flex h-full w-full items-center justify-center rounded-[0.8rem] font-[family-name:var(--font-heading)] text-xs font-semibold text-white transition group-hover:opacity-0">
              伴
            </span>
            <span className="absolute inset-0 inline-flex items-center justify-center text-[color:var(--foreground)] opacity-0 transition group-hover:opacity-100">
              <PanelIcon />
            </span>
          </button>
        </div>
      ) : (
        <div
          className={`flex min-h-[3.25rem] items-center justify-between ${desktopSidebarPadding}`}
        >
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
            onClick={() => setSidebarCollapsed(true)}
            type="button"
          >
            <span className="sr-only">{copy.collapseSidebar}</span>
            <PanelIcon />
          </button>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto py-4 ${desktopSidebarPadding}`}>
        <div className="grid gap-2">
          <Link
            className={`flex min-h-11 items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
              activeView === "dashboard"
                ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
            }`}
            href="/app?view=dashboard"
            onClick={() => setSidebarOpen(false)}
          >
            <HomeIcon />
            {!sidebarCollapsed ? <span>{copy.dashboard}</span> : null}
          </Link>

          {sidebarCollapsed ? (
            <Link
              className={`flex min-h-11 items-center justify-center rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                activeView === "homework"
                  ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                  : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
              }`}
              href="/app?view=homework"
              onClick={(event) => handleHomeworkSubjectLinkClick(event, null)}
              title={copy.homework}
            >
              <HomeworkIcon />
            </Link>
          ) : (
            <div className="group grid gap-1">
              <div className="flex min-h-11 items-center justify-between gap-3 px-3 py-2.5">
                <Link
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-[color:var(--foreground)]"
                  href="/app?view=homework"
                  onClick={(event) => handleHomeworkSubjectLinkClick(event, null)}
                >
                  <HomeworkIcon />
                  <span>{copy.homework}</span>
                </Link>
                <button
                  aria-expanded={homeworkExpanded}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--ink-muted)] transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                  onClick={() => {
                    const nextValue = !homeworkExpanded;

                    setHomeworkExpanded(nextValue);

                    if (!nextValue) {
                      setExpandedSubjectTag(null);
                    }
                  }}
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

              {homeworkExpanded ? (
                subjectGroups.length === 0 ? (
                  <p className="px-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                    {copy.noSubjects}
                  </p>
                ) : (
                  <div className="grid gap-1 pl-7">
                    {subjectGroups.map((group) => {
                      const isActive = visibleHomeworkSubject === group.subjectTag;
                      const isSubjectExpanded =
                        expandedSubjectTag === group.subjectTag;
                      const recentConversations = sortConversations(
                        group.conversations,
                      ).slice(0, 5);

                      return (
                        <div className="grid gap-1" key={group.subjectTag}>
                          <div
                            className={`group/item flex items-center gap-1 rounded-[1rem] pl-1 pr-3 transition ${
                              isActive
                                ? "text-[color:var(--foreground)]"
                                : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                            }`}
                          >
                            <Link
                              className="flex min-h-11 min-w-0 flex-1 items-center justify-between rounded-[1rem] px-2 py-1.5 text-sm"
                              href={`/app?view=homework&subject=${encodeURIComponent(group.subjectTag)}`}
                              onClick={(event) =>
                                handleHomeworkSubjectLinkClick(
                                  event,
                                  group.subjectTag,
                                )
                              }
                            >
                              <span className="truncate">
                                {capitalizeSubjectLabel(group.subjectTag)}
                              </span>
                              {group.activeCount > 0 ? (
                                <span className="student-homework-active-badge ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[0.7rem] font-bold leading-none">
                                  {group.activeCount}
                                </span>
                              ) : null}
                            </Link>
                            <button
                              aria-expanded={isSubjectExpanded}
                              aria-label={capitalizeSubjectLabel(group.subjectTag)}
                              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--ink-muted)] transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                              onClick={() => {
                                setExpandedSubjectTag((current) =>
                                  current === group.subjectTag
                                    ? null
                                    : group.subjectTag,
                                );
                              }}
                              title={capitalizeSubjectLabel(group.subjectTag)}
                              type="button"
                            >
                              <span
                                className={`transition ${
                                  isSubjectExpanded ? "rotate-90" : ""
                                }`}
                              >
                                <ChevronIcon />
                              </span>
                            </button>
                          </div>

                          {isSubjectExpanded ? (
                            <div className="grid gap-0.5 pl-3 pr-3">
                              {recentConversations.map((conversation) => (
                                <Link
                                  className="flex min-h-11 min-w-0 items-center gap-2 rounded-[0.8rem] px-2 py-1 text-xs leading-5 text-[color:var(--ink-muted)] transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                                  href={`/app/conversations/${conversation.id}`}
                                  key={conversation.id}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <span className="truncate">
                                    {conversation.title.trim() ||
                                      copy.pageTitles.conversation}
                                  </span>
                                  {conversation.status === "active" ? (
                                    <span className="student-homework-active-dot h-1.5 w-1.5 shrink-0 rounded-full" />
                                  ) : null}
                                </Link>
                              ))}
                              {group.conversations.length > 5 ? (
                                <p className="px-2 text-xs leading-5 text-[color:var(--ink-muted)]">
                                  ...
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>
          )}

          <div className="mx-3 my-1 h-px bg-[color:var(--line)]" />
          <div className="grid gap-0.5">
            <DisabledRailItem
              collapsed={sidebarCollapsed}
              comingSoonLabel={copy.comingSoon}
              hint={copy.mapsHint}
              icon={<MapIcon />}
              label={copy.maps}
            />
            <DisabledRailItem
              collapsed={sidebarCollapsed}
              comingSoonLabel={copy.comingSoon}
              hint={copy.testsHint}
              icon={<TestIcon />}
              label={copy.tests}
            />
            <div className="mx-3 my-1 h-px bg-[color:var(--line)]" />
            <DisabledRailItem
              collapsed={sidebarCollapsed}
              comingSoonLabel={copy.comingSoon}
              hint={copy.forwardHint}
              icon={<ForwardIcon />}
              label={copy.forward}
            />
            <DisabledRailItem
              collapsed={sidebarCollapsed}
              comingSoonLabel={copy.comingSoon}
              hint={copy.exploreHint}
              icon={<ExploreIcon />}
              label={copy.explore}
            />
          </div>
        </div>
      </nav>

      <div className={`${desktopSidebarPadding} py-3`}>
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
            className={`flex w-full items-center rounded-[1.5rem] px-2.5 py-2 text-left transition hover:bg-[color:var(--surface-strong)] ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            }`}
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
    <main
      className={`bg-[color:var(--background)] ${
        isConversationRoute ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
      data-conversation-route={isConversationRoute ? "true" : undefined}
      lang={languageCode}
    >
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

      <div className={`flex ${isConversationRoute ? "h-full min-h-0 overflow-hidden" : "min-h-screen"}`}>
        <aside
          className="hidden border-r border-[color:var(--line)] bg-[color:var(--surface)] transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:self-start"
          style={{ width: desktopSidebarWidth }}
        >
          {content}
        </aside>

        <div
          className={`flex min-w-0 flex-1 flex-col ${
            isConversationRoute ? "min-h-0 overflow-hidden" : ""
          }`}
        >
          <header
            className={`sticky top-0 z-20 min-h-[3.25rem] border-b border-[color:var(--line)] bg-[color:var(--background)]/88 py-0 backdrop-blur ${
              isConversationRoute ? "px-4 sm:px-6 xl:px-8" : "px-4 sm:px-5 lg:px-6"
            }`}
          >
            <div
              className={`mx-auto flex min-h-[3.25rem] w-full items-center justify-between gap-4 ${
                isConversationRoute ? "max-w-none" : "max-w-5xl"
              }`}
            >
              <div className="flex min-w-0 items-center">
                <div
                  className={`flex min-w-0 flex-col justify-center ${
                    isConversationRoute ? "pl-[3.25rem]" : ""
                  }`}
                >
                  <p className="truncate text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                    {headerContent.eyebrow}
                  </p>
                  {headerContent.title ? (
                    <p className="truncate text-sm font-medium">
                      {headerContent.title}
                    </p>
                  ) : null}
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

          <div
            className={`flex-1 ${
              isConversationRoute
                ? "min-h-0 overflow-hidden px-0 py-0"
                : "px-4 py-4 sm:px-5 lg:px-6"
            }`}
          >
            <div
              className={`w-full ${
                isConversationRoute
                  ? "h-full min-h-0 max-w-none"
                  : "mx-auto max-w-7xl"
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
