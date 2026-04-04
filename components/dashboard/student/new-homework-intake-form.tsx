"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IntakeFileList } from "@/components/dashboard/student/intake-file-list";
import {
  buildExtractionDraftSeed,
  INTAKE_ACCEPT_ATTR,
  isProvisionalExtractionDraft,
  stageIntakeFiles,
  type StagedIntakeFile,
} from "@/lib/intake/intake-config";
import {
  getIntakeSubjectOptions,
  getNewHomeworkIntakeCopy,
} from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { StudentDashboardSnapshot } from "@/lib/server/student-dashboard/types";
import { uploadConversationFiles } from "@/lib/uploads/client-upload";

type NewHomeworkIntakeFormProps = {
  snapshot: StudentDashboardSnapshot;
  languageCode: UiLanguageCode;
  initialSubjectTag?: string | null;
  initialDraft?: string | null;
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

function resolveInitialSubjectState(
  initialSubjectTag: string | null | undefined,
  availableValues: string[],
) {
  if (!initialSubjectTag) {
    return {
      subjectChoice: "mathematiques",
      customSubject: "",
    };
  }

  const normalized = initialSubjectTag.trim();

  if (normalized.length === 0) {
    return {
      subjectChoice: "mathematiques",
      customSubject: "",
    };
  }

  if (availableValues.includes(normalized)) {
    return {
      subjectChoice: normalized,
      customSubject: "",
    };
  }

  return {
    subjectChoice: "autre",
    customSubject: normalized,
  };
}

function getResolvedSubjectTag(subjectChoice: string, customSubject: string) {
  if (subjectChoice === "autre") {
    return customSubject.trim();
  }

  return subjectChoice.trim();
}

function hasAnySource(input: {
  files: StagedIntakeFile[];
  homeworkPrompt: string;
  extractionDraft: string;
}) {
  return (
    input.files.length > 0 ||
    input.homeworkPrompt.trim().length > 0 ||
    input.extractionDraft.trim().length > 0
  );
}

function buildConversationTitle(input: {
  resolvedSubjectTag: string;
  homeworkPrompt: string;
  files: StagedIntakeFile[];
  languageCode: UiLanguageCode;
}) {
  const firstPromptLine = input.homeworkPrompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  const firstFilename = input.files[0]?.file.name.replace(/\.[^.]+$/, "");

  const fallback =
    input.languageCode === "zh"
      ? "新的作業"
      : input.languageCode === "en"
        ? "New homework"
        : "Nouveau devoir";

  const rawTitle =
    firstPromptLine ?? firstFilename ?? input.resolvedSubjectTag ?? fallback;
  const trimmed = rawTitle.trim();

  if (trimmed.length <= 80) {
    return trimmed;
  }

  return `${trimmed.slice(0, 77).trimEnd()}...`;
}

export function NewHomeworkIntakeForm({
  snapshot,
  languageCode,
  initialSubjectTag = null,
  initialDraft = null,
}: NewHomeworkIntakeFormProps) {
  const router = useRouter();
  const copy = getNewHomeworkIntakeCopy(languageCode);
  const subjectOptions = getIntakeSubjectOptions(languageCode);
  const availableValues = subjectOptions
    .map((option) => option.value)
    .filter((value) => value !== "autre");
  const initialSubjectState = resolveInitialSubjectState(
    initialSubjectTag,
    availableValues,
  );
  const initialPrompt = initialDraft?.trim() ?? "";
  const [subjectChoice, setSubjectChoice] = useState(
    initialSubjectState.subjectChoice,
  );
  const [customSubject, setCustomSubject] = useState(
    initialSubjectState.customSubject,
  );
  const [gradedHomework, setGradedHomework] = useState(true);
  const [homeworkPrompt, setHomeworkPrompt] = useState(initialPrompt);
  const [files, setFiles] = useState<StagedIntakeFile[]>([]);
  const [extractionDraft, setExtractionDraft] = useState(initialPrompt);
  const [hasEditedExtractionDraft, setHasEditedExtractionDraft] = useState(
    initialPrompt.length > 0,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resolvedSubjectTag = getResolvedSubjectTag(subjectChoice, customSubject);

  function maybeRefreshExtractionDraft(
    nextFiles: StagedIntakeFile[],
    nextHomeworkPrompt: string,
  ) {
    if (hasEditedExtractionDraft && extractionDraft.trim().length > 0) {
      return;
    }

    setExtractionDraft(
      buildExtractionDraftSeed({
        files: nextFiles,
        pastedText: nextHomeworkPrompt,
        languageCode,
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
      languageCode,
    });

    setFiles(staged.acceptedFiles);
    maybeRefreshExtractionDraft(staged.acceptedFiles, homeworkPrompt);
    setErrorMessage(staged.errors.length > 0 ? staged.errors.join(" ") : null);
    setReviewMessage(null);
    event.target.value = "";
  }

  function handleRemoveFile(fileId: string) {
    const nextFiles = files.filter((file) => file.id !== fileId);
    setFiles(nextFiles);
    maybeRefreshExtractionDraft(nextFiles, homeworkPrompt);
    setReviewMessage(null);
  }

  function handlePromptChange(value: string) {
    setHomeworkPrompt(value);
    maybeRefreshExtractionDraft(files, value);
    setReviewMessage(null);
  }

  function handleExtractionReset() {
    setExtractionDraft(
      buildExtractionDraftSeed({
        files,
        pastedText: homeworkPrompt,
        languageCode,
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
      setErrorMessage(copy.errors.cannotStart);
      return;
    }

    if (!resolvedSubjectTag) {
      setErrorMessage(copy.errors.missingSubject);
      return;
    }

    if (
      !hasAnySource({
        files,
        homeworkPrompt,
        extractionDraft,
      })
    ) {
      setErrorMessage(copy.errors.missingSource);
      return;
    }

    startTransition(async () => {
      const title = buildConversationTitle({
        resolvedSubjectTag,
        homeworkPrompt,
        files,
        languageCode,
      });

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title,
          subjectTag: resolvedSubjectTag,
          gradedHomework,
          pastedText: homeworkPrompt,
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
        setErrorMessage(routeErrorMessage ?? copy.errors.createSession);
        return;
      }

      try {
        const uploadResults =
          files.length > 0
            ? await uploadConversationFiles({
                conversationId: payload.data.conversationId,
                files: files.map((file) => file.file),
                languageCode,
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
                assignmentText: homeworkPrompt,
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
                copy.errors.workspaceSync,
            );
          }
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : copy.errors.uploadFallback;
        setErrorMessage(message);
        setReviewMessage(copy.messages.fallbackResume);
        router.push(
          `/app/conversations/${payload.data.conversationId}?subject=${encodeURIComponent(resolvedSubjectTag)}`,
        );
        router.refresh();
        return;
      }

      setReviewMessage(copy.messages.readyRedirect);
      router.push(
        `/app/conversations/${payload.data.conversationId}?subject=${encodeURIComponent(resolvedSubjectTag)}`,
      );
      router.refresh();
    });
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr)_22rem]">
      <form className="contents" onSubmit={handleReview}>
        <article className="grid gap-5 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.sections.brief.eyebrow}
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
              {copy.sections.brief.title}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
              {copy.sections.review.body}
            </p>
          </div>

          <label className="grid gap-3 text-sm">
            <span className="font-medium">{copy.sections.sources.pastedTextLabel}</span>
            <textarea
              className="min-h-[22rem] rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 py-4 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
              onChange={(event) => handlePromptChange(event.target.value)}
              placeholder={copy.sections.sources.pastedTextPlaceholder}
              value={homeworkPrompt}
            />
          </label>

          <details className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{copy.sections.review.title}</p>
                  <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                    {copy.sections.review.body}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--line)] bg-white px-3 py-1 text-xs text-[color:var(--ink-soft)]">
                  {copy.sections.review.draftBadge}
                </span>
              </div>
            </summary>

            <div className="mt-4 grid gap-4">
              <textarea
                className="min-h-56 rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-4 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
                onChange={(event) => {
                  setExtractionDraft(event.target.value);
                  setHasEditedExtractionDraft(true);
                  setReviewMessage(null);
                }}
                placeholder={copy.sections.review.draftPlaceholder}
                value={extractionDraft}
              />

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                  onClick={handleExtractionReset}
                  type="button"
                >
                  {copy.sections.review.resetDraft}
                </button>
                <span className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-sm text-[color:var(--ink-soft)]">
                  {copy.sections.review.persistenceBadge}
                </span>
              </div>
            </div>
          </details>

          {errorMessage ? (
            <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm leading-6 text-[#8d3b1f]">
              {errorMessage}
            </p>
          ) : null}

          {reviewMessage ? (
            <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              {reviewMessage}
            </p>
          ) : null}
        </article>

        <aside className="grid gap-5 self-start rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)] xl:sticky xl:top-24">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.sections.sources.eyebrow}
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.sections.sources.allowedFilesBody}
            </p>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">{copy.sections.brief.subjectLabel}</span>
            <select
              className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              onChange={(event) => setSubjectChoice(event.target.value)}
              value={subjectChoice}
            >
              {subjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {subjectChoice === "autre" ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                {copy.sections.brief.customSubjectLabel}
              </span>
              <input
                className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                maxLength={60}
                onChange={(event) => setCustomSubject(event.target.value)}
                placeholder={copy.sections.brief.customSubjectPlaceholder}
                type="text"
                value={customSubject}
              />
            </label>
          ) : null}

          <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{copy.sections.sources.allowedFilesTitle}</p>
              <input
                accept={INTAKE_ACCEPT_ATTR}
                className="hidden"
                multiple
                onChange={handleAddFiles}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {copy.sections.sources.addFiles}
              </button>
            </div>

            <IntakeFileList
              files={files}
              languageCode={languageCode}
              onRemove={handleRemoveFile}
            />
          </div>

          <label className="flex items-center gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-medium">
            <input
              checked={gradedHomework}
              onChange={(event) => setGradedHomework(event.target.checked)}
              type="checkbox"
            />
            {copy.sections.sources.gradedHomework}
          </label>

          {!snapshot.canStartHomework ? (
            <div className="rounded-[1.5rem] border border-[#d6c48d] bg-[#fff8e5] px-4 py-4 text-sm leading-6 text-[#6b5320]">
              {copy.errors.cannotStart}
            </div>
          ) : null}

          <button
            className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!snapshot.canStartHomework || isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? copy.sections.review.creating
              : copy.sections.review.createSession}
          </button>
        </aside>
      </form>
    </section>
  );
}
