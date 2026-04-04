import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
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
        subjectTitle: "Subjects in motion",
        open: "Open",
        active: "Continue",
        mapsTitle: "Maps will live here later.",
        mapsBody:
          "This space is reserved for future knowledge maps. Homework remains the main learner experience for now.",
        testsTitle: "Tests will live here later.",
        testsBody:
          "This space is reserved for future quiz practice. Homework remains the main learner experience for now.",
        subjectEyebrow: "Homework subject",
        subjectBody:
          "See the discussions you already saved for this subject, then jump back in from a calmer starting point.",
        noSubjectChats: "No discussion has been saved for this subject yet.",
        needsAttention: "Open learner settings",
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
        subjectTitle: "目前在進行的科目",
        open: "打開",
        active: "續接",
        mapsTitle: "地圖工具之後會在這裡。",
        mapsBody:
          "這裡會保留給未來的知識地圖功能。目前學生的主要體驗仍以作業為主。",
        testsTitle: "測驗工具之後會在這裡。",
        testsBody:
          "這裡會保留給未來的測驗練習功能。目前學生的主要體驗仍以作業為主。",
        subjectEyebrow: "作業科目",
        subjectBody:
          "先查看這個科目已保存的討論，再從更安靜的起點重新開始。",
        noSubjectChats: "這個科目目前還沒有已儲存的對話。",
        needsAttention: "打開設定",
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
        subjectTitle: "Matières en cours",
        open: "Ouvrir",
        active: "Reprendre",
        mapsTitle: "Les cartes viendront ici plus tard.",
        mapsBody:
          "Cet espace est réservé aux futures cartes de connaissances. Pour l'instant, l'expérience élève reste centrée sur les devoirs.",
        testsTitle: "Les tests viendront ici plus tard.",
        testsBody:
          "Cet espace est réservé aux futurs quiz. Pour l'instant, l'expérience élève reste centrée sur les devoirs.",
        subjectEyebrow: "Matière",
        subjectBody:
          "Retrouve ici les discussions déjà enregistrées pour cette matière, puis repars depuis un point d'entrée plus simple.",
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

function renderConversationRows(input: {
  conversations: ListConversationSummary[];
  languageCode: UiLanguageCode;
  ctaLabel: string;
}) {
  return (
    <div className="grid gap-3">
      {input.conversations.map((conversation) => (
        <article
          className="flex flex-col gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-4 md:flex-row md:items-center md:justify-between"
          key={conversation.id}
        >
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2">
              <StudentStatusPill label={conversation.subject_tag} tone="accent" />
              <StudentStatusPill
                label={getConversationStatusLabel(
                  conversation.status,
                  input.languageCode,
                )}
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-[family-name:var(--font-heading)] text-2xl leading-tight">
                {conversation.title}
              </h3>
              <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                {formatDateLabel(
                  conversation.last_message_at ??
                    conversation.completed_at ??
                    conversation.created_at,
                  input.languageCode,
                ) ?? ""}
              </p>
            </div>
          </div>

          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
            href={`/app/conversations/${conversation.id}?subject=${encodeURIComponent(conversation.subject_tag)}`}
          >
            {input.ctaLabel}
          </Link>
        </article>
      ))}
    </div>
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
        <section className="mx-auto grid w-full max-w-5xl gap-6 py-2">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.subjectEyebrow}
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
              {selectedGroup.subjectTag}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
              {copy.subjectBody}
            </p>
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
                ctaLabel: copy.active,
                languageCode,
              })
            )}
          </section>
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
              <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {subjectGroups.map((group) => (
                  <Link
                    className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-5 transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)]"
                    href={`/app?view=homework&subject=${encodeURIComponent(group.subjectTag)}`}
                    key={group.subjectTag}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                        {group.subjectTag}
                      </h2>
                      <StudentStatusPill label={`${group.conversations.length}`} tone="accent" />
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                      {group.conversations[0]?.title ?? copy.noSubjectChats}
                    </p>
                  </Link>
                ))}
              </section>

              <section className="grid gap-4">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                  {copy.recentTitle}
                </h2>
                {renderConversationRows({
                  conversations: conversations.slice(0, 8),
                  ctaLabel: copy.active,
                  languageCode,
                })}
              </section>
            </>
          )}
        </section>
      )}
    </div>
  );
}
