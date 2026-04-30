"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
        unlink: "Unlink",
        delete: "Delete",
        summaryLabel: "Summary",
        structureLabel: "Contents",
        resourceInfoLabel: "About this source",
        resourceInfo:
          "Banban can use selected subject sources by retrieving the most relevant passages, without resending the whole file every turn.",
        unsupported: (name: string) => `${name} is not a supported subject source.`,
        tooLarge: (name: string, limit: string) =>
          `${name} is too large for subject sources. Limit: ${limit}.`,
        uploadError: "Unable to add this subject source.",
        confirmUnlink: (name: string) => `Remove ${name} from this chat?`,
        confirmDelete: (name: string) =>
          `Delete ${name} from subject sources and linked chats?`,
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
        unlink: "取消連結",
        delete: "刪除",
        summaryLabel: "摘要",
        structureLabel: "內容",
        resourceInfoLabel: "關於這個來源",
        resourceInfo:
          "選取科目資料後，banban 會擷取最相關的段落使用，不會每次都重新送出整份檔案。",
        unsupported: (name: string) => `${name} 不是支援的科目資料格式。`,
        tooLarge: (name: string, limit: string) =>
          `${name} 太大，無法作為科目資料來源。上限：${limit}。`,
        uploadError: "無法新增這個科目資料來源。",
        confirmUnlink: (name: string) => `要從這個聊天移除 ${name} 嗎？`,
        confirmDelete: (name: string) =>
          `要從科目資料來源與已連結的聊天刪除 ${name} 嗎？`,
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
        unlink: "Détacher",
        delete: "Supprimer",
        summaryLabel: "Résumé",
        structureLabel: "Contenu",
        resourceInfoLabel: "À propos de cette ressource",
        resourceInfo:
          "Banban peut utiliser les ressources sélectionnées en récupérant les passages utiles, sans renvoyer tout le fichier à chaque message.",
        unsupported: (name: string) =>
          `${name} n'est pas un format pris en charge pour les ressources.`,
        tooLarge: (name: string, limit: string) =>
          `${name} est trop volumineux pour les ressources. Limite : ${limit}.`,
        uploadError: "Impossible d'ajouter cette ressource de matière.",
        confirmUnlink: (name: string) =>
          `Détacher ${name} de cette discussion ?`,
        confirmDelete: (name: string) =>
          `Supprimer ${name} des ressources et des discussions liées ?`,
        pages: (count: number | null) => (count ? `${count}p` : "pages -"),
        outlineUnavailable: "Structure non disponible.",
      };
  }
}

function formatByteLimit(bytes: number, languageCode: UiLanguageCode) {
  const megabytes = bytes / (1024 * 1024);
  const value = Number.isInteger(megabytes)
    ? String(megabytes)
    : megabytes.toFixed(1);

  return languageCode === "fr" ? `${value} Mo` : `${value} MB`;
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

function InfoIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 11.25v5M12 7.75h.01M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 transition group-open/details:rotate-90" fill="none" viewBox="0 0 24 24">
      <path
        d="m9 6 6 6-6 6"
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

  useEffect(() => {
    setResources(initialResources);
    setErrorMessage(null);
    setUploadProgress(null);
    setPendingResourceId(null);
  }, [initialResources, subjectTag]);

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

      if (!policy) {
        errors.push(copy.unsupported(file.name));
        continue;
      }

      if (file.size > policy.policy.maxBytes) {
        errors.push(
          copy.tooLarge(
            file.name,
            formatByteLimit(policy.policy.maxBytes, languageCode),
          ),
        );
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

  function unlinkResource(resource: SubjectResourceLibraryItem) {
    if (!conversationId || !resource.link) {
      return;
    }

    if (!window.confirm(copy.confirmUnlink(resource.original_filename))) {
      return;
    }

    setPendingResourceId(resource.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/subject-resources/selection", {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            resourceId: resource.id,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              error?: {
                message?: string;
              };
            }
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error?.message ?? copy.uploadError);
        }

        mergeResource({
          ...resource,
          selected: false,
          link: null,
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

  function deleteResource(resource: SubjectResourceLibraryItem) {
    if (!window.confirm(copy.confirmDelete(resource.original_filename))) {
      return;
    }

    setPendingResourceId(resource.id);
    startTransition(async () => {
      try {
        const response = await fetch("/api/subject-resources", {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            resourceId: resource.id,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              error?: {
                message?: string;
              };
            }
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error?.message ?? copy.uploadError);
        }

        setResources((current) => current.filter((item) => item.id !== resource.id));
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
                className="group/card grid gap-2 rounded-[0.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-3"
                key={resource.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[color:var(--foreground)]">
                      {resource.original_filename}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-[color:var(--ink-soft)]">
                    <span>
                      {copy.pages(resource.page_count)} ·{" "}
                      {formatDateLabel(resource.updated_at, languageCode)}
                    </span>
                    <button
                      aria-label={copy.resourceInfoLabel}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)] group-hover/card:opacity-100 focus-visible:opacity-100"
                      title={copy.resourceInfo}
                      type="button"
                    >
                      <InfoIcon />
                    </button>
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
                  <details className="group/details rounded-[0.5rem] border border-[color:var(--line)]/80 bg-[color:var(--surface-strong)] px-2.5 py-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-[color:var(--foreground)] [&::-webkit-details-marker]:hidden">
                      <span>{copy.summaryLabel}</span>
                      <ChevronIcon />
                    </summary>
                    <p className="mt-2 text-xs leading-5 text-[color:var(--ink-soft)]">
                      {summary}
                    </p>
                  </details>
                ) : null}
                {outline ? (
                  <details className="group/details rounded-[0.5rem] border border-[color:var(--line)]/80 bg-[color:var(--surface-strong)] px-2.5 py-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-[color:var(--foreground)] [&::-webkit-details-marker]:hidden">
                      <span>{copy.structureLabel}</span>
                      <ChevronIcon />
                    </summary>
                    <div className="mt-2">
                      <SourceOutlinePreview
                        compact
                        maxItems={6}
                        outline={outline}
                        unavailableLabel={copy.outlineUnavailable}
                      />
                    </div>
                  </details>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  {conversationId && resource.link ? (
                    <button
                      className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-medium text-[color:var(--ink-soft)] transition hover:text-[color:var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isUpdating || disabled}
                      onClick={() => unlinkResource(resource)}
                      type="button"
                    >
                      {copy.unlink}
                    </button>
                  ) : null}
                  <button
                    className="rounded-full border border-[#c95f44]/35 px-3 py-1 text-xs font-medium text-[#c95f44] transition hover:border-[#c95f44] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isUpdating || disabled}
                    onClick={() => deleteResource(resource)}
                    type="button"
                  >
                    {copy.delete}
                  </button>
                </div>
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
