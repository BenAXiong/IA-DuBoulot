import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ListConversationSummary } from "@/lib/server/conversations/types";

type StudentSessionHistoryListProps = {
  conversations: ListConversationSummary[];
  languageCode: UiLanguageCode;
};

function buildGroups(conversations: ListConversationSummary[]) {
  const active = conversations.filter((conversation) => conversation.status === "active");
  const completed = conversations.filter(
    (conversation) => conversation.status === "completed",
  );
  const archived = conversations.filter((conversation) => conversation.status === "archived");

  return [
    {
      key: "active",
      title: "Sessions en cours",
      body: "Reprends une session encore ouverte ou termine-la pour figer son resume.",
      conversations: active,
    },
    {
      key: "completed",
      title: "Sessions terminees",
      body: "Ces sessions gardent leur resume et restent consultables en lecture.",
      conversations: completed,
    },
    {
      key: "archived",
      title: "Archives",
      body: "Surface reservee aux cas de nettoyage futur. Elle doit rester quasi vide en MVP.",
      conversations: archived,
    },
  ];
}

function getPrimaryDate(
  conversation: ListConversationSummary,
  languageCode: UiLanguageCode,
) {
  return (
    formatDateLabel(conversation.last_message_at, languageCode) ??
    formatDateLabel(conversation.completed_at, languageCode) ??
    formatDateLabel(conversation.created_at, languageCode) ??
    "Date indisponible"
  );
}

export function StudentSessionHistoryList({
  conversations,
  languageCode,
}: StudentSessionHistoryListProps) {
  const groups = buildGroups(conversations);

  return (
    <div className="grid gap-6" id="sessions">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.15fr_0.85fr]">
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Historique eleve
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            Toutes les sessions, avec leur etat et leur point de reprise.
          </h1>
          <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
            Cette page devient la liste longue duree. Les cartes du dashboard
            restent volontairement courtes et orientees reprise rapide.
          </p>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">Volume actuel</p>
          <p className="text-[color:var(--ink-soft)]">
            {conversations.length} session{conversations.length > 1 ? "s" : ""} visible
            {conversations.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill
              label={`${groups[0]?.conversations.length ?? 0} en cours`}
              tone="accent"
            />
            <StudentStatusPill
              label={`${groups[1]?.conversations.length ?? 0} terminees`}
            />
            <StudentStatusPill
              label={`${groups[2]?.conversations.length ?? 0} archivees`}
              tone="warning"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              href="/app"
            >
              Retour au dashboard
            </Link>
            <Link
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              href="/app/new"
            >
              Nouveau devoir
            </Link>
          </div>
        </article>
      </section>

      {conversations.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="font-medium">Aucune session n&apos;est encore enregistree.</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
            Lance un premier devoir depuis `/app/new`, puis cette page deviendra la
            liste canonique de reprise et de consultation.
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
                          label={getConversationStatusLabel(conversation.status)}
                        />
                        <StudentStatusPill
                          label={
                            conversation.graded_homework
                              ? "Notee"
                              : "Exercice libre"
                          }
                        />
                      </div>
                      <div>
                        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                          {conversation.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                          {conversation.status === "completed"
                            ? "Le resume est consulte depuis la page de session."
                            : "La session reste modifiable tant qu&apos;elle n&apos;est pas terminee."}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
                      <p>Derniere activite</p>
                      <p className="font-medium text-[color:var(--foreground)]">
                        {getPrimaryDate(conversation, languageCode)}
                      </p>
                      <Link
                        className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                        href={`/app/conversations/${conversation.id}`}
                      >
                        Ouvrir la session
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
