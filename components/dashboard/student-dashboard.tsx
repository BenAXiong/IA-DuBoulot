import { ParentApprovalRequestForm } from "@/components/links/parent-approval-request-form";
import { TutorInviteForm } from "@/components/links/tutor-invite-form";
import { StudentDashboardRecentSessions } from "@/components/dashboard/student/student-dashboard-recent-sessions";
import { StudentDashboardStartPanel } from "@/components/dashboard/student/student-dashboard-start-panel";
import { StudentDashboardSupportGrid } from "@/components/dashboard/student/student-dashboard-support-grid";
import { loadStudentDashboardSnapshot } from "@/lib/server/student-dashboard/student-dashboard-service";
import type { AppUserRecord } from "@/lib/server/auth/types";

type StudentDashboardProps = {
  appUser: AppUserRecord;
};

export async function StudentDashboard({ appUser }: StudentDashboardProps) {
  const snapshot = await loadStudentDashboardSnapshot(appUser);

  return (
    <div className="grid gap-6">
      <StudentDashboardStartPanel snapshot={snapshot} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <StudentDashboardRecentSessions
          languageCode={appUser.preferred_ui_language}
          recentSessions={snapshot.recentSessions}
          subjectRollup={snapshot.subjectRollup}
        />
        <StudentDashboardSupportGrid
          languageCode={appUser.preferred_ui_language}
          support={snapshot.support}
          usage={snapshot.usage}
        />
      </div>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.85fr_1.15fr]"
        id="actions"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Actions adultes
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {appUser.is_under_13
              ? "Activer puis maintenir la supervision parentale"
              : "Ajouter un adulte de confiance autour du compte"}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {appUser.is_under_13
              ? "Tant que l'approbation parentale n'est pas active, le prochain devoir reste bloque. Cette zone garde le flux d'invitation traceable a portee de main."
              : "Le compte peut deja travailler seul, mais un parent ou un tuteur lie donnera plus de contexte et de suivi quand les surfaces A5 arriveront."}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          {appUser.is_under_13 ? <ParentApprovalRequestForm /> : <TutorInviteForm />}
        </article>
      </section>
    </div>
  );
}
