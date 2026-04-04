import Link from "next/link";
import { StudentSubjectQuickStart } from "@/components/dashboard/student/student-subject-quick-start";
import {
  formatDateLabel,
  getConversationStatusLabel,
  getStartStateBody,
  getStartStateLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { loadStudentDashboardSnapshot } from "@/lib/server/student-dashboard/student-dashboard-service";
import { listVisibleConversations } from "@/lib/server/conversations/conversation-service";
import type {
  AppUserRecord,
  AuthenticatedUserContext,
  UiLanguageCode,
} from "@/lib/server/auth/types";
import type { ListConversationSummary } from "@/lib/server/conversations/types";

type StudentDashboardProps = {
  appUser: AppUserRecord;
  context: AuthenticatedUserContext;
  selectedSubject: string | null;
  view: "homework" | "maps" | "tests";
};

function getStudentHubCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return {
        homeworkEyebrow: "Homework",
        homeworkTitle: "Pick a subject, continue a discussion, or start a fresh one.",
        homeworkBody:
          "Keep your active homework within reach, return to recent conversations, or open a new discussion when you need a fresh start.",
        noSubjectTitle: "No homework yet",
        noSubjectBody:
          "Start the first discussion, then the sidebar will grow around the subjects you actually use.",
        firstHomework: "Start first homework",
        recentTitle: "Recent homework chats",
        open: "Open",
        active: "Continue",
        mapsTitle: "Maps will live here later.",
        mapsBody:
          "This space is reserved for future knowledge maps. Homework remains the main learner experience for now.",
        testsTitle: "Tests will live here later.",
        testsBody:
          "This space is reserved for future quiz practice. Homework remains the main learner experience for now.",
        subjectEyebrow: "Homework subject",
        noSubjectChats: "No discussion has been saved for this subject yet.",
        needsAttention: "Open learner settings",
        subjectSourcesTitle: "Sources",
        subjectSourcesBody:
          "Add PDFs, photos, and screenshots once the discussion opens.",
        subjectChatsTitle: "Saved chats",
        subjectCount: (count: number) =>
          `${count} ${count === 1 ? "saved chat" : "saved chats"}`,
      };
    case "zh":
      return {
        homeworkEyebrow: "作業",
        homeworkTitle: "選擇科目、接續對話，或開始新的作業。",
        homeworkBody:
          "把正在進行的作業放在手邊，回到最近的對話，或在需要時開始新的討論。",
        noSubjectTitle: "還沒有作業",
        noSubjectBody:
          "先開始第一段對話，之後側邊欄就會依照你實際使用的科目慢慢長出來。",
        firstHomework: "開始第一份作業",
        recentTitle: "最近作業對話",
        open: "打開",
        active: "續接",
        mapsTitle: "地圖工具之後會在這裡。",
        mapsBody:
          "這裡會保留給未來的知識地圖功能。目前學生的主要體驗仍以作業為主。",
        testsTitle: "測驗工具之後會在這裡。",
        testsBody:
          "這裡會保留給未來的測驗練習功能。目前學生的主要體驗仍以作業為主。",
        subjectEyebrow: "作業科目",
        noSubjectChats: "這個科目目前還沒有已儲存的對話。",
        needsAttention: "打開設定",
        subjectSourcesTitle: "來源",
        subjectSourcesBody: "聊天打開後，就可以加入 PDF、照片與截圖。",
        subjectChatsTitle: "已保存對話",
        subjectCount: (count: number) => `已儲存 ${count} 段對話`,
      };
    default:
      return {
        homeworkEyebrow: "Devoirs",
        homeworkTitle: "Choisir une matière, reprendre une discussion, ou en lancer une nouvelle.",
        homeworkBody:
          "Garde les devoirs actifs à portée de main, reprends les discussions récentes, ou relance un nouveau départ quand il le faut.",
        noSubjectTitle: "Aucun devoir pour l'instant",
        noSubjectBody:
          "Lance la première discussion et la barre latérale se structurera ensuite autour des matières réellement utilisées.",
        firstHomework: "Commencer le premier devoir",
        recentTitle: "Discussions récentes",
        open: "Ouvrir",
        active: "Reprendre",
        mapsTitle: "Les cartes viendront ici plus tard.",
        mapsBody:
          "Cet espace est réservé aux futures cartes de connaissances. Pour l'instant, l'expérience élève reste centrée sur les devoirs.",
        testsTitle: "Les tests viendront ici plus tard.",
        testsBody:
          "Cet espace est réservé aux futurs quiz. Pour l'instant, l'expérience élève reste centrée sur les devoirs.",
        subjectEyebrow: "Matière",
        noSubjectChats: "Aucune discussion enregistrée pour cette matière.",
        needsAttention: "Ouvrir les réglages",
        subjectSourcesTitle: "Sources",
        subjectSourcesBody:
          "Ajoute les PDF, photos et captures une fois la discussion ouverte.",
        subjectChatsTitle: "Discussions enregistrées",
        subjectCount: (count: number) =>
          `${count} ${count === 1 ? "discussion enregistrée" : "discussions enregistrées"}`,
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

function renderConversationRows(input: {
  conversations: ListConversationSummary[];
  languageCode: UiLanguageCode;
  showSubject?: boolean;
}) {
  return (
    <div className="divide-y divide-[color:var(--line)]">
      {input.conversations.map((conversation) => (
        <Link
          className="flex items-start justify-between gap-4 py-4 transition hover:bg-[color:var(--surface-strong)]"
          href={`/app/conversations/${conversation.id}?subject=${encodeURIComponent(conversation.subject_tag)}`}
          key={conversation.id}
        >
          <div className="min-w-0 space-y-1">
            <h3 className="truncate font-[family-name:var(--font-heading)] text-xl leading-tight">
              {conversation.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--ink-soft)]">
              {input.showSubject ? <span>{conversation.subject_tag}</span> : null}
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

function renderSubjectCards(input: {
  groups: ReturnType<typeof buildSubjectGroups>;
  emptyFallback: string;
}) {
  return (
    <div className="divide-y divide-[color:var(--line)]">
      {input.groups.map((group) => (
        <Link
          className="flex items-center justify-between gap-4 py-4 transition hover:bg-[color:var(--surface-strong)]"
          href={`/app?view=homework&subject=${encodeURIComponent(group.subjectTag)}`}
          key={group.subjectTag}
        >
          <div className="min-w-0 space-y-1">
            <h2 className="truncate font-[family-name:var(--font-heading)] text-xl leading-tight">
              {group.subjectTag}
            </h2>
            <p className="truncate text-sm text-[color:var(--ink-soft)]">
              {group.conversations[0]?.title ?? input.emptyFallback}
            </p>
          </div>

          <span className="shrink-0 text-sm text-[color:var(--ink-soft)]">
            {group.conversations.length}
          </span>
        </Link>
      ))}
    </div>
  );
}

function renderSubjectRightRail(input: {
  sourcesTitle: string;
  sourcesBody: string;
  countTitle: string;
  countLabel: string;
}) {
  return (
    <aside className="border-l border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-6 xl:min-h-[calc(100vh-4.5rem)]">
      <div className="grid gap-8">
        <section className="grid gap-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {input.sourcesTitle}
          </p>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {input.sourcesBody}
          </p>
        </section>

        <section className="grid gap-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {input.countTitle}
          </p>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {input.countLabel}
          </p>
        </section>
      </div>
    </aside>
  );
}

export async function StudentDashboard({
  appUser,
  context,
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
  const selectedGroup =
    subjectGroups.find((group) => group.subjectTag === selectedSubject) ?? null;

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

      {view === "maps" ? (
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
        <section className="mx-auto grid w-full max-w-none gap-0 xl:-my-6 xl:-mr-8 xl:min-h-[calc(100vh-4.5rem)] xl:grid-cols-[minmax(0,1fr)_18.5rem]">
          <div className="grid gap-6 py-2 xl:py-6 xl:pr-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                {copy.subjectEyebrow}
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
                {selectedGroup.subjectTag}
              </h1>
            </div>

            <StudentSubjectQuickStart
              languageCode={languageCode}
              subjectTag={selectedGroup.subjectTag}
            />

            <section className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                  {copy.recentTitle}
                </h2>
                <Link
                  className="text-sm font-medium text-[color:var(--accent)]"
                  href={`/app/history?subject=${encodeURIComponent(selectedGroup.subjectTag)}`}
                >
                  {copy.open}
                </Link>
              </div>

              {selectedGroup.conversations.length === 0 ? (
                <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
                  {copy.noSubjectChats}
                </p>
              ) : (
                renderConversationRows({
                  conversations: selectedGroup.conversations,
                  languageCode,
                })
              )}
            </section>
          </div>

          {renderSubjectRightRail({
            sourcesTitle: copy.subjectSourcesTitle,
            sourcesBody: copy.subjectSourcesBody,
            countTitle: copy.subjectChatsTitle,
            countLabel: copy.subjectCount(selectedGroup.conversations.length),
          })}
        </section>
      ) : (
        <section className="mx-auto grid w-full max-w-5xl gap-8 py-2">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.homeworkEyebrow}
            </p>
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
              <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
                {copy.noSubjectBody}
              </p>
              <div>
                <Link className="button-base button-primary" href="/app/new">
                  {copy.firstHomework}
                </Link>
              </div>
            </article>
          ) : (
            <>
              {renderSubjectCards({
                groups: subjectGroups,
                emptyFallback: copy.noSubjectChats,
              })}

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
