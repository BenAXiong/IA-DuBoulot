import { redirect } from "next/navigation";
import {
  redirectDeletionRequestedAppUser,
  requireAppPageContext,
} from "@/lib/server/auth/page-guards";

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

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialSubjectTag = getSearchParam(resolvedSearchParams, "subject");
  const initialDraft = getSearchParam(resolvedSearchParams, "draft");
  const params = new URLSearchParams({ view: "homework" });

  if (initialSubjectTag) {
    params.set("subject", initialSubjectTag);
  }

  if (initialSubjectTag && initialDraft) {
    params.set("draft", initialDraft);
  }

  redirect(`/app?${params.toString()}`);
}
