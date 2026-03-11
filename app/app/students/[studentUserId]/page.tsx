import { redirect } from "next/navigation";
import { ParentStudentDetailView } from "@/components/dashboard/oversight/parent-student-detail";
import { TutorStudentDetailView } from "@/components/dashboard/oversight/tutor-student-detail";
import {
  redirectDeletionRequestedAppUser,
  requireAppPageContext,
} from "@/lib/server/auth/page-guards";
import { loadParentStudentDetail } from "@/lib/server/oversight/parent-service";
import { loadTutorStudentDetail } from "@/lib/server/oversight/tutor-service";

type Params = Promise<{ studentUserId: string }> | { studentUserId: string };

export default async function OversightStudentPage({
  params,
}: {
  params: Params;
}) {
  const { appUser } = await requireAppPageContext();
  redirectDeletionRequestedAppUser(appUser);
  const resolvedParams = await params;

  if (appUser.role === "parent") {
    const detail = await loadParentStudentDetail({
      appUser,
      studentUserId: resolvedParams.studentUserId,
    });

    return (
      <ParentStudentDetailView
        detail={detail}
        languageCode={appUser.preferred_ui_language}
      />
    );
  }

  if (appUser.role === "tutor") {
    const detail = await loadTutorStudentDetail({
      appUser,
      studentUserId: resolvedParams.studentUserId,
    });

    return (
      <TutorStudentDetailView
        detail={detail}
        languageCode={appUser.preferred_ui_language}
      />
    );
  }

  redirect("/app");
}
