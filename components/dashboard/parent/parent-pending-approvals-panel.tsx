"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProfileAvatar } from "@/components/dashboard/parent/profile-avatar";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import type { ParentDashboardPendingApprovalModel } from "@/components/dashboard/parent/parent-dashboard-presenters";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getParentDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type ParentPendingApprovalsPanelProps = {
  approvals: ParentDashboardPendingApprovalModel[];
  languageCode: UiLanguageCode;
};

type AcceptResponsePayload = {
  ok?: boolean;
  error?: {
    message?: string;
  };
};

export function ParentPendingApprovalsPanel({
  approvals,
  languageCode,
}: ParentPendingApprovalsPanelProps) {
  const router = useRouter();
  const copy = getParentDashboardCopy(languageCode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (approvals.length === 0) {
    return null;
  }

  function handleAccept(invitationId: string) {
    setErrorMessage(null);
    setPendingApprovalId(invitationId);

    startTransition(async () => {
      const response = await fetch("/api/auth/parent-approval/confirm", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          invitationId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | AcceptResponsePayload
        | null;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(
          payload?.error?.message ?? copy.pendingApprovals.errorFallback,
        );
        setPendingApprovalId(null);
        return;
      }

      router.refresh();
    });
  }

  return (
    <SurfaceCard className="grid gap-4 p-4 sm:p-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
          {copy.pendingApprovals.eyebrow}
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {copy.pendingApprovals.title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.pendingApprovals.body}
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm text-[#8d3b1f]">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-3">
        {approvals.map((approval) => {
          const isThisPending = isPending && pendingApprovalId === approval.id;

          return (
            <article
              className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4"
              key={approval.id}
            >
              <div className="flex items-start gap-3">
                <ProfileAvatar name={approval.studentDisplayName} />
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="font-[family-name:var(--font-heading)] text-xl leading-tight">
                    {approval.studentDisplayName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {approval.ageBandLabel ? (
                      <StudentStatusPill label={approval.ageBandLabel} />
                    ) : null}
                    {approval.under13Label ? (
                      <StudentStatusPill
                        label={approval.under13Label}
                        tone="warning"
                      />
                    ) : null}
                    {approval.relationshipLabel ? (
                      <StudentStatusPill
                        label={copy.pendingApprovals.relationshipLabel(
                          approval.relationshipLabel,
                        )}
                        tone="accent"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3 text-sm text-[color:var(--ink-soft)]">
                {approval.createdAtLabel ? (
                  <p>{copy.pendingApprovals.requestedOn(approval.createdAtLabel)}</p>
                ) : null}
                {approval.expiresAtLabel ? (
                  <p>{copy.pendingApprovals.expiresOn(approval.expiresAtLabel)}</p>
                ) : null}
              </div>

              <button
                className="button-base button-primary justify-center"
                disabled={isPending}
                onClick={() => handleAccept(approval.id)}
                type="button"
              >
                {isThisPending
                  ? copy.pendingApprovals.pending
                  : copy.pendingApprovals.accept}
              </button>
            </article>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
