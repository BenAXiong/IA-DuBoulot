import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ConversationMessageRecord } from "@/lib/server/conversations/types";

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

export function getIntakeSubjectOptions(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: [
      { value: "mathematiques", label: "Mathématiques" },
      { value: "francais", label: "Français" },
      { value: "anglais", label: "Anglais" },
      { value: "histoire-geographie", label: "Histoire-géographie" },
      { value: "sciences", label: "Sciences" },
      { value: "physique-chimie", label: "Physique-chimie" },
      { value: "svt", label: "SVT" },
      { value: "autre", label: "Autre matière" },
    ],
    en: [
      { value: "mathematiques", label: "Mathematics" },
      { value: "francais", label: "French" },
      { value: "anglais", label: "English" },
      { value: "histoire-geographie", label: "History and geography" },
      { value: "sciences", label: "Science" },
      { value: "physique-chimie", label: "Physics and chemistry" },
      { value: "svt", label: "Biology" },
      { value: "autre", label: "Other subject" },
    ],
    zh: [
      { value: "mathematiques", label: "數學" },
      { value: "francais", label: "法文" },
      { value: "anglais", label: "英文" },
      { value: "histoire-geographie", label: "歷史與地理" },
      { value: "sciences", label: "科學" },
      { value: "physique-chimie", label: "物理與化學" },
      { value: "svt", label: "生命與地球科學" },
      { value: "autre", label: "其他科目" },
    ],
  });
}

export function getIntakeConfigCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      category: {
        pdf: "PDF",
        image: "image / capture",
      },
      stageErrors: {
        unsupportedFormat: (fileName: string) =>
          `${fileName} : format non accepté.`,
        maxBytes: (fileName: string, maxBytesLabel: string) =>
          `${fileName} : ${maxBytesLabel} maximum pour ce type de fichier.`,
        tooManyFiles: (limit: number) =>
          `Limite atteinte : ${limit} fichiers maximum par devoir.`,
        totalBudgetExceeded: (budgetLabel: string) =>
          `Budget dépassé : ${budgetLabel} maximum pour l'ensemble des fichiers.`,
      },
      provisionalDraft: {
        marker: "[Brouillon d'extraction provisoire]",
        filesAdded: "Fichiers ajoutés :",
        helper:
          "Ajoute ici une transcription manuelle, les consignes importantes, ou les zones à faire relire avant l'ouverture de la conversation.",
      },
    },
    en: {
      category: {
        pdf: "PDF",
        image: "image / screenshot",
      },
      stageErrors: {
        unsupportedFormat: (fileName: string) =>
          `${fileName}: unsupported format.`,
        maxBytes: (fileName: string, maxBytesLabel: string) =>
          `${fileName}: ${maxBytesLabel} maximum for this file type.`,
        tooManyFiles: (limit: number) =>
          `Limit reached: ${limit} files maximum per homework.`,
        totalBudgetExceeded: (budgetLabel: string) =>
          `Budget exceeded: ${budgetLabel} maximum across all files.`,
      },
      provisionalDraft: {
        marker: "[Temporary extraction draft]",
        filesAdded: "Files added:",
        helper:
          "Add a manual transcription, the key instructions, or the zones that should be reviewed before opening the conversation.",
      },
    },
    zh: {
      category: {
        pdf: "PDF",
        image: "圖片 / 截圖",
      },
      stageErrors: {
        unsupportedFormat: (fileName: string) =>
          `${fileName}：不支援這種格式。`,
        maxBytes: (fileName: string, maxBytesLabel: string) =>
          `${fileName}：此檔案類型上限為 ${maxBytesLabel}。`,
        tooManyFiles: (limit: number) =>
          `已達上限：每份作業最多 ${limit} 個檔案。`,
        totalBudgetExceeded: (budgetLabel: string) =>
          `超出總容量上限：所有檔案合計最多 ${budgetLabel}。`,
      },
      provisionalDraft: {
        marker: "[暫時擷取草稿]",
        filesAdded: "已加入的檔案：",
        helper:
          "在這裡補上手動轉寫、重要題目說明，或是開啟對話前還需要再確認的區段。",
      },
    },
  });
}

export function getClientUploadCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      prepareUpload: (fileName: string) =>
        `Impossible de préparer l'upload pour ${fileName}.`,
      transferUpload: (fileName: string, detail: string) =>
        `Impossible de transférer ${fileName} : ${detail}`,
      confirmUpload: (fileName: string) =>
        `Impossible de confirmer l'upload pour ${fileName}.`,
    },
    en: {
      prepareUpload: (fileName: string) =>
        `Unable to prepare the upload for ${fileName}.`,
      transferUpload: (fileName: string, detail: string) =>
        `Unable to transfer ${fileName}: ${detail}`,
      confirmUpload: (fileName: string) =>
        `Unable to confirm the upload for ${fileName}.`,
    },
    zh: {
      prepareUpload: (fileName: string) =>
        `無法為 ${fileName} 準備上傳。`,
      transferUpload: (fileName: string, detail: string) =>
        `無法傳送 ${fileName}：${detail}`,
      confirmUpload: (fileName: string) =>
        `無法確認 ${fileName} 的上傳。`,
    },
  });
}

export function getConversationRoleLabel(
  role: ConversationMessageRecord["role"],
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      student: "Élève",
      assistant: "Coach",
      system: "Système",
    },
    en: {
      student: "Student",
      assistant: "Coach",
      system: "System",
    },
    zh: {
      student: "學生",
      assistant: "教練",
      system: "系統",
    },
  });

  return labels[role];
}

export function getAttachmentKindLabel(
  attachmentKind: ConversationAttachmentRecord["attachment_kind"],
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      image: "Image",
      screenshot: "Capture",
      pdf: "PDF",
      document: "Document",
    },
    en: {
      image: "Image",
      screenshot: "Screenshot",
      pdf: "PDF",
      document: "Document",
    },
    zh: {
      image: "圖片",
      screenshot: "截圖",
      pdf: "PDF",
      document: "文件",
    },
  });

  return labels[attachmentKind] ?? attachmentKind;
}

export function getAttachmentStatusLabel(
  extractionStatus: ConversationAttachmentRecord["extraction_status"],
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      pending: "Analyse",
      ready: "Extrait",
      failed: "À relire",
    },
    en: {
      pending: "Processing",
      ready: "Extracted",
      failed: "Needs review",
    },
    zh: {
      pending: "分析中",
      ready: "已擷取",
      failed: "需重讀",
    },
  });

  return labels[extractionStatus] ?? extractionStatus;
}

