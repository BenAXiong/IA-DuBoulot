import { getStudentAgeBandOptions } from "@/lib/i18n/config";
import type {
  AccountStatus,
  AgeBand,
  UiLanguageCode,
} from "@/lib/server/auth/types";
import type { MemoryCategory } from "@/lib/server/memory/types";
import type {
  ConversationStatus,
  StudentDashboardStartState,
  StudentDashboardSupportSnapshot,
  StudentDashboardUsageSnapshot,
} from "@/lib/server/student-dashboard/types";

type LocalizedValue<T> = Record<UiLanguageCode, T>;

function pickLocalizedValue<T>(
  languageCode: UiLanguageCode,
  variants: LocalizedValue<T>,
) {
  return variants[languageCode];
}

export function getDashboardAccountStatusLabel(
  status: AccountStatus,
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      active: "Actif",
      pending_parent_approval: "En attente parent",
      suspended: "Suspendu",
      deletion_requested: "Suppression demandée",
    },
    en: {
      active: "Active",
      pending_parent_approval: "Pending parent approval",
      suspended: "Suspended",
      deletion_requested: "Deletion requested",
    },
    zh: {
      active: "啟用中",
      pending_parent_approval: "待家長核准",
      suspended: "已停用",
      deletion_requested: "已要求刪除",
    },
  });

  return labels[status];
}

export function getDashboardAgeBandLabel(
  ageBand: AgeBand | null,
  languageCode: UiLanguageCode,
) {
  if (!ageBand) {
    return null;
  }

  return (
    getStudentAgeBandOptions(languageCode).find((option) => option.value === ageBand)
      ?.label ?? ageBand
  );
}

export function getLocalizedStartStateLabel(
  startState: StudentDashboardStartState,
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      ready: "Prêt",
      pending_parent_approval: "En attente parent",
      quota_blocked: "Quota bloqué",
      suspended: "Suspendu",
      deletion_requested: "Suppression demandée",
    },
    en: {
      ready: "Ready",
      pending_parent_approval: "Pending parent approval",
      quota_blocked: "Quota blocked",
      suspended: "Suspended",
      deletion_requested: "Deletion requested",
    },
    zh: {
      ready: "可開始",
      pending_parent_approval: "待家長核准",
      quota_blocked: "額度受阻",
      suspended: "已停用",
      deletion_requested: "已要求刪除",
    },
  });

  return labels[startState];
}

export function getLocalizedStartStateBody(
  startState: StudentDashboardStartState,
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      ready:
        "Le compte peut lancer un nouveau devoir et reprendre les sessions récentes.",
      pending_parent_approval:
        "Le prochain devoir reste bloqué tant qu'un parent n'a pas activé le lien de supervision.",
      quota_blocked:
        "Le compte a atteint sa limite d'essai ou de quota. La reprise passe maintenant par le statut de facturation et le renouvellement de la période.",
      suspended:
        "Le compte ne peut pas démarrer de nouveau devoir tant que la suspension n'est pas levée.",
      deletion_requested:
        "Le compte reste gelé pendant la file de suppression et n'accepte plus de nouvelle activité.",
    },
    en: {
      ready:
        "The account can start a new homework flow and resume recent sessions.",
      pending_parent_approval:
        "The next homework stays blocked until a parent activates the supervision link.",
      quota_blocked:
        "The account has reached its trial or quota limit. Resuming now depends on billing status and the next usage window.",
      suspended:
        "The account cannot start new homework until the suspension is lifted.",
      deletion_requested:
        "The account stays frozen during the deletion queue and no longer accepts new activity.",
    },
    zh: {
      ready: "此帳號可以開始新作業，也可以回到最近的課程。",
      pending_parent_approval:
        "在家長啟用監督連結前，下一份作業仍會被阻擋。",
      quota_blocked:
        "此帳號已達試用或額度上限。要繼續使用，現在取決於付費狀態與下一個使用期間。",
      suspended: "在停用解除前，帳號不能開始新的作業。",
      deletion_requested:
        "帳號在刪除排隊期間會維持凍結，不再接受新的活動。",
    },
  });

  return labels[startState];
}

export function getLocalizedConversationStatusLabel(
  status: ConversationStatus,
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      active: "En cours",
      completed: "Terminé",
      archived: "Archivée",
    },
    en: {
      active: "Active",
      completed: "Completed",
      archived: "Archived",
    },
    zh: {
      active: "進行中",
      completed: "已完成",
      archived: "已封存",
    },
  });

  return labels[status];
}

export function getStudentDashboardStartPanelCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      paidPlan: "Accès Family",
      trialPlan: "Essai gratuit",
      supervisionRequired: "Supervision requise",
      autonomousStart: "Départ autonome",
      recentSessions: (count: number) =>
        `${count} session${count > 1 ? "s" : ""} récente${count > 1 ? "s" : ""}`,
      eyebrow: "Point de départ élève",
      titleReady: "Le prochain devoir commence ici.",
      titleBlocked: "Le prochain devoir attend encore un jalon de confiance.",
      buttons: {
        ready: "Nouveau devoir",
        waitParent: "Attendre le parent",
        viewQuota: "Voir le quota",
        blocked: "Départ bloqué",
      },
      actionHint: "Commence un nouveau devoir ou reprends le fil depuis ici.",
      recentSubjectsEyebrow: "Matières récentes",
      recentSubjectsTitle:
        "Les prochains raccourcis d'intake partiront des sujets déjà vus.",
      noRecentSubjects:
        "Aucun sujet récent pour l'instant. Le premier devoir fixera les tags les plus utiles pour la reprise de session.",
      intakeBody:
        "C'est ici que l'élève commence un nouveau devoir, avec le bon cadre dès le départ.",
    },
    en: {
      paidPlan: "Family access",
      trialPlan: "Free trial",
      supervisionRequired: "Supervision required",
      autonomousStart: "Autonomous start",
      recentSessions: (count: number) =>
        `${count} recent session${count === 1 ? "" : "s"}`,
      eyebrow: "Student starting point",
      titleReady: "The next homework starts here.",
      titleBlocked: "The next homework is still waiting on a trust milestone.",
      buttons: {
        ready: "New homework",
        waitParent: "Wait for parent",
        viewQuota: "View quota",
        blocked: "Start blocked",
      },
      actionHint: "Start a new homework or pick up where you left off from here.",
      recentSubjectsEyebrow: "Recent subjects",
      recentSubjectsTitle:
        "The next intake shortcuts will start from subjects already seen.",
      noRecentSubjects:
        "No recent subjects yet. The first homework will establish the most useful tags for resuming work later.",
      intakeBody:
        "This is where a new homework session begins, with the right guardrails already in place.",
    },
    zh: {
      paidPlan: "Family 方案",
      trialPlan: "免費試用",
      supervisionRequired: "需要監督",
      autonomousStart: "可自主開始",
      recentSessions: (count: number) => `最近 ${count} 個課程`,
      eyebrow: "學生起始點",
      titleReady: "下一份作業從這裡開始。",
      titleBlocked: "下一份作業仍在等待一個信任節點。",
      buttons: {
        ready: "新作業",
        waitParent: "等待家長",
        viewQuota: "查看額度",
        blocked: "起始受阻",
      },
      actionHint: "可從這裡開始新作業，或接續上次進度。",
      recentSubjectsEyebrow: "最近科目",
      recentSubjectsTitle: "下一批 intake 快捷入口會從已出現過的科目出發。",
      noRecentSubjects:
        "目前還沒有最近科目。第一份作業會建立之後續接最有用的標籤。",
      intakeBody:
        "新的作業會從這裡開始，而且一開始就帶著正確的使用框架。",
    },
  });
}

