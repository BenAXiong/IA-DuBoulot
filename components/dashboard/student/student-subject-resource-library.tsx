"use client";

import { useRef, useState, useTransition } from "react";
import { SourceOutlinePreview } from "@/components/dashboard/student/source-outline-preview";
import { StudentUploadProgressRing } from "@/components/dashboard/student/student-upload-progress-ring";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { SubjectResourceLibraryItem } from "@/lib/server/subject-resources/types";
import {
  SUBJECT_RESOURCE_ACCEPT_ATTR,
  resolveSubjectResourcePolicyInput,
} from "@/lib/subject-resources/subject-resource-policy";
import {
  type SubjectResourceUploadPhase,
  uploadSubjectResourceFiles,
} from "@/lib/uploads/subject-resource-client-upload";

type StudentSubjectResourceLibraryProps = {
  subjectTag: string;
  languageCode: UiLanguageCode;
  initialResources: SubjectResourceLibraryItem[];
  conversationId?: string | null;
  compact?: boolean;
  disabled?: boolean;
};

type UploadProgressState = {
  phase: SubjectResourceUploadPhase;
  completedPhases: number;
  totalPhases: number;
};

function getCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return {
        title: "Sources",
        empty: "No subject sources yet.",
        upload: "Add source",
        uploading: "Adding...",
        selected: "Used in this chat",
        unselected: "Not used",
        ready: "ready",
        pending: "pending",
        failed: "failed",
        unsupported: (name: string) => `${name} is not a supported subject source.`,
        uploadError: "Unable to add this subject source.",
        chunks: (count: number) => `${count} chunk${count === 1 ? "" : "s"}`,
        pages: (count: number | null) => (count ? `${count}p` : "pages -"),
        outlineUnavailable: "No usable structure yet.",
      };
    case "zh":
      return {
        title: "資料來源",
        empty: "這個科目還沒有資料來源。",
        upload: "新增來源",
        uploading: "正在新增...",
        selected: "此聊天會使用",
        unselected: "未使用",
        ready: "ready",
        pending: "pending",
        failed: "failed",
        unsupported: (name: string) => `${name} 不是支援的科目資料格式。`,
        uploadError: "無法新增這個科目資料來源。",
        chunks: (count: number) => `${count} chunks`,
        pages: (count: number | null) => (count ? `${count}p` : "pages -"),
        outlineUnavailable: "尚無可用結構。",
      };
    default:
      return {
        title: "Ressources",
        empty: "Aucune ressource de matière pour l'instant.",
        upload: "Ajouter",
        uploading: "Ajout...",
        selected: "Utilisée ici",
        unselected: "Non utilisée",
        ready: "ready",
        pending: "pending",
        failed: "failed",
        unsupported: (name: string) =>
          `${name} n'est pas un format pris en charge pour les ressources.`,
        uploadError: "Impossible d'ajouter cette ressource de matière.",
        chunks: (count: number) => `${count} chunk${count > 1 ? "s" : ""}`,
        pages: (count: number | null) => (count ? `${count}p` : "pages -"),
        outlineUnavailable: "Structure non disponible.",
      };
  }
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 16V5m0 0 4 4m-4-4-4 4M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getProgressSegments(progress: UploadProgressState | null): 1 | 2 | 3 {
  if (!progress) {
    return 1;
  }

  switch (progress.phase) {
    case "prepare":
      return 1;
    case "upload":
      return 2;
    case "extract":
      return 3;
  }
}

function getStatusLabel(
  status: SubjectResourceLibraryItem["extraction_status"],
  copy: ReturnType<typeof getCopy>,
) {
  switch (status) {
    case "ready":
      return copy.ready;
    case "failed":
      return copy.failed;
    default:
      return copy.pending;
  }
}

