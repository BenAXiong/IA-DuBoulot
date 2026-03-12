import { redirect } from "next/navigation";
import { NewHomeworkEntry } from "@/components/dashboard/student/new-homework-entry";
import {
  redirectDeletionRequestedAppUser,
  requireAppPageContext,
} from "@/lib/server/auth/page-guards";
import { loadStudentDashboardSnapshot } from "@/lib/server/student-dashboard/student-dashboard-service";

export default async function NewHomeworkPage() {
  const { appUser } = await requireAppPageContext();
  redirectDeletionRequestedAppUser(appUser);

  if (appUser.role !== "student") {
    redirect("/app");
  }

  const snapshot = await loadStudentDashboardSnapshot(appUser);

  return (
    <NewHomeworkEntry
      languageCode={appUser.preferred_ui_language}
      snapshot={snapshot}
    />
  );
}