export function getStudentDashboardRecentSessionsCopy(
  languageCode: UiLanguageCode,
) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Sessions récentes",
      title: "Reprendre vite, puis basculer vers l'historique complet si besoin.",
      noRecentTag: "Aucun tag récent",
      viewAll: "Tout voir",
      emptyTitle: "Aucune session enregistrée pour l'instant.",
      emptyBody:
        "Dès que le premier devoir sera lancé, cette zone affichera les reprises utiles et les matières les plus récentes.",
      graded: "Notée",
      practice: "Exercice libre",
      body:
        "Cette session peut être rouverte ici, puis approfondie dans l'historique complet si besoin.",
      lastActivity: "Dernière activité",
      noDate: "Date indisponible",
      resume: "Reprendre",
    },
    en: {
      eyebrow: "Recent sessions",
      title: "Resume quickly, then switch to full history when needed.",
      noRecentTag: "No recent tag",
      viewAll: "View all",
      emptyTitle: "No saved session yet.",
      emptyBody:
        "As soon as the first homework starts, this area will show the most useful recent sessions and subjects to pick up again.",
      graded: "Graded",
      practice: "Open exercise",
      body:
        "This session can be reopened here first, then revisited in full history when needed.",
      lastActivity: "Last activity",
      noDate: "Date unavailable",
      resume: "Resume",
    },
    zh: {
      eyebrow: "最近課程",
      title: "先快速續接，需要時再切到完整歷程。",
      noRecentTag: "沒有最近標籤",
      viewAll: "查看全部",
      emptyTitle: "目前還沒有已儲存的課程。",
      emptyBody:
        "第一份作業開始後，這裡就會顯示最值得優先續接的最近課程與科目。",
      graded: "已評分",
      practice: "自由練習",
      body: "你可以先在這裡重新打開這個課程，需要時再進入完整歷程。",
      lastActivity: "最近活動",
      noDate: "日期不可用",
      resume: "續接",
    },
  });
}

