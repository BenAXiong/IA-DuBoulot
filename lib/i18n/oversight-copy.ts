import type { UiLanguageCode } from "@/lib/server/auth/types";

type LocalizedValue<T> = Record<UiLanguageCode, T>;

function pickLocalizedValue<T>(
  languageCode: UiLanguageCode,
  variants: LocalizedValue<T>,
) {
  return variants[languageCode];
}

function formatCount(
  languageCode: UiLanguageCode,
  count: number,
  variants: {
    fr: { singular: string; plural: string };
    en: { singular: string; plural: string };
    zh: string;
  },
) {
  if (languageCode === "zh") {
    return `${count} ${variants.zh}`;
  }

  const labels = variants[languageCode];
  return `${count} ${count === 1 ? labels.singular : labels.plural}`;
}

export function getQuotaAccessStateLabel(
  accessState: "available" | "warning" | "blocked",
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      available: "disponible",
      warning: "à surveiller",
      blocked: "bloqué",
    },
    en: {
      available: "available",
      warning: "watch closely",
      blocked: "blocked",
    },
    zh: {
      available: "可用",
      warning: "需留意",
      blocked: "受阻",
    },
  });

  return labels[accessState];
}

export function getAdultConversationAudienceLabel(
  audience: "parent" | "tutor",
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      parent: "Vue parent",
      tutor: "Vue tuteur",
    },
    en: {
      parent: "Parent view",
      tutor: "Tutor view",
    },
    zh: {
      parent: "家長視角",
      tutor: "家教視角",
    },
  });

  return labels[audience];
}

export function getAdminAuditActorRoleLabel(
  role: string | null,
  languageCode: UiLanguageCode,
) {
  if (!role) {
    return pickLocalizedValue(languageCode, {
      fr: "rôle inconnu",
      en: "unknown role",
      zh: "未知角色",
    });
  }

  const labels = pickLocalizedValue(languageCode, {
    fr: {
      parent: "parent",
      tutor: "tuteur",
      admin: "admin",
      student: "élève",
      unknown: "rôle inconnu",
    },
    en: {
      parent: "parent",
      tutor: "tutor",
      admin: "admin",
      student: "student",
      unknown: "unknown role",
    },
    zh: {
      parent: "家長",
      tutor: "家教",
      admin: "管理員",
      student: "學生",
      unknown: "未知角色",
    },
  });

  return labels[role as keyof typeof labels] ?? labels.unknown;
}

export function getAdminAuditActionLabel(
  action: string,
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      parent_session_review_view: "lecture parent",
      tutor_session_review_view: "lecture tuteur",
      tutor_note_create: "note privée créée",
      tutor_note_update: "note privée modifiée",
      tutor_note_delete: "note privée supprimée",
    },
    en: {
      parent_session_review_view: "parent review",
      tutor_session_review_view: "tutor review",
      tutor_note_create: "private note created",
      tutor_note_update: "private note updated",
      tutor_note_delete: "private note deleted",
    },
    zh: {
      parent_session_review_view: "家長檢視",
      tutor_session_review_view: "家教檢視",
      tutor_note_create: "已建立私人筆記",
      tutor_note_update: "已更新私人筆記",
      tutor_note_delete: "已刪除私人筆記",
    },
  });

  return labels[action as keyof typeof labels] ?? action;
}

export function getAdminAuditTargetTableLabel(
  targetTable: string,
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      conversations: "sessions",
      tutor_notes: "notes privées tuteur",
    },
    en: {
      conversations: "sessions",
      tutor_notes: "tutor private notes",
    },
    zh: {
      conversations: "課程",
      tutor_notes: "家教私人筆記",
    },
  });

  return labels[targetTable as keyof typeof labels] ?? targetTable;
}