export function getNewHomeworkEntryCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      recentSubjects: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "matière récente", plural: "matières récentes" },
          en: { singular: "recent subject", plural: "recent subjects" },
          zh: "個最近科目",
        }),
      eyebrow: "Nouveau devoir",
      title: "Décris le devoir, ajoute des sources si besoin, puis entre dans le chat.",
      backToDashboard: "Retour au tableau de bord",
      liveFormBadge: "Le chat s'ouvrira dès que le contexte de départ sera prêt",
      sequenceEyebrow: "Parcours",
      sequenceTitle:
        "Décrire le devoir, joindre les sources utiles, puis reprendre la discussion.",
      steps: [
        "1. Expliquer le devoir avec ses propres mots.",
        "2. Ajouter un PDF, une capture ou un extrait lisible si nécessaire.",
        "3. Relire le texte transmis puis ouvrir le chat.",
      ],
    },
    en: {
      recentSubjects: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "matière récente", plural: "matières récentes" },
          en: { singular: "recent subject", plural: "recent subjects" },
          zh: "個最近科目",
        }),
      eyebrow: "New homework",
      title: "Describe the homework, add sources if needed, then step into the chat.",
      backToDashboard: "Back to dashboard",
      liveFormBadge: "The chat opens as soon as the starting context is ready",
      sequenceEyebrow: "Flow",
      sequenceTitle:
        "Describe the homework, attach the useful sources, then continue in the chat.",
      steps: [
        "1. Explain the homework in your own words.",
        "2. Add a PDF, screenshot, or any readable source if needed.",
        "3. Review the source text, then open the chat.",
      ],
    },
    zh: {
      recentSubjects: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "matière récente", plural: "matières récentes" },
          en: { singular: "recent subject", plural: "recent subjects" },
          zh: "個最近科目",
        }),
      eyebrow: "新作業",
      title: "先描述作業、補上需要的來源，再進入聊天。",
      backToDashboard: "回到儀表板",
      liveFormBadge: "起始內容準備好後就會直接進入聊天",
      sequenceEyebrow: "流程",
      sequenceTitle: "先描述作業、加入來源，再把整理好的內容帶進對話。",
      steps: [
        "1. 用自己的話說明這份作業。",
        "2. 視需要加入 PDF、截圖或可讀文字。",
        "3. 重新檢查來源文字後再進入聊天。",
      ],
    },
  });
}

export function getNewHomeworkIntakeCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      errors: {
        cannotStart:
          "Le compte ne peut pas encore lancer un nouveau devoir depuis cette route.",
        missingSubject: "Choisis ou saisis une matière.",
        missingSource:
          "Ajoute au moins un fichier, un texte collé, ou un brouillon d'extraction.",
        createSession: "Impossible de créer la session brouillon pour ce devoir.",
        workspaceSync:
          "La session a été créée mais le texte extrait n'a pas pu être synchronisé.",
        uploadFallback:
          "La session a été créée, mais les pièces jointes n'ont pas toutes été confirmées.",
      },
      messages: {
        fallbackResume:
          "Le brouillon existe déjà. Tu peux reprendre la session et relancer les pièces dans le chat.",
        readyRedirect: "Session créée et pièces analysées. Redirection...",
      },
      sections: {
        brief: {
          eyebrow: "Brief du devoir",
          title: "Pose le contexte du devoir comme tu le raconterais à banban.",
          titleLabel: "Titre du devoir",
          titlePlaceholder: "Ex. : Fractions - exercice 4",
          subjectLabel: "Matière",
          customSubjectLabel: "Nom de la matière",
          customSubjectPlaceholder: "Ex. : Allemand",
        },
        sources: {
          eyebrow: "Sources du devoir",
          title: "Ajoute les pièces utiles et le texte déjà lisible.",
          allowedFilesTitle: "Fichiers autorisés",
          allowedFilesBody:
            "Images, captures d'écran et PDF peuvent être ajoutés ici. Ils seront transmis au chat une fois la session ouverte.",
          addFiles: "Ajouter des fichiers",
          pastedTextLabel: "Que veux-tu travailler ?",
          pastedTextPlaceholder:
            "Explique le devoir, colle l'énoncé, ou décris l'endroit où tu bloques...",
          gradedHomework: "Devoir noté",
        },
        review: {
          eyebrow: "Texte source relu",
          title: "Relire le texte qui servira de base au chat",
          body:
            "La zone principale peut être libre et simple. Si tu ajoutes des fichiers ou corriges une extraction, vérifie ici le texte que le chat récupérera derrière.",
          resetDraft: "Régénérer le brouillon",
          draftPlaceholder: "Le texte relu du devoir apparaîtra ici.",
          draftBadge: "Optionnel mais utile",
          createSession: "Ouvrir le chat",
          creating: "Ouverture...",
          persistenceBadge:
            "Cette base sera persistée avant l'ouverture du chat",
        },
      },
    },
    en: {
      errors: {
        cannotStart:
          "This account cannot start a new homework flow from this route yet.",
        missingSubject: "Choose or enter a subject.",
        missingSource:
          "Add at least one file, some pasted text, or an extraction draft.",
        createSession: "Unable to create the draft session for this homework.",
        workspaceSync:
          "The session was created, but the extracted text could not be synced.",
        uploadFallback:
          "The session was created, but not every attachment could be confirmed.",
      },
      messages: {
        fallbackResume:
          "The draft already exists. You can reopen the session and retry the attachments in the chat.",
        readyRedirect: "Session created and attachments analyzed. Redirecting...",
      },
      sections: {
        brief: {
          eyebrow: "Homework brief",
          title: "Set the homework context the way you would explain it to banban.",
          titleLabel: "Homework title",
          titlePlaceholder: "Ex: Fractions - exercise 4",
          subjectLabel: "Subject",
          customSubjectLabel: "Subject name",
          customSubjectPlaceholder: "Ex: German",
        },
        sources: {
          eyebrow: "Homework sources",
          title: "Add the useful files and any text that is already readable.",
          allowedFilesTitle: "Allowed files",
          allowedFilesBody:
            "Images, screenshots, and PDFs can be attached here. They will join the chat once the session opens.",
          addFiles: "Add files",
          pastedTextLabel: "What do you want to work on?",
          pastedTextPlaceholder:
            "Explain the homework, paste the prompt, or describe the exact place where you're stuck...",
          gradedHomework: "Graded homework",
        },
        review: {
          eyebrow: "Reviewed source text",
          title: "Review the text that will quietly feed the chat",
          body:
            "The main box can stay freeform and simple. If files or manual corrections are involved, this is the quiet place to verify the source text that sits behind the conversation.",
          resetDraft: "Regenerate draft",
          draftPlaceholder: "The reviewed homework text will appear here.",
          draftBadge: "Optional but useful",
          createSession: "Open chat",
          creating: "Opening...",
          persistenceBadge:
            "This context is saved first, then the chat opens",
        },
      },
    },
    zh: {
      errors: {
        cannotStart: "這個帳號目前還不能從這個路由開始新的作業。",
        missingSubject: "請選擇或輸入科目。",
        missingSource:
          "至少要加入一個檔案、貼上一段文字，或先寫好擷取草稿。",
        createSession: "無法為這份作業建立草稿課程。",
        workspaceSync: "課程已建立，但無法同步擷取文字到工作區。",
        uploadFallback: "課程已建立，但不是所有附件都確認成功。",
      },
      messages: {
        fallbackResume:
          "草稿課程已存在。你可以先進入課程，再在對話裡重新處理附件。",
        readyRedirect: "課程已建立，附件也已分析。正在跳轉...",
      },
      sections: {
        brief: {
          eyebrow: "作業摘要",
          title: "先用你會對 banban 說的方式描述這份作業。",
          titleLabel: "作業標題",
          titlePlaceholder: "例：分數 - 第 4 題",
          subjectLabel: "科目",
          customSubjectLabel: "科目名稱",
          customSubjectPlaceholder: "例：德文",
        },
        sources: {
          eyebrow: "作業來源",
          title: "加入需要的檔案，並補上已經可讀的內容。",
          allowedFilesTitle: "允許的檔案",
          allowedFilesBody:
            "圖片、截圖與 PDF 都可以先放在這裡。開啟聊天後，它們會一起成為聊天的背景來源。",
          addFiles: "加入檔案",
          pastedTextLabel: "你想處理什麼？",
          pastedTextPlaceholder:
            "描述這份作業、貼上題目，或直接說明你卡住的地方...",
          gradedHomework: "有評分的作業",
        },
        review: {
          eyebrow: "重讀後的來源文字",
          title: "重新確認會在背後送進聊天的文字",
          body:
            "主輸入框可以保持簡單自由。如果你加入檔案或做了手動修正，就在這裡確認聊天背後使用的來源文字。",
          resetDraft: "重新產生草稿",
          draftPlaceholder: "重讀後的作業文字會顯示在這裡。",
          draftBadge: "選填但很有幫助",
          createSession: "打開聊天",
          creating: "開啟中...",
          persistenceBadge: "這份起始內容會先儲存，之後再進入聊天",
        },
      },
    },
  });
}

