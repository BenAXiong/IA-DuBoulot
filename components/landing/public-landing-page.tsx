"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  type LandingAudience,
  useLandingAudience,
} from "@/components/landing/landing-audience-store";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import { withUiLanguage } from "@/lib/i18n/ui-language";

type CardCopy = {
  body: string;
  title: string;
};

type TutorPlaceholderCopy = {
  contentCards: CardCopy[];
  featureCards: CardCopy[];
  sharingCards: CardCopy[];
};

type PublicLandingPageProps = {
  languageCode: UiLanguageCode;
  tutorPlaceholder: TutorPlaceholderCopy;
};

type HeroCopy = {
  body: string;
  cta: string;
  overlayBody?: string[];
  overlayTitle?: string;
  role: LandingAudience;
  title: string;
};

type LandingFeatureSectionData = {
  cards: CardCopy[];
  description: string;
  media: string;
  mediaFit?: "contain" | "cover";
  title: string;
};

type ComparisonCardCopy = {
  items: string[];
  title: string;
};

type LandingPageCopy = {
  closingBody: string;
  closingTitle: string;
  heroCopy: Record<LandingAudience, HeroCopy>;
  parentComparisonCards: ComparisonCardCopy[];
  parentFeatureSections: LandingFeatureSectionData[];
};

const heroCopy: Record<LandingAudience, HeroCopy> = {
  student: {
    body: "Get step-by-step help with your homework, drill for exams, and explore the topics you like. banban's BigBrain keeps track of what needs strengthening, then prepares practice around the hard parts.",
    cta: "Sign up for free",
    role: "student",
    title: "Meet banban, your AI homework coach.",
  },
  parent: {
    body: "banban is designed to coach your child through learning and Socratic questioning instead of simply giving answers. It helps with homework, revision, writing, and practice while building a long-term picture of the areas that need support.",
    cta: "Create a free parent account",
    overlayBody: [
      "Parents can review session summaries, visible struggles, and progress signals without reading every private exchange by default.",
      "Linked accounts make it easier to know whether your child is stuck, finished, or drifting away from the year's curriculum.",
      "The goal is useful oversight, not hovering: enough context to support the learner, without turning AI into a shortcut machine.",
    ],
    overlayTitle: "How parent oversight works",
    role: "parent",
    title: "A safer way to let AI help with homework.",
  },
  tutor: {
    body: "banban gives tutors a clearer view of linked students' homework sessions, summaries, weak points, and learning patterns, so tutoring time can be more focused, personal, and effective.",
    cta: "Create a free tutor account",
    overlayBody: [
      "Tutors can review linked student sessions and tutor-focused summaries when access has been explicitly granted.",
      "Tutor notes stay private to the tutor, while student learning data remains bounded by the same visibility rules as the rest of the product.",
      "The purpose is faster preparation before a session, not replacing the tutor's judgment.",
    ],
    overlayTitle: "How tutor oversight works",
    role: "tutor",
    title: "Know what your student struggled with before the session starts.",
  },
};

