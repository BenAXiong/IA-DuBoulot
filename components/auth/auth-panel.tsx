"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clearPendingInviteCookie,
  persistPendingInviteCookie,
} from "@/lib/auth/pending-invite";
import { getAuthPanelCopy } from "@/lib/i18n/ui-copy";
import { withUiLanguage } from "@/lib/i18n/ui-language";
import type { UiLanguageCode } from "@/lib/server/auth/types";
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
  languageCode: UiLanguageCode;
};

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function AuthPanel({
  initialError = null,
  initialMessage = null,
  initialMode = "sign_in",
  initialRole = "student",
  intentLabel = null,
  inviteToken = null,
  languageCode,
}: AuthPanelProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const copy = getAuthPanelCopy(languageCode);
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
        setErrorMessage(getAuthErrorMessage(error, copy.errorFallback));
        return;
      }

      router.push(
        withUiLanguage(
          inviteToken ? `/invite/${inviteToken}` : "/onboarding",
          languageCode,
        ),
      );
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

      const nextPath = withUiLanguage(
        inviteToken ? `/invite/${inviteToken}` : `/onboarding?role=${signupRole}`,
        languageCode,
      );
      const confirmUrl = new URL("/auth/confirm", window.location.origin);
      confirmUrl.searchParams.set("next", nextPath);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: confirmUrl.toString(),
        },
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error, copy.errorFallback));
        return;
      }

      if (data.session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      setInfoMessage(
        inviteToken ? copy.signUpInfo.invite : copy.signUpInfo.default,
      );
      setMode("sign_in");
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.26em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl leading-tight">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--ink-soft)]">
          {copy.body}
        </p>

        <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--foreground)]">
          <p className="font-medium">{copy.checklistTitle}</p>
          <ul className="grid gap-2 text-[color:var(--ink-soft)]">
            {copy.checklist.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </article>

      <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <div className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-1 text-sm">
          <button
            className={`rounded-full px-4 py-2 transition ${
              mode === "sign_in"
                ? "bg-[color:var(--foreground)] text-[color:var(--foreground-inverse)]"
                : "text-[color:var(--ink-soft)]"
            }`}
            onClick={() => {
              resetMessages();
              setMode("sign_in");
            }}
            type="button"
          >
            {copy.tabs.signIn}
          </button>
          <button
            className={`rounded-full px-4 py-2 transition ${
              mode === "sign_up"
                ? "bg-[color:var(--foreground)] text-[color:var(--foreground-inverse)]"
                : "text-[color:var(--ink-soft)]"
            }`}
            onClick={() => {
              resetMessages();
              setMode("sign_up");
            }}
            type="button"
          >
            {copy.tabs.signUp}
          </button>
        </div>

        {intentLabel ? (
          <p className="callout-info mt-5 rounded-2xl border px-4 py-3 text-sm">
            {intentLabel}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="callout-error mt-5 rounded-2xl border px-4 py-3 text-sm">
            {errorMessage}
          </p>
        ) : null}

        {infoMessage ? (
          <p className="callout-warning mt-5 rounded-2xl border px-4 py-3 text-sm">
            {infoMessage}
          </p>
        ) : null}

        <form
          className="mt-6 grid gap-4"
          onSubmit={mode === "sign_in" ? handleSignIn : handleSignUp}
        >
          {mode === "sign_up" ? (
            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium">
                {copy.accountType}
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {copy.roles.map((option) => (
                  <button
                    className={`rounded-[1.25rem] border p-4 text-left transition ${
                      signupRole === option.value
                        ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)]"
                        : "border-[color:var(--line)] bg-[color:var(--surface-raised)]"
                    }`}
                    key={option.value}
                    onClick={() => setSignupRole(option.value as SignupRole)}
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
            <span className="font-medium">{copy.fields.email}</span>
            <input
              autoComplete="email"
              className="field-control rounded-2xl px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="parent@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">{copy.fields.password}</span>
            <input
              autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
              className="field-control rounded-2xl px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.placeholders.password}
              required
              type="password"
              value={password}
            />
          </label>

          <button className="button-base button-primary mt-2" disabled={isPending} type="submit">
            {isPending
              ? copy.buttons.pending
              : mode === "sign_in"
                ? copy.buttons.signIn
                : copy.buttons.signUp}
          </button>
        </form>

        <p className="mt-4 text-xs leading-6 text-[color:var(--ink-soft)]">
          {mode === "sign_in" ? copy.footer.signIn : copy.footer.signUp}
        </p>
      </article>
    </section>
  );
}