export function getIntakeFileListCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      empty:
        "Aucun fichier préparé pour l'instant. Tu peux ajouter des images, des captures d'écran, ou des PDF.",
      remove: "Retirer",
      categoryLabel: {
        pdf: "PDF",
        image: "Image / capture",
      },
    },
    en: {
      empty:
        "No prepared file yet. You can add images, screenshots, or PDFs.",
      remove: "Remove",
      categoryLabel: {
        pdf: "PDF",
        image: "Image / screenshot",
      },
    },
    zh: {
      empty: "目前還沒有準備好的檔案。你可以加入圖片、截圖或 PDF。",
      remove: "移除",
      categoryLabel: {
        pdf: "PDF",
        image: "圖片 / 截圖",
      },
    },
  });
}

export function getStudentHistoryCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Historique élève",
      title: "Toutes les sessions, avec leur état et leur point de reprise.",
      body:
        "Cette page devient la liste longue durée. Les cartes du tableau de bord restent volontairement courtes et orientées reprise rapide.",
      volumeTitle: "Volume actuel",
      totalVisibleSessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session visible", plural: "sessions visibles" },
          en: { singular: "visible session", plural: "visible sessions" },
          zh: "個可見課程",
        }),
      activeCount: (count: number) => `${count} en cours`,
      completedCount: (count: number) => `${count} terminées`,
      archivedCount: (count: number) => `${count} archivées`,
      backToDashboard: "Retour au tableau de bord",
      newHomework: "Nouveau devoir",
      emptyTitle: "Aucune session n'est encore enregistrée.",
      emptyBody:
        "Commence un premier devoir, puis cette page deviendra l'endroit naturel pour reprendre et relire le travail.",
      groups: {
        active: {
          title: "Sessions en cours",
          body: "Reprends une session encore ouverte ou termine-la pour figer son résumé.",
        },
        completed: {
          title: "Sessions terminées",
          body: "Ces sessions gardent leur résumé et restent consultables en lecture.",
        },
        archived: {
          title: "Archives",
          body: "Cette zone regroupe les anciennes sessions gardées à part du travail en cours.",
        },
      },
      noDate: "Date indisponible",
      graded: "Notée",
      practice: "Exercice libre",
      completedBody: "Le résumé se consulte depuis la page de session.",
      activeBody:
        "La session reste modifiable tant qu'elle n'est pas encore terminée.",
      lastActivity: "Dernière activité",
      openSession: "Ouvrir la session",
    },
    en: {
      eyebrow: "Student history",
      title: "Every session, with its state and resume point.",
      body:
        "This page is now the long-term list. The dashboard cards stay intentionally short and focused on quick resume.",
      volumeTitle: "Current volume",
      totalVisibleSessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session visible", plural: "sessions visibles" },
          en: { singular: "visible session", plural: "visible sessions" },
          zh: "個可見課程",
        }),
      activeCount: (count: number) => `${count} active`,
      completedCount: (count: number) => `${count} completed`,
      archivedCount: (count: number) => `${count} archived`,
      backToDashboard: "Back to dashboard",
      newHomework: "New homework",
      emptyTitle: "No session has been saved yet.",
      emptyBody:
        "Start a first homework flow, then this page will become the natural place to resume and review past work.",
      groups: {
        active: {
          title: "Active sessions",
          body: "Resume an open session or finish it to freeze its summary.",
        },
        completed: {
          title: "Completed sessions",
          body: "These sessions keep their summary and remain readable.",
        },
        archived: {
          title: "Archive",
          body: "This area holds older sessions that stay outside the current working list.",
        },
      },
      noDate: "Date unavailable",
      graded: "Graded",
      practice: "Open exercise",
      completedBody: "The summary is available from the session page.",
      activeBody: "The session stays editable until it is completed.",
      lastActivity: "Last activity",
      openSession: "Open session",
    },
    zh: {
      eyebrow: "學生歷程",
      title: "所有課程都集中在這裡，包含狀態與續接點。",
      body:
        "這裡會成為長期歷程清單；儀表板上的卡片則維持精簡，專注在快速續接。",
      volumeTitle: "目前總量",
      totalVisibleSessions: (count: number) =>
        formatCount(languageCode, count, {
          fr: { singular: "session visible", plural: "sessions visibles" },
          en: { singular: "visible session", plural: "visible sessions" },
          zh: "個可見課程",
        }),
      activeCount: (count: number) => `${count} 個進行中`,
      completedCount: (count: number) => `${count} 個已完成`,
      archivedCount: (count: number) => `${count} 個已封存`,
      backToDashboard: "回到儀表板",
      newHomework: "新作業",
      emptyTitle: "目前還沒有已儲存的課程。",
      emptyBody:
        "先開始第一份作業，之後這裡就會成為自然的續接與查閱清單。",
      groups: {
        active: {
          title: "進行中的課程",
          body: "你可以回到尚未結束的課程，或先把它完成以固定摘要。",
        },
        completed: {
          title: "已完成的課程",
          body: "這些課程會保留摘要，之後仍可閱讀。",
        },
        archived: {
          title: "封存",
          body: "這一區收納較早的課程，與目前正在進行的工作分開。",
        },
      },
      noDate: "日期不可用",
      graded: "已評分",
      practice: "自由練習",
      completedBody: "摘要可從課程頁面查看。",
      activeBody: "只要課程還沒完成，就仍然可以修改。",
      lastActivity: "最近活動",
      openSession: "打開課程",
    },
  });
}

