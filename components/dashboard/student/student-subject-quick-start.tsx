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
        addSources: "Add sources",
        submit: "Start chat",
        voice: "Voice input coming later",
      };
    case "zh":
      return {
        placeholder: "直接輸入你對這份作業的問題...",
        addSources: "加入來源",
        submit: "開始聊天",
        voice: "語音輸入之後再加入",
      };
    default:
      return {
        placeholder: "Écris directement ta question sur ce devoir...",
        addSources: "Ajouter des sources",
        submit: "Lancer le chat",
        voice: "Saisie vocale plus tard",
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

  function openSourceRoute() {
    router.push(`/app/new?subject=${encodeURIComponent(subjectTag)}`);
  }

  return (
    <form
      className="grid gap-3 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4"
      onSubmit={handleSubmit}
    >
      <textarea
        className="min-h-28 resize-none bg-transparent px-2 pt-2 text-sm leading-7 outline-none placeholder:text-[color:var(--ink-soft)]"
        onChange={(event) => setDraft(event.target.value)}
        placeholder={copy.placeholder}
        value={draft}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            aria-label={copy.addSources}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] transition hover:-translate-y-0.5"
            onClick={openSourceRoute}
            title={copy.addSources}
            type="button"
          >
            <PlusIcon />
          </button>
          <button
            aria-label={copy.voice}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--ink-soft)]"
            disabled
            title={copy.voice}
            type="button"
          >
            <MicIcon />
          </button>
        </div>

        <button
          aria-label={copy.submit}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--foreground)] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={draft.trim().length === 0}
          type="submit"
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
}
