"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { FormCallout } from "@/components/ui/form-callout";
import { FormField } from "@/components/ui/form-field";
import { SelectInput } from "@/components/ui/select-input";
import { TextInput } from "@/components/ui/text-input";
import {
  AI_LANGUAGE_OPTIONS,
  STUDENT_AGE_BAND_OPTIONS,
  UI_LANGUAGE_OPTIONS,
  UNDER_13_AGE_BAND_VALUES,
} from "@/lib/i18n/config";
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
      ? STUDENT_AGE_BAND_OPTIONS.filter(
          (option) =>
            option.value === "" || UNDER_13_AGE_BAND_VALUES.has(option.value),
        )
      : STUDENT_AGE_BAND_OPTIONS;

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
        <FormCallout variant="error">
          {errorMessage}
        </FormCallout>
      ) : null}

      {successMessage ? (
        <FormCallout variant="success">
          {successMessage}
        </FormCallout>
      ) : null}

      <FormField
        error={getFieldError(fieldErrors, "displayName")}
        label="Nom affiche"
      >
        <TextInput
          onChange={(event) => setDisplayName(event.target.value)}
          type="text"
          value={displayName}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          error={getFieldError(fieldErrors, "preferredUiLanguage")}
          label="Langue de l'interface"
        >
          <SelectInput
            onChange={(event) =>
              setPreferredUiLanguage(event.target.value as typeof appUser.preferred_ui_language)
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
          label="Langue de l'aide IA"
        >
          <SelectInput
            onChange={(event) =>
              setAiHelpLanguage(event.target.value as typeof appUser.ai_help_language)
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

      {appUser.role === "student" ? (
        <FormField
          error={getFieldError(fieldErrors, "ageBand")}
          label="Tranche d'age"
        >
          <SelectInput
            onChange={(event) => setAgeBand(event.target.value)}
            value={ageBand}
          >
            {ageBandOptions.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </FormField>
      ) : null}

      <ActionButton disabled={isPending} type="submit">
        {isPending ? "Mise a jour..." : "Enregistrer le profil"}
      </ActionButton>
    </form>
  );
}
