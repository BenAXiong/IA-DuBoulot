import Link from "next/link";
import type { ReactNode } from "react";
import { StudentFirstHomeworkLauncher } from "@/components/dashboard/student/student-first-homework-launcher";
import { StudentSubjectQuickStart } from "@/components/dashboard/student/student-subject-quick-start";
import {
  getStartStateBody,
  getStartStateLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { loadStudentDashboardSnapshot } from "@/lib/server/student-dashboard/student-dashboard-service";
import { listVisibleConversations } from "@/lib/server/conversations/conversation-service";
import { listSubjectResourceLibrary } from "@/lib/server/subject-resources/service";
import { getIntakeSubjectOptions } from "@/lib/i18n/student-flow-copy";
import type {
  AppUserRecord,
  AuthenticatedUserContext,
  UiLanguageCode,
} from "@/lib/server/auth/types";
import type { ListConversationSummary } from "@/lib/server/conversations/types";

type StudentDashboardProps = {
  appUser: AppUserRecord;
  context: AuthenticatedUserContext;
  initialDraft: string | null;
  selectedSubject: string | null;
  view: "dashboard" | "homework" | "maps" | "tests" | "forward";
};

function getStudentHubCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return {
        homeworkEyebrow: "Homework",
        dashboardTitle: "Dashboard",
        dashboardBody: "Choose the learning space you want to open.",
        homeworkTitle: "Select a subject",
        homeworkBody: "Pick a subject and jump straight into the chat.",
        homeworkCardTitle: "Homework",
        homeworkCardBody:
          "Check your answers and get step-by-step guidance on the tough parts.",
        noSubjectTitle: "No homework yet",
        noSubjectBody:
          "Choose the subject here and ask banban for advices.\nDon't forget to upload any class content or practice material that banban will need to help you!",
        forwardTitle: "Forward",
        forwardBody:
          "Preview what is coming next in class and build the basics before it feels rushed.",
        mapsTitle: "Recaps",
        mapsBody:
          "Turn recent lessons into clean summaries and visual maps that make revision easier.",
        testsTitle: "Exams",
        testsBody:
          "Practice with focused questions, spot fragile points, and prepare with less guesswork.",
        exploreTitle: "Explore",
        exploreBody:
          "Follow interesting ideas beyond the assignment and connect them to what you already know.",
        levelUpTitle: "Level up!",
        levelUpBody:
          "A short practice set will appear here when banban has enough recent work to spot what needs reinforcing next.",
        levelUpSignal: "Across all subjects",
        levelUpDetail:
          "Built from recent mistakes and patterns that keep coming back.",
        comingSoon: "Coming soon",
        needsAttention: "Open learner settings",
        subjectResourceUploadQuotaReached:
          "The upload quota for this account has been reached.",
      };
    case "zh":
      return {
        homeworkEyebrow: "作業",
        dashboardTitle: "總覽",
        dashboardBody: "選擇你要開啟的學習區域。",
        homeworkTitle: "選擇科目",
        homeworkBody: "選一個科目，直接開始或回到對話。",
        homeworkCardTitle: "作業",
        homeworkCardBody: "檢查你的答案，並一步步攻克卡住的地方。",
        noSubjectTitle: "還沒有作業",
        noSubjectBody:
          "先在這裡選擇科目，再向 banban 詢問建議。\n別忘了上傳 banban 需要的課堂內容或練習資料，才能更好地幫助你！",
        forwardTitle: "Forward",
        forwardBody:
          "先看看課堂接下來可能會學什麼，提前打好基礎。",
        mapsTitle: "回顧",
        mapsBody:
          "把最近的課程整理成摘要和知識圖，讓複習更清楚。",
        testsTitle: "考試",
        testsBody:
          "用有針對性的題目練習，找出不穩的地方，準備更踏實。",
        exploreTitle: "探索",
        exploreBody: "延伸探索你感興趣的主題，並連回已經學過的內容。",
        levelUpTitle: "Level up!",
        levelUpBody:
          "當 banban 有足夠的近期練習可以判斷需要加強的地方時，這裡會出現一組短練習。",
        levelUpSignal: "所有科目一起看",
        levelUpDetail: "根據最近的錯誤和反覆出現的薄弱點建立。",
        comingSoon: "即將推出",
        needsAttention: "打開設定",
        subjectResourceUploadQuotaReached: "這個帳號的上傳額度已達上限。",
      };
    default:
      return {
        homeworkEyebrow: "Devoirs",
        dashboardTitle: "Dashboard",
        dashboardBody: "Choisis l'espace de travail que tu veux ouvrir.",
        homeworkTitle: "Choisis une matière",
        homeworkBody: "Choisis une matière et entre directement dans la discussion.",
        homeworkCardTitle: "Devoirs",
        homeworkCardBody:
          "Vérifie tes réponses et avance pas à pas sur les passages difficiles.",
        noSubjectTitle: "Aucun devoir pour l'instant",
        noSubjectBody:
          "Choisis la matière ici et demande conseil à banban.\nN'oublie pas d'ajouter les supports de cours ou les exercices dont banban aura besoin pour t'aider !",
        forwardTitle: "Poursuivre",
        forwardBody:
          "Aperçois ce qui arrive ensuite en cours et prépare les bases avant d'être pressé.",
        mapsTitle: "Récap",
        mapsBody:
          "Transforme tes dernières leçons en résumés clairs et en cartes faciles à réviser.",
        testsTitle: "Tests",
        testsBody:
          "Entraîne-toi avec des questions ciblées, repère les points fragiles, et révise plus sereinement.",
        exploreTitle: "Explorer",
        exploreBody:
          "Approfondis les sujets qui t'intéressent et relie-les à ce que tu sais déjà.",
        levelUpTitle: "Level up!",
        levelUpBody:
          "Une courte série d'entraînement apparaîtra ici quand banban aura assez de devoirs récents pour repérer ce qu'il faut renforcer.",
        levelUpSignal: "Toutes matières confondues",
        levelUpDetail:
          "Construit à partir des erreurs récentes et des fragilités qui reviennent.",
        comingSoon: "Bientôt",
        needsAttention: "Ouvrir les réglages",
        subjectResourceUploadQuotaReached:
          "Le quota d'uploads de ce compte est atteint.",
      };
  }
}

