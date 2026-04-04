"use client";

import { MemoryPanel } from "@/components/dashboard/memory/memory-panel";
import { ParentApprovalRequestForm } from "@/components/links/parent-approval-request-form";
import { TutorInviteForm } from "@/components/links/tutor-invite-form";
import type { AppUserRecord } from "@/lib/server/auth/types";
import type { StudentMemorySnapshot } from "@/lib/server/memory/types";

type StudentSettingsSupportSectionsProps = {
  appUser: AppUserRecord;
  memorySnapshot: StudentMemorySnapshot;
};

function getStudentSettingsSupportCopy(
  languageCode: AppUserRecord["preferred_ui_language"],
) {
  switch (languageCode) {
    case "en":
      return {
        supportEyebrow: "Support circle",
        supportTitle: "Keep your learning space and the right adults in sync.",
        supportBody:
          "Use this profile page for the durable parts of your account: who can support you, what banban should remember, and the settings that shape future homework sessions.",
        parentTitle: "Parent supervision",
        parentBody:
          "If your account still needs parent supervision, send the request from here instead of carrying it on the homework home screen.",
        parentOptionalTitle: "Parent link",
        parentOptionalBody:
          "Parent supervision is not required for your age band, so the main homework flow stays focused on the chat. Adult linkage can stay a later workflow.",
        tutorTitle: "Tutor invite",
        tutorBody:
          "Invite a tutor when you want an adult helper to review your work outside the live homework chat.",
        memoryTitle: "Learning memory",
        memoryBody:
          "This is the durable layer banban should keep between homework sessions: strengths, recurring blockers, preferences, and long-term notes.",
      };
    case "zh":
      return {
        supportEyebrow: "支援圈",
        supportTitle: "把學習空間與正確的大人支援整理在同一處。",
        supportBody:
          "這個個人頁面現在承載帳號裡比較長期的內容：誰能支援你、banban 應該記住什麼，以及會影響之後作業課程的設定。",
        parentTitle: "家長監護",
        parentBody:
          "如果你的帳號仍需要家長監護，就從這裡送出請求，而不是把它留在作業首頁上。",
        parentOptionalTitle: "家長連結",
        parentOptionalBody:
          "你的年齡區間不需要強制家長監護，所以主要作業流程可以專注在對話本身。成人連結可以留作之後再處理。",
        tutorTitle: "導師邀請",
        tutorBody:
          "如果你希望有大人在即時作業對話之外查看你的進度，可以從這裡邀請導師。",
        memoryTitle: "學習記憶",
        memoryBody:
          "這裡保存 banban 在不同作業之間仍該記住的內容：優勢、反覆卡住的點、偏好與長期學習筆記。",
      };
    default:
      return {
        supportEyebrow: "Cadre d'accompagnement",
        supportTitle: "Garder l'espace élève et les bons adultes au même endroit.",
        supportBody:
          "Cette page profil devient l'endroit des éléments durables du compte : qui peut t'accompagner, ce que banban doit retenir, et les réglages qui influencent les prochains devoirs.",
        parentTitle: "Supervision parentale",
        parentBody:
          "Si ton compte a encore besoin d'une supervision parentale, envoie la demande ici plutôt que depuis l'écran d'accueil des devoirs.",
        parentOptionalTitle: "Lien parent",
        parentOptionalBody:
          "La supervision parentale n'est pas obligatoire pour cette tranche d'âge, donc le flux devoir reste centré sur la discussion. Le lien adulte peut rester un workflow secondaire.",
        tutorTitle: "Invitation d'un tuteur",
        tutorBody:
          "Invite un tuteur si tu veux qu'un adulte relise ton travail en dehors du chat de devoir en direct.",
        memoryTitle: "Mémoire d'apprentissage",
        memoryBody:
          "Cette zone garde ce que banban doit retenir d'un devoir à l'autre : points forts, blocages récurrents, préférences et notes durables.",
      };
  }
}

export function StudentSettingsSupportSections({
  appUser,
  memorySnapshot,
}: StudentSettingsSupportSectionsProps) {
  const copy = getStudentSettingsSupportCopy(appUser.preferred_ui_language);

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.supportEyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {copy.supportTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.supportBody}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="grid gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <div className="space-y-2">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                {appUser.is_under_13 ? copy.parentTitle : copy.parentOptionalTitle}
              </h3>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {appUser.is_under_13 ? copy.parentBody : copy.parentOptionalBody}
              </p>
            </div>

            {appUser.is_under_13 ? (
              <ParentApprovalRequestForm
                languageCode={appUser.preferred_ui_language}
              />
            ) : null}
          </article>

          <article className="grid gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <div className="space-y-2">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                {copy.tutorTitle}
              </h3>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.tutorBody}
              </p>
            </div>

            <TutorInviteForm
              languageCode={appUser.preferred_ui_language}
              studentUserId={appUser.id}
            />
          </article>
        </div>
      </section>

      <MemoryPanel
        intro={copy.memoryBody}
        languageCode={appUser.preferred_ui_language}
        snapshot={memorySnapshot}
        studentUserId={appUser.id}
        title={copy.memoryTitle}
      />
    </div>
  );
}
