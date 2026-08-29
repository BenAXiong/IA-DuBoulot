"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudentReplyModeSwitch } from "@/components/dashboard/student/student-reply-mode-switch";
import { StudentSubjectResourceLibrary } from "@/components/dashboard/student/student-subject-resource-library";
import { StudentUploadProgressRing } from "@/components/dashboard/student/student-upload-progress-ring";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import {
  dispatchConversationListUpserted,
  dispatchConversationTitleUpdated,
} from "@/lib/conversations/conversation-title-sync";
import { setPendingConversationBootstrap } from "@/lib/conversations/pending-bootstrap-store";
import {
  extractClipboardFiles,
  INTAKE_ACCEPT_ATTR,
  stageIntakeFiles,
  type StagedIntakeFile,
} from "@/lib/intake/intake-config";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ListConversationSummary,
  StudentReplyMode,
} from "@/lib/server/conversations/types";
import type { SubjectResourceLibraryItem } from "@/lib/server/subject-resources/types";
import {
  type ConversationUploadPhase,
  uploadConversationFiles,
} from "@/lib/uploads/client-upload";
import {
  clampWorkspaceSourceText,
  clampWorkspaceSupportText,
} from "@/lib/conversations/workspace-limits";

type StudentSubjectQuickStartProps = {
  initialDraft?: string | null;
  subjectTag: string;
  languageCode: UiLanguageCode;
  existingConversationCount?: number;
  initialSubjectResources?: SubjectResourceLibraryItem[];
  conversations?: ListConversationSummary[];
  subjectResourceUploadDisabledReason?: string | null;
};

type CreateConversationShellResponse =
  | {
      ok: true;
      data: {
        conversationId: string;
        conversation: ListConversationSummary;
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
        fieldErrors?: Record<string, string>;
      };
    };

type SubjectResourceSelectionResponse =
  | {
      ok: true;
      data: {
        link?: unknown;
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
          student_notes: string | null;
        };
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
        fieldErrors?: Record<string, string>;
      };
    };

type UploadProgressState = {
  phase: ConversationUploadPhase;
  completedPhases: number;
  totalPhases: number;
};

type SubjectQuickStartTab = "history" | "resources" | "instructions";

function getQuickStartCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return {
        placeholder: "Ask anything about this homework...",
        addSources: "Add files",
        attachmentsReady: (count: number) =>
          `${count} ${count === 1 ? "file ready" : "files ready"}`,
        submit: "Start chat",
        sending: "Opening chat...",
        preparingUpload: "Preparing uploads...",
        extractionBlocked:
          "The file was added, but its text could not be extracted reliably. Your message was not sent automatically.",
        voice: "Voice input coming soon!",
        startError: "Unable to open the chat right now.",
        tabs: {
          history: "My homework",
          resources: "Sources",
          instructions: "Instructions",
        },
        masterInstructionsSoon: "Master instructions available soon!",
        noSubjectChats: "No homework has been saved for this subject yet.",
        noInstructions: "No subject instruction has been saved yet.",
        workspaceLabel: "Subject workspace",
      };
    case "zh":
      return {
        placeholder: "直接輸入你對這份作業的問題...",
        addSources: "加入檔案",
        attachmentsReady: (count: number) => `已準備 ${count} 個檔案`,
        submit: "開始聊天",
        sending: "正在開啟聊天...",
        preparingUpload: "正在準備上傳...",
        extractionBlocked:
          "檔案已加入，但系統無法可靠地擷取文字。你的訊息沒有被自動送出。",
        voice: "語音輸入即將推出！",
        startError: "目前無法開啟聊天。",
        tabs: {
          history: "我的作業",
          resources: "資料來源",
          instructions: "指示",
        },
        masterInstructionsSoon: "主指示功能即將推出！",
        noSubjectChats: "這個科目目前還沒有已儲存的作業。",
        noInstructions: "這個科目目前還沒有已儲存的指示。",
        workspaceLabel: "科目工作區",
      };
    default:
      return {
        placeholder: "Écris directement ta question sur ce devoir...",
        addSources: "Ajouter des fichiers",
        attachmentsReady: (count: number) =>
          `${count} fichier${count > 1 ? "s" : ""} prêt${count > 1 ? "s" : ""}`,
        submit: "Lancer le chat",
        sending: "Ouverture du chat...",
        preparingUpload: "Préparation des fichiers...",
        extractionBlocked:
          "Le fichier a bien été ajouté, mais son texte n'a pas pu être extrait de façon fiable. Ton message n'a pas été envoyé automatiquement.",
        voice: "Saisie vocale bientôt !",
        startError: "Impossible d'ouvrir le chat pour l'instant.",
        tabs: {
          history: "Mes devoirs",
          resources: "Ressources",
          instructions: "Consignes",
        },
        masterInstructionsSoon: "Consignes principales bientôt disponibles !",
        noSubjectChats: "Aucun devoir enregistré pour cette matière.",
        noInstructions: "Aucune consigne enregistrée pour cette matière.",
        workspaceLabel: "Espace de travail de la matière",
      };
  }
}