export function StudentSubjectResourceLibrary({
  subjectTag,
  languageCode,
  initialResources,
  conversationId = null,
  compact = false,
  disabled = false,
}: StudentSubjectResourceLibraryProps) {
  const copy = getCopy(languageCode);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resources, setResources] = useState(initialResources);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(
    null,
  );
  const [pendingResourceId, setPendingResourceId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function mergeResource(resource: SubjectResourceLibraryItem) {
    setResources((current) => {
      const without = current.filter((item) => item.id !== resource.id);
      return [resource, ...without];
    });
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const acceptedFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const policy = resolveSubjectResourcePolicyInput({
        mimeType: file.type,
        originalFilename: file.name,
      });

      if (!policy || file.size > policy.policy.maxBytes) {
        errors.push(copy.unsupported(file.name));
        continue;
      }

      acceptedFiles.push(file);
    }

    if (errors.length > 0) {
      setErrorMessage(errors[0]);
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const results = await uploadSubjectResourceFiles({
          subjectTag,
          files: acceptedFiles,
          conversationId,
          selectForConversation: Boolean(conversationId),
          languageCode,
          onProgress: (progress) => {
            setUploadProgress({
              phase: progress.phase,
              completedPhases: progress.completedPhases,
              totalPhases: progress.totalPhases,
            });
          },
        });

        setResources((current) => {
          const byId = new Map(current.map((item) => [item.id, item]));
          for (const result of results) {
            byId.set(result.resource.id, {
              ...result.resource,
              selected: result.link?.selected ?? false,
              link: result.link,
              chunk_count: result.chunkCount,
            });
          }
          return Array.from(byId.values()).sort((left, right) =>
            right.updated_at.localeCompare(left.updated_at),
          );
        });
        const warning = results.find((result) => result.warningMessage)?.warningMessage;
        setErrorMessage(warning ?? null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : copy.uploadError,
        );
      } finally {
        setUploadProgress(null);
      }
    });
  }

  function updateSelection(resource: SubjectResourceLibraryItem, selected: boolean) {
    if (!conversationId || resource.extraction_status !== "ready") {
      return;
    }

    setPendingResourceId(resource.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/subject-resources/selection", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            resourceId: resource.id,
            selected,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              data?: {
                link?: SubjectResourceLibraryItem["link"];
              };
              error?: {
                message?: string;
              };
            }
          | null;

        if (!response.ok || !payload?.ok || !payload.data?.link) {
          throw new Error(payload?.error?.message ?? copy.uploadError);
        }

        mergeResource({
          ...resource,
          selected: payload.data.link.selected,
          link: payload.data.link,
        });
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : copy.uploadError,
        );
      } finally {
        setPendingResourceId(null);
      }
    });
  }

  return (
    <section className={`grid gap-3 ${compact ? "" : "py-1"}`}>
      <input
        accept={SUBJECT_RESOURCE_ACCEPT_ATTR}
        className="hidden"
        multiple
        onChange={handleFilePick}
        ref={fileInputRef}
        type="file"
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-heading)] text-xl leading-tight">
          {copy.title}
        </h2>
        <button
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--foreground)]/30 hover:bg-[color:var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || isPending}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {isPending && uploadProgress ? (
            <StudentUploadProgressRing
              completedSegments={getProgressSegments(uploadProgress)}
            />
          ) : (
            <UploadIcon />
          )}
          <span>{isPending && uploadProgress ? copy.uploading : copy.upload}</span>
        </button>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.empty}
        </p>
      ) : (
        <div className="grid gap-2">
          {resources.map((resource) => {
            const selected = resource.selected;
            const canSelect =
              Boolean(conversationId) && resource.extraction_status === "ready";
            const isUpdating = pendingResourceId === resource.id;
            const summary =
              typeof resource.metadata.source_summary === "string"
                ? resource.metadata.source_summary
                : null;
            const outline =
              typeof resource.metadata.source_outline === "string" &&
              resource.metadata.source_outline.trim()
                ? resource.metadata.source_outline.trim()
                : null;

            return (
              <div
                className="grid gap-2 rounded-[0.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-3"
                key={resource.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[color:var(--foreground)]">
                      {resource.original_filename}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
                      {getStatusLabel(resource.extraction_status, copy)} ·{" "}
                      {copy.pages(resource.page_count)} ·{" "}
                      {copy.chunks(resource.chunk_count)} ·{" "}
                      {formatDateLabel(resource.updated_at, languageCode)}
                    </p>
                  </div>

                  {conversationId ? (
                    <button
                      aria-pressed={selected}
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]"
                          : "border-[color:var(--line)] bg-transparent text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
                      }`}
                      disabled={!canSelect || isUpdating || disabled}
                      onClick={() => updateSelection(resource, !selected)}
                      type="button"
                    >
                      {selected ? copy.selected : copy.unselected}
                    </button>
                  ) : null}
                </div>
                {summary ? (
                  <p className="line-clamp-2 text-xs leading-5 text-[color:var(--ink-soft)]">
                    {summary}
                  </p>
                ) : null}
                {outline ? (
                  <SourceOutlinePreview
                    compact
                    maxItems={4}
                    outline={outline}
                    unavailableLabel={copy.outlineUnavailable}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {errorMessage ? (
        <p className="text-xs leading-5 text-[#c95f44]">{errorMessage}</p>
      ) : null}
    </section>
  );
}
