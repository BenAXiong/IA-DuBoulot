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
        homeworkCardBody: "Open a subject and continue a homework chat.",
        noSubjectTitle: "No homework yet",
        noSubjectBody:
          "Choose the subject here and ask banban for advices.\nDon't forget to upload any class content or practice material that banban will need to help you!",
        forwardTitle: "Forward",
        forwardBody:
          "This space is reserved for future forward-looking guidance on what may come next and how to prepare for it at a high level.",
        mapsTitle: "Recaps",
        mapsBody:
          "This space is reserved for future knowledge maps. Homework remains the main learner experience for now.",
        testsTitle: "Exams",
        testsBody:
          "This space is reserved for future quiz practice. Homework remains the main learner experience for now.",
        exploreTitle: "Explore",
        exploreBody:
          "This space is reserved for deeper dives into topics the learner enjoys.",
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
        homeworkCardBody: "打開科目，繼續作業對話。",
        noSubjectTitle: "還沒有作業",
        noSubjectBody:
          "先在這裡選擇科目，再向 banban 詢問建議。\n別忘了上傳 banban 需要的課堂內容或練習資料，才能更好地幫助你！",
        forwardTitle: "Forward",
        forwardBody:
          "這裡會保留給未來的前瞻引導功能，幫學生先看接下來可能會學什麼，以及如何做高層次準備。",
        mapsTitle: "回顧",
        mapsBody:
          "這裡會保留給未來的知識地圖功能。目前學生的主要體驗仍以作業為主。",
        testsTitle: "考試",
        testsBody:
          "這裡會保留給未來的測驗練習功能。目前學生的主要體驗仍以作業為主。",
        exploreTitle: "探索",
        exploreBody: "這裡會保留給深入探索學生喜歡主題的功能。",
        comingSoon: "即將推出",
        needsAttention: "打開設定",
        subjectResourceUploadQuotaReached: "這個帳號的上傳額度已達上限。",
      };
    default:
      return {
        homeworkEyebrow: "Devoirs",
        dashboardTitle: "Tableau",
        dashboardBody: "Choisis l'espace de travail que tu veux ouvrir.",
        homeworkTitle: "Choisis une matière",
        homeworkBody: "Choisis une matière et entre directement dans la discussion.",
        homeworkCardTitle: "Devoirs",
        homeworkCardBody: "Ouvre une matière et continue une discussion de devoir.",
        noSubjectTitle: "Aucun devoir pour l'instant",
        noSubjectBody:
          "Choisis la matière ici et demande conseil à banban.\nN'oublie pas d'ajouter les supports de cours ou les exercices dont banban aura besoin pour t'aider !",
        forwardTitle: "Poursuivre",
        forwardBody:
          "Cet espace est réservé à une future guidance d'anticipation pour voir ce qui pourrait venir ensuite et comment s'y préparer à grands traits.",
        mapsTitle: "Récap",
        mapsBody:
          "Cet espace est réservé aux futures cartes de connaissances. Pour l'instant, l'expérience élève reste centrée sur les devoirs.",
        testsTitle: "Tests",
        testsBody:
          "Cet espace est réservé aux futurs quiz. Pour l'instant, l'expérience élève reste centrée sur les devoirs.",
        exploreTitle: "Explorer",
        exploreBody:
          "Cet espace est réservé aux explorations plus poussées des sujets que tu aimes.",
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
  const dashboardSubjectTags = Array.from(
    new Set([
      ...getIntakeSubjectOptions(languageCode)
        .map((option) => option.value)
        .filter((value) => value !== "autre"),
      ...subjectGroups.map((group) => group.subjectTag),
    ]),
  );
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

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardActivityCard
              body={copy.homeworkCardBody}
              href="/app?view=homework"
              title={copy.homeworkCardTitle}
            />
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