export function getAdminAccessAuditCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      emptyTitle: "Aucun événement sensible n'a encore été journalisé.",
      emptyBody:
        "Les ouvertures de session parent ou tuteur et les mutations de notes privées apparaîtront ici.",
      eyebrow: "Audit sensible",
      title: "Lectures adultes et notes privées, visibles depuis une seule file.",
      body:
        "Cette vue donne au rôle admin une première surface de revue pour les accès parent ou tuteur et les changements de notes privées.",
      unknownActor: "acteur inconnu",
      routeUnavailable: "route indisponible",
      targetDetails: (
        targetTableLabel: string,
        conversationId: string | null,
      ) =>
        `Table cible : ${targetTableLabel}${conversationId ? ` | session ${conversationId}` : ""}`,
    },
    en: {
      emptyTitle: "No sensitive event has been logged yet.",
      emptyBody:
        "Parent or tutor session openings and private-note mutations will appear here.",
      eyebrow: "Sensitive audit",
      title: "Adult reads and private notes, visible from one queue.",
      body:
        "This gives the admin role a first review surface for parent or tutor access and private-note changes.",
      unknownActor: "unknown actor",
      routeUnavailable: "route unavailable",
      targetDetails: (
        targetTableLabel: string,
        conversationId: string | null,
      ) =>
        `Target table: ${targetTableLabel}${conversationId ? ` | session ${conversationId}` : ""}`,
    },
    zh: {
      emptyTitle: "目前還沒有記錄任何敏感事件。",
      emptyBody: "家長或家教開啟課程，以及私人筆記的異動，之後都會顯示在這裡。",
      eyebrow: "敏感稽核",
      title: "成人檢視與私人筆記，集中顯示在同一條稽核流。",
      body:
        "這個畫面先為管理員提供一個初步檢視面板，用來查看家長或家教的存取，以及私人筆記的變更。",
      unknownActor: "未知操作者",
      routeUnavailable: "路由不可用",
      targetDetails: (
        targetTableLabel: string,
        conversationId: string | null,
      ) =>
        `目標資料表：${targetTableLabel}${conversationId ? ` | 課程 ${conversationId}` : ""}`,
    },
  });
}