export function getStudentChatThreadCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      noDate: "Date indisponible",
    },
    en: {
      noDate: "Date unavailable",
    },
    zh: {
      noDate: "日期不可用",
    },
  });
}

export function getStudentConversationComposerCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
      fr: {
        addAttachment: "Ajouter une pièce",
        voice: "Saisie vocale bientôt !",
        placeholder:
          "Explique où tu bloques, ce que tu as déjà essayé, ou l'étape que tu veux clarifier.",
        sending: "Envoi...",
        send: "Envoyer",
      },
      en: {
        addAttachment: "Add attachment",
        voice: "Voice input coming soon!",
        placeholder:
          "Explain where you're stuck, what you've already tried, or the step you want to clarify.",
        sending: "Sending...",
        send: "Send",
      },
      zh: {
        addAttachment: "加入附件",
        voice: "語音輸入即將推出！",
        placeholder: "說明你卡住的地方、已經試過什麼，或你想釐清的步驟。",
        sending: "傳送中...",
        send: "送出",
    },
  });
}

export function getStudentWorkspacePanelCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Notes de travail",
      title:
        "Garde ici le brouillon et les notes que tu veux retrouver pendant la discussion.",
      labels: {
        assignmentText: "Texte du devoir",
        reviewedText: "Texte relu",
        planText: "Plan de résolution",
        draftAnswerText: "Réponse brouillon",
        studentNotes: "Notes élève + références de pièces",
      },
      placeholders: {
        planText: "Liste ici les étapes ou sous-problèmes à traiter.",
        draftAnswerText: "Écris ici ta tentative avant la version finale.",
        studentNotes:
          "Ajoute ici tes notes libres, ou les références de fichiers à garder dans la session.",
      },
      unsaved:
        "Les modifications restent locales tant que tu ne sauvegardes pas.",
      saving: "Sauvegarde...",
      save: "Sauvegarder",
    },
    en: {
      eyebrow: "Work notes",
      title:
        "Keep your draft and the notes you want to revisit while the conversation continues.",
      labels: {
        assignmentText: "Homework text",
        reviewedText: "Reviewed text",
        planText: "Resolution plan",
        draftAnswerText: "Draft answer",
        studentNotes: "Student notes + attachment references",
      },
      placeholders: {
        planText: "List the steps or sub-problems to work through here.",
        draftAnswerText: "Write your attempt here before the final version.",
        studentNotes:
          "Add free-form notes here, or the file references you want to keep during the session.",
      },
      unsaved: "Changes stay local until you save them.",
      saving: "Saving...",
      save: "Save",
    },
    zh: {
      eyebrow: "工作筆記",
      title: "把草稿與你想在對話中反覆查看的內容放在這裡。",
      labels: {
        assignmentText: "作業文字",
        reviewedText: "重讀文字",
        planText: "解題計畫",
        draftAnswerText: "答案草稿",
        studentNotes: "學生筆記與附件參考",
      },
      placeholders: {
        planText: "把你要處理的步驟或子問題列在這裡。",
        draftAnswerText: "先把你的嘗試寫在這裡，再整理成最終版本。",
        studentNotes: "把自由筆記，或你想在這次課程保留的檔案參考寫在這裡。",
      },
      unsaved: "在你按下儲存前，這些修改都只會留在本地端。",
      saving: "儲存中...",
      save: "儲存",
    },
  });
}


