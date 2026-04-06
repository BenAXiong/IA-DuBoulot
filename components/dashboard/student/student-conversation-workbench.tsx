"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { INTAKE_ACCEPT_ATTR, stageIntakeFiles } from "@/lib/intake/intake-config";
import {
  formatDateLabel,
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
} from "@/lib/server/conversations/types";
import { uploadConversationFiles } from "@/lib/uploads/client-upload";

type StudentConversationWorkbenchProps = {
  detail: ConversationDetail;
  languageCode: UiLanguageCode;
};

type MessageRouteResponse =
  | {
      ok: true;
      data: {
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
}: StudentConversationWorkbenchProps) {
  const copy = getStudentWorkbenchCopy(languageCode);
  const sectionRef = useRef<HTMLElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [conversation, setConversation] = useState(detail.conversation);
  const [messages, setMessages] = useState(detail.messages);
  const [attachments, setAttachments] = useState(detail.attachments);
  const [workspace, setWorkspace] = useState<WorkspaceDraftState>(
    buildInitialWorkspace(detail),
  );
  const [composerText, setComposerText] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();
  const [isUploading, startUploading] = useTransition();
  const [isCompleting, startCompleting] = useTransition();
  const [railWidth, setRailWidth] = useState(296);
  const [isResizingRail, setIsResizingRail] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isReadOnly = conversation.status !== "active";

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
  }, [messages]);

  async function sendMessage(intent: "student_message" | "hint" | "summarize") {
    setChatError(null);

    if (intent === "student_message" && composerText.trim().length === 0) {
      setChatError(copy.errors.emptyMessage);
      return;
    }

    startSending(async () => {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            intent,
            contentText: composerText,
          }),
        },
      );

      const payload = (await response
        .json()
        .catch(() => null)) as MessageRouteResponse | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (
        !response.ok ||
        !payload?.ok ||
        !payload.data?.studentMessage ||
        !payload.data?.assistantMessage
      ) {
        setChatError(routeErrorMessage ?? copy.errors.addConversationTurn);
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        payload.data.studentMessage,
        payload.data.assistantMessage,
      ]);
      setComposerText("");
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
      try {
        const results = await uploadConversationFiles({
          conversationId: conversation.id,
          files: staged.acceptedFiles.map((file) => file.file),
          languageCode,
          uploadSource,
        });
        const nextAttachments = [...attachments];

        for (const result of results) {
          nextAttachments.push(result.attachment);
        }

        setAttachments(nextAttachments);

        const extractedBlocks = results
          .map((result) => result.extractedTextBlock)
          .filter((value): value is string => Boolean(value));
        const warningMessages = results
          .map((result) => result.warningMessage)
          .filter((value): value is string => Boolean(value));
        const nextWorkspace: WorkspaceDraftState = {
          ...workspace,
          editedExtractedText:
            extractedBlocks.length > 0
              ? [workspace.editedExtractedText.trim(), ...extractedBlocks]
                  .filter(Boolean)
                  .join("\n\n")
              : workspace.editedExtractedText,
          studentNotes:
            warningMessages.length > 0
              ? [workspace.studentNotes.trim(), ...warningMessages]
                  .filter(Boolean)
                  .join("\n")
              : workspace.studentNotes,
        };

        await persistWorkspace(nextWorkspace);
        setWorkspaceError(null);
      } catch (error) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : copy.errors.addAttachment,
        );
      }
    });
  }

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

  return (
    <div className="grid gap-4">
      <input
        accept={INTAKE_ACCEPT_ATTR}
        className="hidden"
        multiple
        onChange={handleUploadReferencePick}
        ref={fileInputRef}
        type="file"
      />

      <section
        className="grid gap-0 xl:-my-4 xl:-mr-8 xl:items-start xl:[grid-template-columns:minmax(0,1fr)_var(--student-rail-width)]"
        ref={sectionRef}
        style={{
          ["--student-rail-width" as string]: `${railWidth}px`,
        }}
      >
        <article className="flex min-h-0 flex-col gap-3 py-1 md:min-h-[calc(100vh-7.25rem)] xl:h-[calc(100vh-3.25rem)] xl:py-4 xl:pr-8">
          <div
            className="student-scrollbar-hidden min-h-0 flex-1 overflow-y-auto pt-1"
            onScroll={updateTranscriptPositionState}
            ref={transcriptRef}
          >
            <div className="grid gap-4 pb-2">
              <div className="border-b border-[color:var(--line)] pb-3">
                <div className="min-w-0 space-y-1.5">
                  <h1 className="max-w-full break-words font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
                    {conversation.title}
                  </h1>
                  <p className="text-sm text-[color:var(--ink-soft)]">
                    {copy.lastActivity(
                      formatDateLabel(
                        messages.at(-1)?.created_at ??
                          conversation.last_message_at ??
                          conversation.created_at,
                        languageCode,
                      ),
                    )}
                  </p>
                </div>
              </div>

              <StudentChatThread languageCode={languageCode} messages={messages} />
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
                isSending={isSending || isUploading}
                languageCode={languageCode}
                onComposerTextChange={setComposerText}
                onPasteAttachments={(files) => void uploadFiles(files, "paste")}
                onSendMessage={() => sendMessage("student_message")}
                onUploadAttachments={() => fileInputRef.current?.click()}
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

              {isUploading ? (
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

        <aside className="relative border-l border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-4 xl:sticky xl:top-[3.25rem] xl:h-[calc(100vh-3.25rem)] xl:self-start">
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
              isCompleting={isCompleting}
              languageCode={languageCode}
              onComplete={completeSession}
              onRemoveAttachment={removeAttachment}
            />
          </div>
        </aside>
      </section>
    </div>
  );
}
