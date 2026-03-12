"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getIntlLocale, type UiLanguageCode } from "@/lib/i18n/config";
import {
  getInvitationAcceptCopy,
  getRoleLabel,
} from "@/lib/i18n/ui-copy";
import type { AppUserRole } from "@/lib/server/auth/types";
import type {
  InvitationKind,
  InvitationLandingRecord,
  InvitationStatus,
  InvitationViewerState,
} from "@/lib/server/links/types";

type AcceptResponsePayload = {
  ok?: boolean;
  error?: {
    message?: string;
  };
};

type InvitationAcceptPanelProps = {
  token: string;
  landing: InvitationLandingRecord | null;
  viewerState: InvitationViewerState;
  email: string | null;
  appUserRole: AppUserRole | null;
  authSignInHref: string;
  authSignUpHref: string;
  onboardingHref: string;
  languageCode: UiLanguageCode;
};

function getInvitationTitle(
  copy: ReturnType<typeof getInvitationAcceptCopy>,
  kind: InvitationKind | null,
) {
  return kind === "tutor_link" ? copy.titles.tutor : copy.titles.parent;
}

function getInvitationBody(
  copy: ReturnType<typeof getInvitationAcceptCopy>,
  kind: InvitationKind | null,
) {
  return kind === "tutor_link" ? copy.bodies.tutor : copy.bodies.parent;
}

function getConnectedEmailLabel(
  languageCode: UiLanguageCode,
  email: string | null,
) {
  if (!email) {
    return "";
  }

  switch (languageCode) {
    case "en":
      return ` for ${email}`;
    case "zh":
      return `（${email}）`;
    default:
      return ` pour ${email}`;
  }
}

function getInvitationStatusLabel(
  status: InvitationStatus,
  languageCode: UiLanguageCode,
) {
  switch (languageCode) {
    case "en":
      switch (status) {
        case "accepted":
          return "Accepted";
        case "revoked":
          return "Revoked";
        case "expired":
          return "Expired";
        default:
          return "Pending";
      }
    case "zh":
      switch (status) {
        case "accepted":
          return "已接受";
        case "revoked":
          return "已撤銷";
        case "expired":
          return "已過期";
        default:
          return "待處理";
      }
    default:
      switch (status) {
        case "accepted":
          return "Acceptée";
        case "revoked":
          return "Révoquée";
        case "expired":
          return "Expirée";
        default:
          return "En attente";
      }
  }
}

export function InvitationAcceptPanel({
  token,
  landing,
  viewerState,
  email,
  appUserRole,
  authSignInHref,
  authSignUpHref,
  onboardingHref,
  languageCode,
}: InvitationAcceptPanelProps) {
  const router = useRouter();
  const copy = getInvitationAcceptCopy(languageCode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const invitationKind = landing?.invitation.invitation_kind ?? null;
  const acceptRoute =
    invitationKind === "tutor_link"
      ? "/api/auth/invitations/accept"
      : "/api/auth/parent-approval/confirm";
  const currentRoleLabel = appUserRole
    ? getRoleLabel(appUserRole, languageCode)
    : "unknown";
  const targetRoleLabel = landing
    ? getRoleLabel(landing.invitation.target_role, languageCode)
    : "matching";

  function handleAccept() {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch(acceptRoute, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | AcceptResponsePayload
        | null;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(payload?.error?.message ?? copy.errorFallback);
        return;
      }

      router.push("/app");
      router.refresh();
    });
  }

  return (
    <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.92fr_1.08fr] md:p-8">
      <article className="space-y-4">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
          {getInvitationTitle(copy, invitationKind)}
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
          {landing
            ? copy.heading(landing.student.display_name)
            : copy.unavailableHeading}
        </h1>
        <p className="text-base leading-7 text-[color:var(--ink-soft)]">
          {landing
            ? getInvitationBody(copy, invitationKind)
            : copy.unavailableBody}
        </p>

        {landing ? (
          <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--foreground)]">
            <p>
              <span className="font-medium">{copy.labels.student}:</span>{" "}
              {landing.student.display_name}
            </p>
            <p>
              <span className="font-medium">{copy.labels.email}:</span>{" "}
              {landing.targetEmailMasked}
            </p>
            <p>
              <span className="font-medium">{copy.labels.status}:</span>{" "}
              {getInvitationStatusLabel(landing.resolvedStatus, languageCode)}
            </p>
            <p>
              <span className="font-medium">{copy.labels.expiry}:</span>{" "}
              {new Intl.DateTimeFormat(getIntlLocale(languageCode), {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(landing.invitation.expires_at))}
            </p>
          </div>
        ) : null}
      </article>

      <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
        {errorMessage ? (
          <p className="rounded-2xl border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm text-[#8d3b1f]">
            {errorMessage}
          </p>
        ) : null}

        {viewerState === "unavailable" ? (
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.states.unavailable}
          </p>
        ) : null}

        {viewerState === "unauthenticated" ? (
          <>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.states.unauthenticated}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex w-fit self-start items-center justify-center whitespace-nowrap rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium !text-white transition hover:-translate-y-0.5"
                href={authSignInHref}
              >
                {copy.buttons.signIn}
              </Link>
              <Link
                className="inline-flex w-fit self-start items-center justify-center whitespace-nowrap rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-medium !text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                href={authSignUpHref}
              >
                {copy.buttons.signUp}
              </Link>
            </div>
          </>
        ) : null}

        {viewerState === "needs_onboarding" ? (
          <>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.states.needsOnboarding.replace(
                "{emailLabel}",
                getConnectedEmailLabel(languageCode, email),
              )}
            </p>
            <Link
              className="inline-flex w-fit self-start items-center justify-center whitespace-nowrap rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium !text-white transition hover:-translate-y-0.5"
              href={onboardingHref}
            >
              {copy.buttons.onboarding}
            </Link>
          </>
        ) : null}

        {viewerState === "role_mismatch" ? (
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.states.roleMismatch
              .replace("{currentRole}", currentRoleLabel)
              .replace("{targetRole}", targetRoleLabel)}
          </p>
        ) : null}

        {viewerState === "already_accepted" ? (
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.states.alreadyAccepted}
          </p>
        ) : null}

        {(viewerState === "ready" || viewerState === "already_accepted") ? (
          <div className="flex flex-wrap gap-3">
            {viewerState === "ready" ? (
              <button
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPending}
                onClick={handleAccept}
                type="button"
              >
                {isPending ? copy.buttons.pending : copy.buttons.accept}
              </button>
            ) : null}

            <Link
              className="inline-flex w-fit self-start items-center justify-center whitespace-nowrap rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-medium !text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              href="/app"
            >
              {copy.buttons.app}
            </Link>
          </div>
        ) : null}
      </article>
    </section>
  );
}
