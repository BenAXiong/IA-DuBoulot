"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type BootstrapErrorPayload = {
  ok?: false;
  error?: {
    message?: string;
    fieldErrors?: Record<string, string>;
  };
};

type OnboardingFormProps = {
  email: string | null;
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

export function OnboardingForm({ email }: OnboardingFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "parent" | "tutor">("student");
  const [displayName, setDisplayName] = useState("");
  const [preferredUiLanguage, setPreferredUiLanguage] = useState("fr");
  const [aiHelpLanguage, setAiHelpLanguage] = useState("fr");
  const [isUnder13, setIsUnder13] = useState(false);
  const [ageBand, setAgeBand] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const visibleAgeBandOptions = !isUnder13
    ? studentAgeBandOptions
    : studentAgeBandOptions.filter(
        (option) => option.value === "" || under13AgeBandValues.has(option.value),
      );

  function resetErrors() {
    setErrorMessage(null);
    setFieldErrors({});
  }

  function handleRoleChange(nextRole: "student" | "parent" | "tutor") {
    setRole(nextRole);

    if (nextRole !== "student") {
      setIsUnder13(false);
      setAgeBand("");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetErrors();

    startTransition(async () => {
      const response = await fetch("/api/auth/profile/bootstrap", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          role,
          displayName,
          preferredUiLanguage,
          aiHelpLanguage,
          isUnder13: role === "student" ? isUnder13 : false,
          ageBand: role === "student" && ageBand ? ageBand : null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | BootstrapErrorPayload
        | { ok?: true };
      const errorPayload = payload as BootstrapErrorPayload | null;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(
          errorPayload?.error?.message ?? "Impossible de finaliser le profil.",
        );
        setFieldErrors(errorPayload?.error?.fieldErrors ?? {});
        return;
      }

      router.push("/app");
      router.refresh();
    });
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
        <span className="font-medium text-[color:var(--foreground)]">
          Session connectee
        </span>
        <span>{email ?? "email indisponible"}</span>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm text-[#8d3b1f]">
          {errorMessage}
        </p>
      ) : null}

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Role</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              value: "student" as const,
              title: "Eleve",
              body: "Flux principal d'aide aux devoirs et espace de travail.",
            },
            {
              value: "parent" as const,
              title: "Parent",
              body: "Vision sur les sessions et supervision de l'enfant.",
            },
            {
              value: "tutor" as const,
              title: "Tuteur",
              body: "Acces supervise pour suivi pedagogique cible.",
            },
          ].map((option) => (
            <button
              className={`rounded-[1.5rem] border p-4 text-left transition ${
                role === option.value
                  ? "border-[color:var(--accent)] bg-[#fff1e8]"
                  : "border-[color:var(--line)] bg-white/70"
              }`}
              key={option.value}
              onClick={() => handleRoleChange(option.value)}
              type="button"
            >
              <p className="font-[family-name:var(--font-heading)] text-lg">
                {option.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                {option.body}
              </p>
            </button>
          ))}
        </div>
        {getFieldError(fieldErrors, "role") ? (
          <p className="text-sm text-[#8d3b1f]">
            {getFieldError(fieldErrors, "role")}
          </p>
        ) : null}
      </fieldset>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Nom affiche</span>
        <input
          className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Ex: Lea Martin"
          required
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
            onChange={(event) => setPreferredUiLanguage(event.target.value)}
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
            onChange={(event) => setAiHelpLanguage(event.target.value)}
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

      {role === "student" ? (
        <section className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          <label className="inline-flex items-center gap-3 text-sm">
            <input
              checked={isUnder13}
              onChange={(event) => {
                const nextValue = event.target.checked;
                setIsUnder13(nextValue);

                if (!nextValue && under13AgeBandValues.has(ageBand)) {
                  return;
                }

                if (nextValue && ageBand && !under13AgeBandValues.has(ageBand)) {
                  setAgeBand("");
                }
              }}
              type="checkbox"
            />
            <span>Compte eleve de moins de 13 ans</span>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Tranche d&apos;age</span>
            <select
              className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              onChange={(event) => setAgeBand(event.target.value)}
              value={ageBand}
            >
              {visibleAgeBandOptions.map((option) => (
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

          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {isUnder13
              ? "Le compte restera en attente d'approbation parentale apres bootstrap."
              : "Les comptes eleve de 13 ans et plus restent actifs immediatement dans la baseline MVP."}
          </p>
        </section>
      ) : null}

      <button
        className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creation du profil..." : "Finaliser le profil"}
      </button>
    </form>
  );
}