export function getStudentWorkbenchCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      errors: {
        emptyMessage: "Ajoute un message avant de l'envoyer.",
        addConversationTurn:
          "Impossible d'ajouter ce tour de conversation.",
        saveWorkspace: "Impossible de sauvegarder l'espace de travail.",
        uploadAdded:
          "Pièce jointe confirmée et texte extrait synchronisé dans l'espace de travail.",
        addAttachment: "Impossible d'ajouter cette pièce jointe.",
        workspaceSaved: "Espace de travail sauvegardé.",
        completeSession: "Impossible de terminer cette session.",
        sessionCompleted:
          "Session terminée. Le résumé élève est maintenant figé.",
        retryExtraction: "Impossible de relancer l'extraction.",
        extractionRetried:
          "Extraction relancée. Pense à sauvegarder si le texte a changé.",
        deleteAttachment: "Impossible de retirer cette pièce jointe.",
      },
      graded: "Notée",
      practice: "Exercice libre",
      eyebrow: "Discussion de devoir",
      body:
        "Le devoir vit maintenant comme une discussion continue avec quelques repères latéraux, au lieu d'un empilement de cartes séparées.",
      resumeTitle: "Repères",
      createdOn: (dateLabel: string | null) => `Créée le ${dateLabel}`,
      lastActivity: (dateLabel: string | null) =>
        `Dernière activité le ${dateLabel}`,
      viewHistory: "Voir l'historique",
      newHomework: "Nouveau devoir",
      conversationEyebrow: "Conversation",
      conversationTitle: "Transcript persisté et contrôles de coaching",
      uploadInProgress: "Upload et extraction en cours...",
      readOnly:
        "Cette session est terminée. Le transcript reste lisible, mais les nouvelles écritures passent maintenant par une nouvelle session.",
      noFilesUploaded: "Aucun fichier uploadé",
      removeAttachment: "Retirer",
      removeAttachmentConfirm:
        "Retirer ce fichier de cette discussion ?",
      copyMessage: "Copier",
      copiedMessage: "Copié",
      copiedToast: "Copié !",
      pendingAssistant: "Laisse-moi voir...",
      previewImage: "Aperçu de l'image",
      expandPreview: "Agrandir",
      jumpToLatest: "Revenir en bas",
      closePreview: "Fermer l'aperçu",
      completeTooltip:
        "Le chat reste ouvert tant que tu ne choisis pas de terminer cette session.",
      completeButton: "Devoir terminé !",
    },
    en: {
      errors: {
        emptyMessage: "Add a message before sending it.",
        addConversationTurn: "Unable to add this conversation turn.",
        saveWorkspace: "Unable to save the workspace.",
        uploadAdded:
          "Attachment confirmed and extracted text synced into the workspace.",
        addAttachment: "Unable to add this attachment.",
        workspaceSaved: "Workspace saved.",
        completeSession: "Unable to complete this session.",
        sessionCompleted:
          "Session completed. The student summary is now frozen.",
        retryExtraction: "Unable to retry extraction.",
        extractionRetried:
          "Extraction retried. Save the workspace if the text changed.",
        deleteAttachment: "Unable to remove this file.",
      },
      graded: "Graded",
      practice: "Open exercise",
      eyebrow: "Homework conversation",
      body:
        "The homework now lives as one continuous discussion with a few side notes and private sources, instead of several competing panels.",
      resumeTitle: "Markers",
      createdOn: (dateLabel: string | null) => `Created on ${dateLabel}`,
      lastActivity: (dateLabel: string | null) =>
        `Last activity on ${dateLabel}`,
      viewHistory: "View history",
      newHomework: "New homework",
      conversationEyebrow: "Conversation",
      conversationTitle: "Persisted thread and coaching controls",
      uploadInProgress: "Upload and extraction in progress...",
      readOnly:
        "This session is completed. The transcript stays readable, but new writing now belongs in a new session.",
      noFilesUploaded: "No files uploaded",
      removeAttachment: "Remove",
      removeAttachmentConfirm:
        "Remove this file from this conversation?",
      copyMessage: "Copy",
      copiedMessage: "Copied",
      copiedToast: "Copied!",
      pendingAssistant: "Let me see...",
      previewImage: "Image preview",
      expandPreview: "Expand",
      jumpToLatest: "Jump to latest",
      closePreview: "Close preview",
      completeTooltip:
        "The chat stays open until you decide to wrap up this session.",
      completeButton: "Homework done!",
    },
    zh: {
      errors: {
        emptyMessage: "請先輸入訊息再送出。",
        addConversationTurn: "無法加入這一輪對話。",
        saveWorkspace: "無法儲存工作區。",
        uploadAdded: "附件已確認，擷取文字也已同步到工作區。",
        addAttachment: "無法加入這份附件。",
        workspaceSaved: "工作區已儲存。",
        completeSession: "無法結束這個課程。",
        sessionCompleted: "課程已結束，學生摘要現在已固定。",
        retryExtraction: "無法重新執行擷取。",
        extractionRetried: "已重新執行擷取；如果文字有變動，記得再儲存一次。",
        deleteAttachment: "無法移除這個檔案。",
      },
      graded: "已評分",
      practice: "自由練習",
      eyebrow: "作業對話",
      body:
        "這份作業現在是一段連續對話，旁邊只保留少量工作筆記與私密來源，而不是好幾塊彼此競爭的面板。",
      resumeTitle: "重點資訊",
      createdOn: (dateLabel: string | null) => `建立於 ${dateLabel}`,
      lastActivity: (dateLabel: string | null) => `最近活動於 ${dateLabel}`,
      viewHistory: "查看歷程",
      newHomework: "新作業",
      conversationEyebrow: "對話",
      conversationTitle: "已保存的對話串與教練控制",
      uploadInProgress: "正在上傳並擷取...",
      readOnly:
        "這個課程已完成。對話紀錄仍可閱讀，但新的書寫內容需要放到新的課程中。",
      noFilesUploaded: "尚未上傳檔案",
      removeAttachment: "移除",
      removeAttachmentConfirm:
        "要把這個檔案從這段對話中移除嗎？",
      copyMessage: "複製",
      copiedMessage: "已複製",
      copiedToast: "已複製！",
      pendingAssistant: "我看看……",
      previewImage: "圖片預覽",
      expandPreview: "放大",
      jumpToLatest: "回到最新訊息",
      closePreview: "關閉預覽",
      completeTooltip:
        "只要你還沒選擇結束，聊天就會保持開放。",
      completeButton: "作業完成！",
    },
  });
}

export function getStudentConversationServerCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      requestErrors: {
        invalidJson: "Corps JSON invalide.",
        expectedObject: "Le corps de la requête doit être un objet JSON.",
        invalidFields: "Un ou plusieurs champs sont invalides.",
      },
      access: {
        conversationNotFound: "Session introuvable.",
        conversationForbidden: "Tu n'as pas accès à cette session.",
        sessionReadOnly: "Cette session est terminée et reste en lecture seule.",
        archivedCannotComplete:
          "Cette session archivée ne peut pas être terminée à nouveau.",
      },
      createDraft: {
        titleInvalid:
          "Le titre est requis et doit rester sous 120 caractères.",
        subjectInvalid:
          "La matière est requise et doit rester sous 60 caractères.",
        sourceTextTooLong:
          "Le texte collé et le texte relu doivent rester sous 12000 caractères.",
        missingSource:
          "Ajoute du texte, des pièces jointes ou un texte relu avant de créer la session.",
        titleLabel: "Titre",
        subjectLabel: "Matière",
        gradedLabel: "Devoir noté",
        gradedYes: "oui",
        gradedNo: "non",
        attachmentsLabel: "Pièces référencées",
        workspaceAttachmentsLabel: "Pièces référencées pour cette session",
        pastedTextLabel: "Texte fourni",
        reviewedTextLabel: "Texte relu",
        pdfLabel: "PDF",
        imageLabel: "image / capture",
      },
      appendMessage: {
        messageRequired: "Le message est requis.",
        messageTooLong: "Le message doit rester sous 4000 caractères.",
        maskedStudentMessage: "[message masqué par la modération]",
        providerFallback:
          "Je n'arrive pas à répondre correctement pour l'instant. Réessaie dans un instant, ou ajoute une photo ou un extrait du cours si cela peut aider.",
      },
      workspace: {
        sourceTextTooLong:
          "La consigne et le texte extrait doivent rester sous 12000 caractères.",
        supportTextTooLong:
          "Le plan, le brouillon et les notes doivent rester sous 8000 caractères.",
      },
    },
    en: {
      requestErrors: {
        invalidJson: "Invalid JSON body.",
        expectedObject: "Expected a JSON object body.",
        invalidFields: "One or more fields are invalid.",
      },
      access: {
        conversationNotFound: "Conversation not found.",
        conversationForbidden:
          "You do not have access to this conversation.",
        sessionReadOnly: "Completed sessions are read-only.",
        archivedCannotComplete:
          "Archived sessions cannot be completed again.",
      },
      createDraft: {
        titleInvalid:
          "Title is required and must be 120 characters or fewer.",
        subjectInvalid:
          "Subject is required and must be 60 characters or fewer.",
        sourceTextTooLong:
          "Pasted and reviewed text must stay under 12000 characters.",
        missingSource:
          "Provide pasted text, attachment references, or reviewed extracted text before creating a session.",
        titleLabel: "Title",
        subjectLabel: "Subject",
        gradedLabel: "Graded homework",
        gradedYes: "yes",
        gradedNo: "no",
        attachmentsLabel: "Referenced attachments",
        workspaceAttachmentsLabel: "Attachments referenced for this session",
        pastedTextLabel: "Provided text",
        reviewedTextLabel: "Reviewed text",
        pdfLabel: "PDF",
        imageLabel: "image / capture",
      },
      appendMessage: {
        messageRequired: "Message text is required.",
        messageTooLong: "Message text must be 4000 characters or fewer.",
        maskedStudentMessage: "[message hidden by moderation]",
        providerFallback:
          "I’m having trouble answering clearly right now. Try again in a moment, or add a photo or class excerpt if that would help.",
      },
      workspace: {
        sourceTextTooLong:
          "Assignment and extracted text must stay under 12000 characters.",
        supportTextTooLong:
          "Workspace fields must stay under 8000 characters.",
      },
    },
    zh: {
      requestErrors: {
        invalidJson: "JSON 內容無效。",
        expectedObject: "請提供 JSON 物件格式的請求內容。",
        invalidFields: "有一個或多個欄位無效。",
      },
      access: {
        conversationNotFound: "找不到這個課程。",
        conversationForbidden: "你沒有權限存取這個課程。",
        sessionReadOnly: "這個已完成的課程目前為唯讀。",
        archivedCannotComplete: "已封存的課程不能再次結束。",
      },
      createDraft: {
        titleInvalid: "標題為必填，且必須在 120 個字元以內。",
        subjectInvalid: "科目為必填，且必須在 60 個字元以內。",
        sourceTextTooLong: "貼上的文字與重讀文字都必須在 12000 個字元以內。",
        missingSource: "建立課程前，請先提供貼上文字、附件參照或重讀後的擷取文字。",
        titleLabel: "標題",
        subjectLabel: "科目",
        gradedLabel: "是否為評分作業",
        gradedYes: "是",
        gradedNo: "否",
        attachmentsLabel: "已參照附件",
        workspaceAttachmentsLabel: "這個課程參照的附件",
        pastedTextLabel: "提供的文字",
        reviewedTextLabel: "重讀文字",
        pdfLabel: "PDF",
        imageLabel: "圖片 / 截圖",
      },
      appendMessage: {
        messageRequired: "訊息內容為必填。",
        messageTooLong: "訊息內容必須在 4000 個字元以內。",
        maskedStudentMessage: "[訊息已因審核而隱藏]",
        providerFallback:
          "我現在沒辦法好好回答這個問題。請稍後再試一次，或加入照片、課堂內容摘錄，這樣可能會更有幫助。",
      },
      workspace: {
        sourceTextTooLong: "作業題目與擷取文字都必須在 12000 個字元以內。",
        supportTextTooLong:
          "計畫、草稿與筆記欄位都必須在 8000 個字元以內。",
      },
    },
  });
}

