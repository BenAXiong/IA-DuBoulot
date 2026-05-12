import Link from "next/link";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import { DeletionRequestForm } from "@/components/dashboard/settings/deletion-request-form";
import { EditableProfileSection } from "@/components/dashboard/settings/editable-profile-section";
import {
  getPrivacyDeleteButtonLabel,
  getPrivacySettingsCopy,
} from "@/lib/i18n/ui-copy";
import type {
  AccountStatus,
  AppUserRecord,
  AppUserRole,
} from "@/lib/server/auth/types";
import type { PrivacySettingsSnapshot } from "@/lib/server/privacy/types";

type PrivacySettingsViewProps = {
  appUser: AppUserRecord;
  email: string | null;
  snapshot: PrivacySettingsSnapshot;
};

function getSettingsCopy(languageCode: AppUserRecord["preferred_ui_language"]) {
  switch (languageCode) {
    case "en":
      return {
        unavailableEmail: "Email address unavailable",
        email: "Email",
        account: "Account",
        accountType: "Account type",
        status: "Status",
        plan: "Plan",
        starterPlan: "Explorer",
        upgrade: "See upgrade options",
        profileFrozen:
          "Profile changes are locked while deletion is pending.",
        edit: "Modify",
        cancel: "Cancel",
        links: "Linked accounts",
        linkedStudent: "Linked learner",
        noLinks: "No linked account shown here yet.",
        parentLinkDescription: "Ask a parent to follow your work.",
        tutorLinkDescription: "Work with a tutor of your choice.",
        parentLinkButton: "Link to parent account",
        tutorLinkButton: "Link to tutor account",
        parentManageOption: "Manage learners from the parent dashboard",
        tutorManageOption: "Manage learner links from the tutor dashboard",
        deletion: "Account deletion",
        deletionAdmin: "This account must be handled manually.",
        studentDelete: "Delete learner account",
        deleteNote:
          "Deletion is queued first so links, billing, and audit history stay consistent.",
        linkedStudents: "Linked learners",
        noLinkedStudents: "No linked learner can be deleted from here.",
        studentStatusLabel: "Status",
        studentRequested: "deletion requested",
        studentDefault: "active",
        roles: {
          student: "Student",
          parent: "Parent",
          tutor: "Tutor",
          admin: "Admin",
        },
        statuses: {
          active: "Active",
          pending_parent_approval: "Parent approval pending",
          suspended: "Suspended",
          deletion_requested: "Deletion requested",
        },
      };
    case "zh":
      return {
        unavailableEmail: "無法顯示電子郵件地址",
        email: "電子郵件",
        account: "帳號",
        accountType: "帳號類型",
        status: "狀態",
        plan: "方案",
        starterPlan: "Explorer",
        upgrade: "查看升級選項",
        profileFrozen: "刪除申請待處理時，個人資料修改會被鎖定。",
        edit: "修改",
        cancel: "取消",
        links: "已連結帳號",
        linkedStudent: "已連結學生",
        noLinks: "目前沒有可顯示的已連結帳號。",
        parentLinkDescription: "請家長追蹤你的學習進度。",
        tutorLinkDescription: "和你選擇的導師一起學習。",
        parentLinkButton: "連結家長帳號",
        tutorLinkButton: "連結導師帳號",
        parentManageOption: "到家長總覽管理學生",
        tutorManageOption: "到導師總覽管理學生連結",
        deletion: "刪除帳號",
        deletionAdmin: "這個帳號需要人工處理。",
        studentDelete: "刪除學生帳號",
        deleteNote: "刪除會先排隊處理，以保持連結、付費與稽核紀錄一致。",
        linkedStudents: "已連結學生",
        noLinkedStudents: "目前沒有可從這裡刪除的已連結學生。",
        studentStatusLabel: "狀態",
        studentRequested: "已提出刪除申請",
        studentDefault: "啟用中",
        roles: {
          student: "學生",
          parent: "家長",
          tutor: "導師",
          admin: "管理員",
        },
        statuses: {
          active: "啟用中",
          pending_parent_approval: "等待家長核准",
          suspended: "已停用",
          deletion_requested: "已要求刪除",
        },
      };
    default:
      return {
        unavailableEmail: "Adresse e-mail indisponible",
        email: "E-mail",
        account: "Compte",
        accountType: "Type de compte",
        status: "Statut",
        plan: "Offre",
        starterPlan: "Explorer",
        upgrade: "Voir les options",
        profileFrozen:
          "Le profil est bloqué pendant la demande de suppression.",
        edit: "Modifier",
        cancel: "Annuler",
        links: "Comptes liés",
        linkedStudent: "Élève lié",
        noLinks: "Aucun compte lié n'est affiché ici pour le moment.",
        parentLinkDescription: "Demande à un parent de suivre ton travail.",
        tutorLinkDescription: "Travaille avec le tuteur de ton choix.",
        parentLinkButton: "Lier un compte parent",
        tutorLinkButton: "Lier un compte tuteur",
        parentManageOption: "Gérer les élèves depuis le tableau parent",
        tutorManageOption: "Gérer les liens élèves depuis le tableau tuteur",
        deletion: "Suppression du compte",
        deletionAdmin: "Ce compte doit être traité manuellement.",
        studentDelete: "Supprimer le compte élève",
        deleteNote:
          "La suppression passe d'abord par une demande pour garder les liens, la facturation et l'audit cohérents.",
        linkedStudents: "Élèves liés",
        noLinkedStudents:
          "Aucun élève lié ne peut être supprimé depuis ici pour le moment.",
        studentStatusLabel: "Statut",
        studentRequested: "suppression demandée",
        studentDefault: "actif",
        roles: {
          student: "Élève",
          parent: "Parent",
          tutor: "Tuteur",
          admin: "Admin",
        },
        statuses: {
          active: "Actif",
          pending_parent_approval: "Validation parentale en attente",
          suspended: "Suspendu",
          deletion_requested: "Suppression demandée",
        },
      };
  }
}

function AccountFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[color:var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function PlanFact({
  label,
  value,
  upgradeLabel,
}: {
  label: string;
  value: string;
  upgradeLabel: string;
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">
        {label}
      </dt>
      <dd className="flex flex-wrap items-center gap-2 text-sm font-medium text-[color:var(--foreground)]">
        <span>{value}</span>
        <Link
          className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)] underline-offset-4 hover:underline"
          href="/pricing"
        >
          <span>{upgradeLabel}</span>
          <ExternalLinkIcon />
        </Link>
      </dd>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M14 5h5v5M19 5l-8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 6.5H7.5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function formatPlan(
  snapshot: PrivacySettingsSnapshot,
  fallback: string,
) {
  if (!snapshot.billing?.hasSubscription) {
    return fallback;
  }

  return snapshot.billing.planKey ?? fallback;
}

export function PrivacySettingsView({
  appUser,
  email,
  snapshot,
}: PrivacySettingsViewProps) {
  const languageCode = appUser.preferred_ui_language;
  const deletionCopy = getPrivacySettingsCopy(languageCode);
  const copy = getSettingsCopy(languageCode);
  const isFrozen = appUser.account_status === "deletion_requested";
  const roleLabel = copy.roles[appUser.role as AppUserRole];
  const statusLabel = copy.statuses[appUser.account_status as AccountStatus];

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      {isFrozen ? (
        <p className="rounded-[1.25rem] border border-[#d6c48d] bg-[#fff8e5] px-4 py-3 text-sm leading-6 text-[#6b5320]">
          {deletionCopy.deletionQueuedPrefix}
          {formatDateLabel(appUser.deletion_requested_at, languageCode)}
          {deletionCopy.deletionQueuedSuffix}
        </p>
      ) : null}

      <section className="grid gap-5">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">
            {copy.email}
          </p>
          <p className="text-base font-medium text-[color:var(--foreground)]">
            {email ?? copy.unavailableEmail}
          </p>
        </div>

        <dl className="grid gap-4 border-t border-[color:var(--line)] pt-5 sm:grid-cols-3">
          <AccountFact label={copy.accountType} value={roleLabel} />
          <AccountFact label={copy.status} value={statusLabel} />
          <PlanFact
            label={copy.plan}
            upgradeLabel={copy.upgrade}
            value={formatPlan(snapshot, copy.starterPlan)}
          />
        </dl>
      </section>

      <EditableProfileSection
        appUser={appUser}
        cancelLabel={copy.cancel}
        editLabel={copy.edit}
        frozenCopy={copy.profileFrozen}
      />

      <section className="grid gap-4 border-t border-[color:var(--line)] pt-6">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {copy.links}
        </h2>
        {appUser.role === "parent" && snapshot.linkedStudentDeletionTargets.length > 0 ? (
          <div className="grid gap-2">
            {snapshot.linkedStudentDeletionTargets.map((target) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--line)] py-3 last:border-b-0"
                key={target.targetUserId}
              >
                <p className="font-medium">{target.displayName}</p>
                <p className="text-sm text-[color:var(--ink-soft)]">
                  {copy.linkedStudent}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.noLinks}
          </p>
        )}

        <div className="grid gap-3">
          {appUser.role === "student" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.parentLinkDescription}
                </p>
                <Link className="button-base button-secondary justify-center" href="/app">
                  {copy.parentLinkButton}
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.tutorLinkDescription}
                </p>
                <Link className="button-base button-secondary justify-center" href="/app">
                  {copy.tutorLinkButton}
                </Link>
              </div>
            </>
          ) : appUser.role === "parent" ? (
            <Link className="button-base button-secondary" href="/app">
              {copy.parentManageOption}
            </Link>
          ) : appUser.role === "tutor" ? (
            <Link className="button-base button-secondary" href="/app">
              {copy.tutorManageOption}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 border-t border-[color:var(--line)] pt-6">
        <div className="grid gap-1">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.deletion}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.deleteNote}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid content-start gap-3">
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
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.deletionAdmin}
              </p>
            )}
          </div>

          {appUser.role === "parent" ? (
            <div className="grid content-start gap-3">
              <p className="font-medium">{copy.linkedStudents}</p>
              {snapshot.linkedStudentDeletionTargets.length === 0 ? (
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.noLinkedStudents}
                </p>
              ) : (
                <div className="grid gap-4">
                  {snapshot.linkedStudentDeletionTargets.map((target) => (
                    <div className="grid gap-2" key={target.targetUserId}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium">{target.displayName}</p>
                        <p className="text-sm text-[color:var(--ink-soft)]">
                          {copy.studentStatusLabel}:{" "}
                          {target.requestedAt
                            ? copy.studentRequested
                            : copy.studentDefault}
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
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