export function getAdultConversationReviewCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Relecture adulte",
      body: (audienceLabel: string, studentName: string) =>
        `${audienceLabel} sur la session de ${studentName}. La lecture reste strictement consultative pour respecter les frontières d'accès.`,
      graded: "Devoir noté",
      practice: "Exercice libre",
      chronologyTitle: "Chronologie",
      createdOn: (dateLabel: string | null) => `Créée le ${dateLabel}`,
      lastActivity: (dateLabel: string | null) =>
        `Dernière activité : ${dateLabel}`,
      completedOn: (dateLabel: string | null) => `Clôturée le ${dateLabel}`,
      studentActive: "Session encore active côté élève.",
      backToStudent: "Retour au suivi élève",
      conversationEyebrow: "Conversation",
      conversationBody: "Transcript de travail en lecture seule.",
      workspaceEyebrow: "Espace de travail",
      workspaceBody:
        "Lecture du brouillon et des notes sauvegardées pendant la session.",
      workspaceLabels: {
        assignment: "Consigne",
        reviewedText: "Texte relu",
        plan: "Plan",
        draft: "Brouillon",
      },
      workspaceEmpty: {
        assignment: "Aucune consigne sauvegardée.",
        reviewedText: "Aucun texte relu sauvegardé.",
        plan: "Aucun plan noté.",
        draft: "Aucun brouillon sauvegardé.",
      },
      attachmentsEyebrow: "Pièces jointes",
      attachmentsBody:
        "Les fichiers restent privés ; cette vue montre seulement leurs métadonnées et l'état d'extraction.",
      noAttachments: "Aucune pièce jointe pour cette session.",
      attachmentMeta: (
        mimeType: string,
        sizeKb: number,
        pageCount: number | null,
      ) =>
        `${mimeType} | ${sizeKb} KB${pageCount ? ` | ${pageCount} page(s)` : ""}`,
    },
    en: {
      eyebrow: "Adult review",
      body: (audienceLabel: string, studentName: string) =>
        `${audienceLabel} for ${studentName}'s session. This stays strictly read-only to respect access boundaries.`,
      graded: "Graded homework",
      practice: "Open exercise",
      chronologyTitle: "Timeline",
      createdOn: (dateLabel: string | null) => `Created on ${dateLabel}`,
      lastActivity: (dateLabel: string | null) =>
        `Last activity: ${dateLabel}`,
      completedOn: (dateLabel: string | null) => `Completed on ${dateLabel}`,
      studentActive: "The session is still active on the student side.",
      backToStudent: "Back to student view",
      conversationEyebrow: "Conversation",
      conversationBody: "Read-only work transcript.",
      workspaceEyebrow: "Workspace",
      workspaceBody: "Read the draft and notes saved during the session.",
      workspaceLabels: {
        assignment: "Prompt",
        reviewedText: "Reviewed text",
        plan: "Plan",
        draft: "Draft",
      },
      workspaceEmpty: {
        assignment: "No saved prompt.",
        reviewedText: "No saved reviewed text.",
        plan: "No saved plan.",
        draft: "No saved draft.",
      },
      attachmentsEyebrow: "Attachments",
      attachmentsBody:
        "Files remain private; this view only shows metadata and extraction state.",
      noAttachments: "No attachment for this session.",
      attachmentMeta: (
        mimeType: string,
        sizeKb: number,
        pageCount: number | null,
      ) =>
        `${mimeType} | ${sizeKb} KB${pageCount ? ` | ${pageCount} page(s)` : ""}`,
    },
    zh: {
      eyebrow: "成人檢視",
      body: (audienceLabel: string, studentName: string) =>
        `${audienceLabel}：${studentName} 的課程。這個畫面會維持嚴格唯讀，以符合權限邊界。`,
      graded: "已評分作業",
      practice: "自由練習",
      chronologyTitle: "時間軸",
      createdOn: (dateLabel: string | null) => `建立於 ${dateLabel}`,
      lastActivity: (dateLabel: string | null) => `最近活動：${dateLabel}`,
      completedOn: (dateLabel: string | null) => `完成於 ${dateLabel}`,
      studentActive: "這個課程在學生端仍然是進行中。",
      backToStudent: "回到學生追蹤",
      conversationEyebrow: "對話",
      conversationBody: "唯讀的作業對話紀錄。",
      workspaceEyebrow: "工作區",
      workspaceBody: "查看課程期間儲存的草稿與筆記。",
      workspaceLabels: {
        assignment: "題目",
        reviewedText: "重讀文字",
        plan: "計畫",
        draft: "草稿",
      },
      workspaceEmpty: {
        assignment: "沒有已儲存的題目。",
        reviewedText: "沒有已儲存的重讀文字。",
        plan: "沒有已儲存的計畫。",
        draft: "沒有已儲存的草稿。",
      },
      attachmentsEyebrow: "附件",
      attachmentsBody:
        "檔案仍維持私人；這裡只顯示中繼資料與擷取狀態。",
      noAttachments: "這個課程沒有附件。",
      attachmentMeta: (
        mimeType: string,
        sizeKb: number,
        pageCount: number | null,
      ) =>
        `${mimeType} | ${sizeKb} KB${pageCount ? ` | ${pageCount} 頁` : ""}`,
    },
  });
}

