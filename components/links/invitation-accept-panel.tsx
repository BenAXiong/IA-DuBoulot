"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AppUserRole } from "@/lib/server/auth/types";
import type {
  InvitationKind,
  InvitationLandingRecord,
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
};

function getTitle(kind: InvitationKind | null) {
  if (kind === "tutor_link") {
    return "Invitation tuteur";
  }

  return "Invitation parent";
}

function getBody(kind: InvitationKind | null) {
  if (kind === "tutor_link") {
    return "Ce lien relie un tuteur au compte eleve cible.";
  }

  return "Ce lien sert a approuver ou relier un parent au compte eleve cible.";
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
}: InvitationAcceptPanelProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const invitationKind = landing?.invitation.invitation_kind ?? null;
  const acceptRoute =
    invitationKind === "tutor_link"
      ? "/api/auth/invitations/accept"
      : "/api/auth/parent-approval/confirm";

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
        setErrorMessage(
          payload?.error?.message ?? "Impossible d'accepter cette invitation.",
        );
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
          {getTitle(invitationKind)}
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
          {landing
            ? `${landing.student.display_name} attend une action de votre part.`
            : "Le lien d'invitation n'est plus disponible."}
        </h1>
        <p className="text-base leading-7 text-[color:var(--ink-soft)]">
          {landing ? getBody(invitationKind) : "Ce lien peut etre invalide, expire ou deja consomme."}
        </p>

        {landing ? (
          <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--foreground)]">
            <p>
              <span className="font-medium">Eleve cible:</span>{" "}
              {landing.student.display_name}
            </p>
            <p>
              <span className="font-medium">Email invite:</span>{" "}
              {landing.targetEmailMasked}
            </p>
            <p>
              <span className="font-medium">Statut:</span>{" "}
              {landing.resolvedStatus}
            </p>
            <p>
              <span className="font-medium">Expire le:</span>{" "}
              {new Date(landing.invitation.expires_at).toLocaleString("en-CA", {
                hour12: false,
              })}
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
            L&apos;invitation ne peut pas etre utilisee dans son etat actuel.
          </p>
        ) : null}

        {viewerState === "unauthenticated" ? (
          <>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              Cree ou connecte le compte correspondant avant d&apos;accepter ce lien.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
                href={authSignInHref}
              >
                Se connecter
              </Link>
              <Link
                className="rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                href={authSignUpHref}
              >
                Creer le compte
              </Link>
            </div>
          </>
        ) : null}

        {viewerState === "needs_onboarding" ? (
          <>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              La session est connectee{email ? ` pour ${email}` : ""}, mais le
              profil applicatif n&apos;est pas encore cree.
            </p>
            <Link
              className="justify-self-start rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
              href={onboardingHref}
            >
              Terminer l&apos;onboarding
            </Link>
          </>
        ) : null}

        {viewerState === "role_mismatch" ? (
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            La session actuelle utilise le role `{appUserRole ?? "unknown"}`.
            Cette invitation attend un compte `{landing?.invitation.target_role ?? "matching"}`.
            Deconnecte-toi puis reconnecte-toi avec le bon compte si necessaire.
          </p>
        ) : null}

        {viewerState === "already_accepted" ? (
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Cette invitation a deja ete acceptee par ce compte. Tu peux revenir
            a l&apos;espace protege.
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
                {isPending ? "Activation..." : "Accepter l'invitation"}
              </button>
            ) : null}

            <Link
              className="rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              href="/app"
            >
              Aller a l&apos;app
            </Link>
          </div>
        ) : null}
      </article>
    </section>
  );
}