export function getStudentDashboardSupportCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      adultFrameEyebrow: "Cadre adulte",
      approvalRequired: "Parent requis",
      approvalOptional: "Parent optionnel",
      activeParents: (count: number) => `${count} parent actif`,
      activeTutors: (count: number) => `${count} tuteur actif`,
      pendingParents: (count: number) => `${count} parent en attente`,
      pendingTutors: (count: number) => `${count} tuteur en attente`,
      supervisionState: "État de supervision",
      supervisionApproved: (dateLabel: string) =>
        `Dernière approbation parent enregistrée le ${dateLabel}.`,
      supervisionMissing:
        "Aucune approbation parent active n'est encore enregistrée.",
      supervisionOptionalBody:
        "Le compte peut avancer sans approbation parent obligatoire.",
      usageEyebrow: "Usage",
      paidPlan: "Plan Family",
      trialPlan: "Essai gratuit",
      available: "Disponible",
      warning: "À surveiller",
      blocked: "Bloqué",
      trialUntil: (dateLabel: string) => `Essai jusqu'au ${dateLabel}`,
      cards: {
        sessions: "Sessions",
        uploads: "Uploads",
        assistantMessages: "Messages IA",
      },
      remaining: "Restant",
      inputTokens: "Tokens entrée",
      outputTokens: "Tokens sortie",
      supportHeadline: (support: StudentDashboardSupportSnapshot) => {
        if (support.isUnder13) {
          if (support.parentApprovedAt || support.parentLinks.active > 0) {
            return "Supervision parent active";
          }

          return "Validation parent attendue";
        }

        if (support.tutorLinks.active > 0) {
          return "Cadre adulte branché";
        }

        return "Aucun adulte lié pour l'instant";
      },
      usageHeadline: (usage: StudentDashboardUsageSnapshot) => {
        if (usage.quota.accessState === "blocked") {
          return "Essai ou quota atteint";
        }

        if (usage.quota.accessState === "warning") {
          return usage.quota.planKind === "paid"
            ? "Accès actif, marge à surveiller"
            : "Essai en cours, marge bientôt réduite";
        }

        if (usage.hasUsage) {
          return "Activité suivie sur la période courante";
        }

        return "Le suivi d'usage démarre avec le premier devoir";
      },
      usageBody: (
        usage: StudentDashboardUsageSnapshot,
        trialEndsAtLabel: string | null,
      ) => {
        if (!usage.quota.trialStartedAt && usage.quota.planKind === "trial") {
          return "L'essai gratuit commencera avec le premier devoir enregistré.";
        }

        if (usage.quota.blockReason === "trial_window_expired") {
          return "La période d'essai est terminée. Le prochain devoir dépend maintenant d'un abonnement payeur actif.";
        }

        if (usage.quota.blockReason === "sessions") {
          return "La limite de sessions de cette période est atteinte.";
        }

        if (usage.quota.blockReason === "uploads") {
          return "La limite d'uploads de cette période est atteinte.";
        }

        if (usage.quota.blockReason === "assistant_messages") {
          return "La limite de messages IA de cette période est atteinte.";
        }

        if (
          usage.quota.blockReason === "input_tokens" ||
          usage.quota.blockReason === "output_tokens"
        ) {
          return "Le budget IA de cette période est atteint.";
        }

        if (usage.quota.planKind === "paid") {
          return usage.quota.subscriptionStatus === "past_due"
            ? "Le plan Family reste actif pour l'instant, mais la facturation parent demande une vérification."
            : "Le compte travaille sur un accès Family actif piloté par un adulte payeur.";
        }

        if (trialEndsAtLabel) {
          return `Essai actif jusqu'au ${trialEndsAtLabel}.`;
        }

        return "Le premier devoir fixera la date d'essai et la première période d'usage.";
      },
      usedNoLimit: (usedLabel: string) => `${usedLabel} utilisés`,
    },
    en: {
      adultFrameEyebrow: "Adult frame",
      approvalRequired: "Parent required",
      approvalOptional: "Parent optional",
      activeParents: (count: number) => `${count} active parent`,
      activeTutors: (count: number) => `${count} active tutor`,
      pendingParents: (count: number) => `${count} pending parent`,
      pendingTutors: (count: number) => `${count} pending tutor`,
      supervisionState: "Supervision state",
      supervisionApproved: (dateLabel: string) =>
        `Latest parent approval recorded on ${dateLabel}.`,
      supervisionMissing: "No active parent approval is recorded yet.",
      supervisionOptionalBody:
        "The account can move forward without mandatory parent approval.",
      usageEyebrow: "Usage",
      paidPlan: "Family plan",
      trialPlan: "Free trial",
      available: "Available",
      warning: "Watch closely",
      blocked: "Blocked",
      trialUntil: (dateLabel: string) => `Trial until ${dateLabel}`,
      cards: {
        sessions: "Sessions",
        uploads: "Uploads",
        assistantMessages: "AI messages",
      },
      remaining: "Remaining",
      inputTokens: "Input tokens",
      outputTokens: "Output tokens",
      supportHeadline: (support: StudentDashboardSupportSnapshot) => {
        if (support.isUnder13) {
          if (support.parentApprovedAt || support.parentLinks.active > 0) {
            return "Parent supervision active";
          }

          return "Parent approval pending";
        }

        if (support.tutorLinks.active > 0) {
          return "Adult support connected";
        }

        return "No linked adult yet";
      },
      usageHeadline: (usage: StudentDashboardUsageSnapshot) => {
        if (usage.quota.accessState === "blocked") {
          return "Trial or quota reached";
        }

        if (usage.quota.accessState === "warning") {
          return usage.quota.planKind === "paid"
            ? "Access active, margin to watch"
            : "Trial active, margin shrinking soon";
        }

        if (usage.hasUsage) {
          return "Usage tracked in the current window";
        }

        return "Usage tracking starts with the first homework";
      },
      usageBody: (
        usage: StudentDashboardUsageSnapshot,
        trialEndsAtLabel: string | null,
      ) => {
        if (!usage.quota.trialStartedAt && usage.quota.planKind === "trial") {
          return "The free trial will start with the first recorded homework.";
        }

        if (usage.quota.blockReason === "trial_window_expired") {
          return "The trial window is over. The next homework now depends on an active payer subscription.";
        }

        if (usage.quota.blockReason === "sessions") {
          return "The session limit for this period has been reached.";
        }

        if (usage.quota.blockReason === "uploads") {
          return "The upload limit for this period has been reached.";
        }

        if (usage.quota.blockReason === "assistant_messages") {
          return "The AI-message limit for this period has been reached.";
        }

        if (
          usage.quota.blockReason === "input_tokens" ||
          usage.quota.blockReason === "output_tokens"
        ) {
          return "The AI budget for this period has been reached.";
        }

        if (usage.quota.planKind === "paid") {
          return usage.quota.subscriptionStatus === "past_due"
            ? "The Family plan is still active for now, but the parent billing state needs review."
            : "The account is working under an active Family access controlled by a paying adult.";
        }

        if (trialEndsAtLabel) {
          return `Trial active until ${trialEndsAtLabel}.`;
        }

        return "The first homework will set both the trial date and the first usage window.";
      },
      usedNoLimit: (usedLabel: string) => `${usedLabel} used`,
    },
    zh: {
      adultFrameEyebrow: "成人框架",
      approvalRequired: "需要家長",
      approvalOptional: "家長可選",
      activeParents: (count: number) => `${count} 位啟用中的家長`,
      activeTutors: (count: number) => `${count} 位啟用中的家教`,
      pendingParents: (count: number) => `${count} 位待處理家長`,
      pendingTutors: (count: number) => `${count} 位待處理家教`,
      supervisionState: "監督狀態",
      supervisionApproved: (dateLabel: string) =>
        `最近一次家長核准記錄於 ${dateLabel}。`,
      supervisionMissing: "目前還沒有已啟用的家長核准記錄。",
      supervisionOptionalBody: "此帳號可以在沒有強制家長核准的情況下繼續。",
      usageEyebrow: "使用量",
      paidPlan: "Family 方案",
      trialPlan: "免費試用",
      available: "可用",
      warning: "需留意",
      blocked: "受阻",
      trialUntil: (dateLabel: string) => `試用至 ${dateLabel}`,
      cards: {
        sessions: "課程",
        uploads: "上傳",
        assistantMessages: "AI 訊息",
      },
      remaining: "剩餘",
      inputTokens: "輸入 tokens",
      outputTokens: "輸出 tokens",
      supportHeadline: (support: StudentDashboardSupportSnapshot) => {
        if (support.isUnder13) {
          if (support.parentApprovedAt || support.parentLinks.active > 0) {
            return "家長監督已啟用";
          }

          return "等待家長核准";
        }

        if (support.tutorLinks.active > 0) {
          return "成人支持已連接";
        }

        return "目前沒有已連結的成人";
      },
      usageHeadline: (usage: StudentDashboardUsageSnapshot) => {
        if (usage.quota.accessState === "blocked") {
          return "已達試用或額度上限";
        }

        if (usage.quota.accessState === "warning") {
          return usage.quota.planKind === "paid"
            ? "存取仍可用，但需留意餘量"
            : "試用進行中，餘量即將變少";
        }

        if (usage.hasUsage) {
          return "目前期間的使用量已在追蹤";
        }

        return "第一次作業開始後才會啟用使用量追蹤";
      },
      usageBody: (
        usage: StudentDashboardUsageSnapshot,
        trialEndsAtLabel: string | null,
      ) => {
        if (!usage.quota.trialStartedAt && usage.quota.planKind === "trial") {
          return "免費試用會在第一份已記錄作業時開始。";
        }

        if (usage.quota.blockReason === "trial_window_expired") {
          return "試用期間已結束。下一份作業現在取決於是否有啟用中的付費訂閱。";
        }

        if (usage.quota.blockReason === "sessions") {
          return "本期間的課程上限已達成。";
        }

        if (usage.quota.blockReason === "uploads") {
          return "本期間的上傳上限已達成。";
        }

        if (usage.quota.blockReason === "assistant_messages") {
          return "本期間的 AI 訊息上限已達成。";
        }

        if (
          usage.quota.blockReason === "input_tokens" ||
          usage.quota.blockReason === "output_tokens"
        ) {
          return "本期間的 AI 預算已用完。";
        }

        if (usage.quota.planKind === "paid") {
          return usage.quota.subscriptionStatus === "past_due"
            ? "Family 方案目前仍可用，但家長端帳務狀態需要檢查。"
            : "此帳號正在使用由付費成人管理的 Family 權限。";
        }

        if (trialEndsAtLabel) {
          return `試用將持續到 ${trialEndsAtLabel}。`;
        }

        return "第一份作業會決定試用日期與第一個使用期間。";
      },
      usedNoLimit: (usedLabel: string) => `已使用 ${usedLabel}`,
    },
  });
}

export function getStudentDashboardActionsCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Actions adultes",
      titleUnder13: "Activer puis maintenir la supervision parentale",
      titleDefault: "Ajouter un adulte de confiance autour du compte",
      bodyUnder13:
        "Tant que l'approbation parentale n'est pas active, le prochain devoir reste bloqué. Cette zone garde le flux d'invitation traçable à portée de main.",
      bodyDefault:
        "Le compte peut déjà travailler seul, mais un parent ou un tuteur lié donnera plus de contexte et de suivi quand les surfaces A5 arriveront.",
    },
    en: {
      eyebrow: "Adult actions",
      titleUnder13: "Activate and maintain parent supervision",
      titleDefault: "Add a trusted adult around the account",
      bodyUnder13:
        "As long as parent approval is not active, the next homework stays blocked. This area keeps the traceable invitation flow close at hand.",
      bodyDefault:
        "The account can already work alone, but a linked parent or tutor will add more context and follow-up as the adult surfaces mature.",
    },
    zh: {
      eyebrow: "成人操作",
      titleUnder13: "啟用並維持家長監督",
      titleDefault: "為這個帳號加入可信任的大人",
      bodyUnder13:
        "在家長核准啟用前，下一份作業仍會被阻擋。這一區會把可追蹤的邀請流程放在手邊。",
      bodyDefault:
        "帳號已能獨立使用，但若連結家長或家教，後續就能得到更多上下文與追蹤。",
    },
  });
}