function getHomeworkStatusPillClassName(status: ListConversationSummary["status"]) {
  if (status === "active") {
    return "student-homework-status-pill student-homework-status-pill--active";
  }

  if (status === "completed") {
    return "student-homework-status-pill student-homework-status-pill--complete";
  }

  return "student-homework-status-pill";
}

function buildConversationTitle(existingConversationCount: number) {
  return `Subject_${String(existingConversationCount + 1).padStart(3, "0")}`;
}

function getRouteErrorMessage(payload: CreateConversationShellResponse | null) {
  if (!payload || payload.ok) {
    return null;
  }

  return payload.error?.message ?? null;
}

function getWorkspaceRouteErrorMessage(payload: WorkspaceRouteResponse | null) {
  if (!payload || payload.ok) {
    return null;
  }

  const fieldError = payload.error?.fieldErrors
    ? Object.values(payload.error.fieldErrors)[0]
    : null;

  return fieldError ?? payload.error?.message ?? null;
}

function getSubjectResourceSelectionErrorMessage(
  payload: SubjectResourceSelectionResponse | null,
) {
  if (!payload || payload.ok) {
    return null;
  }

  const fieldError = payload.error?.fieldErrors
    ? Object.values(payload.error.fieldErrors)[0]
    : null;

  return fieldError ?? payload.error?.message ?? null;
}

