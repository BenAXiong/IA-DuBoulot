"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { FormCallout } from "@/components/ui/form-callout";
import { FormField } from "@/components/ui/form-field";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import {
  AI_LANGUAGE_CODES,
  AI_LANGUAGE_OPTIONS,
  UI_LANGUAGE_OPTIONS,
  UNDER_13_AGE_BAND_VALUES,
  getStudentAgeBandOptions,
} from "@/lib/i18n/config";
import { getOnboardingFormCopy } from "@/lib/i18n/ui-copy";
import { withUiLanguage } from "@/lib/i18n/ui-language";
import type {
  AiLanguageCode,
  UiLanguageCode,
} from "@/lib/server/auth/types";

type BootstrapErrorPayload = {
  ok?: false;
  error?: {
    message?: string;
    fieldErrors?: Record<string, string>;
  };
};

type OnboardingFormProps = {
  email: string | null;
  defaultRole?: "student" | "parent" | "tutor";
  inviteToken?: string | null;
  initialPreferredUiLanguage: UiLanguageCode;
  languageCode: UiLanguageCode;
};

function getFieldError(
  fieldErrors: Record<string, string>,
  fieldName: string,
) {
  return fieldErrors[fieldName] ?? null;
}

function resolveInitialAiHelpLanguage(
  initialPreferredUiLanguage: UiLanguageCode,
): AiLanguageCode {
  if (AI_LANGUAGE_CODES.includes(initialPreferredUiLanguage as AiLanguageCode)) {
    return initialPreferredUiLanguage as AiLanguageCode;
  }

  return "fr";
}

export function OnboardingForm({
  email,
  defaultRole = "student",
  inviteToken = null,
  initialPreferredUiLanguage,
  languageCode,
}: OnboardingFormProps) {
  const router = useRouter();
  const copy = getOnboardingFormCopy(languageCode);
  const [role, setRole] = useState<"student" | "parent" | "tutor">(defaultRole);
  const [displayName, setDisplayName] = useState("");
  const [preferredUiLanguage, setPreferredUiLanguage] = useState<UiLanguageCode>(
    initialPreferredUiLanguage,
  );
  const [aiHelpLanguage, setAiHelpLanguage] = useState<AiLanguageCode>(
    resolveInitialAiHelpLanguage(initialPreferredUiLanguage),
  );
  const [isUnder13, setIsUnder13] = useState(false);
  const [ageBand, setAgeBand] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const ageBandOptions = getStudentAgeBandOptions(languageCode);
  const visibleAgeBandOptions = !isUnder13
    ? ageBandOptions
    : ageBandOptions.filter(
        (option) =>
          option.value === "" || UNDER_13_AGE_BAND_VALUES.has(option.value),
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
        setErrorMessage(errorPayload?.error?.message ?? copy.errorFallback);
        setFieldErrors(errorPayload?.error?.fieldErrors ?? {});
        return;
      }

      router.push(
        withUiLanguage(inviteToken ? `/invite/${inviteToken}` : "/app", languageCode),
      );
      router.refresh();
    });
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
        <span className="font-medium text-[color:var(--foreground)]">
          {copy.connectedSession}
        </span>
        <span>{email ?? copy.emailUnavailable}</span>
      </div>

      {errorMessage ? <FormCallout variant="error">{errorMessage}</FormCallout> : null}

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{copy.roleLegend}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {copy.roles.map((option) => (
            <button
              className={`rounded-[1.5rem] border p-4 text-left transition ${
                role === option.value
                  ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)]"
                  : "border-[color:var(--line)] bg-[color:var(--surface-raised)]"
              }`}
              key={option.value}
              onClick={() =>
                handleRoleChange(option.value as "student" | "parent" | "tutor")
              }
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
          <p className="text-sm text-[color:var(--error-ink)]">
            {getFieldError(fieldErrors, "role")}
          </p>
        ) : null}
      </fieldset>

      <FormField
        error={getFieldError(fieldErrors, "displayName")}
        label={copy.fields.displayName}
      >
        <TextInput
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={copy.displayNamePlaceholder}
          required
          type="text"
          value={displayName}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          error={getFieldError(fieldErrors, "preferredUiLanguage")}
          label={copy.fields.uiLanguage}
        >
          <SelectInput
            onChange={(event) =>
              setPreferredUiLanguage(event.target.value as UiLanguageCode)
            }
            value={preferredUiLanguage}
          >
            {UI_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField
          error={getFieldError(fieldErrors, "aiHelpLanguage")}
          label={copy.fields.aiLanguage}
        >
          <SelectInput
            onChange={(event) =>
              setAiHelpLanguage(event.target.value as AiLanguageCode)
            }
            value={aiHelpLanguage}
          >
            {AI_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </div>

      {role === "student" ? (
        <section className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          <label className="inline-flex items-center gap-3 text-sm">
            <input
              checked={isUnder13}
              onChange={(event) => {
                const nextValue = event.target.checked;
                setIsUnder13(nextValue);

                if (!nextValue && UNDER_13_AGE_BAND_VALUES.has(ageBand)) {
                  return;
                }

                if (
                  nextValue &&
                  ageBand &&
                  !UNDER_13_AGE_BAND_VALUES.has(ageBand)
                ) {
                  setAgeBand("");
                }
              }}
              type="checkbox"
            />
            <span>{copy.under13Label}</span>
          </label>

          <FormField
            error={getFieldError(fieldErrors, "ageBand")}
            label={copy.fields.ageBand}
          >
            <SelectInput
              onChange={(event) => setAgeBand(event.target.value)}
              value={ageBand}
            >
              {visibleAgeBandOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {isUnder13
              ? copy.studentStatus.under13
              : copy.studentStatus.default}
          </p>
        </section>
      ) : null}

      <ActionButton disabled={isPending} type="submit">
        {isPending ? copy.buttons.pending : copy.buttons.submit}
      </ActionButton>
    </form>
  );
}
