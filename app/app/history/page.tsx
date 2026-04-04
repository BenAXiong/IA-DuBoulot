import { redirect } from "next/navigation";
import { StudentSessionHistoryList } from "@/components/dashboard/student/student-session-history-list";
import {
  redirectDeletionRequestedAppUser,
  requireAppPageContext,
} from "@/lib/server/auth/page-guards";
import { listVisibleConversations } from "@/lib/server/conversations/conversation-service";

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

export default async function StudentHistoryPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const { context, appUser } = await requireAppPageContext();
  redirectDeletionRequestedAppUser(appUser);

  if (appUser.role !== "student") {
    redirect("/app");
  }

  const conversations = await listVisibleConversations({
    context,
  });
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedSubject = getSearchParam(resolvedSearchParams, "subject");

  return (
    <StudentSessionHistoryList
      conversations={conversations}
      languageCode={appUser.preferred_ui_language}
      selectedSubject={selectedSubject}
    />
  );
}
