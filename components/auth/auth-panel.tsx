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
    <section className="w-full max-w-[30rem]">
      <article className="shell-panel flex min-h-0 flex-col rounded-[1.75rem] border border-[color:var(--line)] p-4 shadow-[var(--shadow)] sm:p-5 lg:p-6">
        <div>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-center font-[family-name:var(--font-heading)] text-[clamp(1.8rem,6vw,2.35rem)] leading-[1.04]">
            {copy.title}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm leading-5 text-[color:var(--ink-soft)]">
            {copy.body}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {copy.checklist.map((item) => (
              <span
                className="soft-chip border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-xs leading-5 text-[color:var(--foreground)]"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-1 inline-flex w-full max-w-[16rem] justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-1 text-sm">
          <button
            className={`flex-1 rounded-full px-4 py-2 text-center transition ${
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
            className={`flex-1 rounded-full px-4 py-2 text-center transition ${
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
          <p className="callout-info mt-4 rounded-2xl border px-4 py-3 text-sm">
            {intentLabel}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="callout-error mt-4 rounded-2xl border px-4 py-3 text-sm">
            {errorMessage}
          </p>
        ) : null}

        {infoMessage ? (
          <p className="callout-warning mt-4 rounded-2xl border px-4 py-3 text-sm">
            {infoMessage}
          </p>
        ) : null}

        <form
          className="mt-4 grid content-start gap-2.5"
          onSubmit={mode === "sign_in" ? handleSignIn : handleSignUp}
        >
          {mode === "sign_up" ? (
            <fieldset className="grid gap-2.5">
              <legend className="text-center text-sm font-medium">
                {copy.accountType}
              </legend>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {copy.roles.map((option) => (
                  <button
                    className={`rounded-[1rem] border px-2.5 py-3 text-center transition sm:px-3 sm:py-3 ${
                      signupRole === option.value
                        ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)]"
                        : "border-[color:var(--line)] bg-[color:var(--surface-raised)]"
                    }`}
                    key={option.value}
                    onClick={() => setSignupRole(option.value as SignupRole)}
                    type="button"
                  >
                    <p className="font-[family-name:var(--font-heading)] text-sm sm:text-[0.95rem]">
                      {option.title}
                    </p>
                    <p className="mt-1 hidden text-[11px] leading-4 text-[color:var(--ink-soft)] lg:block">
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

        <p className="mt-3 text-center text-[11px] leading-5 text-[color:var(--ink-soft)]">
          {mode === "sign_in" ? copy.footer.signIn : copy.footer.signUp}
        </p>
      </article>
    </section>
  );
}
