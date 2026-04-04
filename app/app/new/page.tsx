import { redirect } from "next/navigation";
import { NewHomeworkEntry } from "@/components/dashboard/student/new-homework-entry";
import {
  redirectDeletionRequestedAppUser,
  requireAppPageContext,
} from "@/lib/server/auth/page-guards";
import { loadStudentDashboardSnapshot } from "@/lib/server/student-dashboard/student-dashboard-service";

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

export default async function NewHomeworkPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const { appUser } = await requireAppPageContext();
  redirectDeletionRequestedAppUser(appUser);

  if (appUser.role !== "student") {
    redirect("/app");
  }

  const snapshot = await loadStudentDashboardSnapshot(appUser);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialSubjectTag = getSearchParam(resolvedSearchParams, "subject");
  const initialDraft = getSearchParam(resolvedSearchParams, "draft");

  return (
    <NewHomeworkEntry
      initialDraft={initialDraft}
      initialSubjectTag={initialSubjectTag}
      languageCode={appUser.preferred_ui_language}
      snapshot={snapshot}
    />
  );
}
