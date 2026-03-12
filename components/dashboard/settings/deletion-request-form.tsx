"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import { getDeletionRequestFormCopy } from "@/lib/i18n/ui-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type DeletionRequestFormProps = {
  targetDisplayName: string;
  targetUserId?: string;
  buttonLabel: string;
  disabledReason: string | null;
  requestedAt: string | null;
  purgeTargetDate: string | null;
  languageCode: UiLanguageCode;
};

type DeletionRequestResponse = {
  ok?: boolean;
  data?: {
    requestedAt?: string;
    purgeTargetDate?: string;
    targetDisplayName?: string;
  };
  error?: {
    message?: string;
  };
};

export function DeletionRequestForm({
  targetDisplayName,
  targetUserId,
  buttonLabel,
  disabledReason,
  requestedAt,
  purgeTargetDate,
  languageCode,
}: DeletionRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const copy = getDeletionRequestFormCopy(languageCode);
  const [successState, setSuccessState] = useState<{
    requestedAt: string;
    purgeTargetDate: string;
    targetDisplayName: string;
  } | null>(
    requestedAt && purgeTargetDate
      ? {
          requestedAt,
          purgeTargetDate,
          targetDisplayName,
        }
      : null,
  );

  const isAlreadyRequested = Boolean(successState);
  const isDisabled = Boolean(disabledReason) || isAlreadyRequested || isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/privacy/deletion-requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: targetUserId ?? null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | DeletionRequestResponse
        | null;

      if (!response.ok || !payload?.ok || !payload.data?.requestedAt || !payload.data?.purgeTargetDate) {
        setErrorMessage(
          payload?.error?.message ?? copy.genericError,
        );
        return;
      }

      setSuccessState({
        requestedAt: payload.data.requestedAt,
        purgeTargetDate: payload.data.purgeTargetDate,
        targetDisplayName: payload.data.targetDisplayName ?? targetDisplayName,
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      {successState ? (
        <p className="rounded-[1.25rem] border border-[#d6c48d] bg-[#fff8e5] px-4 py-3 text-sm leading-6 text-[#6b5320]">
          {copy.success(
            successState.targetDisplayName,
            formatDateLabel(successState.requestedAt, languageCode),
            formatDateLabel(successState.purgeTargetDate, languageCode),
          )}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm leading-6 text-[#8d3b1f]">
          {errorMessage}
        </p>
      ) : null}

      {disabledReason && !successState ? (
        <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
          {disabledReason}
        </p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <button
          className="inline-flex rounded-full border border-[#b34f32] bg-[#cb5d3c] px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={isDisabled}
          type="submit"
        >
          {isPending ? copy.pending : buttonLabel}
        </button>
      </form>
    </div>
  );
}