export function getStudentDraftCoachCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      moderationSafeReply:
        "Je ne peux pas continuer sur cette demande telle quelle. Reformule ton besoin sur le devoir, montre ce que tu as déjà essayé, et je t'aiderai pas à pas.",
      hint: {
        title: "Indice de départ",
        assignmentFallback:
          "Reprends l'énoncé exact du devoir dans ton espace de travail.",
        firstStep: (title: string) =>
          `1. Reformule l'objectif du devoir : ${title}.`,
        secondStep: (subject: string) =>
          `2. Repère la matière et la consigne clé : ${subject}.`,
        thirdStep: (assignment: string) =>
          `3. À partir du texte disponible, commence par la partie la plus concrète : ${assignment}`,
        closing:
          "Avant de demander une solution complète, note ce que tu sais déjà faire et ce qui te bloque précisément.",
      },
      summary: {
        title: "Résumé de session",
        noPlan: "Aucun plan n'est encore noté dans l'espace de travail.",
        noDraft: "Aucune réponse brouillon n'est encore écrite.",
        assignment: (title: string) => `- Devoir : ${title}`,
        subject: (subject: string) => `- Matière : ${subject}`,
        plan: (planText: string) => `- Plan actuel : ${planText}`,
        draft: (draftText: string) => `- Réponse brouillon : ${draftText}`,
        nextStep:
          "Prochaine étape conseillée : choisis un sous-problème, écris ton essai dans le panneau de droite, puis demande un indice ciblé si besoin.",
      },
      generic: {
        title: "Coach brouillon",
        noReviewedText: "Aucun texte relu n'est encore disponible.",
        notedMessage: (message: string) => `J'ai noté ton message : "${message}".`,
        activeContext: (title: string, subject: string) =>
          `Contexte actif : ${title} (${subject}).`,
        reviewedText: (text: string) => `Texte relu disponible : ${text}`,
        nextStepTitle: "Étape suivante conseillée :",
        bullets: [
          "décris ce que tu as déjà essayé",
          "isole la question exacte à traiter",
          "remplis le plan ou la réponse brouillon dans l'espace de travail avant le futur moteur IA",
        ],
      },
      intents: {
        hint: "Je veux un indice pour avancer sur ce devoir.",
        summarize: "Peux-tu résumer la session et la prochaine étape utile ?",
      },
    },
    en: {
      moderationSafeReply:
        "I can't continue with that request as-is. Rephrase what you need on the homework, show what you've already tried, and I'll help step by step.",
      hint: {
        title: "Starting hint",
        assignmentFallback:
          "Copy the exact homework prompt into your workspace first.",
        firstStep: (title: string) =>
          `1. Restate the goal of the homework: ${title}.`,
        secondStep: (subject: string) =>
          `2. Identify the subject and the key instruction: ${subject}.`,
        thirdStep: (assignment: string) =>
          `3. From the text you have, start with the most concrete part: ${assignment}`,
        closing:
          "Before asking for a full solution, write down what you already know how to do and exactly where you're stuck.",
      },
      summary: {
        title: "Session summary",
        noPlan: "No plan is saved in the workspace yet.",
        noDraft: "No draft answer is written yet.",
        assignment: (title: string) => `- Homework: ${title}`,
        subject: (subject: string) => `- Subject: ${subject}`,
        plan: (planText: string) => `- Current plan: ${planText}`,
        draft: (draftText: string) => `- Draft answer: ${draftText}`,
        nextStep:
          "Recommended next step: pick one sub-problem, write your attempt in the right panel, then ask for a targeted hint if needed.",
      },
      generic: {
        title: "Draft coach",
        noReviewedText: "No reviewed text is available yet.",
        notedMessage: (message: string) =>
          `I noted your message: "${message}".`,
        activeContext: (title: string, subject: string) =>
          `Active context: ${title} (${subject}).`,
        reviewedText: (text: string) => `Reviewed text available: ${text}`,
        nextStepTitle: "Recommended next step:",
        bullets: [
          "describe what you already tried",
          "isolate the exact question to solve",
          "fill in the plan or draft-answer area before the full AI engine takes over",
        ],
      },
      intents: {
        hint: "I want a hint to move forward on this homework.",
        summarize: "Can you summarize the session and the most useful next step?",
      },
    },
    zh: {
      moderationSafeReply:
        "我現在不能直接照這個請求繼續。請重新說明你在這份作業上需要什麼、你已經試過什麼，我會一步一步協助你。",
      hint: {
        title: "起始提示",
        assignmentFallback: "先把作業原題完整放進工作區。",
        firstStep: (title: string) =>
          `1. 先用自己的話重述作業目標：${title}。`,
        secondStep: (subject: string) =>
          `2. 找出科目與關鍵指令：${subject}。`,
        thirdStep: (assignment: string) =>
          `3. 從目前可用的文字開始，先處理最具體的部分：${assignment}`,
        closing:
          "在要求完整答案之前，先寫下你已經會做什麼，以及你卡住的精確位置。",
      },
      summary: {
        title: "課程摘要",
        noPlan: "工作區裡還沒有記錄任何計畫。",
        noDraft: "目前還沒有寫下任何草稿答案。",
        assignment: (title: string) => `- 作業：${title}`,
        subject: (subject: string) => `- 科目：${subject}`,
        plan: (planText: string) => `- 目前計畫：${planText}`,
        draft: (draftText: string) => `- 草稿答案：${draftText}`,
        nextStep:
          "建議下一步：先挑一個子問題，在右側面板寫下你的嘗試，再視需要要求更精準的提示。",
      },
      generic: {
        title: "草稿教練",
        noReviewedText: "目前還沒有可用的重讀文字。",
        notedMessage: (message: string) => `我記下了你的訊息：「${message}」。`,
        activeContext: (title: string, subject: string) =>
          `目前情境：${title}（${subject}）。`,
        reviewedText: (text: string) => `可用的重讀文字：${text}`,
        nextStepTitle: "建議下一步：",
        bullets: [
          "描述你已經試過什麼",
          "把要處理的精確問題單獨挑出來",
          "在完整 AI 引擎接手前，先把計畫或草稿答案填進工作區",
        ],
      },
      intents: {
        hint: "我想要一個提示，幫我繼續完成這份作業。",
        summarize: "可以幫我整理這次課程，以及下一個最有用的步驟嗎？",
      },
    },
  });
}

