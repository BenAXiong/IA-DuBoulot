"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/action-button";
import { FormCallout } from "@/components/ui/form-callout";
import { FormField } from "@/components/ui/form-field";
import { SelectInput } from "@/components/ui/select-input";
import { SurfaceCard } from "@/components/ui/surface-card";
import { TextInput } from "@/components/ui/text-input";
import {
  AI_LANGUAGE_OPTIONS,
  UI_LANGUAGE_OPTIONS,
  getStudentAgeBandOptions,
} from "@/lib/i18n/config";
import { getParentDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { AiLanguageCode, UiLanguageCode } from "@/lib/server/auth/types";

type ParentCreateLearnerPanelProps = {
  defaultAiHelpLanguage: AiLanguageCode;
  defaultUiLanguage: UiLanguageCode;
  languageCode: UiLanguageCode;
};

type CreateLearnerErrorPayload = {
  ok?: false;
  error?: {
    message?: string;
    fieldErrors?: Record<string, string>;
  };
};

function getFieldError(
  fieldErrors: Record<string, string>,
  fieldName: string,
) {
  return fieldErrors[fieldName] ?? null;
}

export function ParentCreateLearnerPanel({
  defaultAiHelpLanguage,
  defaultUiLanguage,
  languageCode,
}: ParentCreateLearnerPanelProps) {
  const router = useRouter();
  const copy = getParentDashboardCopy(languageCode).createLearner;
  const ageBandOptions = getStudentAgeBandOptions(languageCode).filter(
    (option) => option.value !== "",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [ageBand, setAgeBand] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [preferredUiLanguage, setPreferredUiLanguage] =
    useState<UiLanguageCode>(defaultUiLanguage);
  const [aiHelpLanguage, setAiHelpLanguage] =
    useState<AiLanguageCode>(defaultAiHelpLanguage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function resetMessages() {
    setErrorMessage(null);
    setFieldErrors({});
  }

  function resetForm() {
    setDisplayName("");
    setLearnerEmail("");
    setTemporaryPassword("");
    setAgeBand("");
    setRelationshipLabel("");
    setPreferredUiLanguage(defaultUiLanguage);
    setAiHelpLanguage(defaultAiHelpLanguage);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    startTransition(async () => {
      const response = await fetch("/api/parent/students", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          learnerEmail,
          temporaryPassword,
          ageBand,
          relationshipLabel: relationshipLabel.trim() || null,
          preferredUiLanguage,
          aiHelpLanguage,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | CreateLearnerErrorPayload
        | { ok?: true };
      const errorPayload = payload as CreateLearnerErrorPayload | null;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(errorPayload?.error?.message ?? null);
        setFieldErrors(errorPayload?.error?.fieldErrors ?? {});
        return;
      }

      resetForm();
      setIsExpanded(false);
      router.refresh();
    });
  }

  return (
    <SurfaceCard className="grid gap-4 p-4 sm:p-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {copy.title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.body}
        </p>
      </div>

      {!isExpanded ? (
        <ActionButton
          className="justify-center"
          onClick={() => {
            resetMessages();
            setIsExpanded(true);
          }}
          type="button"
        >
          {copy.open}
        </ActionButton>
      ) : (
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {errorMessage ? (
            <FormCallout variant="error">{errorMessage}</FormCallout>
          ) : null}

          <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.helper}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={getFieldError(fieldErrors, "displayName")}
              label={copy.fields.displayName}
            >
              <TextInput
                onChange={(event) => setDisplayName(event.target.value)}
                required
                type="text"
                value={displayName}
              />
            </FormField>

            <FormField
              error={getFieldError(fieldErrors, "ageBand")}
              label={copy.fields.ageBand}
            >
              <SelectInput
                onChange={(event) => setAgeBand(event.target.value)}
                required
                value={ageBand}
              >
                <option value="" />
                {ageBandOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={getFieldError(fieldErrors, "learnerEmail")}
              label={copy.fields.learnerEmail}
            >
              <TextInput
                onChange={(event) => setLearnerEmail(event.target.value)}
                placeholder={copy.placeholders.learnerEmail}
                required
                type="email"
                value={learnerEmail}
              />
            </FormField>

            <FormField
              error={getFieldError(fieldErrors, "temporaryPassword")}
              label={copy.fields.temporaryPassword}
            >
              <TextInput
                minLength={8}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                placeholder={copy.placeholders.temporaryPassword}
                required
                type="password"
                value={temporaryPassword}
              />
            </FormField>
          </div>

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

          <FormField
            error={getFieldError(fieldErrors, "relationshipLabel")}
            label={copy.fields.relationshipLabel}
          >
            <TextInput
              onChange={(event) => setRelationshipLabel(event.target.value)}
              placeholder={copy.placeholders.relationshipLabel}
              type="text"
              value={relationshipLabel}
            />
          </FormField>

          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton
              className="justify-center"
              disabled={isPending}
              type="submit"
            >
              {isPending ? copy.pending : copy.create}
            </ActionButton>
            <ActionButton
              className="justify-center"
              onClick={() => {
                resetMessages();
                setIsExpanded(false);
              }}
              type="button"
              variant="secondary"
            >
              {copy.close}
            </ActionButton>
          </div>
        </form>
      )}
    </SurfaceCard>
  );
}
