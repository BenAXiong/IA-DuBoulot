import Link from "next/link";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { AccountSettingsForm } from "@/components/auth/account-settings-form";
import { ParentDashboard } from "@/components/dashboard/parent-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard";
import { getAppHomeCopy } from "@/lib/i18n/ui-copy";
import {
  redirectDeletionRequestedAppUser,
  requireAppPageContext,
} from "@/lib/server/auth/page-guards";
import type { AppUserRecord } from "@/lib/server/auth/types";
import { loadAdminAccessAuditSnapshot } from "@/lib/server/oversight/admin-service";
import { loadParentDashboardSnapshot } from "@/lib/server/oversight/parent-service";
import { loadTutorDashboardSnapshot } from "@/lib/server/oversight/tutor-service";

async function renderRoleDashboard(
  appUser: AppUserRecord,
  email: string | null,
) {
  switch (appUser.role) {
    case "student":
      return <StudentDashboard appUser={appUser} />;
    case "parent": {
      const snapshot = await loadParentDashboardSnapshot(appUser);
      return (
        <ParentDashboard
          appUser={appUser}
          email={email}
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
      return (
        <AdminDashboard
          auditEventCount={snapshot.events.length}
          languageCode={appUser.preferred_ui_language}
        />
      );
    }
    default:
      return null;
  }
}

export default async function AppHomePage() {
  const { context, appUser } = await requireAppPageContext();
  redirectDeletionRequestedAppUser(appUser);
  const copy = getAppHomeCopy(appUser.preferred_ui_language);
  const showAccountSettingsBlock = appUser.role !== "parent";

  return (
    <div className="grid gap-6">
      {await renderRoleDashboard(appUser, context.email)}

      {showAccountSettingsBlock ? (
        <section
          className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.7fr_1.3fr]"
          id="account"
        >
          <article className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.eyebrow}
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              {copy.title}
            </h2>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.body}
            </p>
            <Link
              className="button-base button-secondary"
              href="/app/settings"
            >
              {copy.cta}
            </Link>
          </article>

          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <AccountSettingsForm appUser={appUser} />
          </article>
        </section>
      ) : null}
    </div>
  );
}
