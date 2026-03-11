"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { INTAKE_ACCEPT_ATTR, stageIntakeFiles } from "@/lib/intake/intake-config";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { StudentAttachmentList } from "@/components/dashboard/student/student-attachment-list";
import { StudentChatThread } from "@/components/dashboard/student/student-chat-thread";
import { StudentConversationComposer } from "@/components/dashboard/student/student-conversation-composer";
import { StudentSessionSummaryPanel } from "@/components/dashboard/student/student-session-summary-panel";
import {
  StudentWorkspacePanel,
  type WorkspaceDraftState,
} from "@/components/dashboard/student/student-workspace-panel";
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
  const [conversation, setConversation] = useState(detail.conversation);
  const [messages, setMessages] = useState(detail.messages);
  const [attachments, setAttachments] = useState(detail.attachments);
  const [summaries, setSummaries] = useState(detail.summaries);
  const [workspace, setWorkspace] = useState<WorkspaceDraftState>(
    buildInitialWorkspace(detail),
  );
  const [composerText, setComposerText] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isUploading, startUploading] = useTransition();
  const [isCompleting, startCompleting] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isReadOnly = conversation.status !== "active";
  const studentSummary =
    summaries.find((summary) => summary.audience === "student") ?? null;

  async function sendMessage(intent: "student_message" | "hint" | "summarize") {
    setChatError(null);

    if (intent === "student_message" && composerText.trim().length === 0) {
      setChatError("Ajoute un message avant de l'envoyer.");
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
        setChatError(
          routeErrorMessage ?? "Impossible d'ajouter ce tour de conversation.",
        );
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
      throw new Error(
        routeErrorMessage ?? "Impossible de sauvegarder l'espace de travail.",
      );
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
        setWorkspaceMessage(
          "Piece jointe confirmee et texte extrait synchronise dans l'espace de travail.",
        );
        setWorkspaceError(null);
      } catch (error) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter cette piece jointe.",
        );
      }
    });
  }

  function saveWorkspace() {
    setWorkspaceError(null);
    setWorkspaceMessage(null);

    startSaving(async () => {
      try {
        await persistWorkspace(workspace);
        setWorkspaceMessage("Espace de travail sauvegarde.");
      } catch (error) {
        setWorkspaceError(
          error instanceof Error
            ? error.message
            : "Impossible de sauvegarder l'espace de travail.",
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
        setCompletionError(
          routeErrorMessage ?? "Impossible de terminer cette session.",
        );
        return;
      }

      setConversation(payload.data.conversation);
      setSummaries(payload.data.summaries ?? []);
      setCompletionMessage("Session terminee. Le resume eleve est maintenant fige.");
      setChatError(null);
      setWorkspaceError(null);
    });
  }

  function retryAttachmentExtraction(attachmentId: string) {
    setWorkspaceError(null);
    setWorkspaceMessage(null);

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
        setWorkspaceError(
          routeErrorMessage ?? "Impossible de relancer l'extraction.",
        );
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
      setWorkspaceMessage(
        payload.data.warningMessage ??
          "Extraction relancee. Pense a sauvegarder si le texte a change.",
      );
    });
  }

  return (
    <div className="grid gap-6">
      <input
        accept={INTAKE_ACCEPT_ATTR}
        className="hidden"
        multiple
        onChange={handleUploadReferencePick}
        ref={fileInputRef}
        type="file"
      />

      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.15fr_0.85fr]">
        <article className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill label={conversation.subject_tag} tone="accent" />
            <StudentStatusPill
              label={getConversationStatusLabel(conversation.status)}
            />
            <StudentStatusPill
              label={conversation.graded_homework ? "Notee" : "Exercice libre"}
            />
          </div>

          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Chat et espace de travail
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              {conversation.title}
            </h1>
            <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
              La session garde maintenant un transcript reel, des pieces jointes
              durables, un texte extrait revu, et un coaching IA centre sur la
              demarche.
            </p>
          </div>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">Reprise</p>
          <p className="text-[color:var(--ink-soft)]">
            Cree le {formatDateLabel(conversation.created_at, languageCode)}
          </p>
          <p className="text-[color:var(--ink-soft)]">
            Derniere activite le{" "}
            {formatDateLabel(
              messages.at(-1)?.created_at ??
                conversation.last_message_at ??
                conversation.created_at,
              languageCode,
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              href="/app/history"
            >
              Voir l&apos;historique
            </Link>
            <Link
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              href="/app/new"
            >
              Nouveau devoir
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:min-h-[calc(100vh-10rem)]">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Conversation
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              Transcript persiste et controls de coaching
            </h2>
          </div>

          <div className="grid gap-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <StudentChatThread languageCode={languageCode} messages={messages} />
            </div>

            <StudentConversationComposer
              composerText={composerText}
              disabled={isReadOnly}
              isSending={isSending || isUploading}
              onComposerTextChange={setComposerText}
              onRequestHint={() => sendMessage("hint")}
              onRequestSummary={() => sendMessage("summarize")}
              onSendMessage={() => sendMessage("student_message")}
              onUploadAttachments={() => fileInputRef.current?.click()}
            />

            {chatError ? (
              <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm leading-6 text-[#8d3b1f]">
                {chatError}
              </p>
            ) : null}

            {isUploading ? (
              <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                Upload et extraction en cours...
              </p>
            ) : null}

            {isReadOnly ? (
              <p className="rounded-[1.25rem] border border-[#cbbf8d] bg-[#fff8df] px-4 py-3 text-sm leading-6 text-[#69551b]">
                Cette session est terminee. Le transcript reste lisible, mais les
                nouvelles ecritures passent maintenant par une nouvelle session.
              </p>
            ) : null}
          </div>
        </article>

        <div className="grid gap-6">
          <StudentSessionSummaryPanel
            conversation={conversation}
            feedbackMessage={completionError ?? completionMessage}
            isCompleting={isCompleting}
            languageCode={languageCode}
            onComplete={completeSession}
            summary={studentSummary}
          />

          <aside className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                Pieces jointes
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                Fichiers prives et statut d&apos;extraction
              </h2>
            </div>

            <StudentAttachmentList
              attachments={attachments}
              disabled={isUploading || isReadOnly}
              onRetryExtraction={retryAttachmentExtraction}
            />
          </aside>

          <StudentWorkspacePanel
            disabled={isReadOnly}
            isSaving={isSaving || isUploading}
            onSaveWorkspace={saveWorkspace}
            onWorkspaceChange={setWorkspace}
            saveMessage={workspaceError ?? workspaceMessage}
            workspace={workspace}
          />
        </div>
      </section>
    </div>
  );
}
