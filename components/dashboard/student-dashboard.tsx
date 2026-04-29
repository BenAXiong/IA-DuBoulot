import Link from "next/link";
import { StudentFirstHomeworkLauncher } from "@/components/dashboard/student/student-first-homework-launcher";
import { StudentSubjectQuickStart } from "@/components/dashboard/student/student-subject-quick-start";
import {
  formatDateLabel,
  getConversationStatusLabel,
  getStartStateBody,
  getStartStateLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { loadStudentDashboardSnapshot } from "@/lib/server/student-dashboard/student-dashboard-service";
import { listVisibleConversations } from "@/lib/server/conversations/conversation-service";
import { listSubjectResourceLibrary } from "@/lib/server/subject-resources/service";
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
  view: "homework" | "maps" | "tests" | "forward";
};

function getStudentHubCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return {
        homeworkEyebrow: "Homework",
        homeworkTitle: "Select a subject",
        homeworkBody: "Pick a subject and jump straight into the chat.",
        noSubjectTitle: "No homework yet",
        noSubjectBody:
          "Choose the subject here and ask banban for advices.\nDon't forget to upload any class content or practice material that banban will need to help you!",
        recentTitle: "Recent homework chats",
        open: "Open",
        active: "Continue",
        forwardTitle: "Forward will live here later.",
        forwardBody:
          "This space is reserved for future forward-looking guidance on what may come next and how to prepare for it at a high level.",
        mapsTitle: "Maps will live here later.",
        mapsBody:
          "This space is reserved for future knowledge maps. Homework remains the main learner experience for now.",
        testsTitle: "Tests will live here later.",
        testsBody:
          "This space is reserved for future quiz practice. Homework remains the main learner experience for now.",
        noSubjectChats: "No discussion has been saved for this subject yet.",
        needsAttention: "Open learner settings",
      };
    case "zh":
      return {
        homeworkEyebrow: "作業",
        homeworkTitle: "選擇科目",
        homeworkBody: "選一個科目，直接開始或回到對話。",
        noSubjectTitle: "還沒有作業",
        noSubjectBody:
          "先在這裡選擇科目，再向 banban 詢問建議。\n別忘了上傳 banban 需要的課堂內容或練習資料，才能更好地幫助你！",
        recentTitle: "最近作業對話",
        open: "打開",
        active: "續接",
        forwardTitle: "Forward 功能之後會在這裡。",
        forwardBody:
          "這裡會保留給未來的前瞻引導功能，幫學生先看接下來可能會學什麼，以及如何做高層次準備。",
        mapsTitle: "地圖工具之後會在這裡。",
        mapsBody:
          "這裡會保留給未來的知識地圖功能。目前學生的主要體驗仍以作業為主。",
        testsTitle: "測驗工具之後會在這裡。",
        testsBody:
          "這裡會保留給未來的測驗練習功能。目前學生的主要體驗仍以作業為主。",
        noSubjectChats: "這個科目目前還沒有已儲存的對話。",
        needsAttention: "打開設定",
      };
    default:
      return {
        homeworkEyebrow: "Devoirs",
        homeworkTitle: "Choisis une matière",
        homeworkBody: "Choisis une matière et entre directement dans la discussion.",
        noSubjectTitle: "Aucun devoir pour l'instant",
        noSubjectBody:
          "Choisis la matière ici et demande conseil à banban.\nN'oublie pas d'ajouter les supports de cours ou les exercices dont banban aura besoin pour t'aider !",
        recentTitle: "Discussions récentes",
        open: "Ouvrir",
        active: "Reprendre",
        forwardTitle: "Forward viendra ici plus tard.",
        forwardBody:
          "Cet espace est réservé à une future guidance d'anticipation pour voir ce qui pourrait venir ensuite et comment s'y préparer à grands traits.",
        mapsTitle: "Les cartes viendront ici plus tard.",
        mapsBody:
          "Cet espace est réservé aux futures cartes de connaissances. Pour l'instant, l'expérience élève reste centrée sur les devoirs.",
        testsTitle: "Les tests viendront ici plus tard.",
        testsBody:
          "Cet espace est réservé aux futurs quiz. Pour l'instant, l'expérience élève reste centrée sur les devoirs.",
        noSubjectChats: "Aucune discussion enregistrée pour cette matière.",
        needsAttention: "Ouvrir les réglages",
      };
  }
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

function formatSubjectDisplay(subjectTag: string) {
  const trimmed = subjectTag.trim();
  if (!trimmed) {
    return subjectTag;
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function renderConversationRows(input: {
  conversations: ListConversationSummary[];
  languageCode: UiLanguageCode;
  showSubject?: boolean;
}) {
  return (
    <div className="divide-y divide-[color:var(--line)]">
      {input.conversations.map((conversation) => (
        <Link
          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-4 transition hover:bg-[color:var(--surface-strong)]"
          href={`/app/conversations/${conversation.id}?subject=${encodeURIComponent(conversation.subject_tag)}`}
          key={conversation.id}
        >
          <div className="min-w-0 space-y-1">
            <h3 className="overflow-hidden text-ellipsis whitespace-nowrap font-[family-name:var(--font-heading)] text-xl leading-tight">
              {conversation.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--ink-soft)]">
              {input.showSubject ? (
                <span>{formatSubjectDisplay(conversation.subject_tag)}</span>
              ) : null}
              <span>
                {getConversationStatusLabel(
                  conversation.status,
                  input.languageCode,
                )}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-sm text-[color:var(--ink-soft)]">
            {formatDateLabel(
              conversation.last_message_at ??
                conversation.completed_at ??
                conversation.created_at,
              input.languageCode,
            ) ?? ""}
          </div>
        </Link>
      ))}
    </div>
  );
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

      {view === "forward" ? (
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
          <div className="grid gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="max-w-full break-words font-[family-name:var(--font-heading)] text-4xl leading-tight">
                {formatSubjectDisplay(selectedGroup.subjectTag)}
              </h1>
            </div>

            <StudentSubjectQuickStart
              conversations={selectedGroup.conversations}
              existingConversationCount={selectedGroup.conversations.length}
              initialDraft={initialDraft}
              initialSubjectResources={selectedSubjectResources}
              languageCode={languageCode}
              subjectTag={selectedGroup.subjectTag}
            />
          </div>
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
                subjectCounts={subjectCounts}
              />
            </article>
          ) : (
            <>
              <article className="grid gap-4">
                <StudentFirstHomeworkLauncher
                  initialDraft={initialDraft}
                  knownSubjects={subjectGroups.map((group) => group.subjectTag)}
                  languageCode={languageCode}
                  subjectCounts={subjectCounts}
                />
              </article>

              <section className="grid gap-4">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                  {copy.recentTitle}
                </h2>
                {renderConversationRows({
                  conversations: conversations.slice(0, 8),
                  languageCode,
                  showSubject: true,
                })}
              </section>
            </>
          )}
        </section>
      )}
    </div>
  );
}