const parentFeatureSections: LandingFeatureSectionData[] = [
  {
    cards: [],
    description:
      "A side-by-side comparison of generic AI help and banban's coaching frame: same homework, very different learning outcome.",
    media: "/landing/abstract-flow-1.gif",
    title:
      "AI should not replace the learner's thinking.\nIt should help them build it.",
  },
  {
    cards: [
      {
        body: "When students upload their work, banban chooses a pedagogical path: hints, reminders, and analogies that scaffold the student's model instead of jumping straight to the answer.",
        title: "A tutor and a companion.",
      },
      {
        body: "Homework is organized by subject, and course materials can be saved as subject resources so banban can connect today's exercise with previous and upcoming units.",
        title: "Macro view enabled.",
      },
      {
        body: "Generate quizzes and worksheets around tough points. banban keeps track of what needs attention so practice can target and conquer one concept at a time.",
        title: "Ace the exams.",
      },
    ],
    description:
      "The everyday workspace stays useful right away, then becomes more valuable as subjects, course files, and recurring weak spots accumulate.",
    media: "/landing/dashboard-overview.png",
    mediaFit: "contain",
    title: "Organized workspace - useful every day,\nimproving with time.",
  },
  {
    cards: [
      {
        body: "Through wins, mistakes, clever phrases, and clumsy wording, banban notices strengths and weaknesses that can later shape better practice.",
        title: "banban learns about the student.",
      },
      {
        body: "The test-and-forget effect is real. Daily drills and scheduled reminders can help hard-earned knowledge stick across weeks and months.",
        title: "Not only exams.",
      },
      {
        body: "Essay skills, chemistry conversions, language phrasing, and recurring reasoning habits can all become part of a more personal learning path.",
        title: "Mastery for anything, anytime.",
      },
    ],
    description:
      "banban's memory layer is meant to turn repeated friction into better practice, not just a one-off answer to tonight's question.",
    media: "/landing/conversation-workspace.png",
    mediaFit: "contain",
    title: "Long-term support with banban's BigBrain.",
  },
  {
    cards: [
      {
        body: "Maps mode helps students discuss the high-level meaning of a chapter, build connections, and turn revision into a more visual structure.",
        title: "Maps of knowledge.",
      },
      {
        body: "Forward mode lets a student preview what is coming next and connect mastered skills to the next units before class feels rushed.",
        title: "Forward.",
      },
      {
        body: "Explore mode keeps curiosity in the loop, linking schoolwork with topics the student actually enjoys.",
        title: "Let curiosity guide learning.",
      },
    ],
    description:
      "Homework is the first use case, but the same learning companion can support revision maps, next-unit previews, and curiosity-led exploration.",
    media: "/landing/conversation-workspace.png",
    mediaFit: "contain",
    title: "Learning modes beyond cram and drill.",
  },
];

const parentComparisonCards: ComparisonCardCopy[] = [
  {
    items: [
      "The learner uploads exercises and the AI answers diligently.",
      "The learner copies the answer while mistakes stay hidden.",
      "The parent sees finished homework, not understanding.",
      "The learner becomes more dependent over time.",
    ],
    title: "When AI becomes a shortcut",
  },
  {
    items: [
      "The student is guided through steps, with hints before answers.",
      "Weak spots become visible and targetable.",
      "Practice adapts to the learner instead of repeating the same worksheet.",
      "Adults can follow progress without hovering.",
    ],
    title: "When AI becomes a coach",
  },
];

