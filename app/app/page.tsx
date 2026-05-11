import Link from "next/link";
import { redirect } from "next/navigation";
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
import type {
  AppUserRecord,
  AuthenticatedUserContext,
} from "@/lib/server/auth/types";
import { loadAdminAccessAuditSnapshot } from "@/lib/server/oversight/admin-service";
import { loadParentDashboardSnapshot } from "@/lib/server/oversight/parent-service";
import { loadTutorDashboardSnapshot } from "@/lib/server/oversight/tutor-service";

async function renderRoleDashboard(
  appUser: AppUserRecord,
  email: string | null,
  context: AuthenticatedUserContext,
  studentView: "dashboard" | "homework" | "maps" | "tests" | "forward",
  selectedSubject: string | null,
  initialDraft: string | null,
) {
  switch (appUser.role) {
    case "student":
      return (
        <StudentDashboard
          appUser={appUser}
          context={context}
          initialDraft={initialDraft}
          selectedSubject={selectedSubject}
          view={studentView}
        />
      );
    case "parent": {
      const snapshot = await loadParentDashboardSnapshot(appUser, email);
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

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return typeof value === "string" ? value : null;
}

export default async function AppHomePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const { context, appUser } = await requireAppPageContext();
  redirectDeletionRequestedAppUser(appUser);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialDraft = getSearchParam(resolvedSearchParams, "draft");
  const selectedSubject = getSearchParam(resolvedSearchParams, "subject");
  const legacyNewSubjectMode = getSearchParam(resolvedSearchParams, "newSubject");
  const studentViewParam = getSearchParam(resolvedSearchParams, "view");
  const studentView =
    studentViewParam === "dashboard" ||
    studentViewParam === "homework" ||
    studentViewParam === "maps" ||
    studentViewParam === "tests" ||
    studentViewParam === "forward"
      ? studentViewParam
      : selectedSubject
        ? "homework"
        : "dashboard";

  if (legacyNewSubjectMode) {
    const nextSearchParams = new URLSearchParams();
    nextSearchParams.set(
      "view",
      studentView === "dashboard" ? "homework" : studentView,
    );

    if (selectedSubject) {
      nextSearchParams.set("subject", selectedSubject);
    }

    if (initialDraft) {
      nextSearchParams.set("draft", initialDraft);
    }

    redirect(`/app?${nextSearchParams.toString()}`);
  }
  const copy = getAppHomeCopy(appUser.preferred_ui_language);
  const showAccountSettingsBlock =
    appUser.role !== "parent" && appUser.role !== "student";

  return (
    <div className="grid gap-6">
      {await renderRoleDashboard(
        appUser,
        context.email,
        context,
        studentView,
        selectedSubject,
        initialDraft,
      )}

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
            <AccountSettingsForm appUser={appUser} email={context.email} />
          </article>
        </section>
      ) : null}
    </div>
  );
}
