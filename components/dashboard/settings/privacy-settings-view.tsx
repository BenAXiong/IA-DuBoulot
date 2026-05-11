import { AccountSettingsForm } from "@/components/auth/account-settings-form";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import { DeletionRequestForm } from "@/components/dashboard/settings/deletion-request-form";
import {
  getPrivacyDeleteButtonLabel,
  getPrivacySettingsCopy,
} from "@/lib/i18n/ui-copy";
import type { AppUserRecord } from "@/lib/server/auth/types";
import type { PrivacySettingsSnapshot } from "@/lib/server/privacy/types";

type PrivacySettingsViewProps = {
  appUser: AppUserRecord;
  email: string | null;
  snapshot: PrivacySettingsSnapshot;
};

function getMinimalSettingsCopy(
  languageCode: AppUserRecord["preferred_ui_language"],
) {
  switch (languageCode) {
    case "en":
      return {
        pageTitle: "Settings",
        pageBody: "Manage your profile and account access.",
        profileTitle: "Profile",
        profileBody: "Update the name and languages used in the app.",
        profileFrozen:
          "Profile changes are locked while an account deletion request is pending.",
        deletionTitle: "Delete account",
        deletionBody:
          "Request deletion for this account. Linked student deletion stays available for parents here too.",
        selfTitle: "This account",
        selfBody: "Request deletion for your own account.",
        selfAdmin: "This account must be handled manually.",
        linkedStudentsTitle: "Linked students",
        linkedStudentsBody:
          "Request deletion for a linked student account from here.",
        noLinkedStudents: "No linked student account is currently available here.",
        studentStatusLabel: "Status",
        studentRequested: "deletion requested",
        studentDefault: "active",
        studentDelete: "Delete student account",
      };
    case "zh":
      return {
        pageTitle: "設定",
        pageBody: "管理你的個人資料與帳號存取。",
        profileTitle: "個人資料",
        profileBody: "更新在 app 內使用的名稱與語言。",
        profileFrozen: "帳號刪除申請排隊中時，個人資料修改會被鎖定。",
        deletionTitle: "刪除帳號",
        deletionBody:
          "從這裡提出帳號刪除申請。家長也可在這裡為已連結學生提出刪除。",
        selfTitle: "這個帳號",
        selfBody: "為你自己的帳號提出刪除申請。",
        selfAdmin: "這個帳號需要人工處理。",
        linkedStudentsTitle: "已連結學生",
        linkedStudentsBody: "從這裡為已連結的學生帳號提出刪除申請。",
        noLinkedStudents: "目前沒有可在這裡處理的已連結學生帳號。",
        studentStatusLabel: "狀態",
        studentRequested: "已提出刪除申請",
        studentDefault: "啟用中",
        studentDelete: "刪除學生帳號",
      };
    default:
      return {
        pageTitle: "Réglages",
        pageBody: "Gère ton profil et l'accès au compte.",
        profileTitle: "Profil",
        profileBody: "Modifie le nom et les langues utilisés dans l'app.",
        profileFrozen:
          "Les changements de profil sont bloqués pendant qu'une demande de suppression est en attente.",
        deletionTitle: "Supprimer le compte",
        deletionBody:
          "Demande la suppression de ce compte. Pour les parents, la suppression d'un élève lié reste aussi disponible ici.",
        selfTitle: "Ce compte",
        selfBody: "Demande la suppression de ton propre compte.",
        selfAdmin: "Ce compte doit être traité manuellement.",
        linkedStudentsTitle: "Élèves liés",
        linkedStudentsBody:
          "Demande la suppression d'un compte élève lié depuis ici.",
        noLinkedStudents:
          "Aucun compte élève lié n'est disponible ici pour le moment.",
        studentStatusLabel: "Statut",
        studentRequested: "suppression demandée",
        studentDefault: "actif",
        studentDelete: "Supprimer le compte élève",
      };
  }
}

export function PrivacySettingsView({
  appUser,
  email,
  snapshot,
}: PrivacySettingsViewProps) {
  const languageCode = appUser.preferred_ui_language;
  const deletionCopy = getPrivacySettingsCopy(languageCode);
  const copy = getMinimalSettingsCopy(languageCode);
  const isFrozen = appUser.account_status === "deletion_requested";

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
          {copy.pageTitle}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.pageBody}
        </p>
        {isFrozen ? (
          <p className="rounded-[1.25rem] border border-[#d6c48d] bg-[#fff8e5] px-4 py-3 text-sm leading-6 text-[#6b5320]">
            {deletionCopy.deletionQueuedPrefix}
            {formatDateLabel(appUser.deletion_requested_at, languageCode)}
            {deletionCopy.deletionQueuedSuffix}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.profileTitle}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.profileBody}
          </p>
        </div>

        {isFrozen ? (
          <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.profileFrozen}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <AccountSettingsForm appUser={appUser} email={email} />
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.deletionTitle}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.deletionBody}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <div className="space-y-2">
              <p className="font-medium">{copy.selfTitle}</p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {snapshot.selfDeletion ? copy.selfBody : copy.selfAdmin}
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
            ) : null}
          </article>

          {appUser.role === "parent" ? (
            <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <div className="space-y-2">
                <p className="font-medium">{copy.linkedStudentsTitle}</p>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.linkedStudentsBody}
                </p>
              </div>

              {snapshot.linkedStudentDeletionTargets.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.noLinkedStudents}
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
                          {copy.studentStatusLabel}:{" "}
                          {target.requestedAt
                            ? copy.studentRequested
                            : copy.studentDefault}
                          .
                        </p>
                      </div>

                      <DeletionRequestForm
                        buttonLabel={copy.studentDelete}
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
