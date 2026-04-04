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
        placeholder: "What do you need help with in this subject?",
        submit: "Start chat",
      };
    case "zh":
      return {
        placeholder: "你在這個科目裡需要什麼幫助？",
        submit: "開始聊天",
      };
    default:
      return {
        placeholder: "Sur quoi as-tu besoin d'aide dans cette matière ?",
        submit: "Lancer le chat",
      };
  }
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
      className="grid gap-3"
      onSubmit={handleSubmit}
    >
      <textarea
        className="min-h-32 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-4 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
        onChange={(event) => setDraft(event.target.value)}
        placeholder={copy.placeholder}
        value={draft}
      />

      <div className="flex justify-end">
        <button
          className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
          type="submit"
        >
          {copy.submit}
        </button>
      </div>
    </form>
  );
}
