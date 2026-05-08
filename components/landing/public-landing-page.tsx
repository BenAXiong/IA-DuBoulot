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
  title: string;
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
    cards: [
      {
        body: "The learner uploads exercises, the AI answers diligently, and finished homework can hide whether the idea was understood.",
        title: "When AI becomes a shortcut.",
      },
      {
        body: "banban guides the student through steps, gives hints before answers, and makes weak spots visible enough to practice.",
        title: "When AI becomes a coach.",
      },
      {
        body: "Parents get a clearer view of struggles and next steps without hovering over every message or taking the work over.",
        title: "What changes for adults.",
      },
    ],
    description:
      "A side-by-side comparison of generic AI help and banban's coaching frame: same homework, very different learning outcome.",
    media: "/landing/abstract-flow-1.gif",
    title:
      "AI should not replace the learner's thinking. It should help them build it.",
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
    media: "/landing/abstract-flow-2.gif",
    title: "Organized workspace - useful every day, improving with time.",
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
    media: "/landing/abstract-flow-3.gif",
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
    media: "/landing/abstract-flow-1.gif",
    title: "Learning modes beyond cram and drill.",
  },
];

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

function MediaFrame({
  alt,
  className = "",
  src,
}: {
  alt: string;
  className?: string;
  src: string;
}) {
  return (
    <div
      className={`relative min-h-[18rem] overflow-hidden rounded-[1.5rem] border border-[color:var(--line)] bg-[#0b1020] shadow-[var(--shadow-soft)] sm:min-h-[20rem] ${className}`}
    >
      <Image
        alt={alt}
        className="h-full w-full object-cover"
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
  title,
  reverse = false,
}: LandingFeatureSectionData & { reverse?: boolean }) {
  return (
    <section className="grid gap-6">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <MediaFrame
          alt={title}
          className={`lg:min-h-[31rem] ${reverse ? "lg:order-2" : ""}`}
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

function ParentFeatures() {
  return (
    <div id="for-parents" className="grid gap-16 sm:gap-20">
      {parentFeatureSections.map((section, index) => (
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
  const selectedCopy = heroCopy[audience];
  const ctaHref = authHrefForAudience(audience, languageCode);
  const [isOversightOpen, setIsOversightOpen] = useState(false);

  return (
    <main className="px-5 pb-16 pt-56 sm:px-8 sm:pt-28 lg:px-12">
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
            <ParentFeatures />
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

        <section className="py-8 text-center sm:py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
              Start with banban.
            </h2>
            <p className="mt-4 text-base leading-7 text-[color:var(--ink-soft)]">
              Create a free account and see how banban supports real learning, one step at a time.
            </p>
            <Link className="button-base button-primary mt-8" href={ctaHref}>
              {selectedCopy.cta}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