function getUploadProgressSegments(
  progress: UploadProgressState | null,
): 1 | 2 | 3 {
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

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 4.75a2.75 2.75 0 0 1 2.75 2.75v4.25a2.75 2.75 0 1 1-5.5 0V7.5A2.75 2.75 0 0 1 12 4.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7.75 10.75v.75a4.25 4.25 0 0 0 8.5 0v-.75M12 15.75v3.5M9.25 19.25h5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m5 12 13-7-3.5 14-2.5-5-7-2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M11.5 13.5 18 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function renderConversationRows(input: {
  conversations: ListConversationSummary[];
  languageCode: UiLanguageCode;
}) {
  return (
    <div className="divide-y divide-[color:var(--line)]">
      {input.conversations.map((conversation) => (
        <Link
          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-4 transition hover:bg-[color:var(--surface-strong)]"
          href={`/app/conversations/${conversation.id}?subject=${encodeURIComponent(conversation.subject_tag)}`}
          key={conversation.id}
        >
          <div className="min-w-0">
            <h3 className="flex min-w-0 items-center gap-2 font-[family-name:var(--font-heading)] text-xl leading-tight">
              <span className={getHomeworkStatusPillClassName(conversation.status)}>
                {getConversationStatusLabel(
                  conversation.status,
                  input.languageCode,
                )}
              </span>
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {conversation.title}
              </span>
            </h3>
          </div>

          <div className="shrink-0 text-sm text-[color:var(--ink-soft)]">
            {formatDateLabel(
              conversation.last_message_at ??
                conversation.completed_at ??
                conversation.created_at,
              input.languageCode,
            ) ?? ""}
          </div>
        </Link>
      ))}
    </div>
  );
}

function renderSubjectTabPanel(input: {
  activeTab: SubjectQuickStartTab;
  conversations: ListConversationSummary[];
  initialSubjectResources: SubjectResourceLibraryItem[];
  languageCode: UiLanguageCode;
  preselectedResourceIds: string[];
  onPreselectedResourceIdsChange: (resourceIds: string[]) => void;
  subjectResourceUploadDisabledReason?: string | null;
  subjectTag: string;
  copy: ReturnType<typeof getQuickStartCopy>;
}) {
  if (input.activeTab === "resources") {
    return (
      <StudentSubjectResourceLibrary
        initialResources={input.initialSubjectResources}
        languageCode={input.languageCode}
        onPreselectedResourceIdsChange={input.onPreselectedResourceIdsChange}
        preselectedResourceIds={input.preselectedResourceIds}
        subjectTag={input.subjectTag}
        uploadDisabledReason={input.subjectResourceUploadDisabledReason}
      />
    );
  }

  if (input.activeTab === "instructions") {
    return (
      <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
        {input.copy.noInstructions}
      </p>
    );
  }

  return input.conversations.length === 0 ? (
    <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
      {input.copy.noSubjectChats}
    </p>
  ) : (
    renderConversationRows({
      conversations: input.conversations,
      languageCode: input.languageCode,
    })
  );
}

export function StudentSubjectQuickStart({
  initialDraft = null,
  subjectTag,
  languageCode,
  existingConversationCount = 0,
  initialSubjectResources = [],
  conversations = [],
  subjectResourceUploadDisabledReason = null,
}: StudentSubjectQuickStartProps) {
  const router = useRouter();
  const copy = getQuickStartCopy(languageCode);
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [stagedFiles, setStagedFiles] = useState<StagedIntakeFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [replyMode, setReplyMode] = useState<StudentReplyMode>("thinking");
  const [activeTab, setActiveTab] = useState<SubjectQuickStartTab>("history");
  const [preselectedResourceIds, setPreselectedResourceIds] = useState<string[]>(
    [],
  );
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(initialDraft ?? "");
    setPreselectedResourceIds([]);
  }, [initialDraft, subjectTag]);

  useEffect(() => {
    const readyResourceIds = new Set(
      initialSubjectResources
        .filter((resource) => resource.extraction_status === "ready")
        .map((resource) => resource.id),
    );

    setPreselectedResourceIds((current) =>
      current.filter((resourceId) => readyResourceIds.has(resourceId)),
    );
  }, [initialSubjectResources]);

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || !event.ctrlKey) {
      return;
    }

    event.preventDefault();

    const form = event.currentTarget.form;
    if (!form || isStarting || draft.trim().length === 0) {
      return;
    }

    form.requestSubmit();
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    addStagedFiles(files);
  }

  function addStagedFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const staged = stageIntakeFiles({
      existingFiles: stagedFiles,
      incomingFiles: files,
      languageCode,
    });

    setStagedFiles(staged.acceptedFiles);
    setErrorMessage(staged.errors[0] ?? null);
  }

  function handleComposerPaste(
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) {
    const files = extractClipboardFiles(event.clipboardData);

    if (files.length === 0) {
      return;
    }

    event.preventDefault();
    addStagedFiles(files);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDraft = draft.trim();
    let conversationId: string | null = null;

    if (trimmedDraft.length === 0 || isStarting) {
      return;
    }

    setErrorMessage(null);
    setIsStarting(true);

    try {
      const createResponse = await fetch("/api/conversations?mode=shell", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: buildConversationTitle(existingConversationCount),
          subjectTag,
          gradedHomework: false,
          attachmentReferences: stagedFiles.map((file) => ({
            name: file.file.name,
            category: file.category,
            byteSize: file.file.size,
          })),
        }),
      });

      const createPayload = (await createResponse
        .json()
        .catch(() => null)) as CreateConversationShellResponse | null;
      conversationId =
        createPayload?.ok && createPayload.data?.conversationId
          ? createPayload.data.conversationId
          : null;

      if (!createResponse.ok || !createPayload?.ok || !conversationId) {
        setErrorMessage(
          getRouteErrorMessage(createPayload) ?? copy.startError,
        );
        return;
      }

      const createdConversation = createPayload.data.conversation;
      dispatchConversationListUpserted(createdConversation);
      dispatchConversationTitleUpdated({
        conversationId,
        title: createdConversation.title,
        subjectTag: createdConversation.subject_tag,
      });

      if (preselectedResourceIds.length > 0) {
        await Promise.all(
          preselectedResourceIds.map(async (resourceId) => {
            const selectionResponse = await fetch(
              "/api/subject-resources/selection",
              {
                method: "PATCH",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  conversationId,
                  resourceId,
                  selected: true,
                }),
              },
            );
            const selectionPayload = (await selectionResponse
              .json()
              .catch(() => null)) as SubjectResourceSelectionResponse | null;

            if (!selectionResponse.ok || !selectionPayload?.ok) {
              throw new Error(
                getSubjectResourceSelectionErrorMessage(selectionPayload) ??
                  copy.startError,
              );
            }
          }),
        );
      }

      const uploadResults =
        stagedFiles.length > 0
          ? await uploadConversationFiles({
              conversationId,
              files: stagedFiles.map((file) => file.file),
              languageCode,
              uploadSource: "file_picker",
              onProgress: (progress) => {
                setUploadProgress({
                  phase: progress.phase,
                  completedPhases: progress.completedPhases,
                  totalPhases: progress.totalPhases,
                });
              },
            })
          : [];
      const extractedBlocks = uploadResults
        .map((result) => result.extractedTextBlock)
        .filter((value): value is string => Boolean(value));
      const warningMessages = uploadResults
        .map((result) => result.warningMessage)
        .filter((value): value is string => Boolean(value));

      if (uploadResults.length > 0) {
        const workspaceResponse = await fetch(
          `/api/conversations/${conversationId}/workspace`,
          {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              assignmentText: "",
              editedExtractedText: clampWorkspaceSourceText(
                extractedBlocks.join("\n\n"),
              ),
              planText: "",
              draftAnswerText: "",
              studentNotes: clampWorkspaceSupportText(
                warningMessages.join("\n"),
              ),
            }),
          },
        );
        const workspacePayload = (await workspaceResponse
          .json()
          .catch(() => null)) as WorkspaceRouteResponse | null;

        if (!workspaceResponse.ok || !workspacePayload?.ok) {
          throw new Error(
            getWorkspaceRouteErrorMessage(workspacePayload) ?? copy.startError,
          );
        }
      }

      const launchErrorMessage =
        uploadResults.some((result) => result.attachment.extraction_status !== "ready")
          ? copy.extractionBlocked
          : null;

      setPendingConversationBootstrap(conversationId, {
        promptText: trimmedDraft,
        stagedFiles: [],
        replyMode,
        subjectTag,
        createdAt: Date.now(),
        autoSend: !launchErrorMessage,
        launchErrorMessage,
      });
      setStagedFiles([]);
      setPreselectedResourceIds([]);
      setDraft("");
      router.push(
        `/app/conversations/${conversationId}?subject=${encodeURIComponent(subjectTag)}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.startError;

      if (conversationId) {
        setPendingConversationBootstrap(conversationId, {
          promptText: trimmedDraft,
          stagedFiles: [],
          replyMode,
          subjectTag,
          createdAt: Date.now(),
          autoSend: false,
          launchErrorMessage: message,
        });
        setStagedFiles([]);
        setPreselectedResourceIds([]);
        router.push(
          `/app/conversations/${conversationId}?subject=${encodeURIComponent(subjectTag)}`,
        );
        return;
      }

      setErrorMessage(message);
    } finally {
      setUploadProgress(null);
      setIsStarting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <form
        className="grid gap-2 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-2"
        onSubmit={handleSubmit}
      >
        <input
          accept={INTAKE_ACCEPT_ATTR}
          className="hidden"
          multiple
          onChange={handleFilePick}
          ref={fileInputRef}
          type="file"
        />

        <textarea
          className="student-chat-textarea min-h-6 resize-none appearance-none border-0 bg-transparent px-1 py-0 text-sm leading-5 placeholder:text-[color:var(--ink-soft)]"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          onPaste={handleComposerPaste}
          placeholder={copy.placeholder}
          value={draft}
        />

        <div className="flex items-center justify-between gap-3 px-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              aria-label={copy.addSources}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isStarting}
              onClick={() => fileInputRef.current?.click()}
              title={copy.addSources}
              type="button"
            >
              <PlusIcon />
            </button>
            <StudentReplyModeSwitch
              disabled={isStarting}
              languageCode={languageCode}
              mode={replyMode}
              onModeChange={setReplyMode}
            />
            <button
              aria-label={copy.voice}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)]"
              disabled
              title={copy.voice}
              type="button"
            >
              <MicIcon />
            </button>
            {stagedFiles.length > 0 ? (
              <span className="truncate text-xs text-[color:var(--ink-soft)]">
                {copy.attachmentsReady(stagedFiles.length)}
              </span>
            ) : null}
          </div>

          <button
            aria-label={
              isStarting && stagedFiles.length > 0
                ? copy.preparingUpload
                : isStarting
                  ? copy.sending
                  : copy.submit
            }
            className="inline-flex h-11 w-11 items-center justify-center text-[color:var(--foreground)] transition hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isStarting || draft.trim().length === 0}
            type="submit"
          >
            {isStarting && stagedFiles.length > 0 ? (
              <StudentUploadProgressRing
                completedSegments={getUploadProgressSegments(uploadProgress)}
              />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>

        {errorMessage ? (
          <p className="px-1 text-xs leading-5 text-[#c95f44]">{errorMessage}</p>
        ) : null}
      </form>

      <section className="grid gap-3">
        <div
          aria-label={copy.workspaceLabel}
          className="flex flex-wrap gap-2"
          role="tablist"
        >
          {(
            [
              ["history", copy.tabs.history],
              ["resources", copy.tabs.resources],
              ["instructions", copy.tabs.instructions],
            ] as Array<[SubjectQuickStartTab, string]>
          ).map(([tab, label]) => {
            const selected = activeTab === tab;
            const disabled = tab === "instructions";
            const button = (
              <button
                aria-disabled={disabled}
                aria-selected={selected}
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium transition ${
                  disabled
                    ? "cursor-not-allowed text-[color:var(--ink-muted)] opacity-60"
                    : selected
                      ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                      : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]"
                }`}
                disabled={disabled}
                key={tab}
                onClick={() => {
                  if (!disabled) {
                    setActiveTab(tab);
                  }
                }}
                role="tab"
                type="button"
              >
                <span>{label}</span>
              </button>
            );

            return disabled ? (
              <span key={tab} title={copy.masterInstructionsSoon}>
                {button}
              </span>
            ) : (
              button
            );
          })}
        </div>

        <div key={activeTab} role="tabpanel">
          {renderSubjectTabPanel({
            activeTab,
            conversations,
            initialSubjectResources,
            languageCode,
            onPreselectedResourceIdsChange: setPreselectedResourceIds,
            preselectedResourceIds,
            subjectResourceUploadDisabledReason,
            subjectTag,
            copy,
          })}
        </div>
      </section>
    </div>
  );
}
