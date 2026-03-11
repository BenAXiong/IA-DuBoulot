import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { AccountSettingsForm } from "@/components/auth/account-settings-form";
import { ParentDashboard } from "@/components/dashboard/parent-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard";
import { requireAppPageContext } from "@/lib/server/auth/page-guards";
import type { AppUserRecord } from "@/lib/server/auth/types";
import { loadAdminAccessAuditSnapshot } from "@/lib/server/oversight/admin-service";
import { loadParentDashboardSnapshot } from "@/lib/server/oversight/parent-service";
import { loadTutorDashboardSnapshot } from "@/lib/server/oversight/tutor-service";

async function renderRoleDashboard(
  role: AppUserRecord["role"],
  appUser: AppUserRecord,
) {
  switch (role) {
    case "student":
      return <StudentDashboard appUser={appUser} />;
    case "parent": {
      const snapshot = await loadParentDashboardSnapshot(appUser);
      return (
        <ParentDashboard
          languageCode={appUser.preferred_ui_language}
          snapshot={snapshot}
        />
      );
    }
    case "tutor": {
      const snapshot = await loadTutorDashboardSnapshot(appUser);
      return (
        <TutorDashboard
          languageCode={appUser.preferred_ui_language}
          snapshot={snapshot}
        />
      );
    }
    case "admin": {
      const snapshot = await loadAdminAccessAuditSnapshot(appUser);
      return <AdminDashboard auditEventCount={snapshot.events.length} />;
    }
    default:
      return null;
  }
}

export default async function AppHomePage() {
  const { appUser } = await requireAppPageContext();

  return (
    <div className="grid gap-6">
      {await renderRoleDashboard(appUser.role, appUser)}

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.7fr_1.3fr]"
        id="account"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Account settings
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            Les champs editables passent maintenant par `PATCH /api/auth/profile`.
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Cette surface reste simple, mais elle exerce deja la persistence
            du profil applicatif et la synchronisation de metadata cote auth.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          <AccountSettingsForm appUser={appUser} />
        </article>
      </section>
    </div>
  );
}
