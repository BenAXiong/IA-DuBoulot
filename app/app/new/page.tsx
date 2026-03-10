import { redirect } from "next/navigation";
import { NewHomeworkEntry } from "@/components/dashboard/student/new-homework-entry";
import { requireAppPageContext } from "@/lib/server/auth/page-guards";
import { loadStudentDashboardSnapshot } from "@/lib/server/student-dashboard/student-dashboard-service";

export default async function NewHomeworkPage() {
  const { appUser } = await requireAppPageContext();

  if (appUser.role !== "student") {
    redirect("/app");
  }

  const snapshot = await loadStudentDashboardSnapshot(appUser);

  return <NewHomeworkEntry snapshot={snapshot} />;
}
