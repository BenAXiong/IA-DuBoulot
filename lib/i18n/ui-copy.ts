import type { AppUserRecord, UiLanguageCode } from "@/lib/server/auth/types";

type LocalizedValue<T> = Record<UiLanguageCode, T>;

function pickLocalizedValue<T>(
  languageCode: UiLanguageCode,
  variants: LocalizedValue<T>,
) {
  return variants[languageCode];
}

export function getThemeToggleCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      label: "Thème",
      light: "Clair",
      dark: "Sombre",
    },
    en: {
      label: "Theme",
      light: "Light",
      dark: "Dark",
    },
    zh: {
      label: "主題",
      light: "淺色",
      dark: "深色",
    },
  });
}

export function getPublicShellCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      tagline: "Aide guidée. Visibilité adulte.",
      nav: {
        product: "Produit",
        pricing: "Tarifs",
        auth: "Connexion",
      },
      pilotBadge: "Pilot privé",
      start: "Commencer",
      openApp: "Connexion",
      footerBadge: "Pilot supervisé",
      footerTitle:
        "Une base simple et lisible pour les premières familles.",
      footerBody:
        "Le produit avance par petits pas: guidance côté élève, visibilité côté adulte, et un cadre clair avant d'ouvrir plus largement le service.",
      footerColumns: [
        {
          title: "Élève",
          items: [
            "Commencer avec un devoir réel",
            "Recevoir des indices avant la réponse",
            "Retrouver son travail d'une session à l'autre",
          ],
        },
        {
          title: "Parent",
          items: [
            "Voir l'historique et les résumés",
            "Suivre le quota et le statut du compte",
            "Garder la main sur la confidentialité",
          ],
        },
        {
          title: "Tuteur",
          items: [
            "Retrouver le contexte d'un élève lié",
            "Lire une synthèse dédiée au suivi",
            "Conserver des notes privées",
          ],
        },
      ],
    },
    en: {
      tagline: "Guided help. Adult visibility.",
      nav: {
        product: "Product",
        pricing: "Pricing",
        auth: "Sign in",
      },
      pilotBadge: "Private pilot",
      start: "Get started",
      openApp: "Sign in",
      footerBadge: "Supervised pilot",
      footerTitle:
        "A simple public entry for the first families.",
      footerBody:
        "The product stays intentionally focused: guided student help, adult visibility, and a clear trust frame before access widens.",
      footerColumns: [
        {
          title: "Student",
          items: [
            "Start from a real homework task",
            "Get guidance before full answers",
            "Return to the same work later",
          ],
        },
        {
          title: "Parent",
          items: [
            "Review summaries and history",
            "Track quota and account status",
            "Keep privacy controls close",
          ],
        },
        {
          title: "Tutor",
          items: [
            "Pick up the linked student context",
            "Read a tutor-specific summary",
            "Keep private support notes",
          ],
        },
      ],
    },
    zh: {
      tagline: "有引導的協助，保留大人視角。",
      nav: {
        product: "產品",
        pricing: "方案",
        auth: "登入",
      },
      pilotBadge: "封閉 Pilot",
      start: "開始使用",
      openApp: "登入",
      footerBadge: "受監督 Pilot",
      footerTitle: "先把公開入口做得簡單、清楚、可被信任。",
      footerBody:
        "產品刻意保持聚焦：學生端有引導，大人端有可見性，在更廣泛開放之前先把信任框架建立好。",
      footerColumns: [
        {
          title: "學生",
          items: [
            "從真實作業開始",
            "先得到引導，再接近答案",
            "可以回到同一份作業繼續",
          ],
        },
        {
          title: "家長",
          items: [
            "查看摘要與歷史紀錄",
            "掌握配額與帳號狀態",
            "把隱私控制留在手邊",
          ],
        },
        {
          title: "家教",
          items: [
            "接手已連結學生的脈絡",
            "閱讀家教專用摘要",
            "保留私人教學筆記",
          ],
        },
      ],
    },
  });
}

export function getHomePageCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      badges: ["Pilot privé", "FR / EN / ZH"],
      eyebrow: "Aide aux devoirs supervisée",
      title:
        "Une aide IA qui guide l'élève sans sortir les adultes du cadre.",
      body:
        "L'élève avance étape par étape, le parent garde de la visibilité, et le tuteur retrouve le fil du travail. Le produit reste volontairement simple, calme et pensé pour de vrais devoirs.",
      ctas: {
        primary: "Entrer dans l'app",
        secondary: "Voir les tarifs",
        journey: "Comprendre le parcours",
      },
      supportCard: {
        eyebrow: "Ce que le produit apporte",
        title: "Un cadre clair pour chaque rôle.",
        items: [
          "L'élève travaille avec des indices, un espace de brouillon et un historique.",
          "Le parent voit les résumés, le statut du compte et les contrôles de confidentialité.",
          "Le tuteur retrouve un élève lié sans accéder à toute la mémoire brute.",
        ],
      },
      proof: [
        {
          title: "Côté élève",
          body: "Le produit aide à avancer sans transformer le devoir en simple machine à réponses.",
        },
        {
          title: "Côté adulte",
          body: "Les parents et les tuteurs gardent de la visibilité au lieu d'être exclus du travail fait avec l'IA.",
        },
        {
          title: "Côté produit",
          body: "Le MVP reste resserré: parcours simple, ton calme, et pilot fermé avant toute ouverture plus large.",
        },
      ],
      journeyEyebrow: "Parcours",
      journeyTitle: "Trois étapes simples pour garder le devoir lisible.",
      journeySteps: [
        {
          title: "1. Importer le devoir",
          body: "PDF, capture, photo ou texte libre: l'entrée suit la réalité du travail scolaire.",
        },
        {
          title: "2. Travailler avec l'IA",
          body: "L'élève avance avec des indices, un espace de brouillon et des réponses orientées apprentissage.",
        },
        {
          title: "3. Garder les adultes alignés",
          body: "Résumés, revue et notes privées permettent un suivi sans ouvrir tout le contexte à tout le monde.",
        },
      ],
      rolesEyebrow: "Rôles",
      rolesTitle: "Trois rôles, une même base de confiance.",
      roles: [
        {
          title: "Élève",
          body: "Commencer un devoir, reprendre une session, et obtenir une aide qui reste pédagogique.",
        },
        {
          title: "Parent",
          body: "Voir la progression, comprendre les points fragiles et garder la main sur le compte.",
        },
        {
          title: "Tuteur",
          body: "Relire une session, suivre les besoins et conserver des notes privées de continuité.",
        },
      ],
      closing: {
        eyebrow: "Pilot",
        title: "Le pilot reste volontairement fermé.",
        body: "Le bon objectif pour maintenant n'est pas d'ajouter du bruit, mais de rendre l'expérience assez nette pour les premières familles réelles.",
        cta: "Commencer",
      },
      helper: {
        buttonLabel: "Accès rapide",
        title: "Accès rapide",
        body: "Les raccourcis produit et opérateur sont regroupés ici pour garder la page d'accueil plus calme.",
        links: {
          auth: "Connexion",
          student: "Inscription élève",
          parent: "Inscription parent",
          tutor: "Inscription tuteur",
          github: "Repo GitHub",
          vercel: "Projet Vercel",
        },
      },
    },
    en: {
      badges: ["Private pilot", "FR / EN / ZH"],
      eyebrow: "Supervised homework help",
      title:
        "AI homework help that guides the student without cutting adults out.",
      body:
        "The student moves step by step, the parent keeps visibility, and the tutor can pick up the thread. The product stays intentionally simple, calm, and built for real homework.",
      ctas: {
        primary: "Open the app",
        secondary: "See pricing",
        journey: "See the flow",
      },
      supportCard: {
        eyebrow: "What the product does",
        title: "A clear frame for each role.",
        items: [
          "The student works with hints, a scratchpad, and session history.",
          "The parent sees summaries, account state, and privacy controls.",
          "The tutor can pick up a linked student without getting full raw memory access.",
        ],
      },
      proof: [
        {
          title: "Student side",
          body: "The product helps the student move forward without becoming a pure answer machine.",
        },
        {
          title: "Adult side",
          body: "Parents and tutors keep visibility instead of being pushed out of the AI-assisted work.",
        },
        {
          title: "Product side",
          body: "The MVP stays tight: simple flow, calm tone, and a closed pilot before any wider rollout.",
        },
      ],
      journeyEyebrow: "Flow",
      journeyTitle: "Three simple steps that keep the homework readable.",
      journeySteps: [
        {
          title: "1. Bring the homework in",
          body: "PDF, screenshot, photo, or pasted text: intake follows how students actually work.",
        },
        {
          title: "2. Work with guided help",
          body: "The student gets hints, a workspace, and learning-oriented replies instead of instant full solutions.",
        },
        {
          title: "3. Keep adults aligned",
          body: "Summaries, review, and private notes support follow-up without exposing every surface to every role.",
        },
      ],
      rolesEyebrow: "Roles",
      rolesTitle: "Three roles, one trust frame.",
      roles: [
        {
          title: "Student",
          body: "Start homework, return to a session later, and get help that stays pedagogical.",
        },
        {
          title: "Parent",
          body: "Review progress, understand fragile points, and keep control of the account.",
        },
        {
          title: "Tutor",
          body: "Review a session, follow recurring needs, and keep private continuity notes.",
        },
      ],
      closing: {
        eyebrow: "Pilot",
        title: "The pilot stays intentionally closed.",
        body: "The right goal for now is not more noise. It is a calmer experience that is strong enough for the first real families.",
        cta: "Get started",
      },
      helper: {
        buttonLabel: "Quick access",
        title: "Quick access",
        body: "Product and operator shortcuts live here so the landing page can stay quieter.",
        links: {
          auth: "Sign in",
          student: "Student sign-up",
          parent: "Parent sign-up",
          tutor: "Tutor sign-up",
          github: "GitHub repo",
          vercel: "Vercel project",
        },
      },
    },
    zh: {
      badges: ["封閉 Pilot", "FR / EN / ZH"],
      eyebrow: "受監督的作業協助",
      title: "用 AI 引導學生做作業，同時不把大人排除在外。",
      body:
        "學生可以一步一步前進，家長保有可見性，家教也能接上脈絡。產品刻意保持簡單、安定，而且是為真實作業情境而設計。",
      ctas: {
        primary: "進入 App",
        secondary: "查看方案",
        journey: "了解流程",
      },
      supportCard: {
        eyebrow: "產品帶來什麼",
        title: "為每個角色保留清楚的框架。",
        items: [
          "學生可用提示、草稿空間與歷史紀錄來完成作業。",
          "家長可看到摘要、帳號狀態與隱私控制。",
          "家教可以接手已連結學生的情境，但不會直接看到完整原始記憶。",
        ],
      },
      proof: [
        {
          title: "學生端",
          body: "產品幫助學生向前推進，但不會變成單純吐答案的機器。",
        },
        {
          title: "大人端",
          body: "家長與家教保有可見性，而不是被排除在 AI 協助之外。",
        },
        {
          title: "產品端",
          body: "MVP 刻意收斂：流程簡單、語氣安定，並先以封閉 Pilot 驗證。",
        },
      ],
      journeyEyebrow: "流程",
      journeyTitle: "三個簡單步驟，讓作業過程保持清楚。",
      journeySteps: [
        {
          title: "1. 帶入作業",
          body: "PDF、截圖、照片或貼上文字都可以，符合學生真實的使用方式。",
        },
        {
          title: "2. 在引導下完成",
          body: "學生會得到提示、工作區與偏向學習的回應，而不是立即拿到完整答案。",
        },
        {
          title: "3. 讓大人保持同步",
          body: "摘要、回顧與私人筆記讓後續追蹤可行，同時不把每個面向都暴露給所有角色。",
        },
      ],
      rolesEyebrow: "角色",
      rolesTitle: "三種角色，共用同一套信任框架。",
      roles: [
        {
          title: "學生",
          body: "開始一份作業、之後再回來續做，並得到仍然具有教學性的協助。",
        },
        {
          title: "家長",
          body: "查看進度、理解脆弱點，並保有對帳號與資料的控制。",
        },
        {
          title: "家教",
          body: "回顧作業過程、追蹤反覆需求，並留下私人連續性筆記。",
        },
      ],
      closing: {
        eyebrow: "Pilot",
        title: "目前的 Pilot 會刻意維持封閉。",
        body: "現在真正重要的不是更多噪音，而是把體驗整理得夠穩、夠清楚，讓第一批真實家庭敢用。",
        cta: "開始使用",
      },
      helper: {
        buttonLabel: "快速入口",
        title: "快速入口",
        body: "產品與操作捷徑先收在這裡，讓首頁保持更安靜。",
        links: {
          auth: "登入",
          student: "學生註冊",
          parent: "家長註冊",
          tutor: "家教註冊",
          github: "GitHub repo",
          vercel: "Vercel 專案",
        },
      },
    },
  });
}

