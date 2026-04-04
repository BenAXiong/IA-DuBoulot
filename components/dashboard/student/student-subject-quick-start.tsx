"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type StudentSubjectQuickStartProps = {
  subjectTag: string;
  languageCode: UiLanguageCode;
};

function getQuickStartCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return {
        placeholder: "Ask anything about this homework...",
        addSources: "File uploads open once the chat starts",
        submit: "Start chat",
        voice: "Voice input coming soon!",
      };
    case "zh":
      return {
        placeholder: "直接輸入你對這份作業的問題...",
        addSources: "開始聊天後才能加入檔案",
        submit: "開始聊天",
        voice: "語音輸入即將推出！",
      };
    default:
      return {
        placeholder: "Écris directement ta question sur ce devoir...",
        addSources: "Les fichiers s'ajoutent une fois le chat lancé",
        submit: "Lancer le chat",
        voice: "Saisie vocale bientôt !",
      };
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

export function StudentSubjectQuickStart({
  subjectTag,
  languageCode,
}: StudentSubjectQuickStartProps) {
  const router = useRouter();
  const copy = getQuickStartCopy(languageCode);
  const [draft, setDraft] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({
      subject: subjectTag,
    });

    if (draft.trim().length > 0) {
      params.set("draft", draft.trim());
    }

    router.push(`/app/new?${params.toString()}`);
  }

  return (
    <form
      className="grid gap-2 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-3"
      onSubmit={handleSubmit}
    >
      <textarea
        className="min-h-14 resize-none bg-transparent px-1.5 pt-1 text-sm leading-6 outline-none placeholder:text-[color:var(--ink-soft)]"
        onChange={(event) => setDraft(event.target.value)}
        placeholder={copy.placeholder}
        value={draft}
      />

      <div className="flex items-center justify-between gap-3 px-1 py-0.5">
        <div className="flex items-center gap-2">
          <button
            aria-label={copy.addSources}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled
            title={copy.addSources}
            type="button"
          >
            <PlusIcon />
          </button>
          <button
            aria-label={copy.voice}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)]"
            disabled
            title={copy.voice}
            type="button"
          >
            <MicIcon />
          </button>
        </div>

        <button
          aria-label={copy.submit}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--foreground)] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={draft.trim().length === 0}
          type="submit"
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
}