export function getParentStudentDetailCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Suivi parent",
      body:
        "Vue parent orientée supervision : sessions récentes, résumé hebdo et lien tuteur si besoin.",
      under13: "Moins de 13 ans",
      weeklySummaryTitle: "Résumé 7 jours",
      weeklySummarySessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session terminée", plural: "sessions terminées" },
          en: { singular: "completed session", plural: "completed sessions" },
          zh: "個已完成課程",
        }),
      weeklyWindow: (start: string | null, end: string | null) =>
        `Fenêtre : ${start} -> ${end}`,
      backToDashboard: "Retour au tableau de bord parent",
      paidPlan: "Accès Family",
      trialPlan: "Essai gratuit",
      sessionsLabel: "Sessions",
      uploadsLabel: "Uploads",
      quotaLabel: "État quota",
      recentSessionsEyebrow: "Sessions récentes",
      recentSessionsBody:
        "Ouvre une session pour consulter le résumé parent et le transcript en lecture seule.",
      noSessions: "Aucune session visible pour cet élève.",
      summaryBadge: (language: string) => `Résumé ${language.toUpperCase()}`,
      noRecommendation: "Aucune recommandation parent n'est encore disponible.",
      noDate: "Date indisponible",
      open: "Ouvrir",
      memoryTitle: "Mémoire pédagogique visible pour cet élève lié",
      memoryIntro:
        "Le parent peut relire et corriger les observations pédagogiques durables sans toucher aux données brutes de session.",
      weeklyRhythmEyebrow: "Rythme hebdo",
      weeklyRhythmBody:
        "Le résumé hebdomadaire reprend le volume récent et la prochaine étape proposée.",
      noWeeklySessions: "Aucune session terminée sur cette fenêtre.",
      completedSessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session", plural: "sessions" },
          en: { singular: "session", plural: "sessions" },
          zh: "個課程",
        }),
      noRecentSummary: "Aucun résumé parent récent.",
      nextStep: (text: string) => `Prochaine étape : ${text}`,
    },
    en: {
      eyebrow: "Parent oversight",
      body:
        "Parent view focused on supervision: recent sessions, weekly summary, and a tutor link when needed.",
      under13: "Under 13",
      weeklySummaryTitle: "7-day summary",
      weeklySummarySessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session terminée", plural: "sessions terminées" },
          en: { singular: "completed session", plural: "completed sessions" },
          zh: "個已完成課程",
        }),
      weeklyWindow: (start: string | null, end: string | null) =>
        `Window: ${start} -> ${end}`,
      backToDashboard: "Back to parent dashboard",
      paidPlan: "Family access",
      trialPlan: "Free trial",
      sessionsLabel: "Sessions",
      uploadsLabel: "Uploads",
      quotaLabel: "Quota state",
      recentSessionsEyebrow: "Recent sessions",
      recentSessionsBody:
        "Open a session to review the parent summary and the read-only transcript.",
      noSessions: "No visible session for this student.",
      summaryBadge: (language: string) => `Summary ${language.toUpperCase()}`,
      noRecommendation: "No parent recommendation is available yet.",
      noDate: "Date unavailable",
      open: "Open",
      memoryTitle: "Visible learning memory for this linked student",
      memoryIntro:
        "The parent can review and correct durable learning observations without touching raw session data.",
      weeklyRhythmEyebrow: "Weekly rhythm",
      weeklyRhythmBody:
        "The weekly summary reflects recent volume and the suggested next step.",
      noWeeklySessions: "No completed session in this window.",
      completedSessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session", plural: "sessions" },
          en: { singular: "session", plural: "sessions" },
          zh: "個課程",
        }),
      noRecentSummary: "No recent parent summary.",
      nextStep: (text: string) => `Next step: ${text}`,
    },
    zh: {
      eyebrow: "家長追蹤",
      body: "家長視角聚焦在監督：最近課程、每週摘要，以及需要時的家教連結。",
      under13: "未滿 13 歲",
      weeklySummaryTitle: "7 天摘要",
      weeklySummarySessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session terminée", plural: "sessions terminées" },
          en: { singular: "completed session", plural: "completed sessions" },
          zh: "個已完成課程",
        }),
      weeklyWindow: (start: string | null, end: string | null) =>
        `區間：${start} -> ${end}`,
      backToDashboard: "回到家長儀表板",
      paidPlan: "Family 方案",
      trialPlan: "免費試用",
      sessionsLabel: "課程",
      uploadsLabel: "上傳",
      quotaLabel: "額度狀態",
      recentSessionsEyebrow: "最近課程",
      recentSessionsBody: "打開課程後，可以查看家長摘要與唯讀對話紀錄。",
      noSessions: "這位學生目前沒有可見課程。",
      summaryBadge: (language: string) => `摘要 ${language.toUpperCase()}`,
      noRecommendation: "目前還沒有家長建議。",
      noDate: "日期不可用",
      open: "打開",
      memoryTitle: "這位連結學生可見的學習記憶",
      memoryIntro:
        "家長可以重讀並修正長期學習觀察，但不會直接改動原始課程資料。",
      weeklyRhythmEyebrow: "每週節奏",
      weeklyRhythmBody: "每週摘要會整理最近的使用量與建議的下一步。",
      noWeeklySessions: "這個區間內還沒有已完成課程。",
      completedSessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session", plural: "sessions" },
          en: { singular: "session", plural: "sessions" },
          zh: "個課程",
        }),
      noRecentSummary: "目前沒有最近的家長摘要。",
      nextStep: (text: string) => `下一步：${text}`,
    },
  });
}

