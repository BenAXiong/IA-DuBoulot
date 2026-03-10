"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  formatBytes,
  INTAKE_ACCEPT_ATTR,
  stageIntakeFiles,
} from "@/lib/intake/intake-config";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { StudentChatThread } from "@/components/dashboard/student/student-chat-thread";
import { StudentConversationComposer } from "@/components/dashboard/student/student-conversation-composer";
import { StudentSessionSummaryPanel } from "@/components/dashboard/student/student-session-summary-panel";
import {
  StudentWorkspacePanel,
  type WorkspaceDraftState,
} from "@/components/dashboard/student/student-workspace-panel";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ConversationDetail,
  ConversationMessageRecord,
  ConversationRecord,
  SessionSummaryRecord,
} from "@/lib/server/conversations/types";

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

  function appendUploadReferencesToWorkspace(files: File[]) {
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

    const lines = staged.acceptedFiles.map((file) => {
      const kindLabel = file.category === "pdf" ? "PDF" : "image/capture";
      return `- ${file.file.name} (${kindLabel}, ${formatBytes(file.file.size)})`;
    });
    const block = [
      "References ajoutees depuis la session:",
      ...lines,
    ].join("\n");

    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      studentNotes: currentWorkspace.studentNotes.trim().length > 0
        ? `${currentWorkspace.studentNotes.trim()}\n\n${block}`
        : block,
    }));
    setWorkspaceMessage(
      "References de fichiers ajoutees dans les notes. Sauvegarde l'espace pour les rendre durables.",
    );
    setWorkspaceError(null);
  }

  function handleUploadReferencePick(event: React.ChangeEvent<HTMLInputElement>) {
    appendUploadReferencesToWorkspace(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function saveWorkspace() {
    setWorkspaceError(null);
    setWorkspaceMessage(null);

    startSaving(async () => {
      const response = await fetch(
        `/api/conversations/${conversation.id}/workspace`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(workspace),
        },
      );

      const payload = (await response
        .json()
        .catch(() => null)) as WorkspaceRouteResponse | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (!response.ok || !payload?.ok || !payload.data?.workspace) {
        setWorkspaceError(
          routeErrorMessage ?? "Impossible de sauvegarder l'espace de travail.",
        );
        return;
      }

      setWorkspace({
        assignmentText: payload.data.workspace.assignment_text ?? "",
        editedExtractedText: payload.data.workspace.edited_extracted_text ?? "",
        planText: payload.data.workspace.plan_text ?? "",
        draftAnswerText: payload.data.workspace.draft_answer_text ?? "",
        studentNotes: payload.data.workspace.student_notes ?? "",
      });
      setWorkspaceMessage("Espace de travail sauvegarde.");
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
              La session garde maintenant un transcript reel, des actions
              d&apos;indice et de resume, puis une vraie cloture avec resume
              persiste avant l&apos;arrivee du moteur IA.
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
              isSending={isSending}
              onComposerTextChange={setComposerText}
              onRequestHint={() => sendMessage("hint")}
              onRequestSummary={() => sendMessage("summarize")}
              onSendMessage={() => sendMessage("student_message")}
              onUploadReferences={() => fileInputRef.current?.click()}
            />

            {chatError ? (
              <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm leading-6 text-[#8d3b1f]">
                {chatError}
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

          <StudentWorkspacePanel
            disabled={isReadOnly}
            isSaving={isSaving}
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
