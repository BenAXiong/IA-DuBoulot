"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IntakeFileList } from "@/components/dashboard/student/intake-file-list";
import { IntakeReadinessCard } from "@/components/dashboard/student/intake-readiness-card";
import {
  buildExtractionDraftSeed,
  INTAKE_ACCEPT_ATTR,
  INTAKE_SUBJECT_OPTIONS,
  isProvisionalExtractionDraft,
  stageIntakeFiles,
  type StagedIntakeFile,
} from "@/lib/intake/intake-config";
import type { StudentDashboardSnapshot } from "@/lib/server/student-dashboard/types";
import { uploadConversationFiles } from "@/lib/uploads/client-upload";

type NewHomeworkIntakeFormProps = {
  snapshot: StudentDashboardSnapshot;
};

type CreateConversationResponse =
  | {
      ok: true;
      data: {
        conversationId: string;
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
        fieldErrors?: Record<string, string>;
      };
    };

type WorkspaceRouteResponse =
  | {
      ok: true;
      data: {
        workspace: {
          assignment_text: string | null;
          edited_extracted_text: string | null;
        };
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
      };
    };

function getWorkspaceRouteErrorMessage(payload: WorkspaceRouteResponse | null) {
  if (!payload || payload.ok) {
    return null;
  }

  return payload.error?.message ?? null;
}

function getResolvedSubjectTag(subjectChoice: string, customSubject: string) {
  if (subjectChoice === "autre") {
    return customSubject.trim();
  }

  return subjectChoice.trim();
}

function hasAnySource(input: {
  files: StagedIntakeFile[];
  pastedText: string;
  extractionDraft: string;
}) {
  return (
    input.files.length > 0 ||
    input.pastedText.trim().length > 0 ||
    input.extractionDraft.trim().length > 0
  );
}

