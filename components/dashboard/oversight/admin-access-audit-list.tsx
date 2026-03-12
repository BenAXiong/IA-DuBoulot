import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getAdminAccessAuditCopy,
  getAdminAuditActionLabel,
  getAdminAuditActorRoleLabel,
  getAdminAuditTargetTableLabel,
} from "@/lib/i18n/oversight-copy";
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
  const copy = getAdminAccessAuditCopy(languageCode);

  if (events.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="font-medium">{copy.emptyTitle}</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.emptyBody}
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
      <div className="space-y-3">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
          {copy.title}
        </h1>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.body}
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
                <StudentStatusPill
                  label={getAdminAuditActorRoleLabel(event.actorRole, languageCode)}
                  tone="accent"
                />
                <StudentStatusPill
                  label={getAdminAuditActionLabel(event.action, languageCode)}
                />
                {event.studentDisplayName ? (
                  <StudentStatusPill label={event.studentDisplayName} tone="warning" />
                ) : null}
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  {event.actorDisplayName ?? event.actorUserId ?? copy.unknownActor}
                </p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.targetDetails(
                    getAdminAuditTargetTableLabel(event.targetTable, languageCode),
                    event.conversationId,
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
              <p>{formatDateLabel(event.createdAt, languageCode) ?? event.createdAt}</p>
              <p className="text-xs">
                {typeof event.metadata.route === "string"
                  ? event.metadata.route
                  : copy.routeUnavailable}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
