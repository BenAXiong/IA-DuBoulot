import Link from "next/link";
import { NewHomeworkIntakeForm } from "@/components/dashboard/student/new-homework-intake-form";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { StudentDashboardSnapshot } from "@/lib/server/student-dashboard/types";

type NewHomeworkEntryProps = {
  snapshot: StudentDashboardSnapshot;
  languageCode: UiLanguageCode;
  initialSubjectTag?: string | null;
  initialDraft?: string | null;
};

function getBackCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return "Back to homework";
    case "zh":
      return "返回作業";
    default:
      return "Retour aux devoirs";
  }
}

export function NewHomeworkEntry({
  snapshot,
  languageCode,
  initialSubjectTag = null,
  initialDraft = null,
}: NewHomeworkEntryProps) {
  return (
    <section className="grid gap-4">
      <div>
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
          href="/app?view=homework"
        >
          <span aria-hidden="true">←</span>
          {getBackCopy(languageCode)}
        </Link>
      </div>

      <NewHomeworkIntakeForm
        initialDraft={initialDraft}
        initialSubjectTag={initialSubjectTag}
        languageCode={languageCode}
        snapshot={snapshot}
      />
    </section>
  );
}
