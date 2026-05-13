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

function calculateAge(birthDate: string) {
  const parsed = new Date(`${birthDate}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getUTCFullYear() - parsed.getUTCFullYear();
  const hasHadBirthday =
    now.getUTCMonth() > parsed.getUTCMonth() ||
    (now.getUTCMonth() === parsed.getUTCMonth() &&
      now.getUTCDate() >= parsed.getUTCDate());

  if (!hasHadBirthday) {
    age -= 1;
  }

  return age;
}

export function OnboardingForm({
  defaultRole = "student",
  inviteToken = null,
  initialPreferredUiLanguage,
  languageCode,
}: OnboardingFormProps) {
  const router = useRouter();
  const copy = getOnboardingFormCopy(languageCode);
  const role = defaultRole;
  const [displayName, setDisplayName] = useState("");
  const [preferredUiLanguage, setPreferredUiLanguage] = useState<UiLanguageCode>(
    initialPreferredUiLanguage,
  );
  const [aiHelpLanguage, setAiHelpLanguage] = useState<AiLanguageCode>(
    resolveInitialAiHelpLanguage(initialPreferredUiLanguage),
  );
  const [birthDate, setBirthDate] = useState("");
  const [countryOfStudy, setCountryOfStudy] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const age = birthDate ? calculateAge(birthDate) : null;
  const isUnder13 = role === "student" && age !== null && age < 13;

  function resetErrors() {
    setErrorMessage(null);
    setFieldErrors({});
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
          birthDate: role === "student" ? birthDate : null,
          countryOfStudy: role === "student" ? countryOfStudy : null,
          schoolName: role === "student" ? schoolName : null,
          gradeLevel: role === "student" ? gradeLevel : null,
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
      {errorMessage ? <FormCallout variant="error">{errorMessage}</FormCallout> : null}

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

      {role === "student" ? (
        <>
          <FormField
            error={getFieldError(fieldErrors, "birthDate")}
            label={copy.fields.birthDate}
          >
            <TextInput
              onChange={(event) => setBirthDate(event.target.value)}
              required
              type="date"
              value={birthDate}
            />
          </FormField>

          <FormField
            error={getFieldError(fieldErrors, "countryOfStudy")}
            label={copy.fields.countryOfStudy}
          >
            <TextInput
              onChange={(event) => setCountryOfStudy(event.target.value)}
              placeholder={copy.countryPlaceholder}
              required
              type="text"
              value={countryOfStudy}
            />
          </FormField>

          <FormField
            error={getFieldError(fieldErrors, "schoolName")}
            label={copy.fields.schoolName}
          >
            <TextInput
              onChange={(event) => setSchoolName(event.target.value)}
              placeholder={copy.schoolPlaceholder}
              type="text"
              value={schoolName}
            />
          </FormField>

          <FormField
            error={getFieldError(fieldErrors, "gradeLevel")}
            label={copy.fields.gradeLevel}
          >
            <TextInput
              onChange={(event) => setGradeLevel(event.target.value)}
              placeholder={copy.gradePlaceholder}
              required
              type="text"
              value={gradeLevel}
            />
          </FormField>

          {birthDate ? (
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {isUnder13
                ? copy.studentStatus.under13
                : copy.studentStatus.default}
            </p>
          ) : null}
        </>
      ) : null}

      <ActionButton disabled={isPending} type="submit">
        {isPending ? copy.buttons.pending : copy.buttons.submit}
      </ActionButton>
    </form>
  );
}