const frenchLandingCopy: LandingPageCopy = {
  closingBody:
    "Crée un compte gratuit et découvre comment banban accompagne un vrai travail, étape par étape.",
  closingTitle: "Commence avec banban.",
  heroCopy: {
    student: {
      body: "Obtiens une aide pas à pas pour tes devoirs, révise pour les contrôles, et explore les sujets que tu aimes. Le BigBrain de banban garde en mémoire ce qu'il faut renforcer, puis prépare de la pratique autour des points difficiles.",
      cta: "S'inscrire gratuitement",
      role: "student",
      title: "Voici banban, ton coach IA pour les devoirs.",
    },
    parent: {
      body: "banban est conçu pour guider votre enfant par le raisonnement et les questions socratiques au lieu de donner simplement les réponses. Il aide pour les devoirs, les révisions, l'écriture et la pratique, tout en construisant une vision à long terme des points à soutenir.",
      cta: "Créer un compte parent gratuit",
      overlayBody: [
        "Les parents peuvent consulter les résumés de session, les blocages visibles et les signaux de progression sans lire chaque échange privé par défaut.",
        "Les comptes liés aident à savoir si l'enfant est bloqué, a terminé, ou s'éloigne du programme de l'année.",
        "L'objectif est une supervision utile, pas une surveillance permanente : assez de contexte pour soutenir l'élève sans transformer l'IA en raccourci.",
      ],
      overlayTitle: "Comment fonctionne le suivi parent",
      role: "parent",
      title: "Une façon plus sûre de laisser l'IA aider aux devoirs.",
    },
    tutor: {
      body: "banban donne aux tuteurs une vue plus claire des devoirs, résumés, points faibles et habitudes d'apprentissage des élèves liés, afin de rendre chaque séance plus ciblée, personnelle et efficace.",
      cta: "Créer un compte tuteur gratuit",
      overlayBody: [
        "Les tuteurs peuvent consulter les sessions d'élèves liés et des résumés pensés pour le suivi lorsque l'accès a été explicitement accordé.",
        "Les notes du tuteur restent privées, tandis que les données d'apprentissage de l'élève restent encadrées par les mêmes règles de visibilité que le reste du produit.",
        "Le but est de préparer plus vite une séance, pas de remplacer le jugement du tuteur.",
      ],
      overlayTitle: "Comment fonctionne le suivi tuteur",
      role: "tutor",
      title: "Sache ce que ton élève n'a pas compris avant la séance.",
    },
  },
  parentComparisonCards: [
    {
      items: [
        "L'élève envoie ses exercices et l'IA répond consciencieusement.",
        "L'élève copie la réponse pendant que les erreurs restent invisibles.",
        "Le parent voit un devoir terminé, pas la compréhension réelle.",
        "L'élève devient plus dépendant avec le temps.",
      ],
      title: "Quand l'IA devient un raccourci",
    },
    {
      items: [
        "L'élève est guidé étape par étape, avec des indices avant les réponses.",
        "Les points faibles deviennent visibles et ciblables.",
        "La pratique s'adapte à l'élève au lieu de répéter la même fiche.",
        "Les adultes peuvent suivre les progrès sans surveiller en permanence.",
      ],
      title: "Quand l'IA devient un coach",
    },
  ],
  parentFeatureSections: [
    {
      cards: [],
      description:
        "Une comparaison côte à côte entre l'aide IA générique et le cadre de coaching de banban : même devoir, résultat d'apprentissage très différent.",
      media: "/landing/abstract-flow-1.gif",
      title:
        "L'IA ne devrait pas remplacer la pensée de l'élève.\nElle devrait l'aider à la construire.",
    },
    {
      cards: [
        {
          body: "Quand l'élève importe son travail, banban choisit une approche pédagogique : indices, rappels et analogies qui soutiennent le modèle mental de l'élève au lieu de sauter directement à la réponse.",
          title: "Un tuteur et un compagnon.",
        },
        {
          body: "Les devoirs sont organisés par matière, et les cours peuvent être conservés comme ressources afin que banban relie l'exercice du jour aux chapitres précédents et suivants.",
          title: "Vue macro activée.",
        },
        {
          body: "Génère des quiz et fiches autour des points difficiles. banban garde la trace de ce qui demande de l'attention pour cibler et conquérir les notions une par une.",
          title: "Réussir les contrôles.",
        },
      ],
      description:
        "L'espace de travail est utile dès le départ, puis gagne en valeur à mesure que les matières, cours et fragilités récurrentes s'accumulent.",
      media: "/landing/dashboard-overview.png",
      mediaFit: "contain",
      title: "Espace de travail organisé - utile chaque jour,\net meilleur avec le temps.",
    },
    {
      cards: [
        {
          body: "À travers les réussites, erreurs, formulations habiles ou maladroites, banban repère des forces et faiblesses qui pourront ensuite guider les entaînements.",
          title: "banban apprend à connaître l'élève.",
        },
        {
          body: "L'effet 'contrôle fini puis on oublie' est réel. Des exercices réguliers et des rappels peuvent aider les connaissances à rester disponibles sur plusieurs semaines et mois.",
          title: "Pas seulement les contrôles.",
        },
        {
          body: "Rédaction, conversions en chimie ou habitudes de raisonnement: tous les aspects sont intégrés pour nourrir un parcours d'apprentissage plus personnel.",
          title: "Maîtrise pour tout, à tout moment.",
        },
      ],
      description:
        "La mémoire de banban transforme les blocages répétés en entraînementsplsu efficaces, pas seulement pour répondre aux devoirs du jour.",
      media: "/landing/conversation-workspace.png",
      mediaFit: "contain",
      title: "Un soutien long terme avec le BigBrain de banban.",
    },
    {
      cards: [
        {
          body: "Le mode Cartes aide l'élève à discuter le sens général d'un chapitre, à créer des liens et à rendre la révision plus visuelle.",
          title: "Cartes de connaissance.",
        },
        {
          body: "Le mode Poursuivre permet d'apercevoir ce qui arrive ensuite et de relier les acquis aux prochains chapitres avant que le cours s'accélère.",
          title: "Poursuivre.",
        },
        {
          body: "Le mode Explorer place la curiosité au centre de l'interaction avec banban, en reliant le travail scolaire aux sujets qui intéressent vraiment l'élève.",
          title: "Laisser la curiosité guider l'apprentissage.",
        },
      ],
      description:
        "Les devoirs sont le premier usage, mais le même compagnon peut soutenir les cartes de révision, l'aperçu des prochains chapitres et l'exploration guidée par la curiosité.",
      media: "/landing/conversation-workspace.png",
      mediaFit: "contain",
      title: "Des modes d'apprentissage au-delà du bachotage.",
    },
  ],
};