export function getPricingPageCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Pricing shell",
      title: "Une page tarifs crédible sans figer trop tôt le business model.",
      body:
        "Le MVP ne vend pas encore un abonnement final. Cette page sert à poser le vocabulaire public et à préparer l'intégration Lemon Squeezy sans surpromettre les offres.",
      posture: {
        title: "Posture MVP",
        body: "Le parcours parent pointe déjà vers le vrai chemin de checkout et de portail. Le paramétrage Lemon final reste à activer selon l'environnement.",
      },
      tiers: [
        {
          name: "Pilot",
          price: "Gratuit / sur invitation",
          body: "Pour la phase de construction et les premiers retours terrain avant un packaging stable.",
          points: ["Accès supervisé", "Auth et invitations réelles", "Quota d'essai actif"],
        },
        {
          name: "Family",
          price: "À définir pour le MVP",
          body: "Cible parent payeur avec suivi enfant, résumés et futur portail de facturation.",
          points: ["Compte parent payeur", "Historique et supervision", "Checkout et portail Lemon Squeezy"],
        },
        {
          name: "Tutor",
          price: "Plus tard",
          body: "Surface tuteur liée à un élève, pensée pour le suivi pédagogique plutôt que pour une marketplace.",
          points: ["Lien d'invitation tracé", "Accès restreint par rôle", "Notes privées à venir"],
        },
      ],
      ctas: {
        auth: "Tester l'auth",
        back: "Retour produit",
      },
    },
    en: {
      eyebrow: "Pricing shell",
      title: "A credible pricing page without freezing the business model too early.",
      body:
        "The MVP is not selling a final subscription yet. This page defines the public vocabulary and prepares Lemon Squeezy integration without overpromising the offers.",
      posture: {
        title: "MVP posture",
        body: "The parent journey already points to the real checkout and portal path. Final Lemon configuration still depends on environment setup.",
      },
      tiers: [
        {
          name: "Pilot",
          price: "Free / invite",
          body: "For the build phase and the first real feedback cycles before the package is stable.",
          points: ["Supervised access", "Real auth and invitations", "Trial quota enabled"],
        },
        {
          name: "Family",
          price: "TBD for MVP",
          body: "Parent payer target with child follow-up, summaries, and the future billing portal.",
          points: ["Parent payer account", "History and oversight", "Lemon Squeezy checkout and portal"],
        },
        {
          name: "Tutor",
          price: "Later",
          body: "Tutor surface linked to one student, built for pedagogical follow-up rather than a marketplace.",
          points: ["Tracked invitation link", "Role-restricted access", "Private notes later"],
        },
      ],
      ctas: {
        auth: "Try auth",
        back: "Back to product",
      },
    },
    zh: {
      eyebrow: "Pricing shell",
      title: "先做可信的方案頁，但不要太早把商業模式鎖死。",
      body:
        "MVP 還不是最終訂閱方案。這一頁的目的，是先建立公開對外的語言，同時為 Lemon Squeezy 整合預留位置，而不是過度承諾。",
      posture: {
        title: "MVP 姿態",
        body: "家長路徑已經指向真正的 checkout 與 portal。最終 Lemon 參數仍要依環境再打開。",
      },
      tiers: [
        {
          name: "Pilot",
          price: "免費 / 邀請制",
          body: "用於建置階段與第一輪真實使用回饋，先不要急著定義最終包裝。",
          points: ["受監督存取", "真實 auth 與邀請", "試用額度啟用"],
        },
        {
          name: "Family",
          price: "MVP 待定",
          body: "面向付費家長，提供孩子追蹤、摘要與未來帳務入口。",
          points: ["家長付費帳號", "歷史與監督", "Lemon Squeezy checkout / portal"],
        },
        {
          name: "Tutor",
          price: "之後再做",
          body: "與單一學生綁定的家教介面，重點是教學追蹤，不是 marketplace。",
          points: ["可追蹤邀請連結", "角色限制存取", "日後補上私人筆記"],
        },
      ],
      ctas: {
        auth: "試用登入",
        back: "回產品頁",
      },
    },
  });
}

export function getAuthIntentLabel(
  languageCode: UiLanguageCode,
  role: "student" | "parent" | "tutor",
  intent: string | null,
) {
  if (intent === "parent_link") {
    return pickLocalizedValue(languageCode, {
      fr: role === "parent"
        ? "Flux parent présélectionné pour créer puis lier un compte supervisé."
        : "Flux parent détecté. Le rôle parent est recommandé pour continuer.",
      en: role === "parent"
        ? "Parent flow preselected to create and then link a supervised account."
        : "Parent-link flow detected. The parent role is recommended to continue.",
      zh: role === "parent"
        ? "已預選家長流程，可先建立帳號再連結受監督帳戶。"
        : "偵測到家長連結流程，建議用家長角色繼續。",
    });
  }

  if (intent === "tutor_link") {
    return pickLocalizedValue(languageCode, {
      fr: role === "tutor"
        ? "Flux tuteur présélectionné pour une future liaison élève-tuteur."
        : "Flux tuteur détecté. Le rôle tuteur est recommandé pour continuer.",
      en: role === "tutor"
        ? "Tutor flow preselected for a future student-tutor link."
        : "Tutor-link flow detected. The tutor role is recommended to continue.",
      zh: role === "tutor"
        ? "已預選家教流程，供後續建立學生與家教的連結。"
        : "偵測到家教連結流程，建議用家教角色繼續。",
    });
  }

  return null;
}