export function getDeterministicStudentSummaryCopy(
  languageCode: UiLanguageCode,
) {
  return pickLocalizedValue(languageCode, {
    fr: {
      progressTitle: "Progression observée",
      progressLines: {
        studentMessages: (count: number) => `- Échanges élève : ${count}`,
        assistantMessages: (count: number) => `- Réponses de coaching : ${count}`,
        planSaved: (saved: boolean) =>
          `- Plan noté : ${saved ? "oui" : "non"}`,
        draftSaved: (saved: boolean) =>
          `- Brouillon présent : ${saved ? "oui" : "non"}`,
      },
      nextSteps: {
        refineDraft:
          "Reprends ton brouillon, vérifie chaque étape, puis ouvre une nouvelle session si tu veux un feedback plus ciblé.",
        writeDraft:
          "Transforme maintenant ton plan en premier brouillon complet avant de lancer une nouvelle session.",
        clarifyPlan:
          "Reformule la consigne et écris un plan court en 3 étapes avant la prochaine reprise.",
      },
      summary: {
        title: (title: string) => `Session terminée : ${title}`,
        subject: (subject: string) => `Matière : ${subject}`,
        assignment: (text: string) => `Consigne retenue : ${text}`,
        noAssignment:
          "Consigne retenue : la session doit encore conserver un énoncé plus explicite.",
        reviewedText: (text: string) => `Texte relu disponible : ${text}`,
        noReviewedText:
          "Texte relu disponible : aucun texte relu n'a été sauvegardé pour cette session.",
        plan: (text: string) => `Plan de travail : ${text}`,
        noPlan:
          "Plan de travail : aucun plan n'a été noté pendant la session.",
        draft: (text: string) => `Brouillon actuel : ${text}`,
        noDraft:
          "Brouillon actuel : aucune tentative rédigée n'a été gardée.",
        nextStep: (text: string) => `Prochaine étape conseillée : ${text}`,
      },
    },
    en: {
      progressTitle: "Observed progress",
      progressLines: {
        studentMessages: (count: number) => `- Student turns: ${count}`,
        assistantMessages: (count: number) => `- Coaching replies: ${count}`,
        planSaved: (saved: boolean) =>
          `- Plan recorded: ${saved ? "yes" : "no"}`,
        draftSaved: (saved: boolean) =>
          `- Draft present: ${saved ? "yes" : "no"}`,
      },
      nextSteps: {
        refineDraft:
          "Review your draft, verify each step, then open a new session if you want more targeted feedback.",
        writeDraft:
          "Turn your plan into a first complete draft before starting a new session.",
        clarifyPlan:
          "Restate the assignment and write a short 3-step plan before resuming again.",
      },
      summary: {
        title: (title: string) => `Session completed: ${title}`,
        subject: (subject: string) => `Subject: ${subject}`,
        assignment: (text: string) => `Saved assignment: ${text}`,
        noAssignment:
          "Saved assignment: the session still needs a clearer prompt to be kept here.",
        reviewedText: (text: string) => `Reviewed text available: ${text}`,
        noReviewedText:
          "Reviewed text available: no reviewed text was saved for this session.",
        plan: (text: string) => `Work plan: ${text}`,
        noPlan: "Work plan: no plan was saved during this session.",
        draft: (text: string) => `Current draft: ${text}`,
        noDraft: "Current draft: no written attempt was kept.",
        nextStep: (text: string) => `Recommended next step: ${text}`,
      },
    },
    zh: {
      progressTitle: "觀察到的進展",
      progressLines: {
        studentMessages: (count: number) => `- 學生訊息輪次：${count}`,
        assistantMessages: (count: number) => `- 教練回覆輪次：${count}`,
        planSaved: (saved: boolean) =>
          `- 是否記錄計畫：${saved ? "是" : "否"}`,
        draftSaved: (saved: boolean) =>
          `- 是否保留草稿：${saved ? "是" : "否"}`,
      },
      nextSteps: {
        refineDraft:
          "回頭檢查你的草稿、逐步驗證每個步驟；如果需要更精準的回饋，再開一個新課程。",
        writeDraft:
          "先把目前的計畫擴寫成第一版完整草稿，再開始新的課程。",
        clarifyPlan:
          "下次續接前，先重新表述題目，並寫一個三步驟短計畫。",
      },
      summary: {
        title: (title: string) => `課程已結束：${title}`,
        subject: (subject: string) => `科目：${subject}`,
        assignment: (text: string) => `保留的題目內容：${text}`,
        noAssignment: "保留的題目內容：這個課程仍需要更清楚的題目敘述。",
        reviewedText: (text: string) => `可用的重讀文字：${text}`,
        noReviewedText: "可用的重讀文字：這個課程沒有儲存任何重讀文字。",
        plan: (text: string) => `工作計畫：${text}`,
        noPlan: "工作計畫：這次課程中沒有記錄任何計畫。",
        draft: (text: string) => `目前草稿：${text}`,
        noDraft: "目前草稿：沒有保留任何已寫出的嘗試。",
        nextStep: (text: string) => `建議下一步：${text}`,
      },
    },
  });
}

