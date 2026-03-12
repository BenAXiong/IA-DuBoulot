"use client";

import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { FormCallout } from "@/components/ui/form-callout";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { getTutorInviteFormCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type InviteResponsePayload = {
  ok?: boolean;
  data?: {
    inviteUrl?: string;
  };
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

type TutorInviteFormProps = {
  studentUserId?: string | null;
  languageCode?: UiLanguageCode;
};

export function TutorInviteForm({
  studentUserId = null,
  languageCode = "fr",
}: TutorInviteFormProps) {
  const copy = getTutorInviteFormCopy(languageCode);
  const [tutorEmail, setTutorEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function resetMessages() {
    setInviteUrl(null);
    setErrorMessage(null);
    setFieldErrors({});
  }

  function handleCopyInviteUrl() {
    if (!inviteUrl) {
      return;
    }

    void navigator.clipboard.writeText(inviteUrl);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    startTransition(async () => {
      const response = await fetch("/api/tutor/links", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          studentUserId,
          tutorEmail,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | InviteResponsePayload
        | null;

      if (!response.ok || !payload?.ok || !payload.data?.inviteUrl) {
        setErrorMessage(
          payload?.error?.message ?? copy.errorFallback,
        );
        setFieldErrors(payload?.error?.fieldErrors ?? {});
        return;
      }

      setInviteUrl(payload.data.inviteUrl);
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {copy.title}
        </h3>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.body}
        </p>
      </div>

      {errorMessage ? (
        <FormCallout variant="error">
          {errorMessage}
        </FormCallout>
      ) : null}

      <FormField
        error={getFieldError(fieldErrors, "tutorEmail")}
        label={copy.tutorEmail}
      >
        <TextInput
          onChange={(event) => setTutorEmail(event.target.value)}
          placeholder="tutor@example.com"
          required
          type="email"
          value={tutorEmail}
        />
      </FormField>

      <ActionButton disabled={isPending} type="submit">
        {isPending ? copy.buttons.pending : copy.buttons.submit}
      </ActionButton>

      {inviteUrl ? (
        <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-sm text-[color:var(--ink-soft)]">
            {copy.successBody}
          </p>
          <code className="overflow-x-auto rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--foreground)]">
            {inviteUrl}
          </code>
          <ActionButton
            className="justify-self-start px-4 py-2"
            onClick={handleCopyInviteUrl}
            type="button"
            variant="secondary"
          >
            {copy.buttons.copy}
          </ActionButton>
        </div>
      ) : null}
    </form>
  );
}
