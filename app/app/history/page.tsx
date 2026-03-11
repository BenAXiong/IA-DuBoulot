import { redirect } from "next/navigation";
import { StudentSessionHistoryList } from "@/components/dashboard/student/student-session-history-list";
import {
  redirectDeletionRequestedAppUser,
  requireAppPageContext,
} from "@/lib/server/auth/page-guards";
import { listVisibleConversations } from "@/lib/server/conversations/conversation-service";

export default async function StudentHistoryPage() {
  const { context, appUser } = await requireAppPageContext();
  redirectDeletionRequestedAppUser(appUser);

  if (appUser.role !== "student") {
    redirect("/app");
  }

  const conversations = await listVisibleConversations({
    context,
  });

  return (
    <StudentSessionHistoryList
      conversations={conversations}
      languageCode={appUser.preferred_ui_language}
    />
  );
}