export function getStudentUploadServerCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      requestErrors: {
        invalidJson: "Corps JSON invalide.",
        expectedObject: "Le corps de la requête doit être un objet JSON.",
        invalidFields: "Un ou plusieurs champs sont invalides.",
      },
      access: {
        conversationNotFound: "Session introuvable.",
        conversationForbidden: "Tu n'as pas accès à cette session.",
        uploadsClosed: "Cette session terminée n'accepte plus de nouvelles pièces jointes.",
        attachmentNotFound: "Pièce jointe introuvable.",
        attachmentForbidden: "Tu n'as pas accès à cette pièce jointe.",
        attachmentSizeMismatch:
          "La taille du fichier envoyé ne correspond pas à la pièce jointe réservée.",
      },
      validation: {
        conversationIdRequired: "L'identifiant de session est requis.",
        originalFilenameRequired: "Le nom du fichier est requis.",
        attachmentIdsRequired:
          "L'identifiant de session et l'identifiant de pièce jointe sont requis.",
        unsupportedFileType: "Type de fichier non pris en charge.",
        fileSizePositive: "La taille du fichier doit être supérieure à zéro.",
        fileTooLarge: (maxMb: number) =>
          `Ce fichier dépasse la limite de ${maxMb} Mo pour ce type de document.`,
        attachmentLimit:
          "Cette session a déjà atteint la limite de pièces jointes.",
        uploadBudgetExceeded:
          "Cet envoi dépasserait le budget d'upload de la session.",
      },
      warnings: {
        extractionFailed:
          "Le texte n'a pas pu être extrait proprement. Garde la pièce jointe et relis manuellement la zone utile.",
        extractionPartial:
          "Extraction partielle : relis le texte avant de t'appuyer dessus.",
        sourceLabel: (filename: string) => `[Source : ${filename}]`,
      },
    },
    en: {
      requestErrors: {
        invalidJson: "Invalid JSON body.",
        expectedObject: "Expected a JSON object body.",
        invalidFields: "One or more fields are invalid.",
      },
      access: {
        conversationNotFound: "Conversation not found.",
        conversationForbidden:
          "You do not have access to this conversation.",
        uploadsClosed: "Completed sessions do not accept new uploads.",
        attachmentNotFound: "Attachment not found.",
        attachmentForbidden:
          "You do not have access to this attachment.",
        attachmentSizeMismatch:
          "Uploaded file size does not match the reserved attachment.",
      },
      validation: {
        conversationIdRequired: "Conversation id is required.",
        originalFilenameRequired: "Original filename is required.",
        attachmentIdsRequired:
          "Conversation id and attachment id are required.",
        unsupportedFileType: "Unsupported file type.",
        fileSizePositive: "File size must be greater than zero.",
        fileTooLarge: (maxMb: number) =>
          `This file exceeds the ${maxMb} MB limit for this file type.`,
        attachmentLimit:
          "This session already reached the attachment limit.",
        uploadBudgetExceeded:
          "This upload would exceed the session upload budget.",
      },
      warnings: {
        extractionFailed:
          "The text could not be extracted cleanly. Keep the attachment and review the useful area manually.",
        extractionPartial:
          "Partial extraction: review the text before relying on it.",
        sourceLabel: (filename: string) => `[Source: ${filename}]`,
      },
    },
    zh: {
      requestErrors: {
        invalidJson: "JSON 內容無效。",
        expectedObject: "請提供 JSON 物件格式的請求內容。",
        invalidFields: "有一個或多個欄位無效。",
      },
      access: {
        conversationNotFound: "找不到這個課程。",
        conversationForbidden: "你沒有權限存取這個課程。",
        uploadsClosed: "已完成的課程不再接受新的附件。",
        attachmentNotFound: "找不到這份附件。",
        attachmentForbidden: "你沒有權限存取這份附件。",
        attachmentSizeMismatch: "上傳檔案的大小與預留附件不一致。",
      },
      validation: {
        conversationIdRequired: "課程識別碼為必填。",
        originalFilenameRequired: "原始檔名為必填。",
        attachmentIdsRequired: "課程識別碼與附件識別碼皆為必填。",
        unsupportedFileType: "不支援這種檔案類型。",
        fileSizePositive: "檔案大小必須大於零。",
        fileTooLarge: (maxMb: number) =>
          `這個檔案超過此類型 ${maxMb} MB 的大小上限。`,
        attachmentLimit: "這個課程已達附件數量上限。",
        uploadBudgetExceeded: "這次上傳會超過這個課程的上傳預算。",
      },
      warnings: {
        extractionFailed:
          "系統無法乾淨地擷取文字。請保留附件，並手動重新檢查需要的區段。",
        extractionPartial:
          "擷取結果不完整：請先重新檢查文字，再依此內容繼續。",
        sourceLabel: (filename: string) => `[來源：${filename}]`,
      },
    },
  });
}

export function getWeaknessTagLabel(
  tag: string,
  languageCode: UiLanguageCode,
) {
  const labels = pickLocalizedValue(languageCode, {
    fr: {
      structurer_la_demarche: "Structurer la démarche",
      formaliser_une_tentative: "Formaliser une tentative",
      clarifier_la_consigne: "Clarifier la consigne",
      verifier_le_raisonnement: "Vérifier le raisonnement",
      justifier_la_reponse: "Justifier la réponse",
    },
    en: {
      structurer_la_demarche: "Structure the approach",
      formaliser_une_tentative: "Write down an attempt",
      clarifier_la_consigne: "Clarify the prompt",
      verifier_le_raisonnement: "Check the reasoning",
      justifier_la_reponse: "Justify the answer",
    },
    zh: {
      structurer_la_demarche: "整理解題步驟",
      formaliser_une_tentative: "把嘗試寫出來",
      clarifier_la_consigne: "釐清題目要求",
      verifier_le_raisonnement: "檢查推理過程",
      justifier_la_reponse: "說明答案依據",
    },
  });

  return (
    labels[tag as keyof typeof labels] ??
    tag.replaceAll("_", " ")
  );
}
