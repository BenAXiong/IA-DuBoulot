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
        subjectLabel: "Subject",
        subjectPlaceholder: "Choose a subject",
        customSubjectLabel: "Other subject",
        customSubjectPlaceholder: "Type the subject name",
        subjectRequired: "Pick a subject before starting the first chat.",
      };
    case "zh":
      return {
        subjectLabel: "科目",
        subjectPlaceholder: "選擇科目",
        customSubjectLabel: "其他科目",
        customSubjectPlaceholder: "輸入科目名稱",
        subjectRequired: "開始第一段對話前，請先選擇科目。",
      };
    default:
      return {
        subjectLabel: "Matière",
        subjectPlaceholder: "Choisir une matière",
        customSubjectLabel: "Autre matière",
        customSubjectPlaceholder: "Écrire le nom de la matière",
        subjectRequired: "Choisis d'abord une matière avant de lancer la première discussion.",
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
      <div className="grid gap-3 sm:max-w-xs">
        <label className="grid gap-2 text-sm text-[color:var(--ink-soft)]">
          <span>{copy.subjectLabel}</span>
          <select
            className="min-h-11 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) => setSelectedSubject(event.target.value)}
            value={selectedSubject}
          >
            <option disabled value="">
              {copy.subjectPlaceholder}
            </option>
            {subjectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {selectedSubject === "autre" ? (
          <label className="grid gap-2 text-sm text-[color:var(--ink-soft)]">
            <span>{copy.customSubjectLabel}</span>
            <input
              className="min-h-11 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--accent)]"
              onChange={(event) => setCustomSubject(event.target.value)}
              placeholder={copy.customSubjectPlaceholder}
              value={customSubject}
            />
          </label>
        ) : null}
      </div>

      {resolvedSubjectTag ? (
        <StudentSubjectQuickStart
          initialDraft={initialDraft}
          languageCode={languageCode}
          subjectTag={resolvedSubjectTag}
        />
      ) : (
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.subjectRequired}
        </p>
      )}
    </div>
  );
}
