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
  UI_LANGUAGE_OPTIONS,
  UNDER_13_AGE_BAND_VALUES,
  getStudentAgeBandOptions,
} from "@/lib/i18n/config";
import { APP_UI_LANGUAGE_COOKIE_NAME } from "@/lib/i18n/ui-language";
import { getAccountSettingsFormCopy } from "@/lib/i18n/ui-copy";
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
  const copy = getAccountSettingsFormCopy(appUser.preferred_ui_language);
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
      ? getStudentAgeBandOptions(appUser.preferred_ui_language).filter(
          (option) =>
            option.value === "" || UNDER_13_AGE_BAND_VALUES.has(option.value),
        )
      : getStudentAgeBandOptions(appUser.preferred_ui_language);

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
        setErrorMessage(errorPayload?.error?.message ?? copy.errorFallback);
        setFieldErrors(errorPayload?.error?.fieldErrors ?? {});
        return;
      }

      document.documentElement.lang = preferredUiLanguage;
      document.documentElement.dataset.uiLanguage = preferredUiLanguage;
      document.cookie = `${APP_UI_LANGUAGE_COOKIE_NAME}=${preferredUiLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`;
      setSuccessMessage(copy.success);
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {errorMessage ? <FormCallout variant="error">{errorMessage}</FormCallout> : null}

      {successMessage ? (
        <FormCallout variant="success">{successMessage}</FormCallout>
      ) : null}

      <FormField
        error={getFieldError(fieldErrors, "displayName")}
        label={copy.fields.displayName}
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
          label={copy.fields.uiLanguage}
        >
          <SelectInput
            onChange={(event) =>
              setPreferredUiLanguage(
                event.target.value as typeof appUser.preferred_ui_language,
              )
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
              setAiHelpLanguage(
                event.target.value as typeof appUser.ai_help_language,
              )
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
          label={copy.fields.ageBand}
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
        {isPending ? copy.buttons.pending : copy.buttons.submit}
      </ActionButton>
    </form>
  );
}
