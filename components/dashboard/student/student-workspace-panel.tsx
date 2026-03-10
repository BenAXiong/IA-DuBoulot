"use client";

type WorkspaceDraftState = {
  assignmentText: string;
  editedExtractedText: string;
  planText: string;
  draftAnswerText: string;
  studentNotes: string;
};

type StudentWorkspacePanelProps = {
  disabled?: boolean;
  isSaving?: boolean;
  saveMessage: string | null;
  workspace: WorkspaceDraftState;
  onWorkspaceChange: (nextWorkspace: WorkspaceDraftState) => void;
  onSaveWorkspace: () => void;
};

export function StudentWorkspacePanel({
  disabled = false,
  isSaving = false,
  saveMessage,
  workspace,
  onWorkspaceChange,
  onSaveWorkspace,
}: StudentWorkspacePanelProps) {
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
    <aside className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
      <div className="space-y-3">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          Espace de travail
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
          Texte, plan, et brouillon restent modifiables pendant la session.
        </h2>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Texte du devoir</span>
        <textarea
          className="min-h-32 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          disabled={disabled || isSaving}
          onChange={(event) => updateField("assignmentText", event.target.value)}
          value={workspace.assignmentText}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Texte relu</span>
        <textarea
          className="min-h-40 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          disabled={disabled || isSaving}
          onChange={(event) =>
            updateField("editedExtractedText", event.target.value)
          }
          value={workspace.editedExtractedText}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Plan de resolution</span>
        <textarea
          className="min-h-28 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          disabled={disabled || isSaving}
          onChange={(event) => updateField("planText", event.target.value)}
          placeholder="Liste ici les etapes ou sous-problemes a traiter."
          value={workspace.planText}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Reponse brouillon</span>
        <textarea
          className="min-h-32 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          disabled={disabled || isSaving}
          onChange={(event) => updateField("draftAnswerText", event.target.value)}
          placeholder="Ecris ici ta tentative avant la version finale."
          value={workspace.draftAnswerText}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Notes eleve + references de pieces</span>
        <textarea
          className="min-h-28 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          disabled={disabled || isSaving}
          onChange={(event) => updateField("studentNotes", event.target.value)}
          placeholder="Ajoute ici tes notes libres, ou les references de fichiers a garder dans la session."
          value={workspace.studentNotes}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--ink-soft)]">
          {saveMessage ?? "Les modifications restent locales tant que tu ne sauvegardes pas."}
        </p>
        <button
          className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isSaving}
          onClick={onSaveWorkspace}
          type="button"
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>
    </aside>
  );
}

export type { WorkspaceDraftState };
