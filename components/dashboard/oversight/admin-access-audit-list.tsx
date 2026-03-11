import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { AdminSensitiveAccessEvent } from "@/lib/server/oversight/types";

type AdminAccessAuditListProps = {
  events: AdminSensitiveAccessEvent[];
  languageCode: UiLanguageCode;
};

export function AdminAccessAuditList({
  events,
  languageCode,
}: AdminAccessAuditListProps) {
  if (events.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="font-medium">Aucun evenement sensible n&apos;a encore ete journalise.</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
          Les ouvertures de session parent/tuteur et les mutations de notes
          privees apparaitront ici.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
      <div className="space-y-3">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          Audit sensible
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
          Lectures adultes et notes privees, visibles depuis une seule file.
        </h1>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          Cette vue donne au role admin une premiere surface de revue pour les
          acces parent/tuteur et les changements de notes privees.
        </p>
      </div>

      <div className="grid gap-3">
        {events.map((event) => (
          <article
            className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 md:grid-cols-[1fr_auto]"
            key={event.id}
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StudentStatusPill label={event.actorRole ?? "unknown"} tone="accent" />
                <StudentStatusPill label={event.action} />
                {event.studentDisplayName ? (
                  <StudentStatusPill label={event.studentDisplayName} tone="warning" />
                ) : null}
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  {event.actorDisplayName ?? event.actorUserId ?? "acteur inconnu"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--ink-soft)]">
                  Table cible: {event.targetTable}
                  {event.conversationId ? ` | session ${event.conversationId}` : ""}
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
              <p>{formatDateLabel(event.createdAt, languageCode) ?? event.createdAt}</p>
              <p className="text-xs">
                {typeof event.metadata.route === "string"
                  ? event.metadata.route
                  : "route indisponible"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
