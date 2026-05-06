import Link from "next/link";
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
        homeworkCardBody: "Start from a subject, add useful sources, and keep the homework conversation moving.",
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
        homeworkCardBody: "從科目開始，加入需要的資料，繼續完成作業對話。",
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
        homeworkCardBody: "Pars d'une matière, ajoute les sources utiles, et avance dans ton devoir.",
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
        comingSoon: "Bientôt",
        needsAttention: "Ouvrir les réglages",
        subjectResourceUploadQuotaReached:
          "Le quota d'uploads de ce compte est atteint.",
      };
  }
}

function DashboardActivityCard({
  title,
  body,
  href,
  badge,
}: {
  title: string;
  body: string;
  href?: string;
  badge?: string;
}) {
  const className =
    "grid min-h-36 gap-3 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-left transition";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {title}
        </h2>
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
  subjects,
}: {
  title: string;
  body: string;
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
        <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{body}</p>
      </Link>

      <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
        {subjects.map((subject) => (
          <Link
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
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
  const dashboardCardSubjectTags =
    subjectGroups.length > 0
      ? subjectGroups.map((group) => group.subjectTag)
      : dashboardSubjectTags;
  const dashboardCardSubjects = dashboardCardSubjectTags.map((subjectTag) => ({
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
              subjects={dashboardCardSubjects}
              title={copy.homeworkCardTitle}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <DashboardActivityCard
                badge={copy.comingSoon}
                body={copy.mapsBody}
                title={copy.mapsTitle}
              />
              <DashboardActivityCard
                badge={copy.comingSoon}
                body={copy.testsBody}
                title={copy.testsTitle}
              />
              <DashboardActivityCard
                badge={copy.comingSoon}
                body={copy.forwardBody}
                title={copy.forwardTitle}
              />
              <DashboardActivityCard
                badge={copy.comingSoon}
                body={copy.exploreBody}
                title={copy.exploreTitle}
              />
            </div>
          </div>
        </section>
      ) : view === "forward" ? (
        <section className="mx-auto grid w-full max-w-4xl gap-4 py-10">
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
        <section className="mx-auto grid w-full max-w-4xl gap-4 py-10">
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
        <section className="mx-auto grid w-full max-w-4xl gap-4 py-10">
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