export function getMemoryPanelCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Mémoire pédagogique",
      summaries: {
        strength: "Forces",
        weakness: "Fragilités",
        preference: "Préférences",
      },
      emptySummaries: {
        strength: "Aucune force durable enregistrée.",
        weakness: "Aucune fragilité durable enregistrée.",
        preference: "Aucune préférence durable enregistrée.",
      },
      errorFallback: "Impossible de mettre à jour la mémoire pédagogique.",
      success: {
        updated: "Mémoire mise à jour.",
        created: "Mémoire ajoutée.",
        deleted: "Mémoire retirée.",
      },
      form: {
        edit: "Modifier une mémoire",
        add: "Ajouter une mémoire",
        cancel: "Annuler",
        category: "Catégorie",
        title: "Titre",
        detail: "Détail",
        titlePlaceholder: "ex. Fractions avec schéma",
        detailPlaceholder:
          "Garde une formulation strictement pédagogique et concrète.",
        pending: "Enregistrement...",
        update: "Mettre à jour",
        create: "Ajouter",
        note:
          "Les souvenirs doivent rester utiles à l'apprentissage. Les données sensibles ou spéculatives sont refusées.",
      },
      categories: {
        strength: "Forces",
        weakness: "Fragilités",
        preference: "Préférences",
        topic: "Sujets récurrents",
        learning_note: "Notes d'apprentissage",
      },
      activeItems: (count: number) => `${count} élément(s) actif(s)`,
      confidence: (label: string) => `Confiance ${label}`,
      expiry: (dateLabel: string) => `Échéance ${dateLabel}`,
      edit: "Modifier",
      delete: "Supprimer",
      empty: "Aucune mémoire pédagogique active pour le moment.",
    },
    en: {
      eyebrow: "Pedagogical memory",
      summaries: {
        strength: "Strengths",
        weakness: "Weaknesses",
        preference: "Preferences",
      },
      emptySummaries: {
        strength: "No durable strength recorded yet.",
        weakness: "No durable weakness recorded yet.",
        preference: "No durable preference recorded yet.",
      },
      errorFallback: "Unable to update pedagogical memory.",
      success: {
        updated: "Memory updated.",
        created: "Memory added.",
        deleted: "Memory removed.",
      },
      form: {
        edit: "Edit a memory",
        add: "Add a memory",
        cancel: "Cancel",
        category: "Category",
        title: "Title",
        detail: "Detail",
        titlePlaceholder: "e.g. Fractions with diagram",
        detailPlaceholder:
          "Keep the wording strictly pedagogical and concrete.",
        pending: "Saving...",
        update: "Update",
        create: "Add",
        note:
          "Memories must stay useful for learning. Sensitive or speculative data is rejected.",
      },
      categories: {
        strength: "Strengths",
        weakness: "Weaknesses",
        preference: "Preferences",
        topic: "Recurring topics",
        learning_note: "Learning notes",
      },
      activeItems: (count: number) => `${count} active item(s)`,
      confidence: (label: string) => `Confidence ${label}`,
      expiry: (dateLabel: string) => `Expires ${dateLabel}`,
      edit: "Edit",
      delete: "Delete",
      empty: "No active pedagogical memory at the moment.",
    },
    zh: {
      eyebrow: "教學記憶",
      summaries: {
        strength: "優勢",
        weakness: "脆弱點",
        preference: "偏好",
      },
      emptySummaries: {
        strength: "目前沒有已記錄的長期優勢。",
        weakness: "目前沒有已記錄的長期脆弱點。",
        preference: "目前沒有已記錄的長期偏好。",
      },
      errorFallback: "無法更新教學記憶。",
      success: {
        updated: "教學記憶已更新。",
        created: "教學記憶已新增。",
        deleted: "教學記憶已移除。",
      },
      form: {
        edit: "編輯記憶",
        add: "新增記憶",
        cancel: "取消",
        category: "類別",
        title: "標題",
        detail: "細節",
        titlePlaceholder: "例如：用圖示理解分數",
        detailPlaceholder: "描述要維持教學性、具體且可操作。",
        pending: "儲存中...",
        update: "更新",
        create: "新增",
        note: "記憶內容必須對學習有用。敏感或推測性資料會被拒絕。",
      },
      categories: {
        strength: "優勢",
        weakness: "脆弱點",
        preference: "偏好",
        topic: "反覆出現主題",
        learning_note: "學習筆記",
      },
      activeItems: (count: number) => `${count} 個啟用中的項目`,
      confidence: (label: string) => `信心度 ${label}`,
      expiry: (dateLabel: string) => `到期日 ${dateLabel}`,
      edit: "編輯",
      delete: "刪除",
      empty: "目前沒有啟用中的教學記憶。",
    },
  });
}

export function getMemoryCategoryLabel(
  category: MemoryCategory,
  languageCode: UiLanguageCode,
) {
  return getMemoryPanelCopy(languageCode).categories[category];
}

export function getMemoryServerCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      expectedObject: "Le corps JSON doit être un objet.",
      invalidJson: "Corps JSON invalide.",
      invalidFields: "Un ou plusieurs champs sont invalides.",
      sensitiveText:
        "Les contenus mémoire sensibles ou spéculatifs ne sont pas autorisés.",
      notFound: "Ressource introuvable.",
      noAccess: "Tu n'as pas accès à cette action.",
      activeLimitReached:
        "La limite de mémoires actives est déjà atteinte pour cet élève.",
      itemNotFound: "Mémoire introuvable.",
      fieldErrors: {
        category: "Choisis une catégorie de mémoire valide.",
        titleRequired:
          "Le titre est requis et doit contenir 120 caractères ou moins.",
        titleSensitive:
          "Garde les mémoires strictement pédagogiques et non sensibles.",
        detailText: "Le détail doit être du texte.",
        detailLength: "Le détail doit contenir 320 caractères ou moins.",
        detailSensitive:
          "Garde les mémoires strictement pédagogiques et non sensibles.",
        itemId: "Un UUID valide est requis.",
        action: "Action attendue : 'upsert' ou 'delete'.",
      },
      service: {
        updateProfile:
          "Impossible de mettre à jour le profil de mémoire élève.",
        verifyLimit:
          "Impossible de vérifier la limite d'éléments mémoire.",
        loadItem: "Impossible de charger cette mémoire.",
        updateItem: "Impossible de mettre à jour cette mémoire.",
        createItem: "Impossible de créer cette mémoire.",
        deleteItem: "Impossible de supprimer cette mémoire.",
      },
    },
    en: {
      expectedObject: "The JSON body must be an object.",
      invalidJson: "Invalid JSON body.",
      invalidFields: "One or more fields are invalid.",
      sensitiveText:
        "Sensitive or speculative memory text is not allowed.",
      notFound: "Resource not found.",
      noAccess: "You do not have access to this action.",
      activeLimitReached:
        "The active memory limit is already reached for this student.",
      itemNotFound: "Memory item not found.",
      fieldErrors: {
        category: "Choose a valid memory category.",
        titleRequired:
          "Title is required and must be 120 characters or fewer.",
        titleSensitive:
          "Keep memory items strictly educational and non-sensitive.",
        detailText: "Detail must be text.",
        detailLength: "Detail must be 320 characters or fewer.",
        detailSensitive:
          "Keep memory items strictly educational and non-sensitive.",
        itemId: "A valid UUID is required.",
        action: "Expected 'upsert' or 'delete'.",
      },
      service: {
        updateProfile: "Unable to update the student memory profile.",
        verifyLimit: "Unable to verify the memory item limit.",
        loadItem: "Unable to load the memory item.",
        updateItem: "Unable to update the memory item.",
        createItem: "Unable to create the memory item.",
        deleteItem: "Unable to delete the memory item.",
      },
    },
    zh: {
      expectedObject: "JSON 內容必須是物件。",
      invalidJson: "JSON 內容無效。",
      invalidFields: "一個或多個欄位無效。",
      sensitiveText: "不允許敏感或推測性的記憶內容。",
      notFound: "找不到資源。",
      noAccess: "你沒有權限執行這個操作。",
      activeLimitReached: "這位學生的啟用記憶數量已達上限。",
      itemNotFound: "找不到記憶項目。",
      fieldErrors: {
        category: "請選擇有效的記憶類別。",
        titleRequired: "標題為必填，且不得超過 120 個字元。",
        titleSensitive: "記憶內容必須保持教學用途且不可敏感。",
        detailText: "細節必須是文字。",
        detailLength: "細節不得超過 320 個字元。",
        detailSensitive: "記憶內容必須保持教學用途且不可敏感。",
        itemId: "必須提供有效的 UUID。",
        action: "動作必須是 'upsert' 或 'delete'。",
      },
      service: {
        updateProfile: "無法更新學生記憶摘要。",
        verifyLimit: "無法檢查記憶項目上限。",
        loadItem: "無法載入這個記憶項目。",
        updateItem: "無法更新這個記憶項目。",
        createItem: "無法建立這個記憶項目。",
        deleteItem: "無法刪除這個記憶項目。",
      },
    },
  });
}