export function getTutorStudentDetailCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Suivi tuteur",
      body:
        "Vue tuteur orientée progression : sessions récentes, fragilités récurrentes et notes privées invisibles à l'élève.",
      recentSessionCount: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session", plural: "sessions" },
          en: { singular: "session", plural: "sessions" },
          zh: "個課程",
        }),
      pinnedNotes: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "note épinglée", plural: "notes épinglées" },
          en: { singular: "pinned note", plural: "pinned notes" },
          zh: "則置頂筆記",
        }),
      weaknessesTitle: "Fragilités observées",
      noWeaknesses: "Aucun tag faible consolidé pour l'instant.",
      backToDashboard: "Retour au tableau de bord tuteur",
      recentSessionsEyebrow: "Sessions récentes",
      recentSessionsBody:
        "Ouvre une session pour lire le transcript, la synthèse tuteur et ajouter une note liée à cette séance si besoin.",
      noSessions: "Aucune session visible pour cet élève.",
      noRecommendation: "Aucune recommandation tuteur n'est encore disponible.",
      noDate: "Date indisponible",
      open: "Ouvrir",
      nextTopicsEyebrow: "Prochains sujets",
      nextTopicsEmpty:
        "Les recommandations apparaîtront ici quand des synthèses tuteur auront été générées sur plusieurs sessions.",
      notesTitle: "Notes privées du suivi",
      notesBody:
        "Ces notes restent invisibles pour l'élève et pour le parent. Utilise-les pour garder des hypothèses pédagogiques et une trace des prochaines interventions.",
    },
    en: {
      eyebrow: "Tutor oversight",
      body:
        "Tutor view focused on progress: recent sessions, repeated weak points, and private notes hidden from the student.",
      recentSessionCount: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session", plural: "sessions" },
          en: { singular: "session", plural: "sessions" },
          zh: "個課程",
        }),
      pinnedNotes: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "note épinglée", plural: "notes épinglées" },
          en: { singular: "pinned note", plural: "pinned notes" },
          zh: "則置頂筆記",
        }),
      weaknessesTitle: "Observed weak points",
      noWeaknesses: "No consolidated weak tag yet.",
      backToDashboard: "Back to tutor dashboard",
      recentSessionsEyebrow: "Recent sessions",
      recentSessionsBody:
        "Open a session to read the transcript, the tutor summary, and add a note tied to that session when needed.",
      noSessions: "No visible session for this student.",
      noRecommendation: "No tutor recommendation is available yet.",
      noDate: "Date unavailable",
      open: "Open",
      nextTopicsEyebrow: "Next topics",
      nextTopicsEmpty:
        "Recommendations will appear here once tutor summaries have been generated across several sessions.",
      notesTitle: "Private follow-up notes",
      notesBody:
        "These notes stay hidden from the student and the parent. Use them to keep pedagogical hypotheses and a record of the next interventions.",
    },
    zh: {
      eyebrow: "家教追蹤",
      body:
        "家教視角聚焦在進展：最近課程、反覆出現的薄弱點，以及學生看不到的私人筆記。",
      recentSessionCount: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session", plural: "sessions" },
          en: { singular: "session", plural: "sessions" },
          zh: "個課程",
        }),
      pinnedNotes: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "note épinglée", plural: "notes épinglées" },
          en: { singular: "pinned note", plural: "pinned notes" },
          zh: "則置頂筆記",
        }),
      weaknessesTitle: "觀察到的薄弱點",
      noWeaknesses: "目前還沒有整理好的薄弱標籤。",
      backToDashboard: "回到家教儀表板",
      recentSessionsEyebrow: "最近課程",
      recentSessionsBody:
        "打開課程後，可以閱讀對話紀錄、家教摘要，必要時再補上一則與該堂課相關的筆記。",
      noSessions: "這位學生目前沒有可見課程。",
      noRecommendation: "目前還沒有家教建議。",
      noDate: "日期不可用",
      open: "打開",
      nextTopicsEyebrow: "下一批主題",
      nextTopicsEmpty:
        "當多個課程已產生家教摘要後，這裡才會開始顯示建議。",
      notesTitle: "追蹤用私人筆記",
      notesBody:
        "這些筆記對學生與家長都不可見。你可以用來記錄教學假設，以及下一步要介入的方向。",
    },
  });
}

export function getSummaryLanguagePanelCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      empty: "Aucun résumé parent n'est encore disponible pour cette session.",
      eyebrow: "Résumé parent",
      nextStep: (text: string) => `Prochaine étape : ${text}`,
    },
    en: {
      empty: "No parent summary is available for this session yet.",
      eyebrow: "Parent summary",
      nextStep: (text: string) => `Next step: ${text}`,
    },
    zh: {
      empty: "這個課程目前還沒有家長摘要。",
      eyebrow: "家長摘要",
      nextStep: (text: string) => `下一步：${text}`,
    },
  });
}

export function getTutorSummaryPanelCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      unavailableTitle: "Synthèse tuteur indisponible.",
      unavailableBody:
        "La session n'a pas encore produit d'insight tuteur exploitable.",
      eyebrow: "Synthèse tuteur",
      nextIntervention: (text: string) =>
        `Prochaine intervention conseillée : ${text}`,
    },
    en: {
      unavailableTitle: "Tutor summary unavailable.",
      unavailableBody:
        "This session has not produced a usable tutor insight yet.",
      eyebrow: "Tutor summary",
      nextIntervention: (text: string) =>
        `Suggested next intervention: ${text}`,
    },
    zh: {
      unavailableTitle: "目前沒有家教摘要。",
      unavailableBody: "這個課程還沒有產生可用的家教洞察。",
      eyebrow: "家教摘要",
      nextIntervention: (text: string) => `建議的下一步介入：${text}`,
    },
  });
}

export function getTutorNotesPanelCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Notes privées",
      createError: "Impossible de créer cette note privée.",
      updateError: "Impossible de mettre à jour cette note.",
      deleteError: "Impossible de supprimer cette note.",
      placeholders: {
        session:
          "Note privée sur cette session : point de vigilance, idée pour la prochaine séance, rappel pédagogique...",
        general:
          "Note privée générale sur l'élève : habitudes, priorités, points à suivre...",
      },
      pinLabel: "Épingler cette note",
      saving: "Enregistrement...",
      addNote: "Ajouter la note",
      empty: "Aucune note privée n'est encore enregistrée pour ce suivi.",
      pinned: "Épinglée",
      linkedToSession: "Liée à une session",
      generalNote: "Note générale",
      save: "Sauver",
      cancel: "Annuler",
      edit: "Modifier",
      delete: "Supprimer",
    },
    en: {
      eyebrow: "Private notes",
      createError: "Unable to create this private note.",
      updateError: "Unable to update this note.",
      deleteError: "Unable to delete this note.",
      placeholders: {
        session:
          "Private note about this session: warning sign, idea for the next lesson, teaching reminder...",
        general:
          "General private note about the student: habits, priorities, points to follow...",
      },
      pinLabel: "Pin this note",
      saving: "Saving...",
      addNote: "Add note",
      empty: "No private note has been saved for this follow-up yet.",
      pinned: "Pinned",
      linkedToSession: "Linked to a session",
      generalNote: "General note",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
    },
    zh: {
      eyebrow: "私人筆記",
      createError: "無法建立這則私人筆記。",
      updateError: "無法更新這則筆記。",
      deleteError: "無法刪除這則筆記。",
      placeholders: {
        session:
          "關於這堂課的私人筆記：需要留意的點、下次課程的想法、教學提醒...",
        general:
          "關於這位學生的一般私人筆記：習慣、優先事項、需要追蹤的點...",
      },
      pinLabel: "置頂這則筆記",
      saving: "儲存中...",
      addNote: "加入筆記",
      empty: "這個追蹤目前還沒有任何私人筆記。",
      pinned: "已置頂",
      linkedToSession: "連結到某堂課",
      generalNote: "一般筆記",
      save: "儲存",
      cancel: "取消",
      edit: "編輯",
      delete: "刪除",
    },
  });
}

