"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppUserRecord } from "@/lib/server/auth/types";

type ProfileErrorPayload = {
  ok?: false;
  error?: {
    message?: string;
    fieldErrors?: Record<string, string>;
  };
};

type AccountSettingsFormProps = {
  appUser: AppUserRecord;
};

const uiLanguageOptions = [
  { value: "fr", label: "Francais" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
] as const;

const aiLanguageOptions = [
  { value: "fr", label: "Francais" },
  { value: "en", label: "English" },
] as const;

const studentAgeBandOptions = [
  { value: "", label: "Selectionner une tranche d'age" },
  { value: "six_eight", label: "6-8 ans" },
  { value: "nine_ten", label: "9-10 ans" },
  { value: "eleven_twelve", label: "11-12 ans" },
  { value: "thirteen_fifteen", label: "13-15 ans" },
  { value: "sixteen_eighteen", label: "16-18 ans" },
] as const;

const under13AgeBandValues = new Set([
  "six_eight",
  "nine_ten",
  "eleven_twelve",
]);

function getFieldError(
  fieldErrors: Record<string, string>,
  fieldName: string,
) {
  return fieldErrors[fieldName] ?? null;
}

export function AccountSettingsForm({ appUser }: AccountSettingsFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(appUser.display_name);
  const [preferredUiLanguage, setPreferredUiLanguage] = useState(
    appUser.preferred_ui_language,
  );
  const [aiHelpLanguage, setAiHelpLanguage] = useState(appUser.ai_help_language);
  const [ageBand, setAgeBand] = useState(appUser.age_band ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ageBandOptions =
    appUser.role === "student" && appUser.is_under_13
      ? studentAgeBandOptions.filter(
          (option) =>
            option.value === "" || under13AgeBandValues.has(option.value),
        )
      : studentAgeBandOptions;

  function resetMessages() {
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    startTransition(async () => {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          preferredUiLanguage,
          aiHelpLanguage,
          ageBand: appUser.role === "student" && ageBand ? ageBand : null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ProfileErrorPayload
        | { ok?: true };
      const errorPayload = payload as ProfileErrorPayload | null;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(
          errorPayload?.error?.message ?? "Impossible de mettre le profil a jour.",
        );
        setFieldErrors(errorPayload?.error?.fieldErrors ?? {});
        return;
      }

      setSuccessMessage("Profil mis a jour.");
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {errorMessage ? (
        <p className="rounded-2xl border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm text-[#8d3b1f]">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-2xl border border-[#8cb88b] bg-[#eef8ee] px-4 py-3 text-sm text-[#295a2a]">
          {successMessage}
        </p>
      ) : null}

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Nom affiche</span>
        <input
          className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          onChange={(event) => setDisplayName(event.target.value)}
          type="text"
          value={displayName}
        />
        {getFieldError(fieldErrors, "displayName") ? (
          <span className="text-[#8d3b1f]">
            {getFieldError(fieldErrors, "displayName")}
          </span>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Langue de l&apos;interface</span>
          <select
            className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) =>
              setPreferredUiLanguage(event.target.value as typeof appUser.preferred_ui_language)
            }
            value={preferredUiLanguage}
          >
            {uiLanguageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {getFieldError(fieldErrors, "preferredUiLanguage") ? (
            <span className="text-[#8d3b1f]">
              {getFieldError(fieldErrors, "preferredUiLanguage")}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Langue de l&apos;aide IA</span>
          <select
            className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) =>
              setAiHelpLanguage(event.target.value as typeof appUser.ai_help_language)
            }
            value={aiHelpLanguage}
          >
            {aiLanguageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {getFieldError(fieldErrors, "aiHelpLanguage") ? (
            <span className="text-[#8d3b1f]">
              {getFieldError(fieldErrors, "aiHelpLanguage")}
            </span>
          ) : null}
        </label>
      </div>

      {appUser.role === "student" ? (
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Tranche d&apos;age</span>
          <select
            className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) => setAgeBand(event.target.value)}
            value={ageBand}
          >
            {ageBandOptions.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {getFieldError(fieldErrors, "ageBand") ? (
            <span className="text-[#8d3b1f]">
              {getFieldError(fieldErrors, "ageBand")}
            </span>
          ) : null}
        </label>
      ) : null}

      <button
        className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Mise a jour..." : "Enregistrer le profil"}
      </button>
    </form>
  );
}
