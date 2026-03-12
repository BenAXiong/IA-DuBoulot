import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { getStudentHistoryCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ListConversationSummary } from "@/lib/server/conversations/types";

type StudentSessionHistoryListProps = {
  conversations: ListConversationSummary[];
  languageCode: UiLanguageCode;
};

function buildGroups(
  conversations: ListConversationSummary[],
  languageCode: UiLanguageCode,
) {
  const copy = getStudentHistoryCopy(languageCode);
  const active = conversations.filter((conversation) => conversation.status === "active");
  const completed = conversations.filter(
    (conversation) => conversation.status === "completed",
  );
  const archived = conversations.filter((conversation) => conversation.status === "archived");

  return [
    {
      key: "active",
      title: copy.groups.active.title,
      body: copy.groups.active.body,
      conversations: active,
    },
    {
      key: "completed",
      title: copy.groups.completed.title,
      body: copy.groups.completed.body,
      conversations: completed,
    },
    {
      key: "archived",
      title: copy.groups.archived.title,
      body: copy.groups.archived.body,
      conversations: archived,
    },
  ];
}

function getPrimaryDate(
  conversation: ListConversationSummary,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentHistoryCopy(languageCode);

  return (
    formatDateLabel(conversation.last_message_at, languageCode) ??
    formatDateLabel(conversation.completed_at, languageCode) ??
    formatDateLabel(conversation.created_at, languageCode) ??
    copy.noDate
  );
}

export function StudentSessionHistoryList({
  conversations,
  languageCode,
}: StudentSessionHistoryListProps) {
  const copy = getStudentHistoryCopy(languageCode);
  const groups = buildGroups(conversations, languageCode);

  return (
    <div className="grid gap-6" id="sessions">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.15fr_0.85fr]">
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.eyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {copy.title}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.body}
          </p>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">{copy.volumeTitle}</p>
          <p className="text-[color:var(--ink-soft)]">
            {copy.totalVisibleSessions(conversations.length)}
          </p>
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill
              label={copy.activeCount(groups[0]?.conversations.length ?? 0)}
              tone="accent"
            />
            <StudentStatusPill label={copy.completedCount(groups[1]?.conversations.length ?? 0)} />
            <StudentStatusPill
              label={copy.archivedCount(groups[2]?.conversations.length ?? 0)}
              tone="warning"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              href="/app"
            >
              {copy.backToDashboard}
            </Link>
            <Link
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              href="/app/new"
            >
              {copy.newHomework}
            </Link>
          </div>
        </article>
      </section>

      {conversations.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="font-medium">{copy.emptyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.emptyBody}
          </p>
        </section>
      ) : (
        groups.map((group) =>
          group.conversations.length > 0 ? (
            <section
              className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
              key={group.key}
            >
              <div className="space-y-3">
                <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                  {group.title}
                </p>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {group.body}
                </p>
              </div>

              <div className="grid gap-3">
                {group.conversations.map((conversation) => (
                  <article
                    className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 md:grid-cols-[1fr_auto]"
                    key={conversation.id}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <StudentStatusPill
                          label={conversation.subject_tag}
                          tone="accent"
                        />
                        <StudentStatusPill
                          label={getConversationStatusLabel(
                            conversation.status,
                            languageCode,
                          )}
                        />
                        <StudentStatusPill
                          label={
                            conversation.graded_homework
                              ? copy.graded
                              : copy.practice
                          }
                        />
                      </div>
                      <div>
                        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                          {conversation.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                          {conversation.status === "completed"
                            ? copy.completedBody
                            : copy.activeBody}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
                      <p>{copy.lastActivity}</p>
                      <p className="font-medium text-[color:var(--foreground)]">
                        {getPrimaryDate(conversation, languageCode)}
                      </p>
                      <Link
                        className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                        href={`/app/conversations/${conversation.id}`}
                      >
                        {copy.openSession}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null,
        )
      )}
    </div>
  );
}
