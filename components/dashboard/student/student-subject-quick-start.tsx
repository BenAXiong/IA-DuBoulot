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
        title: "Start from this subject",
        body:
          "Write the problem in your own words, then continue straight into a new discussion for this subject.",
        placeholder: "What do you need help with in this subject?",
        submit: "Continue",
      };
    case "zh":
      return {
        title: "從這個科目開始",
        body: "先用自己的話寫下問題，然後直接在這個科目裡開始新的討論。",
        placeholder: "你在這個科目裡需要什麼幫助？",
        submit: "繼續",
      };
    default:
      return {
        title: "Partir de cette matière",
        body:
          "Écris le problème avec tes mots, puis enchaîne directement vers une nouvelle discussion pour cette matière.",
        placeholder: "Sur quoi as-tu besoin d'aide dans cette matière ?",
        submit: "Continuer",
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
      className="grid gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium">{copy.title}</p>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.body}
        </p>
      </div>

      <textarea
        className="min-h-28 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
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
