"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentReplyModeSwitch } from "@/components/dashboard/student/student-reply-mode-switch";
import { setPendingConversationBootstrap } from "@/lib/conversations/pending-bootstrap-store";
import {
  extractClipboardFiles,
  INTAKE_ACCEPT_ATTR,
  stageIntakeFiles,
  type StagedIntakeFile,
} from "@/lib/intake/intake-config";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { StudentReplyMode } from "@/lib/server/conversations/types";

type StudentSubjectQuickStartProps = {
  initialDraft?: string | null;
  subjectTag: string;
  languageCode: UiLanguageCode;
  existingConversationCount?: number;
};

type CreateConversationShellResponse =
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
      };
    };

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
        voice: "Voice input coming soon!",
        startError: "Unable to open the chat right now.",
      };
    case "zh":
      return {
        placeholder: "直接輸入你對這份作業的問題...",
        addSources: "加入檔案",
        attachmentsReady: (count: number) => `已準備 ${count} 個檔案`,
        submit: "開始聊天",
        sending: "正在開啟聊天...",
        voice: "語音輸入即將推出！",
        startError: "目前無法開啟聊天。",
      };
    default:
      return {
        placeholder: "Écris directement ta question sur ce devoir...",
        addSources: "Ajouter des fichiers",
        attachmentsReady: (count: number) =>
          `${count} fichier${count > 1 ? "s" : ""} prêt${count > 1 ? "s" : ""}`,
        submit: "Lancer le chat",
        sending: "Ouverture du chat...",
        voice: "Saisie vocale bientôt !",
        startError: "Impossible d'ouvrir le chat pour l'instant.",
      };
  }
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

export function StudentSubjectQuickStart({
  initialDraft = null,
  subjectTag,
  languageCode,
  existingConversationCount = 0,
}: StudentSubjectQuickStartProps) {
  const router = useRouter();
  const copy = getQuickStartCopy(languageCode);
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [stagedFiles, setStagedFiles] = useState<StagedIntakeFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [replyMode, setReplyMode] = useState<StudentReplyMode>("thinking");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(initialDraft ?? "");
  }, [initialDraft, subjectTag]);

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
      const conversationId =
        createPayload?.ok && createPayload.data?.conversationId
          ? createPayload.data.conversationId
          : null;

      if (!createResponse.ok || !conversationId) {
        setErrorMessage(
          getRouteErrorMessage(createPayload) ?? copy.startError,
        );
        return;
      }

      setPendingConversationBootstrap(conversationId, {
        promptText: trimmedDraft,
        stagedFiles: stagedFiles.map((file) => file.file),
        replyMode,
        subjectTag,
        createdAt: Date.now(),
      });
      setStagedFiles([]);
      setDraft("");
      router.push(
        `/app/conversations/${conversationId}?subject=${encodeURIComponent(subjectTag)}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : copy.startError,
      );
    } finally {
      setIsStarting(false);
    }
  }

  return (
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] focus:shadow-none focus-visible:shadow-none"
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
          aria-label={isStarting ? copy.sending : copy.submit}
          className="inline-flex h-8 w-8 items-center justify-center text-[color:var(--foreground)] transition hover:text-[color:var(--accent)] focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isStarting || draft.trim().length === 0}
          type="submit"
        >
          <SendIcon />
        </button>
      </div>

      {errorMessage ? (
        <p className="px-1 text-xs leading-5 text-[#c95f44]">{errorMessage}</p>
      ) : null}
    </form>
  );
}