const chineseLandingCopy: LandingPageCopy = {
  closingBody: "建立免費帳號，看看 banban 如何一步一步支援真實學習。",
  closingTitle: "從 banban 開始。",
  heroCopy: {
    student: {
      body: "取得作業的逐步引導、為考試練習，並探索你喜歡的主題。banban 的 BigBrain 會記住需要加強的地方，再圍繞難點準備練習。",
      cta: "免費註冊",
      role: "student",
      title: "認識 banban，你的 AI 作業教練。",
    },
    parent: {
      body: "banban 的設計目標，是透過推理與蘇格拉底式提問陪孩子學習，而不是直接給答案。它能協助作業、複習、寫作與練習，同時長期整理需要支持的地方。",
      cta: "建立免費家長帳號",
      overlayBody: [
        "家長可以查看 session 摘要、可見的卡關點與進步訊號，但預設不需要閱讀每一則私人對話。",
        "連結帳號讓你更容易知道孩子是卡住了、完成了，還是逐漸偏離今年的課程節奏。",
        "目標是有用的陪伴，而不是盯著孩子：提供足夠脈絡來支持學習，但不把 AI 變成偷懶捷徑。",
      ],
      overlayTitle: "家長監督如何運作",
      role: "parent",
      title: "讓 AI 協助作業的更安全方式。",
    },
    tutor: {
      body: "banban 讓家教更清楚看到已連結學生的作業 session、摘要、弱點與學習模式，讓課前準備更聚焦，教學更個人化、更有效。",
      cta: "建立免費家教帳號",
      overlayBody: [
        "在明確授權後，家教可以查看已連結學生的 session 與針對教學準備的摘要。",
        "家教筆記保持私密；學生學習資料仍受產品其他可見性規則保護。",
        "目的在於更快準備課程，而不是取代家教的判斷。",
      ],
      overlayTitle: "家教監督如何運作",
      role: "tutor",
      title: "上課前就知道學生卡在哪裡。",
    },
  },
  parentComparisonCards: [
    {
      items: [
        "學生上傳練習，AI 很認真地給出答案。",
        "學生複製答案，但錯誤理解仍然被藏起來。",
        "家長看到作業完成，卻看不到真正理解。",
        "學生長期變得更依賴。",
      ],
      title: "當 AI 變成捷徑",
    },
    {
      items: [
        "學生被一步一步引導，答案之前先有提示。",
        "弱點變得可見，也能被針對練習。",
        "練習會適應學生，而不是重複同一張題單。",
        "大人可以追蹤進步，而不用一直盯著。",
      ],
      title: "當 AI 變成教練",
    },
  ],
  parentFeatureSections: [
    {
      cards: [],
      description:
        "比較一般 AI 幫忙與 banban 教練式框架：同一份作業，學習結果很不一樣。",
      media: "/landing/abstract-flow-1.gif",
      title: "AI 不應該取代學生思考。\n它應該幫學生建立思考。",
    },
    {
      cards: [
        {
          body: "學生上傳作業後，banban 會選擇教學路徑：用提示、提醒與類比支撐學生的理解，而不是直接跳到答案。",
          title: "家教，也是夥伴。",
        },
        {
          body: "作業依科目整理，課程資料也能保存為科目資源，讓 banban 把今天的練習和前後單元連起來。",
          title: "開啟宏觀視角。",
        },
        {
          body: "圍繞難點產生小測驗與練習。banban 會追蹤需要注意的地方，讓練習逐一瞄準概念。",
          title: "準備好面對考試。",
        },
      ],
      description:
        "日常工作區一開始就有用，並會隨著科目、課程資料與反覆出現的弱點累積而更有價值。",
      media: "/landing/dashboard-overview.png",
      mediaFit: "contain",
      title: "有整理的工作區 - 每天有用，\n也會越用越好。",
    },
    {
      cards: [
        {
          body: "透過成功、錯誤、靈活或笨拙的表達，banban 會注意到之後能用來設計更好練習的強項與弱點。",
          title: "banban 會認識學生。",
        },
        {
          body: "考完就忘很常見。每日練習與定期提醒能讓好不容易學會的知識保留數週甚至數月。",
          title: "不只為了考試。",
        },
        {
          body: "作文能力、化學換算、語言表達與反覆出現的推理習慣，都可以成為更個人化學習路徑的一部分。",
          title: "任何時候，掌握任何能力。",
        },
      ],
      description:
        "banban 的記憶層目標，是把反覆摩擦變成更好的練習，而不只是回答今晚的問題。",
      media: "/landing/conversation-workspace.png",
      mediaFit: "contain",
      title: "透過 banban 的 BigBrain 取得長期支持。",
    },
    {
      cards: [
        {
          body: "知識地圖模式能幫學生討論章節的高層意義、建立連結，讓複習變得更視覺化。",
          title: "知識地圖。",
        },
        {
          body: "預習模式讓學生先看看接下來會學什麼，並把已掌握的能力連到下一個單元。",
          title: "往前走。",
        },
        {
          body: "探索模式把好奇心保留下來，將學校內容和學生真正喜歡的主題連接起來。",
          title: "讓好奇心引導學習。",
        },
      ],
      description:
        "作業是第一個使用場景，但同一個學習夥伴也能支援複習地圖、下一單元預習與好奇心探索。",
      media: "/landing/conversation-workspace.png",
      mediaFit: "contain",
      title: "超越考前硬背與刷題的學習模式。",
    },
  ],
};

