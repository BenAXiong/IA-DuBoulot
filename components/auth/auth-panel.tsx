"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clearPendingInviteCookie,
  persistPendingInviteCookie,
} from "@/lib/auth/pending-invite";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "sign_in" | "sign_up";
type SignupRole = "student" | "parent" | "tutor";

type AuthPanelProps = {
  initialError?: string | null;
  initialMessage?: string | null;
  initialMode?: AuthMode;
  initialRole?: SignupRole;
  intentLabel?: string | null;
  inviteToken?: string | null;
};

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

export function AuthPanel({
  initialError = null,
  initialMessage = null,
  initialMode = "sign_in",
  initialRole = "student",
  intentLabel = null,
  inviteToken = null,
}: AuthPanelProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>(initialRole);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [infoMessage, setInfoMessage] = useState<string | null>(initialMessage);
  const [isPending, startTransition] = useTransition();

  function resetMessages() {
    setErrorMessage(null);
    setInfoMessage(null);
  }

  function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    startTransition(async () => {
      if (!inviteToken) {
        clearPendingInviteCookie();
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      router.push(inviteToken ? `/invite/${inviteToken}` : "/onboarding");
      router.refresh();
    });
  }

  function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();

    startTransition(async () => {
      if (inviteToken) {
        persistPendingInviteCookie(inviteToken);
      } else {
        clearPendingInviteCookie();
      }

      const confirmUrl = new URL("/auth/confirm", window.location.origin);
      confirmUrl.searchParams.set(
        "next",
        inviteToken ? `/invite/${inviteToken}` : `/onboarding?role=${signupRole}`,
      );

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: confirmUrl.toString(),
        },
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      if (data.session) {
        router.push(inviteToken ? `/invite/${inviteToken}` : `/onboarding?role=${signupRole}`);
        router.refresh();
        return;
      }

      setInfoMessage(
        inviteToken
          ? "Compte cree. Confirme l'adresse email depuis le message Supabase. Le produit reprendra automatiquement l'invitation dans ce navigateur."
          : "Compte cree. Confirme l'adresse email depuis le message Supabase avant de continuer.",
      );
      setMode("sign_in");
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.26em] text-[color:var(--ink-soft)]">
          Auth branch
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl leading-tight">
          Connecter la vraie session Supabase au produit.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--ink-soft)]">
          Cette etape ouvre le flux reel vers l&apos;onboarding, le bootstrap
          de profil et les pages protegees deja branchees au backend.
        </p>

        <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--foreground)]">
          <p className="font-medium">Ce qui est deja branche:</p>
          <ul className="grid gap-2 text-[color:var(--ink-soft)]">
            <li>- email + mot de passe via Supabase SSR</li>
            <li>- confirmation email route `auth/confirm`</li>
            <li>- page d&apos;onboarding reliee au bootstrap API</li>
            <li>- redirection vers `/app` si le profil existe deja</li>
          </ul>
        </div>
      </article>

      <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="inline-flex rounded-full border border-[color:var(--line)] bg-white/70 p-1 text-sm">
          <button
            className={`rounded-full px-4 py-2 transition ${
              mode === "sign_in"
                ? "bg-[color:var(--foreground)] text-white"
                : "text-[color:var(--ink-soft)]"
            }`}
            onClick={() => {
              resetMessages();
              setMode("sign_in");
            }}
            type="button"
          >
            Connexion
          </button>
          <button
            className={`rounded-full px-4 py-2 transition ${
              mode === "sign_up"
                ? "bg-[color:var(--foreground)] text-white"
                : "text-[color:var(--ink-soft)]"
            }`}
            onClick={() => {
              resetMessages();
              setMode("sign_up");
            }}
            type="button"
          >
            Creation
          </button>
        </div>

        {intentLabel ? (
          <p className="mt-5 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--ink-soft)]">
            {intentLabel}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-5 rounded-2xl border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm text-[#8d3b1f]">
            {errorMessage}
          </p>
        ) : null}

        {infoMessage ? (
          <p className="mt-5 rounded-2xl border border-[#cbbf8d] bg-[#fff8df] px-4 py-3 text-sm text-[#69551b]">
            {infoMessage}
          </p>
        ) : null}

        <form
          className="mt-6 grid gap-4"
          onSubmit={mode === "sign_in" ? handleSignIn : handleSignUp}
        >
          {mode === "sign_up" ? (
            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium">Type de compte</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    value: "student" as const,
                    title: "Eleve",
                    body: "Aide aux devoirs et espace de travail.",
                  },
                  {
                    value: "parent" as const,
                    title: "Parent",
                    body: "Supervision et suivis des sessions.",
                  },
                  {
                    value: "tutor" as const,
                    title: "Tuteur",
                    body: "Accompagnement pedagogique cible.",
                  },
                ].map((option) => (
                  <button
                    className={`rounded-[1.25rem] border p-4 text-left transition ${
                      signupRole === option.value
                        ? "border-[color:var(--accent)] bg-[#fff1e8]"
                        : "border-[color:var(--line)] bg-white/70"
                    }`}
                    key={option.value}
                    onClick={() => setSignupRole(option.value)}
                    type="button"
                  >
                    <p className="font-[family-name:var(--font-heading)] text-base">
                      {option.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[color:var(--ink-soft)]">
                      {option.body}
                    </p>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Email</span>
            <input
              autoComplete="email"
              className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="parent@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Mot de passe</span>
            <input
              autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
              className="rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 caracteres minimum"
              required
              type="password"
              value={password}
            />
          </label>

          <button
            className="mt-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            type="submit"
          >
            {isPending
              ? "Traitement..."
              : mode === "sign_in"
                ? "Se connecter"
                : "Creer le compte"}
          </button>
        </form>

        <p className="mt-4 text-xs leading-6 text-[color:var(--ink-soft)]">
          {mode === "sign_in"
            ? "Si la session est valide mais qu'aucun profil applicatif n'existe encore, la prochaine etape sera l'onboarding."
            : "Si la confirmation email est active, l'utilisateur devra valider le lien avant d'arriver sur l'onboarding."}
        </p>
      </article>
    </section>
  );
}