export function getAuthPanelCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      errorFallback: "Une erreur inattendue est survenue.",
      signUpInfo: {
        invite:
          "Compte créé. Confirme l'adresse email depuis le message Supabase. Le produit reprendra automatiquement l'invitation dans ce navigateur.",
        default:
          "Compte créé. Confirme l'adresse email depuis le message Supabase avant de continuer.",
      },
      eyebrow: "Auth branch",
      title: "Connecter la vraie session Supabase au produit.",
      body:
        "Cette étape ouvre le flux réel vers l'onboarding, le bootstrap de profil et les pages protégées déjà branchées au backend.",
      checklistTitle: "Ce qui est déjà branché :",
      checklist: [
        "email + mot de passe via Supabase SSR",
        "route de confirmation email `auth/confirm`",
        "page d'onboarding reliée au bootstrap API",
        "redirection vers `/app` si le profil existe déjà",
      ],
      tabs: {
        signIn: "Connexion",
        signUp: "Création",
      },
      accountType: "Type de compte",
      roles: [
        { value: "student", title: "Élève", body: "Aide aux devoirs et espace de travail." },
        { value: "parent", title: "Parent", body: "Supervision et suivis des sessions." },
        { value: "tutor", title: "Tuteur", body: "Accompagnement pédagogique ciblé." },
      ],
      fields: {
        email: "Email",
        password: "Mot de passe",
      },
      placeholders: {
        password: "8 caractères minimum",
      },
      buttons: {
        signIn: "Se connecter",
        signUp: "Créer le compte",
        pending: "Traitement...",
      },
      footer: {
        signIn:
          "Si la session est valide mais qu'aucun profil applicatif n'existe encore, la prochaine étape sera l'onboarding.",
        signUp:
          "Si la confirmation email est active, l'utilisateur devra valider le lien avant d'arriver sur l'onboarding.",
      },
    },
    en: {
      errorFallback: "An unexpected error occurred.",
      signUpInfo: {
        invite:
          "Account created. Confirm the email address from the Supabase message. The product will resume the invitation automatically in this browser.",
        default:
          "Account created. Confirm the email address from the Supabase message before continuing.",
      },
      eyebrow: "Auth branch",
      title: "Connect the real Supabase session to the product.",
      body:
        "This step opens the real flow toward onboarding, profile bootstrap, and the protected pages already wired to the backend.",
      checklistTitle: "Already wired:",
      checklist: [
        "email + password through Supabase SSR",
        "email confirmation route at `auth/confirm`",
        "onboarding page connected to the bootstrap API",
        "redirect to `/app` when the profile already exists",
      ],
      tabs: {
        signIn: "Sign in",
        signUp: "Create",
      },
      accountType: "Account type",
      roles: [
        { value: "student", title: "Student", body: "Homework help and workspace." },
        { value: "parent", title: "Parent", body: "Oversight and session follow-up." },
        { value: "tutor", title: "Tutor", body: "Focused pedagogical support." },
      ],
      fields: {
        email: "Email",
        password: "Password",
      },
      placeholders: {
        password: "8 characters minimum",
      },
      buttons: {
        signIn: "Sign in",
        signUp: "Create account",
        pending: "Processing...",
      },
      footer: {
        signIn:
          "If the session is valid but no application profile exists yet, onboarding will be the next step.",
        signUp:
          "If email confirmation is enabled, the user must validate the link before arriving on onboarding.",
      },
    },
    zh: {
      errorFallback: "發生未預期的錯誤。",
      signUpInfo: {
        invite:
          "帳號已建立。請先從 Supabase 郵件確認信箱，之後產品會在這個瀏覽器中自動接回邀請流程。",
        default:
          "帳號已建立。請先從 Supabase 郵件確認信箱，再繼續下一步。",
      },
      eyebrow: "Auth branch",
      title: "把真正的 Supabase session 接到產品流程中。",
      body:
        "這一步會打開真實的 onboarding、個人資料 bootstrap，以及已經接到後端的受保護頁面。",
      checklistTitle: "目前已接通：",
      checklist: [
        "透過 Supabase SSR 的 email + password",
        "email 確認路由 `auth/confirm`",
        "已連到 bootstrap API 的 onboarding 頁",
        "若個人資料已存在就導向 `/app`",
      ],
      tabs: {
        signIn: "登入",
        signUp: "建立帳號",
      },
      accountType: "帳號類型",
      roles: [
        { value: "student", title: "學生", body: "作業協助與工作區。" },
        { value: "parent", title: "家長", body: "監督與課程歷程追蹤。" },
        { value: "tutor", title: "家教", body: "聚焦式教學支持。" },
      ],
      fields: {
        email: "Email",
        password: "密碼",
      },
      placeholders: {
        password: "至少 8 個字元",
      },
      buttons: {
        signIn: "登入",
        signUp: "建立帳號",
        pending: "處理中...",
      },
      footer: {
        signIn:
          "如果 session 有效，但應用層個人資料尚未建立，下一步會進入 onboarding。",
        signUp:
          "如果 email 確認已啟用，使用者必須先驗證連結，才會進入 onboarding。",
      },
    },
  });
}

export function getOnboardingPageCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Onboarding",
      title: "Finaliser le profil applicatif avant d'entrer dans l'espace protégé.",
      body:
        "Cette étape crée ou répare la ligne `public.users` et branche le compte sur les contraintes de rôle déjà définies dans le schéma.",
    },
    en: {
      eyebrow: "Onboarding",
      title: "Finish the application profile before entering the protected workspace.",
      body:
        "This step creates or repairs the `public.users` row and connects the account to the role constraints already defined in the schema.",
    },
    zh: {
      eyebrow: "Onboarding",
      title: "在進入受保護工作區前，先完成應用層個人資料。",
      body:
        "這一步會建立或修復 `public.users` 這一列，並讓帳號接上 schema 中既有的角色限制。",
    },
  });
}

export function getOnboardingFormCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      errorFallback: "Impossible de finaliser le profil.",
      connectedSession: "Session connectée",
      emailUnavailable: "email indisponible",
      roleLegend: "Rôle",
      roles: [
        { value: "student", title: "Élève", body: "Flux principal d'aide aux devoirs et espace de travail." },
        { value: "parent", title: "Parent", body: "Vision sur les sessions et supervision de l'enfant." },
        { value: "tutor", title: "Tuteur", body: "Accès supervisé pour suivi pédagogique ciblé." },
      ],
      fields: {
        displayName: "Nom affiché",
        uiLanguage: "Langue de l'interface",
        aiLanguage: "Langue de l'aide IA",
        ageBand: "Tranche d'âge",
      },
      displayNamePlaceholder: "Ex : Léa Martin",
      under13Label: "Compte élève de moins de 13 ans",
      studentStatus: {
        under13: "Le compte restera en attente d'approbation parentale après le bootstrap.",
        default: "Les comptes élève de 13 ans et plus restent actifs immédiatement dans la baseline MVP.",
      },
      buttons: {
        pending: "Création du profil...",
        submit: "Finaliser le profil",
      },
    },
    en: {
      errorFallback: "Unable to finish the profile.",
      connectedSession: "Connected session",
      emailUnavailable: "email unavailable",
      roleLegend: "Role",
      roles: [
        { value: "student", title: "Student", body: "Main homework-help flow and workspace." },
        { value: "parent", title: "Parent", body: "Session visibility and child oversight." },
        { value: "tutor", title: "Tutor", body: "Supervised access for focused pedagogical follow-up." },
      ],
      fields: {
        displayName: "Display name",
        uiLanguage: "Interface language",
        aiLanguage: "AI help language",
        ageBand: "Age band",
      },
      displayNamePlaceholder: "Example: Lea Martin",
      under13Label: "Student account under 13",
      studentStatus: {
        under13: "The account will stay pending parent approval after bootstrap.",
        default: "Student accounts aged 13 and above stay active immediately in the MVP baseline.",
      },
      buttons: {
        pending: "Creating profile...",
        submit: "Finish profile",
      },
    },
    zh: {
      errorFallback: "無法完成個人資料建立。",
      connectedSession: "已登入 session",
      emailUnavailable: "email 無法取得",
      roleLegend: "角色",
      roles: [
        { value: "student", title: "學生", body: "主要作業協助流程與工作區。" },
        { value: "parent", title: "家長", body: "查看課程與監督孩子進度。" },
        { value: "tutor", title: "家教", body: "受監督的教學追蹤權限。" },
      ],
      fields: {
        displayName: "顯示名稱",
        uiLanguage: "介面語言",
        aiLanguage: "AI 協助語言",
        ageBand: "年齡區間",
      },
      displayNamePlaceholder: "例如：Lea Martin",
      under13Label: "13 歲以下學生帳號",
      studentStatus: {
        under13: "bootstrap 後，帳號會維持待家長核准。",
        default: "13 歲以上學生帳號在 MVP 基線中會立即啟用。",
      },
      buttons: {
        pending: "建立中...",
        submit: "完成個人資料",
      },
    },
  });
}

