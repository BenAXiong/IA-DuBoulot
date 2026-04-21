"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { INTAKE_ACCEPT_ATTR, stageIntakeFiles } from "@/lib/intake/intake-config";
import { dispatchConversationTitleUpdated } from "@/lib/conversations/conversation-title-sync";
import {
  clearPendingConversationBootstrap,
  takePendingConversationBootstrap,
} from "@/lib/conversations/pending-bootstrap-store";
import {
} from "@/components/dashboard/student/student-dashboard-presenters";
import { StudentChatThread } from "@/components/dashboard/student/student-chat-thread";
import { StudentConversationComposer } from "@/components/dashboard/student/student-conversation-composer";
import { StudentConversationSideRail } from "@/components/dashboard/student/student-conversation-side-rail";
import type { WorkspaceDraftState } from "@/components/dashboard/student/student-workspace-panel";
import { getStudentWorkbenchCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ConversationDetail,
  ConversationMessageRecord,
  ConversationRecord,
  SessionSummaryRecord,
  StudentReplyMode,
} from "@/lib/server/conversations/types";
import { uploadConversationFiles } from "@/lib/uploads/client-upload";

type StudentConversationWorkbenchProps = {
  detail: ConversationDetail;
  languageCode: UiLanguageCode;
  studentDisplayName: string;
};

type MessageRouteResponse =
  | {
      ok: true;
      data: {
        conversation: ConversationRecord;
        studentMessage: ConversationMessageRecord;
        assistantMessage: ConversationMessageRecord;
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
      };
    };

type WorkspaceRouteResponse =
  | {
      ok: true;
      data: {
        workspace: ConversationDetail["workspace"];
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
      };
    };

type CompleteRouteResponse =
  | {
      ok: true;
      data: {
        conversation: ConversationRecord;
        summaries: ConversationDetail["summaries"];
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
      };
    };

type ExtractionRouteResponse =
  | {
      ok: true;
      data: {
        attachment: ConversationDetail["attachments"][number];
        extractedTextBlock: string | null;
        warningMessage: string | null;
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
      };
    };

function buildInitialWorkspace(detail: ConversationDetail): WorkspaceDraftState {
  return {
    assignmentText:
      detail.workspace?.assignment_text ?? detail.conversation.assignment_text ?? "",
    editedExtractedText:
      detail.workspace?.edited_extracted_text ??
      detail.conversation.edited_extracted_text ??
      "",
    planText: detail.workspace?.plan_text ?? "",
    draftAnswerText: detail.workspace?.draft_answer_text ?? "",
    studentNotes: detail.workspace?.student_notes ?? "",
  };
}