function getLandingPageCopy(languageCode: UiLanguageCode): LandingPageCopy {
  if (languageCode === "fr") {
    return frenchLandingCopy;
  }

  if (languageCode === "zh") {
    return chineseLandingCopy;
  }

  return {
    closingBody:
      "Create a free account and see how banban supports real learning, one step at a time.",
    closingTitle: "Start with banban.",
    heroCopy,
    parentComparisonCards,
    parentFeatureSections,
  };
}

function authHrefForAudience(
  audience: LandingAudience,
  languageCode: UiLanguageCode,
) {
  if (audience === "parent") {
    return withUiLanguage(
      "/auth?mode=sign_up&role=parent&intent=parent_link",
      languageCode,
    );
  }

  if (audience === "tutor") {
    return withUiLanguage(
      "/auth?mode=sign_up&role=tutor&intent=tutor_link",
      languageCode,
    );
  }

  return withUiLanguage("/auth?mode=sign_up&role=student", languageCode);
}

function FeatureCard({ body, title }: CardCopy) {
  return (
    <article className="shell-card page-glow h-full rounded-[1.35rem] p-5">
      <h3 className="font-[family-name:var(--font-heading)] text-xl leading-tight">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        {body}
      </p>
    </article>
  );
}

function ComparisonCard({ items, title }: ComparisonCardCopy) {
  return (
    <article className="shell-card page-glow h-full rounded-[1.35rem] p-5 sm:p-6">
      <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
        {title}
      </h3>
      <ul className="mt-5 grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        {items.map((item) => (
          <li className="flex gap-3" key={item}>
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function MediaFrame({
  alt,
  className = "",
  fit = "cover",
  src,
}: {
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
  src: string;
}) {
  const imageFitClassName = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div
      className={`relative min-h-[18rem] overflow-hidden rounded-[1.5rem] border border-[color:var(--line)] bg-[#0b1020] shadow-[var(--shadow-soft)] sm:min-h-[20rem] ${className}`}
    >
      <Image
        alt={alt}
        className={`h-full w-full ${imageFitClassName}`}
        fill
        sizes="(min-width: 1024px) 46vw, 100vw"
        src={src}
        unoptimized
      />
    </div>
  );
}

function LandingFeatureSection({
  cards,
  media,
  mediaFit,
  title,
  reverse = false,
}: LandingFeatureSectionData & { reverse?: boolean }) {
  return (
    <section className="grid gap-6">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="whitespace-pre-line font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      <div
        className={`grid items-stretch gap-5 ${
          reverse
            ? "lg:grid-cols-[minmax(19rem,1fr)_minmax(0,2fr)]"
            : "lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]"
        }`}
      >
        <MediaFrame
          alt={title}
          className={`lg:min-h-[31rem] ${reverse ? "lg:order-2" : ""}`}
          fit={mediaFit}
          src={media}
        />
        <div className={`grid gap-4 ${reverse ? "lg:order-1" : ""}`}>
          {cards.map((card) => (
            <FeatureCard body={card.body} key={card.title} title={card.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OversightOverlay({
  copy,
  isOpen,
  onClose,
}: {
  copy: HeroCopy;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!copy.overlayBody || !copy.overlayTitle) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="landing-oversight-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      role="dialog"
    >
      <button
        aria-label="Close oversight details"
        className="absolute inset-0 bg-[color:var(--foreground)]/30 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="shell-panel page-glow relative grid max-h-[78dvh] w-[92vw] gap-6 overflow-y-auto rounded-[2rem] p-6 shadow-[var(--shadow-strong)] sm:w-[75vw] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2
            className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl"
            id="landing-oversight-title"
          >
            {copy.overlayTitle}
          </h2>
          <button
            aria-label="Close oversight details"
            className="theme-toggle shrink-0"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
        <ul className="grid gap-4 text-base leading-7 text-[color:var(--ink-soft)]">
          {copy.overlayBody.map((item) => (
            <li className="flex gap-3" key={item}>
              <span
                aria-hidden="true"
                className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OversightInlineTrigger({
  copy,
  onOpen,
}: {
  copy: HeroCopy;
  onOpen: () => void;
}) {
  if (!copy.overlayTitle || !copy.overlayBody) {
    return null;
  }

  return (
    <>
      {" "}
      <button
        className="font-semibold text-[color:var(--foreground)] underline decoration-[color:var(--accent)] decoration-2 underline-offset-4 transition hover:text-[color:var(--accent)]"
        onClick={onOpen}
        type="button"
      >
        {copy.overlayTitle}.
      </button>
    </>
  );
}

function HeroSubtitle({
  copy,
  onOpenOversight,
}: {
  copy: HeroCopy;
  onOpenOversight: () => void;
}) {
  return (
    <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[color:var(--ink-soft)]">
      {copy.body}
      <OversightInlineTrigger copy={copy} onOpen={onOpenOversight} />
    </p>
  );
}

function ParentFeatures({ copy }: { copy: LandingPageCopy }) {
  const [comparisonFeature, ...standardFeatures] = copy.parentFeatureSections;

  return (
    <div id="for-parents" className="grid gap-16 sm:gap-20">
      <section className="grid gap-6">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="whitespace-pre-line font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
            {comparisonFeature.title}
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {copy.parentComparisonCards.map((card) => (
            <ComparisonCard key={card.title} {...card} />
          ))}
        </div>
        <MediaFrame
          alt={comparisonFeature.description}
          className="lg:min-h-[31rem]"
          src={comparisonFeature.media}
        />
      </section>

      {standardFeatures.map((section, index) => (
        <LandingFeatureSection
          key={section.title}
          reverse={index % 2 === 1}
          {...section}
        />
      ))}
    </div>
  );
}

function TutorFeatures({
  tutorPlaceholder,
}: {
  tutorPlaceholder: TutorPlaceholderCopy;
}) {
  const rows: LandingFeatureSectionData[] = [
    {
      cards: tutorPlaceholder.featureCards,
      description:
        "Before the tutoring session begins, banban can surface the recent learning context: what the student tried, where they stalled, and what probably needs attention first.",
      media: "/landing/abstract-flow-1.gif",
      title: "Prepare with the context already in hand.",
    },
    {
      cards: tutorPlaceholder.contentCards,
      description:
        "Session history gives tutors a cleaner starting point than asking the student to reconstruct every missing step from memory.",
      media: "/landing/abstract-flow-2.gif",
      title: "Use session history as a starting point.",
    },
    {
      cards: tutorPlaceholder.sharingCards,
      description:
        "Linked summaries, review history, and private tutor notes help tutoring stay continuous from one meeting to the next.",
      media: "/landing/abstract-flow-3.gif",
      title: "Keep follow-up organized across sessions.",
    },
  ];

  return (
    <div className="grid gap-16 sm:gap-20">
      {rows.map((row, index) => (
        <LandingFeatureSection
          key={row.title}
          reverse={index % 2 === 1}
          {...row}
        />
      ))}
    </div>
  );
}

export function PublicLandingPage({
  languageCode,
  tutorPlaceholder,
}: PublicLandingPageProps) {
  const audience = useLandingAudience();
  const landingCopy = getLandingPageCopy(languageCode);
  const selectedCopy = landingCopy.heroCopy[audience];
  const ctaHref = authHrefForAudience(audience, languageCode);
  const [isOversightOpen, setIsOversightOpen] = useState(false);

  return (
    <main className="px-5 pb-16 pt-56 sm:px-8 sm:pt-28 lg:px-36">
      <div className="mx-auto grid max-w-[92rem] gap-16 sm:gap-20">
        <section className="py-8 text-center sm:py-10 lg:py-16" id="hero">
          <div className="mx-auto max-w-6xl">
            <h1 className="mx-auto max-w-5xl font-[family-name:var(--font-heading)] text-5xl leading-[0.96] sm:text-6xl lg:text-[5.25rem]">
              {selectedCopy.title}
            </h1>
            <HeroSubtitle
              copy={selectedCopy}
              onOpenOversight={() => setIsOversightOpen(true)}
            />
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link className="button-base button-primary" href={ctaHref}>
                {selectedCopy.cta}
              </Link>
            </div>
          </div>
        </section>

        <OversightOverlay
          copy={selectedCopy}
          isOpen={isOversightOpen}
          onClose={() => setIsOversightOpen(false)}
        />

        {audience === "parent" ? (
          <section className="grid gap-16 sm:gap-20" id="features">
            <ParentFeatures copy={landingCopy} />
          </section>
        ) : null}

        {audience === "tutor" ? (
          <section className="grid gap-16 sm:gap-20" id="features">
            <TutorFeatures tutorPlaceholder={tutorPlaceholder} />
          </section>
        ) : null}

        {audience === "student" ? (
          <div aria-hidden="true" id="features" />
        ) : null}

        {audience === "student" ? null : (
          <section className="py-8 text-center sm:py-12">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
                {landingCopy.closingTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[color:var(--ink-soft)]">
                {landingCopy.closingBody}
              </p>
              <Link className="button-base button-primary mt-8" href={ctaHref}>
                {selectedCopy.cta}
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