export function getInvitationAcceptCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      titles: {
        parent: "Invitation parent",
        tutor: "Invitation tuteur",
      },
      bodies: {
        parent: "Ce lien sert à approuver ou relier un parent au compte élève cible.",
        tutor: "Ce lien relie un tuteur au compte élève cible.",
      },
      heading: (studentName: string) => `${studentName} attend une action de votre part.`,
      unavailableHeading: "Le lien d'invitation n'est plus disponible.",
      unavailableBody: "Ce lien peut être invalide, expiré ou déjà consommé.",
      labels: {
        student: "Élève cible",
        email: "Email invité",
        status: "Statut",
        expiry: "Expire le",
      },
      errorFallback: "Impossible d'accepter cette invitation.",
      states: {
        unavailable: "L'invitation ne peut pas être utilisée dans son état actuel.",
        unauthenticated: "Crée ou connecte le compte correspondant avant d'accepter ce lien.",
        needsOnboarding:
          "La session est connectée{emailLabel}, mais le profil applicatif n'est pas encore créé.",
        roleMismatch:
          "La session actuelle utilise le rôle `{currentRole}`. Cette invitation attend un compte `{targetRole}`. Déconnecte-toi puis reconnecte-toi avec le bon compte si nécessaire.",
        alreadyAccepted:
          "Cette invitation a déjà été acceptée par ce compte. Tu peux revenir à l'espace protégé.",
      },
      buttons: {
        signIn: "Se connecter",
        signUp: "Créer le compte",
        onboarding: "Terminer l'onboarding",
        pending: "Activation...",
        accept: "Accepter l'invitation",
        app: "Aller à l'app",
      },
    },
    en: {
      titles: {
        parent: "Parent invitation",
        tutor: "Tutor invitation",
      },
      bodies: {
        parent: "This link approves or connects a parent to the target student account.",
        tutor: "This link connects a tutor to the target student account.",
      },
      heading: (studentName: string) => `${studentName} is waiting for your action.`,
      unavailableHeading: "This invitation link is no longer available.",
      unavailableBody: "The link may be invalid, expired, or already used.",
      labels: {
        student: "Target student",
        email: "Invited email",
        status: "Status",
        expiry: "Expires on",
      },
      errorFallback: "Unable to accept this invitation.",
      states: {
        unavailable: "The invitation cannot be used in its current state.",
        unauthenticated: "Create or sign in to the matching account before accepting this link.",
        needsOnboarding:
          "The session is connected{emailLabel}, but the application profile has not been created yet.",
        roleMismatch:
          "The current session uses the `{currentRole}` role. This invitation expects a `{targetRole}` account. Sign out and sign back in with the right account if needed.",
        alreadyAccepted:
          "This invitation has already been accepted by this account. You can return to the protected workspace.",
      },
      buttons: {
        signIn: "Sign in",
        signUp: "Create account",
        onboarding: "Finish onboarding",
        pending: "Activating...",
        accept: "Accept invitation",
        app: "Go to app",
      },
    },
    zh: {
      titles: {
        parent: "家長邀請",
        tutor: "家教邀請",
      },
      bodies: {
        parent: "這個連結可用來核准或連結家長到目標學生帳號。",
        tutor: "這個連結可用來把家教連到目標學生帳號。",
      },
      heading: (studentName: string) => `${studentName} 正在等待你的操作。`,
      unavailableHeading: "這個邀請連結已不可用。",
      unavailableBody: "此連結可能無效、已過期或已被使用。",
      labels: {
        student: "目標學生",
        email: "受邀 email",
        status: "狀態",
        expiry: "到期時間",
      },
      errorFallback: "無法接受此邀請。",
      states: {
        unavailable: "此邀請在目前狀態下無法使用。",
        unauthenticated: "請先建立或登入正確帳號，再接受這個連結。",
        needsOnboarding:
          "目前 session 已連線{emailLabel}，但應用層個人資料尚未建立。",
        roleMismatch:
          "目前 session 使用的角色是 `{currentRole}`。這個邀請需要 `{targetRole}` 帳號。若有需要，請先登出再用正確帳號登入。",
        alreadyAccepted:
          "這個邀請已被此帳號接受。你可以回到受保護工作區。",
      },
      buttons: {
        signIn: "登入",
        signUp: "建立帳號",
        onboarding: "完成 onboarding",
        pending: "啟用中...",
        accept: "接受邀請",
        app: "前往 app",
      },
    },
  });
}

export function getAuthCompleteCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Confirmation",
      title: "La session est validée.",
      body: "Le navigateur finalise la reprise du flux avant de revenir sur la page utile.",
      redirecting: "Session confirmée. Redirection en cours vers la suite du flux.",
    },
    en: {
      eyebrow: "Confirmation",
      title: "The session is confirmed.",
      body: "The browser is finishing the flow handoff before returning to the useful page.",
      redirecting: "Session confirmed. Redirecting to the next step in the flow.",
    },
    zh: {
      eyebrow: "確認",
      title: "Session 已完成驗證。",
      body: "瀏覽器正在完成流程接續，之後會回到正確頁面。",
      redirecting: "Session 已確認，正在導向下一步。",
    },
  });
}

export function getAppShellCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      pilotBadge: "Pilot privé",
      sessionActive: "Session active",
      unknownEmail: "adresse inconnue",
      application: "Application",
      chips: {
        role: "Rôle",
        status: "Statut",
        interface: "Interface",
      },
      signOut: {
        idle: "Se déconnecter",
        pending: "Déconnexion...",
      },
      deletionRequested:
        "Une suppression est déjà en file pour ce compte. Les autres workflows restent gelés tant que la file n'est pas relevée.",
      roles: {
        student: {
          label: "Espace élève",
          badge: "Élève",
          title: "Un espace calme pour comprendre avant de répondre.",
          body: "Le shell garde les repères importants visibles sans surcharger la session de travail.",
        },
        parent: {
          label: "Espace parent",
          badge: "Parent",
          title: "Un tableau clair pour suivre sans surintervenir.",
          body: "Les surfaces parent gardent la supervision, les réglages et la trace des invitations au même endroit.",
        },
        tutor: {
          label: "Espace tuteur",
          badge: "Tuteur",
          title: "Une lecture structurée des sessions et des prochains points à reprendre.",
          body: "Le shell laisse la place aux notes privées et au suivi pédagogique sans brouiller la séparation des rôles.",
        },
        admin: {
          label: "Espace admin",
          badge: "Admin",
          title: "Une vue sobre pour auditer les accès sensibles et les risques opératoires.",
          body: "L'interface reste volontairement resserrée pour garder l'audit, les réglages et l'état global faciles à relire.",
        },
      },
      accountStatus: {
        active: "Actif",
        pending_parent_approval: "En attente parent",
        suspended: "Suspendu",
        deletion_requested: "Suppression en attente",
      },
      navigation: {
        student: [
          { href: "/app/new", label: "Nouveau devoir", hint: "entrée rapide et reprise" },
          { href: "/app/history", label: "Historique", hint: "sessions et résumés" },
          { href: "/app/settings", label: "Réglages", hint: "profil et confidentialité" },
        ],
        parent: [
          { href: "/app", label: "Accueil", hint: "vue d'ensemble" },
          { href: "/app#students", label: "Élèves", hint: "liens et supervision" },
          { href: "/app/settings", label: "Réglages", hint: "facturation, profil et confidentialité" },
        ],
        tutor: [
          { href: "/app", label: "Accueil", hint: "vue d'ensemble" },
          { href: "/app#students", label: "Élèves", hint: "sessions et notes" },
          { href: "/app/settings", label: "Réglages", hint: "profil et confidentialité" },
        ],
        admin: [
          { href: "/app", label: "Accueil", hint: "état global" },
          { href: "/app/audit", label: "Audit", hint: "lectures sensibles" },
          { href: "/app/settings", label: "Réglages", hint: "profil et limites admin" },
        ],
      },
    },
    en: {
      pilotBadge: "Private pilot",
      sessionActive: "Active session",
      unknownEmail: "unknown address",
      application: "Application",
      chips: {
        role: "Role",
        status: "Status",
        interface: "Interface",
      },
      signOut: {
        idle: "Sign out",
        pending: "Signing out...",
      },
      deletionRequested:
        "A deletion request is already queued for this account. Other workflows stay frozen until that queue is resolved.",
      roles: {
        student: {
          label: "Student space",
          badge: "Student",
          title: "A calmer workspace to understand before responding.",
          body: "The shell keeps the important landmarks visible without overloading the work session.",
        },
        parent: {
          label: "Parent space",
          badge: "Parent",
          title: "A clear overview to follow progress without overstepping.",
          body: "Parent surfaces keep oversight, settings, and invitation traceability in one place.",
        },
        tutor: {
          label: "Tutor space",
          badge: "Tutor",
          title: "A structured read of sessions and the next points to revisit.",
          body: "The shell leaves room for private notes and pedagogical follow-up without blurring role separation.",
        },
        admin: {
          label: "Admin space",
          badge: "Admin",
          title: "A restrained view for sensitive-access audits and operational risks.",
          body: "The interface stays intentionally tight so audit, settings, and global state remain easy to review.",
        },
      },
      accountStatus: {
        active: "Active",
        pending_parent_approval: "Pending parent approval",
        suspended: "Suspended",
        deletion_requested: "Deletion pending",
      },
      navigation: {
        student: [
          { href: "/app/new", label: "New homework", hint: "quick entry and resume" },
          { href: "/app/history", label: "History", hint: "sessions and summaries" },
          { href: "/app/settings", label: "Settings", hint: "profile and privacy" },
        ],
        parent: [
          { href: "/app", label: "Home", hint: "overview" },
          { href: "/app#students", label: "Students", hint: "links and oversight" },
          { href: "/app/settings", label: "Settings", hint: "billing, profile, and privacy" },
        ],
        tutor: [
          { href: "/app", label: "Home", hint: "overview" },
          { href: "/app#students", label: "Students", hint: "sessions and notes" },
          { href: "/app/settings", label: "Settings", hint: "profile and privacy" },
        ],
        admin: [
          { href: "/app", label: "Home", hint: "global state" },
          { href: "/app/audit", label: "Audit", hint: "sensitive reads" },
          { href: "/app/settings", label: "Settings", hint: "profile and admin limits" },
        ],
      },
    },
    zh: {
      pilotBadge: "封閉 Pilot",
      sessionActive: "目前 session",
      unknownEmail: "未知地址",
      application: "Application",
      chips: {
        role: "角色",
        status: "狀態",
        interface: "介面",
      },
      signOut: {
        idle: "登出",
        pending: "登出中...",
      },
      deletionRequested:
        "此帳號已有刪除要求排隊中。在該流程解除前，其餘工作流會維持凍結。",
      roles: {
        student: {
          label: "學生空間",
          badge: "學生",
          title: "一個更安定的工作區，先理解，再回答。",
          body: "這個 shell 會保留重要定位資訊，不讓作業流程變得嘈雜。",
        },
        parent: {
          label: "家長空間",
          badge: "家長",
          title: "清楚的總覽，方便追蹤，又不會過度介入。",
          body: "家長介面把監督、設定與邀請紀錄集中在同一個地方。",
        },
        tutor: {
          label: "家教空間",
          badge: "家教",
          title: "以結構化方式查看課程與下一步教學重點。",
          body: "這個 shell 保留私人筆記與教學追蹤空間，同時不混淆角色邊界。",
        },
        admin: {
          label: "管理空間",
          badge: "管理員",
          title: "以克制方式查看敏感存取與營運風險。",
          body: "介面刻意維持精簡，好讓稽核、設定與整體狀態更容易閱讀。",
        },
      },
      accountStatus: {
        active: "啟用中",
        pending_parent_approval: "待家長核准",
        suspended: "已停用",
        deletion_requested: "待刪除",
      },
      navigation: {
        student: [
          { href: "/app/new", label: "新作業", hint: "快速開始與續接" },
          { href: "/app/history", label: "歷程", hint: "課程與摘要" },
          { href: "/app/settings", label: "設定", hint: "個人資料與隱私" },
        ],
        parent: [
          { href: "/app", label: "首頁", hint: "總覽" },
          { href: "/app#students", label: "學生", hint: "連結與監督" },
          { href: "/app/settings", label: "設定", hint: "付費、個人資料與隱私" },
        ],
        tutor: [
          { href: "/app", label: "首頁", hint: "總覽" },
          { href: "/app#students", label: "學生", hint: "課程與筆記" },
          { href: "/app/settings", label: "設定", hint: "個人資料與隱私" },
        ],
        admin: [
          { href: "/app", label: "首頁", hint: "整體狀態" },
          { href: "/app/audit", label: "稽核", hint: "敏感讀取" },
          { href: "/app/settings", label: "設定", hint: "個人資料與管理限制" },
        ],
      },
    },
  });
}