export function getMemoryFallbackGeneratedCopy(languageCode: "fr" | "en") {
  return languageCode === "en"
    ? {
        topicDetail: "Topic recovered from a recent completed session.",
        weaknessDetail: "Still-fragile point seen in the recent session.",
        preferenceTitle: "Prefers help in English",
        preferenceDetail:
          "Explicit preference inferred from the account AI-help setting.",
      }
    : {
        topicDetail: "Sujet retrouvé dans une session terminée récente.",
        weaknessDetail: "Point encore fragile dans la session récente.",
        preferenceTitle: "Aide en français",
        preferenceDetail:
          "Préférence explicite dérivée du réglage d'aide IA du compte.",
      };
}

export function getParentApprovalRequestFormCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      errorFallback: "Impossible de préparer le lien d'approbation parentale.",
      title: "Demander l'approbation parentale",
      body:
        "Crée un lien d'invitation parent. En attendant un vrai service d'envoi, le lien peut être copié puis partagé manuellement.",
      fields: {
        parentEmail: "Email du parent ou tuteur légal",
        relationshipLabel: "Étiquette de relation",
      },
      relationshipPlaceholder: "Parent",
      buttons: {
        pending: "Préparation...",
        submit: "Générer le lien parent",
        copy: "Copier le lien",
      },
      successBody:
        "Lien prêt. Partage-le avec le parent pour qu'il crée ou connecte son compte, puis accepte l'invitation.",
    },
    en: {
      errorFallback: "Unable to prepare the parent-approval link.",
      title: "Request parent approval",
      body:
        "Create a parent invitation link. Until a real delivery service exists, the link can be copied and shared manually.",
      fields: {
        parentEmail: "Parent or legal guardian email",
        relationshipLabel: "Relationship label",
      },
      relationshipPlaceholder: "Parent",
      buttons: {
        pending: "Preparing...",
        submit: "Generate parent link",
        copy: "Copy link",
      },
      successBody:
        "Link ready. Share it with the parent so they can create or sign in to their account, then accept the invitation.",
    },
    zh: {
      errorFallback: "無法準備家長核准連結。",
      title: "要求家長核准",
      body:
        "建立家長邀請連結。在真正的寄送服務完成前，這個連結可先複製並手動分享。",
      fields: {
        parentEmail: "家長或法定監護人 email",
        relationshipLabel: "關係標籤",
      },
      relationshipPlaceholder: "家長",
      buttons: {
        pending: "準備中...",
        submit: "產生家長連結",
        copy: "複製連結",
      },
      successBody:
        "連結已準備好。請分享給家長，讓對方建立或登入帳號後接受邀請。",
    },
  });
}

export function getTutorInviteFormCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      errorFallback: "Impossible de préparer le lien tuteur.",
      title: "Inviter un tuteur",
      body:
        "Ce flux crée un lien de tutorat traçable. Pour l'instant, le lien est partagé manuellement plutôt qu'envoyé par email depuis le produit.",
      tutorEmail: "Email du tuteur",
      buttons: {
        pending: "Préparation...",
        submit: "Générer le lien tuteur",
        copy: "Copier le lien",
      },
      successBody:
        "Lien prêt. Le tuteur devra créer ou connecter son compte, terminer son onboarding si besoin, puis accepter l'invitation.",
    },
    en: {
      errorFallback: "Unable to prepare the tutor link.",
      title: "Invite a tutor",
      body:
        "This flow creates a traceable tutoring link. For now, the link is shared manually instead of being emailed by the product.",
      tutorEmail: "Tutor email",
      buttons: {
        pending: "Preparing...",
        submit: "Generate tutor link",
        copy: "Copy link",
      },
      successBody:
        "Link ready. The tutor must create or sign in to an account, finish onboarding if needed, then accept the invitation.",
    },
    zh: {
      errorFallback: "無法準備家教連結。",
      title: "邀請家教",
      body:
        "這個流程會建立可追蹤的家教連結。目前仍以手動分享連結為主，而不是由產品直接寄信。",
      tutorEmail: "家教 email",
      buttons: {
        pending: "準備中...",
        submit: "產生家教連結",
        copy: "複製連結",
      },
      successBody:
        "連結已準備好。家教需要先建立或登入帳號，必要時完成 onboarding，之後再接受邀請。",
    },
  });
}

