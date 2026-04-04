"use client";

import { useMemo, useState } from "react";
import { StudentSubjectQuickStart } from "@/components/dashboard/student/student-subject-quick-start";
import {
  getIntakeSubjectOptions,
} from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type StudentFirstHomeworkLauncherProps = {
  initialDraft?: string | null;
  languageCode: UiLanguageCode;
};

function getFirstHomeworkCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return {
        customSubjectLabel: "Other subject",
        customSubjectPlaceholder: "Type the subject name",
      };
    case "zh":
      return {
        customSubjectLabel: "其他科目",
        customSubjectPlaceholder: "輸入科目名稱",
      };
    default:
      return {
        customSubjectLabel: "Autre matière",
        customSubjectPlaceholder: "Écrire le nom de la matière",
      };
  }
}

export function StudentFirstHomeworkLauncher({
  initialDraft = null,
  languageCode,
}: StudentFirstHomeworkLauncherProps) {
  const copy = getFirstHomeworkCopy(languageCode);
  const subjectOptions = useMemo(
    () => getIntakeSubjectOptions(languageCode),
    [languageCode],
  );
  const [selectedSubject, setSelectedSubject] = useState(
    subjectOptions[0]?.value ?? "",
  );
  const [customSubject, setCustomSubject] = useState("");

  const resolvedSubjectTag =
    selectedSubject === "autre" ? customSubject.trim() : selectedSubject;

  return (
    <div className="grid gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-6 py-6">
      <div className="flex flex-wrap gap-2">
        {subjectOptions.map((option) => {
          const isActive = selectedSubject === option.value;

          return (
            <button
              className={
                isActive
                  ? "inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--foreground)] px-4 text-sm font-medium text-[color:var(--background)] transition"
                  : "inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 text-sm text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              }
              key={option.value}
              onClick={() => setSelectedSubject(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {selectedSubject === "autre" ? (
        <label className="grid gap-2 text-sm text-[color:var(--ink-soft)] sm:max-w-xs">
          <span>{copy.customSubjectLabel}</span>
          <input
            className="min-h-11 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--accent)]"
            onChange={(event) => setCustomSubject(event.target.value)}
            placeholder={copy.customSubjectPlaceholder}
            value={customSubject}
          />
        </label>
      ) : null}

      {resolvedSubjectTag ? (
        <StudentSubjectQuickStart
          initialDraft={initialDraft}
          languageCode={languageCode}
          subjectTag={resolvedSubjectTag}
        />
      ) : null}
    </div>
  );
}