export function getAppHomeCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      eyebrow: "Réglages du compte",
      title: "Les champs éditables passent maintenant par `PATCH /api/auth/profile`.",
      body:
        "Cette surface reste simple, mais elle exerce déjà la persistance du profil applicatif et la synchronisation de metadata côté auth.",
      cta: "Ouvrir les réglages complets",
    },
    en: {
      eyebrow: "Account settings",
      title: "Editable fields now flow through `PATCH /api/auth/profile`.",
      body:
        "This surface stays simple, but it already exercises application-profile persistence and auth-metadata synchronization.",
      cta: "Open full settings",
    },
    zh: {
      eyebrow: "帳號設定",
      title: "可編輯欄位現在都會走 `PATCH /api/auth/profile`。",
      body:
        "這個介面目前仍然簡潔，但已經實際驗證應用層個人資料持久化與 auth metadata 同步。",
      cta: "打開完整設定",
    },
  });
}

export function getAccountSettingsFormCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      errorFallback: "Impossible de mettre le profil à jour.",
      success: "Profil mis à jour.",
      fields: {
        displayName: "Nom affiché",
        uiLanguage: "Langue de l'interface",
        aiLanguage: "Langue de l'aide IA",
        ageBand: "Tranche d'âge",
      },
      buttons: {
        pending: "Mise à jour...",
        submit: "Enregistrer le profil",
      },
    },
    en: {
      errorFallback: "Unable to update the profile.",
      success: "Profile updated.",
      fields: {
        displayName: "Display name",
        uiLanguage: "Interface language",
        aiLanguage: "AI help language",
        ageBand: "Age band",
      },
      buttons: {
        pending: "Updating...",
        submit: "Save profile",
      },
    },
    zh: {
      errorFallback: "無法更新個人資料。",
      success: "個人資料已更新。",
      fields: {
        displayName: "顯示名稱",
        uiLanguage: "介面語言",
        aiLanguage: "AI 協助語言",
        ageBand: "年齡區間",
      },
      buttons: {
        pending: "更新中...",
        submit: "儲存個人資料",
      },
    },
  });
}

export function getAuthProfileServerCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      expectedObject: "Le corps JSON doit être un objet.",
      invalidJson: "Corps JSON invalide.",
      invalidFields: "Un ou plusieurs champs sont invalides.",
      fieldErrors: {
        role: "Le rôle doit être student, parent ou tutor.",
        displayName:
          "Le nom affiché est requis et doit contenir 80 caractères ou moins.",
        preferredUiLanguage:
          "La langue de l'interface doit être fr, en ou zh.",
        aiHelpLanguage: "La langue d'aide IA doit être fr ou en.",
        ageBandSupported:
          "La tranche d'âge doit faire partie des valeurs prises en charge.",
        onlyStudentUnder13:
          "Seuls les comptes élève peuvent être marqués comme moins de 13 ans.",
        under13AgeBand:
          "Les comptes élève de moins de 13 ans doivent utiliser six_eight, nine_ten ou eleven_twelve.",
        bootstrapAgeBandStudentOnly:
          "Seules les demandes d'onboarding élève doivent inclure une tranche d'âge.",
        storedAgeBandStudentOnly:
          "Seuls les comptes élève peuvent stocker une tranche d'âge.",
      },
      service: {
        syncAuthMetadata:
          "Impossible de synchroniser les métadonnées auth du profil.",
        bootstrapStudentProfile:
          "Impossible d'initialiser le profil élève.",
        loadCurrentProfile:
          "Impossible de charger le profil applicatif actuel.",
        roleConflict:
          "Un profil applicatif existe déjà avec un autre rôle.",
        bootstrapAppProfile:
          "Impossible d'initialiser le profil applicatif.",
        updateAppProfile:
          "Impossible de mettre à jour le profil applicatif.",
      },
    },
    en: {
      expectedObject: "The JSON body must be an object.",
      invalidJson: "Invalid JSON body.",
      invalidFields: "One or more fields are invalid.",
      fieldErrors: {
        role: "Role must be student, parent, or tutor.",
        displayName:
          "Display name is required and must be 80 characters or fewer.",
        preferredUiLanguage:
          "Interface language must be fr, en, or zh.",
        aiHelpLanguage: "AI help language must be fr or en.",
        ageBandSupported: "Age band must be one of the supported values.",
        onlyStudentUnder13:
          "Only student accounts can be marked as under 13.",
        under13AgeBand:
          "Under-13 student accounts must use six_eight, nine_ten, or eleven_twelve.",
        bootstrapAgeBandStudentOnly:
          "Only student onboarding requests should include an age band.",
        storedAgeBandStudentOnly:
          "Only student accounts can store an age band.",
      },
      service: {
        syncAuthMetadata: "Unable to sync auth profile metadata.",
        bootstrapStudentProfile: "Unable to bootstrap the student profile.",
        loadCurrentProfile: "Unable to load the current app profile.",
        roleConflict:
          "An app profile already exists with a different role.",
        bootstrapAppProfile: "Unable to bootstrap the app profile.",
        updateAppProfile: "Unable to update the app profile.",
      },
    },
    zh: {
      expectedObject: "JSON 內容必須是物件。",
      invalidJson: "JSON 內容無效。",
      invalidFields: "一個或多個欄位無效。",
      fieldErrors: {
        role: "角色必須是 student、parent 或 tutor。",
        displayName: "顯示名稱為必填，且不得超過 80 個字元。",
        preferredUiLanguage: "介面語言必須是 fr、en 或 zh。",
        aiHelpLanguage: "AI 協助語言必須是 fr 或 en。",
        ageBandSupported: "年齡區間必須是支援的值之一。",
        onlyStudentUnder13: "只有學生帳號可以標記為 13 歲以下。",
        under13AgeBand:
          "13 歲以下的學生帳號必須使用 six_eight、nine_ten 或 eleven_twelve。",
        bootstrapAgeBandStudentOnly:
          "只有學生 onboarding 請求可以包含年齡區間。",
        storedAgeBandStudentOnly:
          "只有學生帳號可以儲存年齡區間。",
      },
      service: {
        syncAuthMetadata: "無法同步 auth 個人資料 metadata。",
        bootstrapStudentProfile: "無法初始化學生個人資料。",
        loadCurrentProfile: "無法載入目前的應用層個人資料。",
        roleConflict: "已存在使用不同角色的應用層個人資料。",
        bootstrapAppProfile: "無法初始化應用層個人資料。",
        updateAppProfile: "無法更新應用層個人資料。",
      },
    },
  });
}

