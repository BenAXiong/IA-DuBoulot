import { AccountSettingsForm } from "@/components/auth/account-settings-form";
import { BillingStatusCard } from "@/components/dashboard/oversight/billing-status-card";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import { DeletionRequestForm } from "@/components/dashboard/settings/deletion-request-form";
import {
  getPrivacyDataCategories,
  getPrivacyDeleteButtonLabel,
  getPrivacyRoleIntro,
  getPrivacySettingsCopy,
} from "@/lib/i18n/ui-copy";
import type { AppUserRecord } from "@/lib/server/auth/types";
import type { PrivacySettingsSnapshot } from "@/lib/server/privacy/types";

type PrivacySettingsViewProps = {
  appUser: AppUserRecord;
  snapshot: PrivacySettingsSnapshot;
};

export function PrivacySettingsView({
  appUser,
  snapshot,
}: PrivacySettingsViewProps) {
  const languageCode = appUser.preferred_ui_language;
  const copy = getPrivacySettingsCopy(languageCode);
  const isFrozen = appUser.account_status === "deletion_requested";
  const dataCategories = getPrivacyDataCategories(appUser, languageCode);

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.1fr_0.9fr]">
        <article className="space-y-4">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.titleEyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {copy.title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {getPrivacyRoleIntro(appUser, languageCode)}
          </p>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>{copy.introSummary}</p>
          <p>{copy.introPrivacy}</p>
          {isFrozen ? (
            <p className="rounded-[1.25rem] border border-[#d6c48d] bg-[#fff8e5] px-4 py-3 text-[#6b5320]">
              {copy.deletionQueuedPrefix}
              {formatDateLabel(appUser.deletion_requested_at, languageCode)}
              {copy.deletionQueuedSuffix}
            </p>
          ) : null}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article
          className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
          id="settings"
        >
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.sections.profile}
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.sections.profileBody}
            </p>
          </div>

          {isFrozen ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.sections.profileFrozen}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <AccountSettingsForm appUser={appUser} />
            </div>
          )}
        </article>

        {appUser.role === "parent" && snapshot.billing ? (
          <BillingStatusCard
            billing={snapshot.billing}
            languageCode={languageCode}
          />
        ) : (
          <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                {copy.sections.privacyCard}
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.sections.privacyCardBody}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              {appUser.role === "admin"
                ? copy.sections.adminNoBilling
                : copy.sections.noBilling}
            </div>
          </article>
        )}
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
        id="privacy"
      >
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.sections.dataRetention}
          </p>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.sections.dataRetentionBody}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-medium">{copy.sections.visibleCategories}</p>
            <ul className="grid gap-2 text-sm leading-6 text-[color:var(--ink-soft)]">
              {dataCategories.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-medium">{copy.sections.retentionWindows}</p>
            <ul className="grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.retentionRules.map((rule) => (
                <li key={rule.title}>
                  <span className="font-medium text-[color:var(--foreground)]">
                    {rule.title}:{" "}
                  </span>
                  {rule.body}
                </li>
              ))}
            </ul>
          </article>

          <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-medium">{copy.sections.providers}</p>
            <ul className="grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.providerRules.map((rule) => (
                <li key={rule.title}>
                  <span className="font-medium text-[color:var(--foreground)]">
                    {rule.title}:{" "}
                  </span>
                  {rule.body}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
        id="deletion"
      >
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.sections.deletion}
          </p>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.sections.deletionBody}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <div className="space-y-2">
              <p className="font-medium">{copy.sections.selfAccount}</p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {snapshot.selfDeletion
                  ? copy.sections.selfAccountBody
                  : copy.sections.selfAccountAdmin}
              </p>
            </div>

            {snapshot.selfDeletion ? (
              <DeletionRequestForm
                buttonLabel={getPrivacyDeleteButtonLabel(appUser, languageCode)}
                disabledReason={snapshot.selfDeletion.blockedReason}
                languageCode={languageCode}
                purgeTargetDate={snapshot.selfDeletion.purgeTargetDate}
                requestedAt={snapshot.selfDeletion.requestedAt}
                targetDisplayName={snapshot.selfDeletion.displayName}
              />
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.sections.adminManual}
              </div>
            )}
          </article>

          {appUser.role === "parent" ? (
            <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <div className="space-y-2">
                <p className="font-medium">{copy.sections.linkedStudents}</p>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.sections.linkedStudentsBody}
                </p>
              </div>

              {snapshot.linkedStudentDeletionTargets.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.sections.noLinkedStudents}
                </div>
              ) : (
                <div className="grid gap-3">
                  {snapshot.linkedStudentDeletionTargets.map((target) => (
                    <div
                      className="grid gap-3 rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-4"
                      key={target.targetUserId}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{target.displayName}</p>
                        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                          {copy.sections.studentStatus}:{" "}
                          {target.requestedAt
                            ? copy.sections.studentRequested
                            : copy.sections.studentDefault}
                          .
                        </p>
                      </div>

                      <DeletionRequestForm
                        buttonLabel={copy.sections.studentDelete}
                        disabledReason={target.blockedReason}
                        languageCode={languageCode}
                        purgeTargetDate={target.purgeTargetDate}
                        requestedAt={target.requestedAt}
                        targetDisplayName={target.displayName}
                        targetUserId={target.targetUserId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