function DashboardIconFrame({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)]">
      {children}
    </span>
  );
}

function HomeworkIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
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
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
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
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
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
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
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
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
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

function DashboardActivityCard({
  title,
  body,
  icon,
  href,
  badge,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  href?: string;
  badge?: string;
}) {
  const className =
    "grid min-h-36 gap-3 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-left transition";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <DashboardIconFrame>{icon}</DashboardIconFrame>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {title}
          </h2>
        </div>
        {badge ? (
          <span className="shrink-0 rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs font-medium text-[color:var(--ink-soft)]">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{body}</p>
    </>
  );

  if (href) {
    return (
      <Link
        className={`${className} hover:border-[color:var(--foreground)]/30 hover:bg-[color:var(--surface-strong)]`}
        href={href}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className={`${className} opacity-65`} data-disabled="true">
      {content}
    </article>
  );
}

function formatSubjectDisplay(subject: string) {
  const trimmed = subject.trim();
  if (!trimmed) {
    return subject;
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function DashboardHomeworkCard({
  title,
  body,
  icon,
  subjects,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  subjects: Array<{
    label: string;
    subjectTag: string;
  }>;
}) {
  return (
    <section className="grid gap-4 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,0.9fr)] sm:items-center">
      <Link
        className="grid gap-3 transition hover:text-[color:var(--accent)]"
        href="/app?view=homework"
      >
        <div className="flex items-center gap-3">
          <DashboardIconFrame>{icon}</DashboardIconFrame>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {title}
          </h2>
        </div>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{body}</p>
      </Link>

      <div className="flex max-w-full flex-wrap justify-end gap-2">
        {subjects.map((subject) => (
          <Link
            className="inline-flex min-h-9 min-w-[7.5rem] flex-[1_1_7.5rem] items-center justify-center whitespace-nowrap rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] sm:max-w-[12rem]"
            href={`/app?view=homework&subject=${encodeURIComponent(subject.subjectTag)}`}
            key={subject.subjectTag}
          >
            {subject.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function DashboardLevelUpCard({
  title,
  body,
  signal,
  detail,
  badge,
}: {
  title: string;
  body: string;
  signal: string;
  detail: string;
  badge: string;
}) {
  return (
    <article className="grid gap-4 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,0.42fr)] sm:items-center">
      <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <DashboardIconFrame>
            <TestIcon />
          </DashboardIconFrame>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
              {signal}
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              {title}
            </h2>
          </div>
        </div>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{body}</p>
      </div>

      <div className="grid gap-3 rounded-[0.9rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
        <span className="w-fit rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs font-medium text-[color:var(--ink-soft)]">
          {badge}
        </span>
        <p className="text-sm leading-6 text-[color:var(--foreground)]">
          {detail}
        </p>
      </div>
    </article>
  );
}

function buildSubjectGroups(conversations: ListConversationSummary[]) {
  const groups = new Map<string, ListConversationSummary[]>();

  for (const conversation of conversations) {
    const subjectTag = conversation.subject_tag.trim() || "General";
    const existing = groups.get(subjectTag) ?? [];
    existing.push(conversation);
    groups.set(subjectTag, existing);
  }

  return Array.from(groups.entries())
    .map(([subjectTag, subjectConversations]) => ({
      subjectTag,
      conversations: subjectConversations,
    }))
    .sort((left, right) => right.conversations.length - left.conversations.length);
}

export async function StudentDashboard({
  appUser,
  context,
  initialDraft,
  selectedSubject,
  view,
}: StudentDashboardProps) {
  const [snapshot, conversations] = await Promise.all([
    loadStudentDashboardSnapshot(appUser),
    listVisibleConversations({
      context,
    }),
  ]);
  const languageCode = appUser.preferred_ui_language;
  const copy = getStudentHubCopy(languageCode);
  const subjectGroups = buildSubjectGroups(conversations);
  const intakeSubjectOptions = getIntakeSubjectOptions(languageCode);
  const dashboardSubjectTags = Array.from(
    new Set([
      ...intakeSubjectOptions
        .map((option) => option.value)
        .filter((value) => value !== "autre"),
      ...subjectGroups.map((group) => group.subjectTag),
    ]),
  );
  const dashboardCardSubjects = dashboardSubjectTags.map((subjectTag) => ({
    subjectTag,
    label:
      intakeSubjectOptions.find(
        (option) => option.value.toLowerCase() === subjectTag.toLowerCase(),
      )?.label ?? formatSubjectDisplay(subjectTag),
  }));
  const subjectCounts = Object.fromEntries(
    subjectGroups.map((group) => [group.subjectTag, group.conversations.length]),
  );
  const selectedGroup = selectedSubject
    ? subjectGroups.find((group) => group.subjectTag === selectedSubject) ?? {
        subjectTag: selectedSubject,
        conversations: [],
      }
    : null;
  const selectedSubjectResources = selectedGroup
    ? await listSubjectResourceLibrary({
        context,
        subjectTag: selectedGroup.subjectTag,
      })
    : [];
  const subjectResourceUploadDisabledReason =
    (snapshot.usage.quota.uploads.remaining ?? 0) <= 0
      ? copy.subjectResourceUploadQuotaReached
      : null;
  const subjectResourcesBySubject = Object.fromEntries(
    await Promise.all(
      dashboardSubjectTags.map(async (subjectTag) => [
        subjectTag,
        await listSubjectResourceLibrary({
          context,
          subjectTag,
        }),
      ]),
    ),
  );

  return (
    <div className="grid gap-8">
      {!snapshot.canStartHomework ? (
        <section className="rounded-[1.75rem] border border-[#d6c48d] bg-[#fff8e5] px-5 py-4 text-sm leading-6 text-[#6b5320]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-medium">
                {getStartStateLabel(snapshot.startState, languageCode)}
              </p>
              <p>{getStartStateBody(snapshot.startState, languageCode)}</p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#c9b671] bg-white px-4 py-2 font-medium text-[#5e4917] transition hover:-translate-y-0.5"
              href="/app/settings"
            >
              {copy.needsAttention}
            </Link>
          </div>
        </section>
      ) : null}

      {view === "dashboard" ? (
        <section className="mx-auto grid w-full max-w-5xl gap-6 py-1">
          <div className="space-y-3">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              {copy.dashboardTitle}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
              {copy.dashboardBody}
            </p>
          </div>

          <div className="grid gap-3">
            <DashboardHomeworkCard
              body={copy.homeworkCardBody}
              icon={<HomeworkIcon />}
              subjects={dashboardCardSubjects}
              title={copy.homeworkCardTitle}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardActivityCard
                badge={copy.comingSoon}
                body={copy.mapsBody}
                icon={<MapIcon />}
                title={copy.mapsTitle}
              />
              <DashboardActivityCard
                badge={copy.comingSoon}
                body={copy.testsBody}
                icon={<TestIcon />}
                title={copy.testsTitle}
              />
              <DashboardActivityCard
                badge={copy.comingSoon}
                body={copy.forwardBody}
                icon={<ForwardIcon />}
                title={copy.forwardTitle}
              />
              <DashboardActivityCard
                badge={copy.comingSoon}
                body={copy.exploreBody}
                icon={<ExploreIcon />}
                title={copy.exploreTitle}
              />
            </div>
            <DashboardLevelUpCard
              badge={copy.comingSoon}
              body={copy.levelUpBody}
              detail={copy.levelUpDetail}
              signal={copy.levelUpSignal}
              title={copy.levelUpTitle}
            />
          </div>
        </section>
      ) : view === "forward" ? (
        <section className="mx-auto grid w-full max-w-5xl gap-4 py-10">
          <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.forwardTitle}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
            {copy.forwardTitle}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.forwardBody}
          </p>
        </section>
      ) : view === "maps" ? (
        <section className="mx-auto grid w-full max-w-5xl gap-4 py-10">
          <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.mapsTitle}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
            {copy.mapsTitle}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.mapsBody}
          </p>
        </section>
      ) : view === "tests" ? (
        <section className="mx-auto grid w-full max-w-5xl gap-4 py-10">
          <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.testsTitle}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
            {copy.testsTitle}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.testsBody}
          </p>
        </section>
      ) : selectedGroup ? (
        <section className="mx-auto grid w-full max-w-5xl gap-3 py-0.5">
          <StudentSubjectQuickStart
            conversations={selectedGroup.conversations}
            existingConversationCount={selectedGroup.conversations.length}
            initialDraft={initialDraft}
            initialSubjectResources={selectedSubjectResources}
            languageCode={languageCode}
            subjectResourceUploadDisabledReason={
              subjectResourceUploadDisabledReason
            }
            subjectTag={selectedGroup.subjectTag}
          />
        </section>
      ) : (
        <section className="mx-auto grid w-full max-w-5xl gap-8 py-1">
          <div className="space-y-3">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              {copy.homeworkTitle}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
              {copy.homeworkBody}
            </p>
          </div>

          {subjectGroups.length === 0 ? (
            <article className="grid gap-4 rounded-[1.75rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] px-6 py-8">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                {copy.noSubjectTitle}
              </h2>
              <p className="w-full max-w-none whitespace-pre-line text-sm leading-7 text-[color:var(--ink-soft)]">
                {copy.noSubjectBody}
              </p>
              <StudentFirstHomeworkLauncher
                initialDraft={initialDraft}
                languageCode={languageCode}
                knownSubjects={subjectGroups.map((group) => group.subjectTag)}
                conversations={conversations}
                subjectCounts={subjectCounts}
                subjectResourcesBySubject={subjectResourcesBySubject}
                subjectResourceUploadDisabledReason={
                  subjectResourceUploadDisabledReason
                }
              />
            </article>
          ) : (
            <>
              <article className="grid gap-4">
                <StudentFirstHomeworkLauncher
                  initialDraft={initialDraft}
                  knownSubjects={subjectGroups.map((group) => group.subjectTag)}
                  languageCode={languageCode}
                  conversations={conversations}
                  subjectCounts={subjectCounts}
                  subjectResourcesBySubject={subjectResourcesBySubject}
                  subjectResourceUploadDisabledReason={
                    subjectResourceUploadDisabledReason
                  }
                />
              </article>
            </>
          )}
        </section>
      )}
    </div>
  );
}