export function getInvitationServerCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      expectedObject: "Le corps JSON doit être un objet.",
      invalidJson: "Corps JSON invalide.",
      invalidFields: "Un ou plusieurs champs sont invalides.",
      fieldErrors: {
        validEmail: "Une adresse email valide est requise.",
        relationshipLabel:
          "L'étiquette de relation doit contenir 80 caractères ou moins.",
        studentUserId: "L'identifiant élève doit être un UUID valide.",
        token: "Le jeton d'invitation est invalide.",
        parentEmailDifferent:
          "L'email parent doit être différent de l'email élève.",
        parentStudentRequired:
          "Les invitations tuteur créées par un parent doivent préciser un identifiant élève.",
        studentRequired:
          "Un identifiant élève est requis pour cette invitation.",
        tutorEmailDifferent:
          "L'email tuteur doit être différent de l'email du compte actuel.",
        invitedEmailRequired:
          "Connecte-toi avec l'adresse email invitée pour accepter cette invitation.",
      },
      service: {
        loadInvitation: "Impossible de charger l'invitation.",
        updateInvitationStatus:
          "Impossible de mettre à jour le statut de l'invitation.",
        rotateInvitation:
          "Impossible de remplacer l'invitation déjà en attente.",
        createInvitation: "Impossible de créer l'invitation.",
        inspectParentLinks:
          "Impossible de vérifier l'état des liens parent.",
        validateParentLink: "Impossible de valider le lien parent.",
        activateParentLink: "Impossible d'activer le lien parent.",
        updateStudentApproval:
          "Impossible de mettre à jour l'état d'approbation élève.",
        activateStudentAccount:
          "Impossible d'activer le compte élève.",
        activateTutorLink: "Impossible d'activer le lien tuteur.",
        reloadAcceptedInvitation:
          "Impossible de recharger l'invitation acceptée.",
      },
      errors: {
        invitationStudentAccount:
          "L'invitation ne référence pas un compte élève.",
        activeParentLinkRequired:
          "Un lien parent actif est requis pour cet élève.",
        missingInviterContext:
          "Le contexte de l'inviteur manque sur cette invitation.",
        under13TutorNeedsParentOrigin:
          "L'accès tuteur pour un élève de moins de 13 ans exige une invitation initiée par un parent.",
        invitationOriginNotAllowed:
          "L'origine de cette invitation n'est pas autorisée à activer un lien tuteur.",
        parentApprovalOnlyUnder13:
          "Les demandes d'approbation parentale sont réservées aux comptes élève de moins de 13 ans.",
        activeParentLinkExists:
          "Cet élève a déjà un lien parent actif.",
        under13StudentCannotInviteTutor:
          "Les élèves de moins de 13 ans ne peuvent pas inviter un tuteur directement. Un parent lié doit lancer ce flux.",
        onlyStudentsAndLinkedParents:
          "Seuls les élèves et les parents liés peuvent émettre des invitations tuteur.",
        tutorInviteRequiresActiveStudent:
          "Les invitations tuteur exigent un compte élève actif.",
        under13TutorParentOnly:
          "L'accès tuteur pour un élève de moins de 13 ans doit être initié par un parent lié.",
        onlyActiveAccountsCanAccept:
          "Seuls les comptes actifs peuvent accepter une invitation.",
        invitationNotFound: "Invitation introuvable.",
        invitationRoleInvalid:
          "La configuration de rôle de l'invitation est invalide.",
        invitationKindRouteMismatch:
          "Le type d'invitation ne correspond pas à cette route.",
        invitationExpired: "L'invitation a expiré.",
        invitationInactive: "L'invitation n'est plus active.",
        invitationAccepted: "L'invitation a déjà été acceptée.",
        invitationDifferentRole:
          "Cette invitation vise un autre rôle de compte.",
        invitationEmailMismatch:
          "L'email connecté ne correspond pas à la cible de l'invitation.",
        unsupportedInvitationKind:
          "Ce type d'invitation n'est pas pris en charge.",
      },
    },
    en: {
      expectedObject: "The JSON body must be an object.",
      invalidJson: "Invalid JSON body.",
      invalidFields: "One or more fields are invalid.",
      fieldErrors: {
        validEmail: "A valid email address is required.",
        relationshipLabel:
          "Relationship label must be 80 characters or fewer.",
        studentUserId: "Student user ID must be a valid UUID.",
        token: "Invitation token is invalid.",
        parentEmailDifferent:
          "The parent email must be different from the student email.",
        parentStudentRequired:
          "Parent-issued tutor invitations must specify a student user ID.",
        studentRequired: "A student user ID is required for this invitation.",
        tutorEmailDifferent:
          "The tutor email must be different from the current account email.",
        invitedEmailRequired:
          "Sign in with the invited email address to accept this invitation.",
      },
      service: {
        loadInvitation: "Unable to load the invitation.",
        updateInvitationStatus:
          "Unable to update the invitation status.",
        rotateInvitation:
          "Unable to rotate the existing pending invitation.",
        createInvitation: "Unable to create the invitation.",
        inspectParentLinks: "Unable to inspect parent link state.",
        validateParentLink: "Unable to validate the parent link.",
        activateParentLink: "Unable to activate the parent link.",
        updateStudentApproval:
          "Unable to update the student approval state.",
        activateStudentAccount:
          "Unable to activate the student account.",
        activateTutorLink: "Unable to activate the tutor link.",
        reloadAcceptedInvitation:
          "Unable to reload the accepted invitation.",
      },
      errors: {
        invitationStudentAccount:
          "The invitation does not reference a student account.",
        activeParentLinkRequired:
          "An active parent link is required for this student.",
        missingInviterContext:
          "The invitation is missing inviter context.",
        under13TutorNeedsParentOrigin:
          "Under-13 tutor access requires a parent-originated invitation.",
        invitationOriginNotAllowed:
          "The invitation origin is not allowed to activate a tutor link.",
        parentApprovalOnlyUnder13:
          "Parent approval requests are only available for under-13 student accounts.",
        activeParentLinkExists:
          "This student already has an active parent link.",
        under13StudentCannotInviteTutor:
          "Under-13 students cannot directly invite tutors. A linked parent must initiate that flow.",
        onlyStudentsAndLinkedParents:
          "Only students and linked parents can issue tutor invitations.",
        tutorInviteRequiresActiveStudent:
          "Tutor invitations require an active student account.",
        under13TutorParentOnly:
          "Under-13 tutor access must be initiated by a linked parent.",
        onlyActiveAccountsCanAccept:
          "Only active accounts can accept invitations.",
        invitationNotFound: "Invitation not found.",
        invitationRoleInvalid:
          "Invitation role configuration is invalid.",
        invitationKindRouteMismatch:
          "Invitation kind does not match this route.",
        invitationExpired: "Invitation has expired.",
        invitationInactive: "Invitation is no longer active.",
        invitationAccepted: "Invitation has already been accepted.",
        invitationDifferentRole:
          "This invitation is for a different account role.",
        invitationEmailMismatch:
          "The signed-in email does not match the invitation target.",
        unsupportedInvitationKind: "Unsupported invitation kind.",
      },
    },
    zh: {
      expectedObject: "JSON 內容必須是物件。",
      invalidJson: "JSON 內容無效。",
      invalidFields: "一個或多個欄位無效。",
      fieldErrors: {
        validEmail: "必須提供有效的 email 地址。",
        relationshipLabel: "關係標籤不得超過 80 個字元。",
        studentUserId: "學生使用者 ID 必須是有效的 UUID。",
        token: "邀請 token 無效。",
        parentEmailDifferent:
          "家長 email 必須與學生 email 不同。",
        parentStudentRequired:
          "由家長發出的家教邀請必須指定學生使用者 ID。",
        studentRequired: "這個邀請必須提供學生使用者 ID。",
        tutorEmailDifferent:
          "家教 email 必須與目前帳號的 email 不同。",
        invitedEmailRequired:
          "請使用被邀請的 email 地址登入後再接受邀請。",
      },
      service: {
        loadInvitation: "無法載入邀請。",
        updateInvitationStatus: "無法更新邀請狀態。",
        rotateInvitation: "無法輪替目前待處理的邀請。",
        createInvitation: "無法建立邀請。",
        inspectParentLinks: "無法檢查家長連結狀態。",
        validateParentLink: "無法驗證家長連結。",
        activateParentLink: "無法啟用家長連結。",
        updateStudentApproval: "無法更新學生核准狀態。",
        activateStudentAccount: "無法啟用學生帳號。",
        activateTutorLink: "無法啟用家教連結。",
        reloadAcceptedInvitation: "無法重新載入已接受的邀請。",
      },
      errors: {
        invitationStudentAccount: "這個邀請沒有指向學生帳號。",
        activeParentLinkRequired: "這位學生需要有有效的家長連結。",
        missingInviterContext: "這個邀請缺少邀請者資訊。",
        under13TutorNeedsParentOrigin:
          "13 歲以下學生的家教存取必須由家長發起邀請。",
        invitationOriginNotAllowed:
          "這個邀請來源無權啟用家教連結。",
        parentApprovalOnlyUnder13:
          "家長核准請求只適用於 13 歲以下的學生帳號。",
        activeParentLinkExists: "這位學生已經有有效的家長連結。",
        under13StudentCannotInviteTutor:
          "13 歲以下學生不能直接邀請家教，必須由已連結的家長發起。",
        onlyStudentsAndLinkedParents:
          "只有學生與已連結家長可以發出家教邀請。",
        tutorInviteRequiresActiveStudent:
          "家教邀請需要學生帳號處於啟用狀態。",
        under13TutorParentOnly:
          "13 歲以下學生的家教存取必須由已連結家長發起。",
        onlyActiveAccountsCanAccept:
          "只有啟用中的帳號可以接受邀請。",
        invitationNotFound: "找不到邀請。",
        invitationRoleInvalid: "邀請的角色設定無效。",
        invitationKindRouteMismatch: "邀請類型與此路由不符。",
        invitationExpired: "邀請已過期。",
        invitationInactive: "邀請已不再有效。",
        invitationAccepted: "邀請已被接受。",
        invitationDifferentRole: "這個邀請是給其他帳號角色的。",
        invitationEmailMismatch:
          "目前登入的 email 與邀請目標不符。",
        unsupportedInvitationKind: "不支援這種邀請類型。",
      },
    },
  });
}