export function NewHomeworkIntakeForm({
  snapshot,
}: NewHomeworkIntakeFormProps) {
  const router = useRouter();
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [subjectChoice, setSubjectChoice] = useState("mathematiques");
  const [customSubject, setCustomSubject] = useState("");
  const [gradedHomework, setGradedHomework] = useState(true);
  const [pastedText, setPastedText] = useState("");
  const [files, setFiles] = useState<StagedIntakeFile[]>([]);
  const [extractionDraft, setExtractionDraft] = useState("");
  const [hasEditedExtractionDraft, setHasEditedExtractionDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalBytes = files.reduce((sum, file) => sum + file.file.size, 0);
  const resolvedSubjectTag = getResolvedSubjectTag(subjectChoice, customSubject);
  const titleReady = assignmentTitle.trim().length > 0;
  const subjectReady = resolvedSubjectTag.length > 0;

  function maybeRefreshExtractionDraft(nextFiles: StagedIntakeFile[], nextPastedText: string) {
    if (hasEditedExtractionDraft && extractionDraft.trim().length > 0) {
      return;
    }

    setExtractionDraft(
      buildExtractionDraftSeed({
        files: nextFiles,
        pastedText: nextPastedText,
      }),
    );
  }

  function handleAddFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files ?? []);

    if (incomingFiles.length === 0) {
      return;
    }

    const staged = stageIntakeFiles({
      existingFiles: files,
      incomingFiles,
    });

    setFiles(staged.acceptedFiles);
    maybeRefreshExtractionDraft(staged.acceptedFiles, pastedText);
    setErrorMessage(staged.errors.length > 0 ? staged.errors.join(" ") : null);
    setReviewMessage(null);
    event.target.value = "";
  }

  function handleRemoveFile(fileId: string) {
    const nextFiles = files.filter((file) => file.id !== fileId);
    setFiles(nextFiles);
    maybeRefreshExtractionDraft(nextFiles, pastedText);
    setReviewMessage(null);
  }

  function handlePastedTextChange(value: string) {
    setPastedText(value);
    maybeRefreshExtractionDraft(files, value);
    setReviewMessage(null);
  }

  function handleExtractionReset() {
    setExtractionDraft(
      buildExtractionDraftSeed({
        files,
        pastedText,
      }),
    );
    setHasEditedExtractionDraft(false);
    setReviewMessage(null);
  }

  function handleReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setReviewMessage(null);

    if (!snapshot.canStartHomework) {
      setErrorMessage(
        "Le compte ne peut pas encore lancer un nouveau devoir depuis cette route.",
      );
      return;
    }

    if (!assignmentTitle.trim()) {
      setErrorMessage("Ajoute un titre de devoir avant de continuer.");
      return;
    }

    if (!resolvedSubjectTag) {
      setErrorMessage("Choisis ou saisis une matiere.");
      return;
    }

    if (
      !hasAnySource({
        files,
        pastedText,
        extractionDraft,
      })
    ) {
      setErrorMessage(
        "Ajoute au moins un fichier, un texte colle, ou un brouillon d'extraction.",
      );
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: assignmentTitle.trim(),
          subjectTag: resolvedSubjectTag,
          gradedHomework,
          pastedText,
          editedExtractedText: extractionDraft,
          attachmentReferences: [],
        }),
      });

      const payload = (await response
        .json()
        .catch(() => null)) as CreateConversationResponse | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (!response.ok || !payload?.ok || !payload.data?.conversationId) {
        setErrorMessage(
          routeErrorMessage ??
            "Impossible de creer la session brouillon pour ce devoir.",
        );
        return;
      }

      try {
        const uploadResults =
          files.length > 0
            ? await uploadConversationFiles({
                conversationId: payload.data.conversationId,
                files: files.map((file) => file.file),
              })
            : [];
        const extractedBlocks = uploadResults
          .map((result) => result.extractedTextBlock)
          .filter((value): value is string => Boolean(value));
        const warningMessages = uploadResults
          .map((result) => result.warningMessage)
          .filter((value): value is string => Boolean(value));
        const baseExtractionDraft = extractionDraft.trim();
        const mergedExtractionDraft =
          extractedBlocks.length === 0
            ? baseExtractionDraft
            : !baseExtractionDraft || isProvisionalExtractionDraft(baseExtractionDraft)
              ? extractedBlocks.join("\n\n")
              : [baseExtractionDraft, ...extractedBlocks].join("\n\n");

        if (mergedExtractionDraft !== extractionDraft.trim()) {
          const workspaceResponse = await fetch(
            `/api/conversations/${payload.data.conversationId}/workspace`,
            {
              method: "PATCH",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                assignmentText: pastedText,
                editedExtractedText: mergedExtractionDraft,
                planText: "",
                draftAnswerText: "",
                studentNotes: warningMessages.join("\n"),
              }),
            },
          );
          const workspacePayload = (await workspaceResponse
            .json()
            .catch(() => null)) as WorkspaceRouteResponse | null;

          if (!workspaceResponse.ok || !workspacePayload?.ok) {
            throw new Error(
              getWorkspaceRouteErrorMessage(workspacePayload) ??
                "La session a ete creee mais le texte extrait n'a pas pu etre synchronise.",
            );
          }
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "La session a ete creee, mais les pieces jointes n'ont pas toutes ete confirmees.";
        setErrorMessage(message);
        setReviewMessage(
          "Le brouillon existe deja. Tu peux reprendre la session et relancer les pieces dans le chat.",
        );
        router.push(`/app/conversations/${payload.data.conversationId}`);
        router.refresh();
        return;
      }

      setReviewMessage("Session creee et pieces analysees. Redirection...");
      router.push(`/app/conversations/${payload.data.conversationId}`);
      router.refresh();
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <form className="grid gap-6" onSubmit={handleReview}>
        <article className="grid gap-5 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              A3.2.1 Brief du devoir
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              Capture le titre et la matiere avant toute extraction.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Titre du devoir</span>
              <input
                className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                maxLength={120}
                onChange={(event) => setAssignmentTitle(event.target.value)}
                placeholder="Ex: Fractions - exercice 4"
                type="text"
                value={assignmentTitle}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Matiere</span>
              <select
                className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                onChange={(event) => setSubjectChoice(event.target.value)}
                value={subjectChoice}
              >
                {INTAKE_SUBJECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {subjectChoice === "autre" ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Nom de la matiere</span>
              <input
                className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                maxLength={60}
                onChange={(event) => setCustomSubject(event.target.value)}
                placeholder="Ex: Allemand"
                type="text"
                value={customSubject}
              />
            </label>
          ) : null}
        </article>

        <article className="grid gap-5 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              A3.2.2 A3.2.3 Sources du devoir
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              Ajoute les pieces du devoir puis le texte utile deja lisible.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium">Fichiers autorises</p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Images, captures d&apos;ecran et PDF sont verifies ici puis
                transferes et analyses pendant la creation de session.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                accept={INTAKE_ACCEPT_ATTR}
                className="hidden"
                multiple
                onChange={handleAddFiles}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Ajouter des fichiers
              </button>
            </div>
          </div>

          <IntakeFileList files={files} onRemove={handleRemoveFile} />

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Texte colle ou recopie utile</span>
              <textarea
                className="min-h-40 rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                onChange={(event) => handlePastedTextChange(event.target.value)}
                placeholder="Colle ici l'enonce, la correction, ou les passages deja lisibles..."
                value={pastedText}
              />
            </label>

            <label className="flex items-center gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-medium">
              <input
                checked={gradedHomework}
                onChange={(event) => setGradedHomework(event.target.checked)}
                type="checkbox"
              />
              Devoir note
            </label>
          </div>
        </article>

        <article className="grid gap-5 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                A3.2.4 Texte extrait relu
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                Relis, corrige, puis laisse un texte propre a transmettre au chat.
              </h2>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Le brouillon peut venir du texte colle, d&apos;une correction
                manuelle, ou des pieces qui seront analysees a la creation.
              </p>
            </div>

            <button
              className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
              onClick={handleExtractionReset}
              type="button"
            >
              Regenerer le brouillon
            </button>
          </div>

          <textarea
            className="min-h-64 rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-4 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) => {
              setExtractionDraft(event.target.value);
              setHasEditedExtractionDraft(true);
              setReviewMessage(null);
            }}
            placeholder="Le texte relu du devoir apparaitra ici."
            value={extractionDraft}
          />

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!snapshot.canStartHomework || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creation..." : "Creer la session"}
            </button>
            <span className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm text-[color:var(--ink-soft)]">
              La session sera persistee puis les pieces seront uploadees et extraites
            </span>
          </div>

          {errorMessage ? (
            <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm leading-6 text-[#8d3b1f]">
              {errorMessage}
            </p>
          ) : null}
        </article>
      </form>

      <IntakeReadinessCard
        canStartHomework={snapshot.canStartHomework}
        extractionDraftLength={extractionDraft.trim().length}
        filesCount={files.length}
        pastedTextLength={pastedText.trim().length}
        reviewMessage={reviewMessage}
        subjectReady={subjectReady}
        titleReady={titleReady}
        totalBytes={totalBytes}
      />
    </section>
  );
}