export function getParentDashboardCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      overview: {
        eyebrow: "Vue parent",
        title: "Suivre le travail sans reprendre la main à la place de l'élève.",
        body:
          "Vois qui avance, qui a besoin d'un check-in, et quelle session mérite une relecture plus attentive.",
        stats: {
          learners: "Élèves liés",
          activeAssignments: "Devoirs ouverts",
          completedThisWeek: "Terminés cette semaine",
          attention: "À surveiller",
        },
        spotlightEyebrow: "Priorité du moment",
        spotlightTitle: (name: string) => `${name} mérite le prochain regard parent.`,
        spotlightEmpty:
          "Dès qu'un élève sera lié, cet espace remontera le suivi le plus utile à lire en premier.",
        openLearner: "Ouvrir l'élève",
        reviewLatest: "Relire la dernière session",
        lastActivity: (value: string) => `Dernière activité : ${value}`,
        noNextStep: "Aucune prochaine étape n'a encore été enregistrée.",
      },
      account: {
        eyebrow: "Compte parent",
        noEmail: "adresse non disponible",
        familyPlan: "Accès Family",
        noPlan: "Sans plan Family",
        plan: "Plan",
        status: "Statut",
        unknown: "inconnu",
        trialEndsAt: "Fin d'essai",
        periodEndsAt: "Fin de période",
        settings: "Réglages",
        manageBilling: "Gérer la facturation",
        activateFamily: "Activer Family",
        statuses: {
          active: "Actif",
          pending_parent_approval: "En attente parent",
          suspended: "Suspendu",
          deletion_requested: "Suppression demandée",
        },
      },
      pendingApprovals: {
        eyebrow: "Demandes en attente",
        title: "Demandes parentales à traiter",
        body:
          "Quand un élève demande cette adresse pour activer la supervision parentale, la demande apparaît ici jusqu'à acceptation ou expiration.",
        requestedOn: (value: string) => `Demandée le ${value}`,
        expiresOn: (value: string) => `Expire le ${value}`,
        relationshipLabel: (value: string) => `Relation : ${value}`,
        accept: "Accepter la supervision",
        pending: "Activation...",
        errorFallback: "Impossible d'accepter cette demande pour l'instant.",
      },
      createLearner: {
        eyebrow: "Créer un élève",
        title: "Préparer le compte élève depuis l'espace parent",
        body:
          "Utilise ce parcours quand le parent veut piloter la configuration, la supervision et la facturation avant de laisser l'élève se connecter.",
        helper:
          "Pour cette première version, l'élève se connectera avec l'email et le mot de passe choisis ici.",
        open: "Ajouter un élève",
        close: "Fermer",
        create: "Créer l'élève",
        pending: "Création...",
        fields: {
          displayName: "Prénom ou nom affiché",
          learnerEmail: "Email de connexion élève",
          temporaryPassword: "Mot de passe initial",
          ageBand: "Tranche d'âge",
          relationshipLabel: "Relation avec l'élève",
          uiLanguage: "Langue de l'interface",
          aiLanguage: "Langue d'aide IA",
        },
        placeholders: {
          learnerEmail: "eleve@example.com",
          temporaryPassword: "8 caractères minimum",
          relationshipLabel: "ex. Mère, Père, Tuteur légal",
        },
      },
      learners: {
        eyebrow: "Élèves liés",
        body:
          "Chaque fiche garde l'état du moment, les difficultés visibles et l'accès direct vers le suivi détaillé.",
        empty:
          "Aucun élève lié pour l'instant. Commence par créer le premier compte élève depuis cet espace.",
        under13: "Moins de 13 ans",
        openLearner: "Ouvrir le suivi",
        reviewLatest: "Dernière session",
        noLatestSession: "Aucune session récente pour l'instant.",
        difficulties: "Difficultés à surveiller",
        noDifficulty: "Aucune difficulté récurrente n'apparaît encore.",
        sessionsUsage: (used: number, limit: number | null) =>
          `Sessions ${used}/${limit ?? "?"}`,
        openAssignments: (count: number) => `${count} devoir(s) ouvert(s)`,
        noOpenAssignments: "Aucun devoir ouvert",
        weeklyCompleted: (count: number) =>
          `${count} terminé(s) cette semaine`,
        nextStep: (value: string) => `Prochaine étape : ${value}`,
        latestSession: (title: string) => `Dernière session : ${title}`,
        lastActivity: (value: string) => `Activité ${value}`,
        status: {
          blocked: "Intervention rapide utile",
          warning: "Quota à surveiller",
          inProgress: "Travail en cours",
          activeToday: "Actif aujourd'hui",
          activeThisWeek: "Actif cette semaine",
          quiet: "Plus calme en ce moment",
        },
        activity: {
          today: "aujourd'hui",
          yesterday: "hier",
          thisWeek: "cette semaine",
          earlier: "récemment",
          none: "sans activité récente",
        },
      },
      activity: {
        eyebrow: "Activité d'apprentissage",
        title: "Résumé hebdomadaire et sessions récentes restent au même endroit.",
        body:
          "Commence par le rythme de la semaine, puis ouvre la session la plus récente quand un point mérite plus de contexte.",
        weeklyTitle: "Cette semaine",
        weeklyEmpty: "Aucune activité terminée cette semaine.",
        weeklyNoSummary: "Aucun résumé parent enregistré pour l'instant.",
        weeklySessions: (count: number) => `${count} session(s)`,
        weeklyNextStep: (value: string) => `Prochaine étape : ${value}`,
        viewLearner: "Voir l'élève",
        recentTitle: "Sessions récentes",
        recentEmpty: "Aucune session visible pour l'instant.",
        recentNoSummary: "Aucun résumé parent n'est encore disponible.",
        recentNoRecommendation: "Aucune prochaine étape n'a encore été sauvegardée.",
        lastActivity: (value: string) => `Mis à jour ${value}`,
        noDate: "Date indisponible",
        openReview: "Ouvrir la relecture",
      },
    },
    en: {
      overview: {
        eyebrow: "Parent view",
        title: "Follow the work closely without taking over the learner's seat.",
        body:
          "See who is moving, who needs a check-in, and which session deserves a closer parent read.",
        stats: {
          learners: "Linked learners",
          activeAssignments: "Open homework",
          completedThisWeek: "Completed this week",
          attention: "Need attention",
        },
        spotlightEyebrow: "Best next follow-up",
        spotlightTitle: (name: string) => `${name} is the clearest next parent follow-up.`,
        spotlightEmpty:
          "As soon as a learner is linked, this area will surface the most useful follow-up first.",
        openLearner: "Open learner",
        reviewLatest: "Review latest session",
        lastActivity: (value: string) => `Last activity: ${value}`,
        noNextStep: "No next step has been saved yet.",
      },
      account: {
        eyebrow: "Parent account",
        noEmail: "signed-in email unavailable",
        familyPlan: "Family access",
        noPlan: "No Family plan yet",
        plan: "Plan",
        status: "Status",
        unknown: "unknown",
        trialEndsAt: "Trial ends",
        periodEndsAt: "Current period ends",
        settings: "Settings",
        manageBilling: "Manage billing",
        activateFamily: "Activate Family",
        statuses: {
          active: "Active",
          pending_parent_approval: "Pending parent approval",
          suspended: "Suspended",
          deletion_requested: "Deletion requested",
        },
      },
      pendingApprovals: {
        eyebrow: "Pending requests",
        title: "Parent approvals waiting here",
        body:
          "When a learner uses this email to request parent supervision, the request appears here until it is accepted or expires.",
        requestedOn: (value: string) => `Requested on ${value}`,
        expiresOn: (value: string) => `Expires on ${value}`,
        relationshipLabel: (value: string) => `Relationship: ${value}`,
        accept: "Accept supervision",
        pending: "Activating...",
        errorFallback: "Unable to accept this request right now.",
      },
      createLearner: {
        eyebrow: "Create a learner",
        title: "Set up the learner account from the parent workspace",
        body:
          "Use this path when the parent wants to handle setup, supervision, and billing first, then let the learner sign in later.",
        helper:
          "In this first version, the learner signs in with the email and password chosen here.",
        open: "Add learner",
        close: "Close",
        create: "Create learner",
        pending: "Creating...",
        fields: {
          displayName: "Learner display name",
          learnerEmail: "Learner sign-in email",
          temporaryPassword: "Initial password",
          ageBand: "Age band",
          relationshipLabel: "Relationship to learner",
          uiLanguage: "Interface language",
          aiLanguage: "AI help language",
        },
        placeholders: {
          learnerEmail: "learner@example.com",
          temporaryPassword: "8 characters minimum",
          relationshipLabel: "e.g. Mother, Father, Guardian",
        },
      },
      learners: {
        eyebrow: "Linked learners",
        body:
          "Each card keeps the current state, visible difficulties, and the direct path into the detailed learner view.",
        empty:
          "No linked learner yet. Start by creating the first learner account from this workspace.",
        under13: "Under 13",
        openLearner: "Open learner",
        reviewLatest: "Latest session",
        noLatestSession: "No recent session yet.",
        difficulties: "Difficulties to watch",
        noDifficulty: "No recurring difficulty is visible yet.",
        sessionsUsage: (used: number, limit: number | null) =>
          `Sessions ${used}/${limit ?? "?"}`,
        openAssignments: (count: number) => `${count} open homework`,
        noOpenAssignments: "No open homework",
        weeklyCompleted: (count: number) => `${count} completed this week`,
        nextStep: (value: string) => `Next step: ${value}`,
        latestSession: (title: string) => `Latest session: ${title}`,
        lastActivity: (value: string) => `Activity ${value}`,
        status: {
          blocked: "Needs a quick check-in",
          warning: "Quota to watch",
          inProgress: "Work in progress",
          activeToday: "Active today",
          activeThisWeek: "Active this week",
          quiet: "Quieter right now",
        },
        activity: {
          today: "today",
          yesterday: "yesterday",
          thisWeek: "this week",
          earlier: "recently",
          none: "with no recent activity",
        },
      },
      activity: {
        eyebrow: "Learning activity",
        title: "Weekly progress and recent sessions stay together.",
        body:
          "Start with the weekly rhythm, then open the latest session when something needs more context.",
        weeklyTitle: "This week",
        weeklyEmpty: "No completed activity this week.",
        weeklyNoSummary: "No parent summary saved yet.",
        weeklySessions: (count: number) => `${count} session(s)`,
        weeklyNextStep: (value: string) => `Next step: ${value}`,
        viewLearner: "View learner",
        recentTitle: "Recent sessions",
        recentEmpty: "No visible session yet.",
        recentNoSummary: "No parent summary is available yet.",
        recentNoRecommendation: "No next step has been saved yet.",
        lastActivity: (value: string) => `Updated ${value}`,
        noDate: "Date unavailable",
        openReview: "Open review",
      },
    },
    zh: {
      overview: {
        eyebrow: "家長視圖",
        title: "貼近追蹤學習進度，但不取代孩子的位置。",
        body:
          "先看誰正在推進、誰需要家長 check-in，再決定哪一個課程值得打開細讀。",
        stats: {
          learners: "已連結學習者",
          activeAssignments: "進行中的作業",
          completedThisWeek: "本週已完成",
          attention: "需要留意",
        },
        spotlightEyebrow: "下一個值得關注的人",
        spotlightTitle: (name: string) => `${name} 是現在最值得先看的家長追蹤。`,
        spotlightEmpty:
          "一旦有學習者連結進來，這裡就會先浮出最值得優先查看的追蹤。",
        openLearner: "打開學習者",
        reviewLatest: "查看最近課程",
        lastActivity: (value: string) => `最近活動：${value}`,
        noNextStep: "目前還沒有儲存下一步建議。",
      },
      account: {
        eyebrow: "家長帳號",
        noEmail: "目前沒有可顯示的 email",
        familyPlan: "Family 權限",
        noPlan: "尚未啟用 Family",
        plan: "方案",
        status: "狀態",
        unknown: "未知",
        trialEndsAt: "試用結束",
        periodEndsAt: "本期結束",
        settings: "設定",
        manageBilling: "管理帳務",
        activateFamily: "啟用 Family",
        statuses: {
          active: "啟用中",
          pending_parent_approval: "待家長核准",
          suspended: "已停用",
          deletion_requested: "已要求刪除",
        },
      },
      pendingApprovals: {
        eyebrow: "待處理請求",
        title: "待家長處理的核准",
        body:
          "當學習者用這個 email 申請家長監督時，請求會顯示在這裡，直到接受或過期。",
        requestedOn: (value: string) => `申請時間：${value}`,
        expiresOn: (value: string) => `到期時間：${value}`,
        relationshipLabel: (value: string) => `關係：${value}`,
        accept: "接受監督",
        pending: "啟用中...",
        errorFallback: "目前無法接受這個請求。",
      },
      createLearner: {
        eyebrow: "建立學習者",
        title: "從家長工作區先完成學習者帳號設定",
        body:
          "當家長希望先掌握設定、監督與付費，再交給孩子使用時，就走這個流程。",
        helper:
          "在這個第一版流程中，學習者會用你在這裡設定的 email 與密碼登入。",
        open: "新增學習者",
        close: "關閉",
        create: "建立學習者",
        pending: "建立中...",
        fields: {
          displayName: "學習者顯示名稱",
          learnerEmail: "學習者登入 email",
          temporaryPassword: "初始密碼",
          ageBand: "年齡區間",
          relationshipLabel: "與學習者的關係",
          uiLanguage: "介面語言",
          aiLanguage: "AI 協助語言",
        },
        placeholders: {
          learnerEmail: "learner@example.com",
          temporaryPassword: "至少 8 個字元",
          relationshipLabel: "例如：母親、父親、監護人",
        },
      },
      learners: {
        eyebrow: "已連結學習者",
        body:
          "每張卡片都保留當前狀態、看得見的困難點，以及進入詳細檢視的直接入口。",
        empty:
          "目前還沒有已連結的學習者。先從這裡建立第一個學習者帳號。",
        under13: "13 歲以下",
        openLearner: "打開追蹤",
        reviewLatest: "最近課程",
        noLatestSession: "目前還沒有最近課程。",
        difficulties: "需要留意的困難",
        noDifficulty: "目前還看不出重複出現的困難。",
        sessionsUsage: (used: number, limit: number | null) =>
          `課程 ${used}/${limit ?? "?"}`,
        openAssignments: (count: number) => `${count} 份進行中的作業`,
        noOpenAssignments: "沒有進行中的作業",
        weeklyCompleted: (count: number) => `本週完成 ${count} 份`,
        nextStep: (value: string) => `下一步：${value}`,
        latestSession: (title: string) => `最近課程：${title}`,
        lastActivity: (value: string) => `活動狀態 ${value}`,
        status: {
          blocked: "值得盡快 check-in",
          warning: "額度需留意",
          inProgress: "作業進行中",
          activeToday: "今天有活動",
          activeThisWeek: "本週有活動",
          quiet: "最近較安靜",
        },
        activity: {
          today: "今天",
          yesterday: "昨天",
          thisWeek: "這週",
          earlier: "最近",
          none: "最近沒有活動",
        },
      },
      activity: {
        eyebrow: "學習活動",
        title: "每週節奏與最近課程放在同一個地方看。",
        body:
          "先用本週節奏判斷整體狀況，再在需要時打開最近課程補足上下文。",
        weeklyTitle: "本週",
        weeklyEmpty: "本週沒有已完成活動。",
        weeklyNoSummary: "目前還沒有儲存家長摘要。",
        weeklySessions: (count: number) => `${count} 個課程`,
        weeklyNextStep: (value: string) => `下一步：${value}`,
        viewLearner: "查看學習者",
        recentTitle: "最近課程",
        recentEmpty: "目前沒有可見課程。",
        recentNoSummary: "目前還沒有家長摘要。",
        recentNoRecommendation: "目前還沒有儲存下一步。",
        lastActivity: (value: string) => `更新於 ${value}`,
        noDate: "日期不可用",
        openReview: "打開檢視",
      },
    },
  });
}