export function getPrivacySettingsCopy(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: {
      titleEyebrow: "Réglages et confidentialité",
      title: "Un point d'entrée stable pour le profil, la facturation et les contrôles de données.",
      introSummary:
        "Le MVP explique ici ce qui est stocké, pourquoi, pendant combien de temps, et qui peut demander une suppression.",
      introPrivacy:
        "Le produit limite la collecte aux données d'apprentissage et garde les traces billing ou sécurité séparées des contenus élève.",
      deletionQueuedPrefix: "Une suppression est déjà en file pour ce compte depuis le ",
      deletionQueuedSuffix:
        ". Les autres workflows restent bloqués tant que cette file n'est pas relevée.",
      sections: {
        profile: "Profil",
        profileBody: "Les champs éditables restent limités au profil applicatif utile.",
        profileFrozen: "Le profil n'est plus éditable pendant la file de suppression.",
        privacyCard: "Confidentialité",
        privacyCardBody:
          "Les traces sensibles et les suppressions demandent des étapes explicites, pas des effets cachés.",
        noBilling:
          "Ce compte n'a pas de panneau billing dédié. La priorité ici est la lisibilité des données et des contrôles de suppression.",
        adminNoBilling:
          "Le rôle admin garde les surfaces d'audit, mais la suppression libre-service reste désactivée.",
        dataRetention: "Données et rétention",
        dataRetentionBody:
          "La collecte reste limitée aux données utiles au coaching, à la supervision et à la sécurité du produit.",
        visibleCategories: "Catégories visibles",
        retentionWindows: "Fenêtres de rétention",
        providers: "Prestataires utilisés",
        deletion: "Suppression et gel",
        deletionBody:
          "Une demande de suppression gèle le compte tout de suite, coupe les nouveaux workflows, puis lance une purge ciblée des contenus d'apprentissage.",
        selfAccount: "Mon compte",
        selfAccountAdmin:
          "Le compte admin ne propose pas de suppression libre-service.",
        selfAccountBody:
          "La demande supprime les contenus pédagogiques, coupe les accès reliés et garde seulement les traces billing ou sécurité strictement nécessaires.",
        adminManual:
          "La suppression du compte admin reste une opération manuelle et auditée.",
        linkedStudents: "Élèves liés",
        linkedStudentsBody:
          "Le parent peut demander la suppression d'un compte élève lié. Le compte élève est gelé tout de suite et les accès tuteur sont révoqués.",
        noLinkedStudents:
          "Aucun élève lié ne peut être géré depuis ce compte parent.",
        studentStatus: "Statut actuel",
        studentRequested: "suppression demandée",
        studentDefault: "actif ou supervisé",
        studentDelete: "Demander la suppression des données élève",
      },
      retentionRules: [
        {
          title: "Demandes en attente",
          body: "Les approbations parentales non finalisées visent une purge après 7 jours.",
        },
        {
          title: "Contenu élève inactif",
          body: "Les contenus élève inactifs passent en revue à 180 jours avant suppression.",
        },
        {
          title: "Accès sensibles",
          body: "Les audits d'accès parent, tuteur, admin et billing restent conservés 12 mois.",
        },
        {
          title: "Suppression demandée",
          body: "Le compte est gelé tout de suite et la purge des contenus d'apprentissage vise 30 jours hors sauvegardes et obligations billing ou sécurité.",
        },
      ],
      providerRules: [
        {
          title: "Supabase",
          body: "Héberge l'authentification, les profils, les conversations, les liens et les fichiers privés.",
        },
        {
          title: "Gemini",
          body: "Reçoit uniquement le contenu utile au devoir, avec assemblage des prompts côté serveur.",
        },
        {
          title: "Lemon Squeezy",
          body: "Traite la facturation parentale. Les traces billing peuvent survivre à la purge des contenus élève si la loi ou l'opération l'exige.",
        },
        {
          title: "PostHog et Resend",
          body: "Resteront limités aux événements produit et aux emails transactionnels une fois configurés, sans contenu brut de devoir.",
        },
      ],
      selfDeleteButton: {
        parent: "Demander la suppression du compte parent",
        tutor: "Demander la suppression du compte tuteur",
        default: "Demander la suppression du compte",
      },
      deletionRequestForm: {
        genericError: "Impossible d'enregistrer cette demande de suppression.",
        pending: "Demande en cours...",
        success: (
          targetDisplayName: string,
          requestedAt: string | null,
          purgeTargetDate: string | null,
        ) =>
          `Suppression demandée pour ${targetDisplayName} le ${requestedAt}. Purge cible d'ici le ${purgeTargetDate}.`,
      },
      roleIntro: {
        studentUnder13:
          "Le compte élève de moins de 13 ans reste sous contrôle parental. Le parent lié pilote la suppression et voit les catégories de données conservées.",
        student:
          "Le compte élève peut voir les données utiles à l'apprentissage, comprendre les règles de rétention et demander sa suppression s'il n'est pas sous contrôle parental.",
        parent:
          "Le compte parent centralise la facturation, la supervision enfant et les demandes de suppression des données d'apprentissage liées.",
        tutor:
          "Le compte tuteur garde un accès pédagogique limité : sessions visibles, notes privées et suppression du compte sans toucher aux données parentales.",
        admin:
          "Le compte admin garde une vue opérationnelle. Les contrôles libre-service restent bloqués pour éviter les suppressions accidentelles du rôle le plus sensible.",
      },
      dataCategories: {
        common: [
          "profil applicatif limité au nom affiché, langues, rôle et tranche d'âge",
          "liens parent-élève et tuteur-élève explicites et auditables",
          "sessions, messages, pièces jointes, texte extrait et résumés",
        ],
        student: [
          "état de quota, essais et consommation IA",
          "mémoire pédagogique réservée aux signaux éducatifs utiles",
        ],
        parent: [
          "état payeur et abonnement Family du compte parent",
          "visibilité sur les données enfant liées et les demandes de suppression",
        ],
        tutor: [
          "notes privées tuteur invisibles à l'élève et au parent",
          "aucune lecture brute des tables mémoire ou des compteurs d'usage enfant",
        ],
        admin: [
          "audit des accès sensibles et moderation",
          "gestion exceptionnelle des données via surfaces admin dédiées",
          "pas de parcours libre-service pour la suppression du compte admin",
        ],
      },
    },
    en: {
      titleEyebrow: "Settings and privacy",
      title: "One stable entry point for profile, billing, and data controls.",
      introSummary:
        "The MVP explains what is stored here, why, for how long, and who can request deletion.",
      introPrivacy:
        "The product limits collection to learning data and keeps billing or security traces separate from student content.",
      deletionQueuedPrefix: "A deletion request has already been queued for this account since ",
      deletionQueuedSuffix:
        ". Other workflows remain blocked until that queue is resolved.",
      sections: {
        profile: "Profile",
        profileBody: "Editable fields stay limited to the useful application profile.",
        profileFrozen: "The profile is no longer editable while deletion is queued.",
        privacyCard: "Privacy",
        privacyCardBody:
          "Sensitive traces and deletion requests require explicit steps, not hidden effects.",
        noBilling:
          "This account has no dedicated billing panel. The priority here is clear data visibility and deletion controls.",
        adminNoBilling:
          "The admin role keeps audit surfaces, but self-service deletion remains disabled.",
        dataRetention: "Data and retention",
        dataRetentionBody:
          "Collection stays limited to data useful for coaching, oversight, and product safety.",
        visibleCategories: "Visible categories",
        retentionWindows: "Retention windows",
        providers: "Providers used",
        deletion: "Deletion and freeze",
        deletionBody:
          "A deletion request freezes the account immediately, stops new workflows, and then starts a targeted purge of learning content.",
        selfAccount: "My account",
        selfAccountAdmin:
          "The admin account does not offer self-service deletion.",
        selfAccountBody:
          "The request removes pedagogical content, cuts linked access, and keeps only billing or security traces that remain strictly necessary.",
        adminManual:
          "Admin-account deletion remains a manual, audited operation.",
        linkedStudents: "Linked students",
        linkedStudentsBody:
          "The parent can request deletion for a linked student account. The student account is frozen immediately and tutor access is revoked.",
        noLinkedStudents:
          "No linked student can be managed from this parent account.",
        studentStatus: "Current status",
        studentRequested: "deletion requested",
        studentDefault: "active or supervised",
        studentDelete: "Request student-data deletion",
      },
      retentionRules: [
        {
          title: "Pending requests",
          body: "Unfinished parent approvals target a purge after 7 days.",
        },
        {
          title: "Inactive student content",
          body: "Inactive student content is reviewed at 180 days before deletion.",
        },
        {
          title: "Sensitive access",
          body: "Parent, tutor, admin, and billing access audits are kept for 12 months.",
        },
        {
          title: "Deletion requested",
          body: "The account is frozen immediately and the learning-content purge targets 30 days outside backups and billing or security obligations.",
        },
      ],
      providerRules: [
        {
          title: "Supabase",
          body: "Hosts authentication, profiles, conversations, links, and private files.",
        },
        {
          title: "Gemini",
          body: "Receives only the content useful to the homework flow, with prompts assembled server-side.",
        },
        {
          title: "Lemon Squeezy",
          body: "Handles parent billing. Billing traces may survive deletion of student content when law or operations require it.",
        },
        {
          title: "PostHog and Resend",
          body: "Will remain limited to product events and transactional emails once configured, without raw homework content.",
        },
      ],
      selfDeleteButton: {
        parent: "Request parent-account deletion",
        tutor: "Request tutor-account deletion",
        default: "Request account deletion",
      },
      deletionRequestForm: {
        genericError: "Unable to save this deletion request.",
        pending: "Request in progress...",
        success: (
          targetDisplayName: string,
          requestedAt: string | null,
          purgeTargetDate: string | null,
        ) =>
          `Deletion requested for ${targetDisplayName} on ${requestedAt}. Target purge by ${purgeTargetDate}.`,
      },
      roleIntro: {
        studentUnder13:
          "A student account under 13 remains under parental control. The linked parent handles deletion and can see the kept data categories.",
        student:
          "The student account can see the data useful to learning, understand retention rules, and request deletion if it is not under parental control.",
        parent:
          "The parent account centralizes billing, child oversight, and deletion requests for linked learning data.",
        tutor:
          "The tutor account keeps limited pedagogical access: visible sessions, private notes, and account deletion without touching parent data.",
        admin:
          "The admin account keeps an operational view. Self-service controls stay blocked to avoid accidental deletion of the most sensitive role.",
      },
      dataCategories: {
        common: [
          "application profile limited to display name, languages, role, and age band",
          "explicit and auditable parent-student and tutor-student links",
          "sessions, messages, attachments, extracted text, and summaries",
        ],
        student: [
          "quota state, trial state, and AI usage",
          "pedagogical memory limited to useful educational signals",
        ],
        parent: [
          "payer state and Family subscription for the parent account",
          "visibility into linked child data and deletion requests",
        ],
        tutor: [
          "private tutor notes hidden from the student and parent",
          "no raw reads of memory tables or child usage counters",
        ],
        admin: [
          "sensitive-access and moderation audit",
          "exception handling for data through dedicated admin surfaces",
          "no self-service path for deleting the admin account",
        ],
      },
    },
    zh: {
      titleEyebrow: "設定與隱私",
      title: "為個人資料、付費與資料控制提供一個穩定入口。",
      introSummary:
        "MVP 會在這裡說明儲存了什麼、為什麼儲存、保存多久，以及誰可以要求刪除。",
      introPrivacy:
        "產品把收集範圍限制在學習資料，並將帳務或安全紀錄與學生內容分開。",
      deletionQueuedPrefix: "此帳號自 ",
      deletionQueuedSuffix: " 起已有刪除要求排隊中。在解除前，其餘工作流會維持阻擋。",
      sections: {
        profile: "個人資料",
        profileBody: "可編輯欄位只限於有用的應用層個人資料。",
        profileFrozen: "在刪除排隊期間，個人資料不可再編輯。",
        privacyCard: "隱私",
        privacyCardBody: "敏感紀錄與刪除要求都需要明確步驟，而不是隱藏效果。",
        noBilling: "此帳號沒有專屬 billing 面板。這裡的優先順序是資料可讀性與刪除控制。",
        adminNoBilling: "管理員角色保留稽核介面，但自助刪除仍維持停用。",
        dataRetention: "資料與保留",
        dataRetentionBody: "收集範圍仍限定於對教練、監督與產品安全有幫助的資料。",
        visibleCategories: "可見類別",
        retentionWindows: "保留期間",
        providers: "使用的供應商",
        deletion: "刪除與凍結",
        deletionBody:
          "一旦提出刪除要求，帳號會立刻凍結、停止新工作流，接著再對學習內容進行定向清除。",
        selfAccount: "我的帳號",
        selfAccountAdmin: "管理員帳號不提供自助刪除。",
        selfAccountBody:
          "此要求會刪除教學內容、切斷相關存取，只保留仍嚴格必要的帳務或安全紀錄。",
        adminManual: "管理員帳號刪除仍是手動且可稽核的操作。",
        linkedStudents: "已連結學生",
        linkedStudentsBody:
          "家長可以要求刪除已連結學生帳號。學生帳號會立刻凍結，家教權限也會被撤銷。",
        noLinkedStudents: "此家長帳號下沒有可管理的已連結學生。",
        studentStatus: "目前狀態",
        studentRequested: "已要求刪除",
        studentDefault: "啟用中或受監督",
        studentDelete: "要求刪除學生資料",
      },
      retentionRules: [
        {
          title: "待處理要求",
          body: "尚未完成的家長核准流程，目標在 7 天後清除。",
        },
        {
          title: "非活躍學生內容",
          body: "非活躍學生內容會在 180 天時進行檢視，再決定刪除。",
        },
        {
          title: "敏感存取",
          body: "家長、家教、管理員與帳務存取稽核會保留 12 個月。",
        },
        {
          title: "已要求刪除",
          body: "帳號會立刻凍結，學習內容目標在 30 天內清除，不含備份與帳務或安全義務。",
        },
      ],
      providerRules: [
        {
          title: "Supabase",
          body: "承載驗證、個人資料、對話、連結與私密檔案。",
        },
        {
          title: "Gemini",
          body: "只接收作業流程需要的內容，prompt 由伺服器端組裝。",
        },
        {
          title: "Lemon Squeezy",
          body: "處理家長付費。若法律或營運需要，帳務紀錄可能會比學生內容保存更久。",
        },
        {
          title: "PostHog 與 Resend",
          body: "未來設定完成後，也只會用於產品事件與交易郵件，不會傳送原始作業內容。",
        },
      ],
      selfDeleteButton: {
        parent: "要求刪除家長帳號",
        tutor: "要求刪除家教帳號",
        default: "要求刪除帳號",
      },
      deletionRequestForm: {
        genericError: "無法儲存這筆刪除要求。",
        pending: "要求送出中...",
        success: (
          targetDisplayName: string,
          requestedAt: string | null,
          purgeTargetDate: string | null,
        ) =>
          `${targetDisplayName} 已於 ${requestedAt} 提出刪除要求。目標清除時間為 ${purgeTargetDate} 前。`,
      },
      roleIntro: {
        studentUnder13:
          "13 歲以下學生帳號仍受家長控制。已連結家長可處理刪除，並查看保留的資料類別。",
        student:
          "學生帳號可以查看有助於學習的資料、了解保留規則，並在不受家長控制時要求刪除。",
        parent:
          "家長帳號集中處理付費、孩子監督，以及已連結學習資料的刪除要求。",
        tutor:
          "家教帳號只保留有限的教學權限：可見課程、私人筆記，以及刪除自己的帳號，但不會碰到家長資料。",
        admin:
          "管理員帳號保留營運視角。自助控制維持封鎖，以避免最敏感角色被意外刪除。",
      },
      dataCategories: {
        common: [
          "應用層個人資料僅限顯示名稱、語言、角色與年齡區間",
          "家長-學生與家教-學生連結均明確且可稽核",
          "課程、訊息、附件、擷取文字與摘要",
        ],
        student: [
          "額度狀態、試用狀態與 AI 使用量",
          "僅保留對學習有用的教學記憶訊號",
        ],
        parent: [
          "家長帳號的付費狀態與 Family 訂閱",
          "查看已連結孩子資料與刪除要求的權限",
        ],
        tutor: [
          "家教私人筆記，學生與家長不可見",
          "不可直接讀取記憶表或孩子使用量計數",
        ],
        admin: [
          "敏感存取與 moderation 稽核",
          "透過專用管理介面處理例外資料",
          "沒有管理員帳號自助刪除流程",
        ],
      },
    },
  });
}