export function StudentConversationWorkbench({
  detail,
  languageCode,
  studentDisplayName,
}: StudentConversationWorkbenchProps) {
  const copy = getStudentWorkbenchCopy(languageCode);
  const sectionRef = useRef<HTMLElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [conversation, setConversation] = useState(detail.conversation);
  const [messages, setMessages] = useState(detail.messages);
  const [attachments, setAttachments] = useState(detail.attachments);
  const [summaries, setSummaries] = useState<SessionSummaryRecord[]>(
    detail.summaries,
  );
  const [workspace, setWorkspace] = useState<WorkspaceDraftState>(
    buildInitialWorkspace(detail),
  );
  const [composerText, setComposerText] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();
  const [isUploading, startUploading] = useTransition();
  const [isCompleting, startCompleting] = useTransition();
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [railWidth, setRailWidth] = useState(296);
  const [isResizingRail, setIsResizingRail] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [replyMode, setReplyMode] = useState<StudentReplyMode>("thinking");
  const [retryingAttachmentId, setRetryingAttachmentId] = useState<string | null>(
    null,
  );
  const [pendingStudentMessage, setPendingStudentMessage] =
    useState<ConversationMessageRecord | null>(null);
  const [pendingAssistantMessage, setPendingAssistantMessage] =
    useState<ConversationMessageRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceRef = useRef(workspace);
  const bootstrapStartedRef = useRef(false);
  const autoRetriedAttachmentIdsRef = useRef<Set<string>>(new Set());
  const isReadOnly = conversation.status !== "active";
  const displayMessages = [
    ...messages,
    ...(pendingStudentMessage ? [pendingStudentMessage] : []),
    ...(pendingAssistantMessage ? [pendingAssistantMessage] : []),
  ];

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    dispatchConversationTitleUpdated({
      conversationId: conversation.id,
      title: conversation.title,
      subjectTag: conversation.subject_tag,
    });
  }, [conversation.id, conversation.subject_tag, conversation.title]);

  function isRetriableAttachmentFailure(
    attachment: ConversationDetail["attachments"][number],
  ) {
    const metadata =
      attachment.metadata &&
      typeof attachment.metadata === "object" &&
      !Array.isArray(attachment.metadata)
        ? (attachment.metadata as Record<string, unknown>)
        : null;

    return (
      attachment.extraction_status === "failed" &&
      metadata?.extraction_error === "provider_failure"
    );
  }

  function mergeRetryResultIntoWorkspace(input: {
    currentWorkspace: WorkspaceDraftState;
    extractedTextBlock: string | null;
    warningMessage: string | null;
    attachment: ConversationDetail["attachments"][number];
  }) {
    let nextWorkspace = input.currentWorkspace;

    if (
      input.attachment.extraction_status === "ready" &&
      input.extractedTextBlock &&
      !input.currentWorkspace.editedExtractedText.includes(input.extractedTextBlock)
    ) {
      nextWorkspace = {
        ...nextWorkspace,
        editedExtractedText: [
          nextWorkspace.editedExtractedText.trim(),
          input.extractedTextBlock,
        ]
          .filter(Boolean)
          .join("\n\n"),
      };
    }

    if (
      input.attachment.extraction_status === "ready" &&
      input.warningMessage &&
      !input.currentWorkspace.studentNotes.includes(input.warningMessage)
    ) {
      nextWorkspace = {
        ...nextWorkspace,
        studentNotes: [nextWorkspace.studentNotes.trim(), input.warningMessage]
          .filter(Boolean)
          .join("\n"),
      };
    }

    return nextWorkspace;
  }

  useEffect(() => {
    if (!isResizingRail) {
      return;
    }

    function clampRailWidth(nextWidth: number) {
      const sectionWidth = sectionRef.current?.offsetWidth ?? 0;
      const minWidth = 260;
      const maxWidth = sectionWidth > 0 ? Math.floor(sectionWidth * 0.6) : 720;
      return Math.max(minWidth, Math.min(nextWidth, maxWidth));
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const nextWidth = rect.right - event.clientX;
      setRailWidth(clampRailWidth(nextWidth));
    }

    function stopResizing() {
      setIsResizingRail(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [isResizingRail]);

  function updateTranscriptPositionState() {
    const node = transcriptRef.current;
    if (!node) {
      return;
    }

    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 96);
  }

  function scrollTranscriptToBottom(behavior: ScrollBehavior = "smooth") {
    const node = transcriptRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior,
    });
  }

  useEffect(() => {
    const node = transcriptRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: "auto",
    });
    updateTranscriptPositionState();
  }, []);

  useEffect(() => {
    updateTranscriptPositionState();
    scrollTranscriptToBottom("auto");
  }, [messages, pendingStudentMessage, pendingAssistantMessage]);

  async function performAcceptedUploadFiles(
    files: File[],
    uploadSource: "file_picker" | "paste",
  ) {
    if (files.length === 0) {
      return;
    }

    try {
      const results = await uploadConversationFiles({
        conversationId: conversation.id,
        files,
        languageCode,
        uploadSource,
      });

      setAttachments((currentAttachments) => [
        ...currentAttachments,
        ...results.map((result) => result.attachment),
      ]);

      const extractedBlocks = results
        .map((result) => result.extractedTextBlock)
        .filter((value): value is string => Boolean(value));
      const warningMessages = results
        .map((result) => result.warningMessage)
        .filter((value): value is string => Boolean(value));
      const currentWorkspace = workspaceRef.current;
      const nextWorkspace: WorkspaceDraftState = {
        ...currentWorkspace,
        editedExtractedText:
          extractedBlocks.length > 0
            ? [currentWorkspace.editedExtractedText.trim(), ...extractedBlocks]
                .filter(Boolean)
                .join("\n\n")
            : currentWorkspace.editedExtractedText,
        studentNotes:
          warningMessages.length > 0
            ? [currentWorkspace.studentNotes.trim(), ...warningMessages]
                .filter(Boolean)
                .join("\n")
            : currentWorkspace.studentNotes,
      };

      await persistWorkspace(nextWorkspace);
      setWorkspaceError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.errors.addAttachment;
      setWorkspaceError(message);
      throw error;
    }
  }

  async function performSendTurnRequest(input: {
    pendingDraft: string;
    intent: "student_message" | "hint" | "summarize";
    replyMode: StudentReplyMode;
    restoreComposerOnFailure: boolean;
  }) {
    const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        intent: input.intent,
        contentText: input.pendingDraft,
        replyMode: input.replyMode,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | MessageRouteResponse
      | null;
    const routeErrorMessage =
      payload && "error" in payload ? payload.error?.message : null;

    if (
      !response.ok ||
      !payload?.ok ||
      !payload.data?.studentMessage ||
      !payload.data?.assistantMessage ||
      !payload.data?.conversation
    ) {
      setPendingStudentMessage(null);
      setPendingAssistantMessage(null);
      if (input.restoreComposerOnFailure) {
        setComposerText(input.pendingDraft);
      }
      setChatError(routeErrorMessage ?? copy.errors.addConversationTurn);
      return false;
    }

    setPendingStudentMessage(null);
    setPendingAssistantMessage(null);
    setConversation(payload.data.conversation);
    setMessages((currentMessages) => [
      ...currentMessages,
      payload.data.studentMessage,
      payload.data.assistantMessage,
    ]);
    return true;
  }

  async function sendMessage(intent: "student_message" | "hint" | "summarize") {
    setChatError(null);

    if (intent === "student_message" && composerText.trim().length === 0) {
      setChatError(copy.errors.emptyMessage);
      return;
    }

    const pendingDraft = composerText.trim();
    const pendingTimestamp = new Date().toISOString();

    if (intent === "student_message") {
      setPendingStudentMessage({
        id: `pending-student-${pendingTimestamp}`,
        conversation_id: conversation.id,
        author_user_id: conversation.student_user_id,
        role: "student",
        content_text: pendingDraft,
        content_language: languageCode,
        model_provider: null,
        model_name: null,
        input_tokens: null,
        output_tokens: null,
        created_at: pendingTimestamp,
      });
      setPendingAssistantMessage({
        id: `pending-assistant-${pendingTimestamp}`,
        conversation_id: conversation.id,
        author_user_id: null,
        role: "assistant",
        content_text: copy.pendingAssistant,
        content_language: languageCode,
        model_provider: null,
        model_name: null,
        input_tokens: null,
        output_tokens: null,
        created_at: pendingTimestamp,
      });
      setComposerText("");
    }

    startSending(async () => {
      await performSendTurnRequest({
        pendingDraft,
        intent,
        replyMode,
        restoreComposerOnFailure: intent === "student_message",
      });
    });
  }

  async function persistWorkspace(nextWorkspace: WorkspaceDraftState) {
    const response = await fetch(`/api/conversations/${conversation.id}/workspace`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(nextWorkspace),
    });

    const payload = (await response
      .json()
      .catch(() => null)) as WorkspaceRouteResponse | null;
    const routeErrorMessage =
      payload && "error" in payload ? payload.error?.message : null;

    if (!response.ok || !payload?.ok || !payload.data?.workspace) {
      throw new Error(routeErrorMessage ?? copy.errors.saveWorkspace);
    }

    const persistedWorkspace = {
      assignmentText: payload.data.workspace.assignment_text ?? "",
      editedExtractedText: payload.data.workspace.edited_extracted_text ?? "",
      planText: payload.data.workspace.plan_text ?? "",
      draftAnswerText: payload.data.workspace.draft_answer_text ?? "",
      studentNotes: payload.data.workspace.student_notes ?? "",
    };

    setWorkspace(persistedWorkspace);
    return persistedWorkspace;
  }

  function handleUploadReferencePick(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void uploadFiles(files, "file_picker");
  }

  async function uploadFiles(
    files: File[],
    uploadSource: "file_picker" | "paste",
  ) {
    if (files.length === 0) {
      return;
    }

    const staged = stageIntakeFiles({
      existingFiles: [],
      incomingFiles: files,
      languageCode,
    });

    if (staged.errors.length > 0) {
      setWorkspaceError(staged.errors.join(" "));
    }

    if (staged.acceptedFiles.length === 0) {
      return;
    }

    startUploading(async () => {
      await performAcceptedUploadFiles(
        staged.acceptedFiles.map((file) => file.file),
        uploadSource,
      ).catch(() => undefined);
    });
  }

  const runBootstrap = useEffectEvent(async () => {
    const bootstrap = takePendingConversationBootstrap(conversation.id);

    if (!bootstrap) {
      return;
    }

    bootstrapStartedRef.current = true;
    setChatError(null);
    setComposerText("");
    setIsBootstrapping(true);

    const pendingTimestamp = new Date().toISOString();
    setPendingStudentMessage({
      id: `pending-student-${pendingTimestamp}`,
      conversation_id: conversation.id,
      author_user_id: conversation.student_user_id,
      role: "student",
      content_text: bootstrap.promptText,
      content_language: languageCode,
      model_provider: null,
      model_name: null,
      input_tokens: null,
      output_tokens: null,
      created_at: pendingTimestamp,
    });
    setPendingAssistantMessage({
      id: `pending-assistant-${pendingTimestamp}`,
      conversation_id: conversation.id,
      author_user_id: null,
      role: "assistant",
      content_text: copy.pendingAssistant,
      content_language: languageCode,
      model_provider: null,
      model_name: null,
      input_tokens: null,
      output_tokens: null,
      created_at: pendingTimestamp,
    });

    try {
      await performAcceptedUploadFiles(bootstrap.stagedFiles, "file_picker");
      const succeeded = await performSendTurnRequest({
        pendingDraft: bootstrap.promptText,
        intent: "student_message",
        replyMode: bootstrap.replyMode,
        restoreComposerOnFailure: true,
      });

      if (!succeeded) {
        bootstrapStartedRef.current = false;
      }
    } catch {
      setPendingStudentMessage(null);
      setPendingAssistantMessage(null);
      setComposerText(bootstrap.promptText);
      bootstrapStartedRef.current = false;
    } finally {
      setIsBootstrapping(false);
    }
  });

  useEffect(() => {
    if (detail.messages.length > 0) {
      clearPendingConversationBootstrap(conversation.id);
      return;
    }

    if (bootstrapStartedRef.current) {
      return;
    }

    void runBootstrap();
  }, [conversation.id, detail.messages.length]);

  function completeSession() {
    setWorkspaceError(null);

    startCompleting(async () => {
      const response = await fetch(
        `/api/conversations/${conversation.id}/complete`,
        {
          method: "POST",
        },
      );

      const payload = (await response
        .json()
        .catch(() => null)) as CompleteRouteResponse | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (!response.ok || !payload?.ok || !payload.data?.conversation) {
        setWorkspaceError(routeErrorMessage ?? copy.errors.completeSession);
        return;
      }

      setConversation(payload.data.conversation);
      setSummaries(payload.data.summaries ?? []);
      setChatError(null);
      setWorkspaceError(null);
    });
  }

  function removeAttachment(attachmentId: string) {
    setWorkspaceError(null);

    startUploading(async () => {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: {
              message?: string;
            };
          }
        | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (!response.ok) {
        setWorkspaceError(
          routeErrorMessage ?? copy.errors.deleteAttachment,
        );
        return;
      }

      setAttachments((currentAttachments) =>
        currentAttachments.filter((attachment) => attachment.id !== attachmentId),
      );
    });
  }

  async function retryAttachmentExtraction(
    attachmentId: string,
    options?: { silent?: boolean },
  ) {
    setWorkspaceError(null);
    setRetryingAttachmentId(attachmentId);

    try {
      const response = await fetch("/api/uploads/extract", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          attachmentId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ExtractionRouteResponse
        | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (!response.ok || !payload?.ok || !payload.data?.attachment) {
        if (!options?.silent) {
          setWorkspaceError(routeErrorMessage ?? copy.errors.retryExtraction);
        }
        return;
      }

      setAttachments((currentAttachments) =>
        currentAttachments.map((attachment) =>
          attachment.id === attachmentId ? payload.data.attachment : attachment,
        ),
      );

      const currentWorkspace = workspaceRef.current;
      const nextWorkspace = mergeRetryResultIntoWorkspace({
        currentWorkspace,
        attachment: payload.data.attachment,
        extractedTextBlock: payload.data.extractedTextBlock,
        warningMessage: payload.data.warningMessage,
      });

      if (nextWorkspace !== currentWorkspace) {
        try {
          await persistWorkspace(nextWorkspace);
        } catch (error) {
          if (!options?.silent) {
            const message =
              error instanceof Error ? error.message : copy.errors.retryExtraction;
            setWorkspaceError(message);
          }
          return;
        }
      }

      if (!options?.silent && payload.data.attachment.extraction_status === "ready") {
        setWorkspaceError(copy.errors.extractionRetried);
      }
    } finally {
      setRetryingAttachmentId((current) =>
        current === attachmentId ? null : current,
      );
    }
  }

  const runSilentAttachmentRetry = useEffectEvent((attachmentId: string) => {
    void retryAttachmentExtraction(attachmentId, { silent: true });
  });

  useEffect(() => {
    if (isUploading || isReadOnly || retryingAttachmentId) {
      return;
    }

    const pendingRetry = attachments.find(
      (attachment) =>
        isRetriableAttachmentFailure(attachment) &&
        !autoRetriedAttachmentIdsRef.current.has(attachment.id),
    );

    if (!pendingRetry) {
      return;
    }

    autoRetriedAttachmentIdsRef.current.add(pendingRetry.id);
    runSilentAttachmentRetry(pendingRetry.id);
  }, [attachments, isUploading, isReadOnly, retryingAttachmentId]);

  return (
    <div className="grid h-full min-h-0 gap-4">
      <input
        accept={INTAKE_ACCEPT_ATTR}
        className="hidden"
        multiple
        onChange={handleUploadReferencePick}
        ref={fileInputRef}
        type="file"
      />

      <section
        className="grid min-h-0 flex-1 gap-0 overflow-hidden xl:-my-4 xl:-mr-8 xl:items-start xl:[grid-template-columns:minmax(0,1fr)_var(--student-rail-width)]"
        ref={sectionRef}
        style={{
          ["--student-rail-width" as string]: `${railWidth}px`,
        }}
      >
        <article className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-1 xl:py-4 xl:pr-8">
          <div
            className="student-scrollbar-hidden min-h-0 flex-1 overflow-y-auto pt-1"
            onScroll={updateTranscriptPositionState}
            ref={transcriptRef}
          >
            <div className="grid gap-4 pb-2">
              <StudentChatThread
                languageCode={languageCode}
                messages={displayMessages}
                studentDisplayName={studentDisplayName}
              />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-1 bg-[linear-gradient(to_top,var(--background)_78%,rgba(0,0,0,0))] px-1 pb-1 pt-6">
            <div className="grid gap-3">
              {showJumpToLatest ? (
                <div className="flex justify-center">
                  <button
                    aria-label={copy.jumpToLatest}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5"
                    onClick={() => scrollTranscriptToBottom()}
                    title={copy.jumpToLatest}
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="m7 10 5 5 5-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>
              ) : null}

              <StudentConversationComposer
                composerText={composerText}
                disabled={isReadOnly}
                isSending={isSending || isUploading || isBootstrapping}
                languageCode={languageCode}
                onComposerTextChange={setComposerText}
                onReplyModeChange={setReplyMode}
                onPasteAttachments={(files) => void uploadFiles(files, "paste")}
                onSendMessage={() => sendMessage("student_message")}
                onUploadAttachments={() => fileInputRef.current?.click()}
                replyMode={replyMode}
              />

              {chatError ? (
                <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm leading-6 text-[#8d3b1f]">
                  {chatError}
                </p>
              ) : null}

              {workspaceError ? (
                <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {workspaceError}
                </p>
              ) : null}

              {isUploading || isBootstrapping ? (
                <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.uploadInProgress}
                </p>
              ) : null}

              {isReadOnly ? (
                <p className="rounded-[1.25rem] border border-[#cbbf8d] bg-[#fff8df] px-4 py-3 text-sm leading-6 text-[#69551b]">
                  {copy.readOnly}
                </p>
              ) : null}
            </div>
          </div>
        </article>

        <aside className="relative min-h-0 overflow-hidden border-l border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-4 xl:h-full">
          <button
            aria-label="Resize side rail"
            className="absolute bottom-0 left-[-4px] top-0 hidden w-2 cursor-col-resize xl:block"
            onPointerDown={(event) => {
              event.preventDefault();
              setIsResizingRail(true);
            }}
            type="button"
          />
          <div className="flex h-full min-h-0 flex-col">
            <StudentConversationSideRail
              attachments={attachments}
              disabled={isUploading || isReadOnly}
              isCompleted={conversation.status === "completed"}
              isCompleting={isCompleting}
              languageCode={languageCode}
              onComplete={completeSession}
              onRemoveAttachment={removeAttachment}
              onRetryAttachment={(attachmentId) => {
                void retryAttachmentExtraction(attachmentId);
              }}
              retryingAttachmentId={retryingAttachmentId}
              summaries={summaries}
            />
          </div>
        </aside>
      </section>
    </div>
  );
}
