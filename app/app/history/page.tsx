import { redirect } from "next/navigation";

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
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedSubject = getSearchParam(resolvedSearchParams, "subject");

  if (selectedSubject) {
    redirect(`/app?view=homework&subject=${encodeURIComponent(selectedSubject)}`);
  }

  redirect("/app?view=homework");
}
