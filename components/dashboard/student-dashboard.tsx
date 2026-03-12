import { MemoryPanel } from "@/components/dashboard/memory/memory-panel";
import { ParentApprovalRequestForm } from "@/components/links/parent-approval-request-form";
import { TutorInviteForm } from "@/components/links/tutor-invite-form";
import {
  getStudentDashboardActionsCopy,
} from "@/lib/i18n/dashboard-copy";
import { StudentDashboardRecentSessions } from "@/components/dashboard/student/student-dashboard-recent-sessions";
import { StudentDashboardStartPanel } from "@/components/dashboard/student/student-dashboard-start-panel";
import { StudentDashboardSupportGrid } from "@/components/dashboard/student/student-dashboard-support-grid";
import { loadVisibleStudentMemory } from "@/lib/server/memory/service";
import { loadStudentDashboardSnapshot } from "@/lib/server/student-dashboard/student-dashboard-service";
import type { AppUserRecord } from "@/lib/server/auth/types";

type StudentDashboardProps = {
  appUser: AppUserRecord;
};

export async function StudentDashboard({ appUser }: StudentDashboardProps) {
  const [snapshot, memory] = await Promise.all([
    loadStudentDashboardSnapshot(appUser),
    loadVisibleStudentMemory({
      viewer: appUser,
      studentUserId: appUser.id,
    }),
  ]);
  const languageCode = appUser.preferred_ui_language;
  const actionsCopy = getStudentDashboardActionsCopy(languageCode);

  return (
    <div className="grid gap-6">
      <StudentDashboardStartPanel snapshot={snapshot} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <StudentDashboardRecentSessions
          languageCode={languageCode}
          recentSessions={snapshot.recentSessions}
          subjectRollup={snapshot.subjectRollup}
        />
        <StudentDashboardSupportGrid
          languageCode={languageCode}
          support={snapshot.support}
          usage={snapshot.usage}
        />
      </div>

      <MemoryPanel
        intro={
          languageCode === "en"
            ? "This memory keeps only reusable pedagogical signals, never sensitive or speculative labels."
            : languageCode === "zh"
              ? "這份記憶只保留可重用的教學訊號，不會保留敏感或推測性標籤。"
              : "Cette mémoire garde uniquement des points pédagogiques réutilisables, jamais des étiquettes sensibles ou spéculatives."
        }
        languageCode={languageCode}
        snapshot={memory}
        studentUserId={appUser.id}
        title={
          languageCode === "en"
            ? "Review, correct, and clean the durable points that matter for the next homework"
            : languageCode === "zh"
              ? "重新檢視、修正並清理那些對下一份作業有幫助的長期要點"
              : "Relire, corriger et nettoyer les points durables utiles au prochain devoir"
        }
      />

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.85fr_1.15fr]"
        id="actions"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {actionsCopy.eyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {appUser.is_under_13
              ? actionsCopy.titleUnder13
              : actionsCopy.titleDefault}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {appUser.is_under_13
              ? actionsCopy.bodyUnder13
              : actionsCopy.bodyDefault}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          {appUser.is_under_13 ? (
            <ParentApprovalRequestForm languageCode={languageCode} />
          ) : (
            <TutorInviteForm languageCode={languageCode} />
          )}
        </article>
      </section>
    </div>
  );
}