export function getTutorDashboardCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      overview: {
        links: "Liens",
        sessions: "Sessions",
        notes: "Notes",
        linkedStudents: (count: number) => `${count} élève(s) suivi(s)`,
        recentSessions: (count: number) => `${count} session(s) récente(s)`,
        notesTitle: "Notes privées actives",
        linksBody:
          "Les invitations tuteur débouchent maintenant sur un vrai suivi élève et sur des notes privées persistantes.",
        sessionsBody:
          "Les synthèses tuteur et leurs tags faibles deviennent la vue d'entrée pédagogique.",
        notesBody:
          "Les notes restent invisibles pour l'élève et le parent, avec audit à chaque mutation.",
      },
      linkedStudents: {
        eyebrow: "Élèves liés",
        body:
          "Chaque fiche mène vers le détail élève avec vues de sessions, tags faibles et notes privées.",
        empty: "Aucun élève lié pour l'instant.",
        sessions: (count: number) => `${count} session(s)`,
        notes: (count: number) => `${count} note(s)`,
        noWeakness: "Aucun tag faible consolidé.",
        open: "Ouvrir le suivi",
      },
      review: {
        eyebrow: "Sessions à revoir",
        body:
          "Les sessions récentes remontent avec les insights tuteur déjà disponibles.",
        empty: "Aucune session récente visible.",
        noRecommendation: "Aucune recommandation tuteur disponible.",
        noDate: "Date indisponible",
      },
      recent: {
        eyebrow: "Sessions récentes",
        body:
          "Cette liste traverse tous les élèves liés et mène vers la relecture tuteur et les notes de séance.",
        empty: "Aucune session visible pour l'instant.",
        noSummary:
          "Aucune synthèse tuteur n'est encore disponible pour cette session.",
        noDate: "Date indisponible",
        open: "Ouvrir",
      },
    },
    en: {
      overview: {
        links: "Links",
        sessions: "Sessions",
        notes: "Notes",
        linkedStudents: (count: number) => `${count} followed student(s)`,
        recentSessions: (count: number) => `${count} recent session(s)`,
        notesTitle: "Active private notes",
        linksBody:
          "Tutor invitations now lead to real student follow-up and persistent private notes.",
        sessionsBody:
          "Tutor summaries and weakness tags are becoming the pedagogical entry view.",
        notesBody:
          "Notes stay invisible to the student and parent, with audits on every mutation.",
      },
      linkedStudents: {
        eyebrow: "Linked students",
        body:
          "Each card leads to the student detail with session views, weakness tags, and private notes.",
        empty: "No linked student yet.",
        sessions: (count: number) => `${count} session(s)`,
        notes: (count: number) => `${count} note(s)`,
        noWeakness: "No consolidated weakness tag.",
        open: "Open follow-up",
      },
      review: {
        eyebrow: "Sessions to review",
        body:
          "Recent sessions surface with the tutor insights already available.",
        empty: "No recent session visible.",
        noRecommendation: "No tutor recommendation available.",
        noDate: "Date unavailable",
      },
      recent: {
        eyebrow: "Recent sessions",
        body:
          "This list spans all linked students and leads to tutor review plus session notes.",
        empty: "No visible session yet.",
        noSummary: "No tutor summary is available for this session yet.",
        noDate: "Date unavailable",
        open: "Open",
      },
    },
    zh: {
      overview: {
        links: "連結",
        sessions: "課程",
        notes: "筆記",
        linkedStudents: (count: number) => `${count} 位追蹤中的學生`,
        recentSessions: (count: number) => `${count} 個最近課程`,
        notesTitle: "啟用中的私人筆記",
        linksBody:
          "家教邀請現在已接上真正的學生追蹤流程與持久化私人筆記。",
        sessionsBody: "家教摘要與弱點標籤正逐步成為教學入口視圖。",
        notesBody:
          "筆記對學生與家長都不可見，而且每次變更都會留下稽核。",
      },
      linkedStudents: {
        eyebrow: "已連結學生",
        body:
          "每張卡片都會通往學生詳情，包含課程檢視、弱點標籤與私人筆記。",
        empty: "目前還沒有已連結學生。",
        sessions: (count: number) => `${count} 個課程`,
        notes: (count: number) => `${count} 則筆記`,
        noWeakness: "還沒有彙整出的弱點標籤。",
        open: "打開追蹤",
      },
      review: {
        eyebrow: "待複查課程",
        body: "最近課程會連同目前已有的家教洞察一起出現。",
        empty: "目前沒有可見的最近課程。",
        noRecommendation: "目前沒有家教建議。",
        noDate: "日期不可用",
      },
      recent: {
        eyebrow: "最近課程",
        body:
          "這份列表橫跨所有已連結學生，並通往家教檢視與課程筆記。",
        empty: "目前沒有可見課程。",
        noSummary: "這個課程目前還沒有家教摘要。",
        noDate: "日期不可用",
        open: "打開",
      },
    },
  });
}