export function getLanguageLabel(languageCode: UiLanguageCode) {
  return pickLocalizedValue(languageCode, {
    fr: "Français",
    en: "English",
    zh: "中文",
  });
}

export function getRoleLabel(
  role: AppUserRecord["role"],
  languageCode: UiLanguageCode,
) {
  return getAppShellCopy(languageCode).roles[role].badge;
}

export function getPrivacyRoleIntro(
  appUser: AppUserRecord,
  languageCode: UiLanguageCode,
) {
  const copy = getPrivacySettingsCopy(languageCode);

  if (appUser.role === "student" && appUser.is_under_13) {
    return copy.roleIntro.studentUnder13;
  }

  if (appUser.role === "student") {
    return copy.roleIntro.student;
  }

  if (appUser.role === "parent") {
    return copy.roleIntro.parent;
  }

  if (appUser.role === "tutor") {
    return copy.roleIntro.tutor;
  }

  return copy.roleIntro.admin;
}

export function getPrivacyDataCategories(
  appUser: AppUserRecord,
  languageCode: UiLanguageCode,
) {
  const copy = getPrivacySettingsCopy(languageCode);
  const common = copy.dataCategories.common;

  if (appUser.role === "student") {
    return [...common, ...copy.dataCategories.student];
  }

  if (appUser.role === "parent") {
    return [...common, ...copy.dataCategories.parent];
  }

  if (appUser.role === "tutor") {
    return [...common, ...copy.dataCategories.tutor];
  }

  return copy.dataCategories.admin;
}

export function getPrivacyDeleteButtonLabel(
  appUser: AppUserRecord,
  languageCode: UiLanguageCode,
) {
  const copy = getPrivacySettingsCopy(languageCode);

  if (appUser.role === "parent") {
    return copy.selfDeleteButton.parent;
  }

  if (appUser.role === "tutor") {
    return copy.selfDeleteButton.tutor;
  }

  return copy.selfDeleteButton.default;
}

export function getDeletionRequestFormCopy(languageCode: UiLanguageCode) {
  return getPrivacySettingsCopy(languageCode).deletionRequestForm;
}