export function getTutorNotesServerCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      expectedObject: "Le corps JSON doit être un objet.",
      invalidJson: "Corps JSON invalide.",
      invalidFields: "Un ou plusieurs champs sont invalides.",
      notFound: "Note tuteur introuvable.",
      fieldErrors: {
        uuid: "Un UUID valide est requis.",
        noteTextRequired:
          "Le texte de la note est requis et doit contenir 4000 caractères ou moins.",
        conversationStudent:
          "La session doit appartenir à l'élève lié.",
      },
      service: {
        validateConversation:
          "Impossible de valider la session liée.",
        loadNote: "Impossible de charger la note tuteur.",
        createNote: "Impossible de créer la note tuteur.",
        updateNote: "Impossible de mettre à jour la note tuteur.",
        deleteNote: "Impossible de supprimer la note tuteur.",
      },
    },
    en: {
      expectedObject: "The JSON body must be an object.",
      invalidJson: "Invalid JSON body.",
      invalidFields: "One or more fields are invalid.",
      notFound: "Tutor note not found.",
      fieldErrors: {
        uuid: "A valid UUID is required.",
        noteTextRequired:
          "Note text is required and must be 4000 characters or fewer.",
        conversationStudent:
          "Conversation must belong to the linked student.",
      },
      service: {
        validateConversation:
          "Unable to validate the linked conversation.",
        loadNote: "Unable to load the tutor note.",
        createNote: "Unable to create the tutor note.",
        updateNote: "Unable to update the tutor note.",
        deleteNote: "Unable to delete the tutor note.",
      },
    },
    zh: {
      expectedObject: "JSON 內容必須是物件。",
      invalidJson: "JSON 內容無效。",
      invalidFields: "一個或多個欄位無效。",
      notFound: "找不到家教筆記。",
      fieldErrors: {
        uuid: "必須提供有效的 UUID。",
        noteTextRequired: "筆記內容為必填，且不得超過 4000 個字元。",
        conversationStudent: "這堂課必須屬於已連結的學生。",
      },
      service: {
        validateConversation: "無法驗證連結的課程。",
        loadNote: "無法載入家教筆記。",
        createNote: "無法建立家教筆記。",
        updateNote: "無法更新家教筆記。",
        deleteNote: "無法刪除家教筆記。",
      },
    },
  });
}

export function getBillingStatusCardCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Facturation",
      body:
        "Le statut payeur reste visible côté parent et donne un point d'entrée direct vers l'activation ou la gestion Lemon Squeezy.",
      plan: "Plan",
      status: "Statut",
      unknown: "inconnu",
      trialEndsAt: "Fin d'essai",
      periodEndsAt: "Fin de période",
      openPortal: "Ouvrir le portail billing",
      resumeSubscription: "Reprendre l'abonnement",
      noSubscription: "Aucun abonnement payeur visible pour ce compte parent.",
      activateFamily: "Activer Family",
    },
    en: {
      eyebrow: "Billing",
      body:
        "The payer status stays visible on the parent side and offers a direct path to activate or manage Lemon Squeezy.",
      plan: "Plan",
      status: "Status",
      unknown: "unknown",
      trialEndsAt: "Trial ends",
      periodEndsAt: "Period ends",
      openPortal: "Open billing portal",
      resumeSubscription: "Resume subscription",
      noSubscription: "No payer subscription is visible for this parent account.",
      activateFamily: "Activate Family",
    },
    zh: {
      eyebrow: "付費狀態",
      body:
        "家長端會持續看到付費者狀態，並可直接前往啟用或管理 Lemon Squeezy。",
      plan: "方案",
      status: "狀態",
      unknown: "未知",
      trialEndsAt: "試用結束",
      periodEndsAt: "週期結束",
      openPortal: "打開付費入口",
      resumeSubscription: "恢復訂閱",
      noSubscription: "這個家長帳號目前沒有可見的付費訂閱。",
      activateFamily: "啟用 Family",
    },
  });
}

export function getBillingServerCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      noManageableSubscription:
        "Aucun abonnement payeur n'est encore disponible à gérer.",
    },
    en: {
      noManageableSubscription:
        "No payer subscription is available for management yet.",
    },
    zh: {
      noManageableSubscription:
        "目前還沒有可管理的付費訂閱。",
    },
  });
}
