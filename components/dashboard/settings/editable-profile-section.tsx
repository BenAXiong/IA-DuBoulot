"use client";

import { useState } from "react";
import { AccountSettingsForm } from "@/components/auth/account-settings-form";
import {
  AI_LANGUAGE_OPTIONS,
  UI_LANGUAGE_OPTIONS,
  getStudentAgeBandOptions,
} from "@/lib/i18n/config";
import { getAccountSettingsFormCopy } from "@/lib/i18n/ui-copy";
import type { AppUserRecord } from "@/lib/server/auth/types";

type EditableProfileSectionProps = {
  appUser: AppUserRecord;
  editLabel: string;
  cancelLabel: string;
  frozenCopy: string;
};

function findOptionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null,
) {
  return options.find((option) => option.value === value)?.label ?? value ?? "-";
}

function ProfileRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid gap-1 border-b border-[color:var(--line)] py-3 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-sm text-[color:var(--ink-soft)]">{label}</dt>
      <dd className="text-sm font-medium text-[color:var(--foreground)]">
        {value?.trim() || "-"}
      </dd>
    </div>
  );
}

export function EditableProfileSection({
  appUser,
  editLabel,
  cancelLabel,
  frozenCopy,
}: EditableProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const copy = getAccountSettingsFormCopy(appUser.preferred_ui_language);
  const isFrozen = appUser.account_status === "deletion_requested";
  const ageBandLabel =
    appUser.role === "student"
      ? findOptionLabel(
          getStudentAgeBandOptions(appUser.preferred_ui_language),
          appUser.age_band,
        )
      : null;

  return (
    <section className="grid gap-4 border-t border-[color:var(--line)] pt-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {appUser.preferred_ui_language === "en"
            ? "Profile"
            : appUser.preferred_ui_language === "zh"
              ? "個人資料"
              : "Profil"}
        </h2>
        {!isFrozen ? (
          <button
            className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-medium transition hover:bg-[color:var(--surface-strong)]"
            onClick={() => setIsEditing((current) => !current)}
            type="button"
          >
            {isEditing ? cancelLabel : editLabel}
          </button>
        ) : null}
      </div>

      {isFrozen ? (
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {frozenCopy}
        </p>
      ) : isEditing ? (
        <AccountSettingsForm appUser={appUser} showEmail={false} />
      ) : (
        <dl>
          <ProfileRow label={copy.fields.displayName} value={appUser.display_name} />
          <ProfileRow
            label={copy.fields.uiLanguage}
            value={findOptionLabel(
              UI_LANGUAGE_OPTIONS,
              appUser.preferred_ui_language,
            )}
          />
          <ProfileRow
            label={copy.fields.aiLanguage}
            value={findOptionLabel(AI_LANGUAGE_OPTIONS, appUser.ai_help_language)}
          />
          {appUser.role === "student" ? (
            <ProfileRow label={copy.fields.ageBand} value={ageBandLabel} />
          ) : null}
        </dl>
      )}
    </section>
  );
}
