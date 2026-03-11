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

export function ParentApprovalRequestForm() {
  const [parentEmail, setParentEmail] = useState("");
  const [relationshipLabel, setRelationshipLabel] = useState("Parent");
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
      const response = await fetch("/api/auth/parent-approval/request", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          parentEmail,
          relationshipLabel,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | InviteResponsePayload
        | null;

      if (!response.ok || !payload?.ok || !payload.data?.inviteUrl) {
        setErrorMessage(
          payload?.error?.message ??
            "Impossible de preparer le lien d'approbation parentale.",
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
          Demander l&apos;approbation parentale
        </h3>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          Cree un lien d&apos;invitation parent. En attendant un vrai service d&apos;envoi,
          le lien peut etre copie puis partage manuellement.
        </p>
      </div>

      {errorMessage ? (
        <FormCallout variant="error">
          {errorMessage}
        </FormCallout>
      ) : null}

      <FormField
        error={getFieldError(fieldErrors, "parentEmail")}
        label="Email du parent ou tuteur legal"
      >
        <TextInput
          onChange={(event) => setParentEmail(event.target.value)}
          placeholder="parent@example.com"
          required
          type="email"
          value={parentEmail}
        />
      </FormField>

      <FormField
        error={getFieldError(fieldErrors, "relationshipLabel")}
        label="Etiquette de relation"
      >
        <TextInput
          onChange={(event) => setRelationshipLabel(event.target.value)}
          placeholder="Parent"
          type="text"
          value={relationshipLabel}
        />
      </FormField>

      <ActionButton disabled={isPending} type="submit">
        {isPending ? "Preparation..." : "Generer le lien parent"}
      </ActionButton>

      {inviteUrl ? (
        <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-sm text-[color:var(--ink-soft)]">
            Lien pret. Partage-le avec le parent pour qu&apos;il cree ou connecte
            son compte, puis accepte l&apos;invitation.
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
