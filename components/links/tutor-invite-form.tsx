"use client";

import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { FormCallout } from "@/components/ui/form-callout";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";

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
};

export function TutorInviteForm({
  studentUserId = null,
}: TutorInviteFormProps) {
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
          payload?.error?.message ?? "Impossible de preparer le lien tuteur.",
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
          Inviter un tuteur
        </h3>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          Ce flux cree un lien de tutorat traçable. Pour l&apos;instant, le lien
          est partage manuellement plutot qu&apos;envoye par email depuis le produit.
        </p>
      </div>

      {errorMessage ? (
        <FormCallout variant="error">
          {errorMessage}
        </FormCallout>
      ) : null}

      <FormField
        error={getFieldError(fieldErrors, "tutorEmail")}
        label="Email du tuteur"
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
        {isPending ? "Preparation..." : "Generer le lien tuteur"}
      </ActionButton>

      {inviteUrl ? (
        <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-sm text-[color:var(--ink-soft)]">
            Lien pret. Le tuteur devra creer ou connecter son compte, terminer
            son onboarding si besoin, puis accepter l&apos;invitation.
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
            Copier le lien
          </ActionButton>
        </div>
      ) : null}
    </form>
  );
}
