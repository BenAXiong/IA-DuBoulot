import { redirect } from "next/navigation";
import { StudentConversationDetail } from "@/components/dashboard/student/student-conversation-detail";
import { requireAppPageContext } from "@/lib/server/auth/page-guards";
import { loadConversationDetail } from "@/lib/server/conversations/conversation-service";

type Params = Promise<{ conversationId: string }> | { conversationId: string };

export default async function ConversationDetailPage({
  params,
}: {
  params: Params;
}) {
  const { appUser } = await requireAppPageContext();

  if (appUser.role !== "student") {
    redirect("/app");
  }

  const resolvedParams = await params;
  const detail = await loadConversationDetail({
    viewer: appUser,
    conversationId: resolvedParams.conversationId,
  });

  return (
    <StudentConversationDetail
      detail={detail}
      languageCode={appUser.preferred_ui_language}
    />
  );
}
