"use client";

import { useState, useTransition } from "react";

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
        <p className="rounded-2xl border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm text-[#8d3b1f]">
          {errorMessage}
        </p>
      ) : null}

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Email du parent ou tuteur legal</span>
        <input
          className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          onChange={(event) => setParentEmail(event.target.value)}
          placeholder="parent@example.com"
          required
          type="email"
          value={parentEmail}
        />
        {getFieldError(fieldErrors, "parentEmail") ? (
          <span className="text-[#8d3b1f]">
            {getFieldError(fieldErrors, "parentEmail")}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Etiquette de relation</span>
        <input
          className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          onChange={(event) => setRelationshipLabel(event.target.value)}
          placeholder="Parent"
          type="text"
          value={relationshipLabel}
        />
        {getFieldError(fieldErrors, "relationshipLabel") ? (
          <span className="text-[#8d3b1f]">
            {getFieldError(fieldErrors, "relationshipLabel")}
          </span>
        ) : null}
      </label>

      <button
        className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Preparation..." : "Generer le lien parent"}
      </button>

      {inviteUrl ? (
        <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-sm text-[color:var(--ink-soft)]">
            Lien pret. Partage-le avec le parent pour qu&apos;il cree ou connecte
            son compte, puis accepte l&apos;invitation.
          </p>
          <code className="overflow-x-auto rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--foreground)]">
            {inviteUrl}
          </code>
          <button
            className="justify-self-start rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
            onClick={handleCopyInviteUrl}
            type="button"
          >
            Copier le lien
          </button>
        </div>
      ) : null}
    </form>
  );
}
