"use client";

import { useRef, useState, useTransition } from "react";
import { INTAKE_ACCEPT_ATTR, stageIntakeFiles } from "@/lib/intake/intake-config";
import {
  formatDateLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { StudentAttachmentList } from "@/components/dashboard/student/student-attachment-list";
import { StudentChatThread } from "@/components/dashboard/student/student-chat-thread";
import { StudentConversationComposer } from "@/components/dashboard/student/student-conversation-composer";
import { StudentSessionSummaryPanel } from "@/components/dashboard/student/student-session-summary-panel";
import type { WorkspaceDraftState } from "@/components/dashboard/student/student-workspace-panel";
import { getStudentWorkbenchCopy } from "@/lib/i18n/student-flow-copy";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ConversationDetail,
  ConversationMessageRecord,
  ConversationRecord,
  SessionSummaryRecord,
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
        summaries: SessionSummaryRecord[];
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
      };
    };

type RetryExtractionResponse =
  | {
      ok: true;
      data: {
        attachment: ConversationAttachmentRecord;
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
}: StudentConversationWorkbenchProps) {
  const copy = getStudentWorkbenchCopy(languageCode);
  const [conversation, setConversation] = useState(detail.conversation);
  const [messages, setMessages] = useState(detail.messages);
  const [attachments, setAttachments] = useState(detail.attachments);
  const [summaries, setSummaries] = useState(detail.summaries);
  const [workspace, setWorkspace] = useState<WorkspaceDraftState>(
    buildInitialWorkspace(detail),
  );
  const [composerText, setComposerText] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();
  const [isUploading, startUploading] = useTransition();
  const [isCompleting, startCompleting] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isReadOnly = conversation.status !== "active";
  const studentSummary =
    summaries.find((summary) => summary.audience === "student") ?? null;

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
    setCompletionError(null);
    setCompletionMessage(null);

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
        setCompletionError(routeErrorMessage ?? copy.errors.completeSession);
        return;
      }

      setConversation(payload.data.conversation);
      setSummaries(payload.data.summaries ?? []);
      setCompletionMessage(copy.errors.sessionCompleted);
      setChatError(null);
      setWorkspaceError(null);
    });
  }

  function retryAttachmentExtraction(attachmentId: string) {
    setWorkspaceError(null);

    startUploading(async () => {
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
      const payload = (await response
        .json()
        .catch(() => null)) as RetryExtractionResponse | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (!response.ok || !payload?.ok || !payload.data?.attachment) {
        setWorkspaceError(routeErrorMessage ?? copy.errors.retryExtraction);
        return;
      }

      setAttachments((currentAttachments) =>
        currentAttachments.map((attachment) =>
          attachment.id === attachmentId ? payload.data.attachment : attachment,
        ),
      );
      setWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        editedExtractedText:
          payload.data.extractedTextBlock &&
          !currentWorkspace.editedExtractedText.includes(
            payload.data.extractedTextBlock,
          )
            ? [
                currentWorkspace.editedExtractedText.trim(),
                payload.data.extractedTextBlock,
              ]
                .filter(Boolean)
                .join("\n\n")
            : currentWorkspace.editedExtractedText,
      }));
      setWorkspaceError(
        payload.data.warningMessage ?? copy.errors.extractionRetried,
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

      <section className="grid gap-0 xl:-my-4 xl:-mr-8 xl:min-h-[calc(100vh-3.25rem)] xl:grid-cols-[minmax(0,1fr)_18.5rem]">
        <article className="flex min-h-0 flex-col gap-3 py-1 xl:py-4 xl:pr-8">
          <div className="border-b border-[color:var(--line)] pb-3">
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                {conversation.subject_tag}
              </p>
              <h1 className="truncate font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
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

          <div className="min-h-0 flex-1 overflow-y-auto pt-1">
            <StudentChatThread languageCode={languageCode} messages={messages} />
          </div>

          <StudentConversationComposer
            composerText={composerText}
            disabled={isReadOnly}
            isSending={isSending || isUploading}
            languageCode={languageCode}
            onComposerTextChange={setComposerText}
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
        </article>

        <aside className="border-l border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-4 xl:min-h-[calc(100vh-3.25rem)]">
          <div className="grid gap-4 xl:sticky xl:top-24 xl:self-start">
            <StudentSessionSummaryPanel
              conversation={conversation}
              feedbackMessage={completionError ?? completionMessage}
              isCompleting={isCompleting}
              languageCode={languageCode}
              onComplete={completeSession}
              summary={studentSummary}
            />

            <aside className="grid gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
              <div className="space-y-3">
                <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                  {copy.attachmentsEyebrow}
                </p>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                  {copy.attachmentsTitle}
                </h2>
              </div>

              <StudentAttachmentList
                attachments={attachments}
                disabled={isUploading || isReadOnly}
                languageCode={languageCode}
                onRetryExtraction={retryAttachmentExtraction}
              />
            </aside>
          </div>
        </aside>
      </section>
    </div>
  );
}
