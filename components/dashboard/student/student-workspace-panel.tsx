"use client";

import { getStudentWorkspacePanelCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type WorkspaceDraftState = {
  assignmentText: string;
  editedExtractedText: string;
  planText: string;
  draftAnswerText: string;
  studentNotes: string;
};

type StudentWorkspacePanelProps = {
  languageCode: UiLanguageCode;
  disabled?: boolean;
  isSaving?: boolean;
  saveMessage: string | null;
  workspace: WorkspaceDraftState;
  onWorkspaceChange: (nextWorkspace: WorkspaceDraftState) => void;
  onSaveWorkspace: () => void;
};

export function StudentWorkspacePanel({
  languageCode,
  disabled = false,
  isSaving = false,
  saveMessage,
  workspace,
  onWorkspaceChange,
  onSaveWorkspace,
}: StudentWorkspacePanelProps) {
  const copy = getStudentWorkspacePanelCopy(languageCode);

  function updateField<Key extends keyof WorkspaceDraftState>(
    field: Key,
    value: WorkspaceDraftState[Key],
  ) {
    onWorkspaceChange({
      ...workspace,
      [field]: value,
    });
  }

  return (
    <aside className="grid gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="space-y-3">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {copy.title}
        </h2>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">{copy.labels.draftAnswerText}</span>
        <textarea
          className="min-h-32 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          disabled={disabled || isSaving}
          onChange={(event) => updateField("draftAnswerText", event.target.value)}
          placeholder={copy.placeholders.draftAnswerText}
          value={workspace.draftAnswerText}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">{copy.labels.studentNotes}</span>
        <textarea
          className="min-h-28 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          disabled={disabled || isSaving}
          onChange={(event) => updateField("studentNotes", event.target.value)}
          placeholder={copy.placeholders.studentNotes}
          value={workspace.studentNotes}
        />
      </label>

      <details className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
        <summary className="cursor-pointer list-none text-sm font-medium">
          {copy.labels.reviewedText}
        </summary>
        <textarea
          className="mt-4 min-h-40 w-full rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          disabled={disabled || isSaving}
          onChange={(event) =>
            updateField("editedExtractedText", event.target.value)
          }
          value={workspace.editedExtractedText}
        />
      </details>

      <details className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
        <summary className="cursor-pointer list-none text-sm font-medium">
          {copy.labels.assignmentText}
        </summary>
        <div className="mt-4 grid gap-4">
          <textarea
            className="min-h-32 rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            disabled={disabled || isSaving}
            onChange={(event) => updateField("assignmentText", event.target.value)}
            value={workspace.assignmentText}
          />

          <label className="grid gap-2 text-sm">
            <span className="font-medium">{copy.labels.planText}</span>
            <textarea
              className="min-h-28 rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              disabled={disabled || isSaving}
              onChange={(event) => updateField("planText", event.target.value)}
              placeholder={copy.placeholders.planText}
              value={workspace.planText}
            />
          </label>
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--ink-soft)]">
          {saveMessage ?? copy.unsaved}
        </p>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isSaving}
          onClick={onSaveWorkspace}
          type="button"
        >
          {isSaving ? copy.saving : copy.save}
        </button>
      </div>
    </aside>
  );
}

export type { WorkspaceDraftState };