export function getAdminDashboardCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      overview: {
        operations: "Opérations",
        volume: "Volume",
        route: "Route",
        auditTitle: "Audit sensible",
        volumeTitle: (count: number) => `${count} événement(s)`,
        routeTitle: "/app/audit",
        auditBody:
          "Les lectures parent/tuteur et les mutations de notes privées sont maintenant regroupées dans une vue admin dédiée.",
        volumeBody:
          "Retrouve ici les ouvertures de sessions adultes et les changements de notes privées les plus récents.",
        routeBody:
          "Route dédiée au suivi des accès sensibles et des revues de confiance.",
      },
      ops: {
        eyebrow: "Ops",
        title:
          "Le shell admin centralise désormais la revue des accès sensibles.",
        body:
          "L'espace regroupe les accès adultes, les notes privées et les points de vigilance dans une vue plus lisible.",
        support:
          "L'audit reste séparé du support et de la modération pour garder les revues sensibles faciles à relire.",
        open: "Ouvrir l'audit",
      },
    },
    en: {
      overview: {
        operations: "Operations",
        volume: "Volume",
        route: "Route",
        auditTitle: "Sensitive audit",
        volumeTitle: (count: number) => `${count} event(s)`,
        routeTitle: "/app/audit",
        auditBody:
          "Parent/tutor reads and private-note mutations are now grouped into a dedicated admin view.",
        volumeBody:
          "Track the latest adult session openings and tutor private-note changes in one place.",
        routeBody: "Dedicated route for sensitive-access review and trust follow-up.",
      },
      ops: {
        eyebrow: "Ops",
        title: "The admin shell now centers the review of sensitive access.",
        body:
          "This space brings adult access, private notes, and trust checks into one clearer operational view.",
        support:
          "Audit stays separate from support and moderation so sensitive reviews remain easier to read.",
        open: "Open audit",
      },
    },
    zh: {
      overview: {
        operations: "營運",
        volume: "量級",
        route: "路由",
        auditTitle: "敏感稽核",
        volumeTitle: (count: number) => `${count} 筆事件`,
        routeTitle: "/app/audit",
        auditBody:
          "家長 / 家教讀取，以及私人筆記異動，現在都集中在專用的管理檢視中。",
        volumeBody: "可在這裡查看最近的成人課程開啟與家教私人筆記變更。",
        routeBody: "這是一條專門用於敏感存取檢視與信任追蹤的路由。",
      },
      ops: {
        eyebrow: "Ops",
        title: "管理 shell 現在以敏感存取檢視為中心。",
        body:
          "這個空間把成人存取、私人筆記與信任檢查集中到同一個更清楚的營運檢視。",
        support:
          "稽核會與 support、moderation 分開，讓敏感檢視維持清楚可讀。",
        open: "打開稽核",
      },
    },
  });
}
