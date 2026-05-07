"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import { withUiLanguage } from "@/lib/i18n/ui-language";

type Audience = "student" | "parent" | "tutor";

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
  eyebrow: string;
  overlayBody?: string[];
  overlayTitle?: string;
  role: Audience;
  title: string;
};

const heroCopy: Record<Audience, HeroCopy> = {
  student: {
    body: "Get step-by-step help with your homework, drill for exams, and explore the topics you like. banban's BigBrain keeps track of what needs strengthening, then prepares practice around the hard parts.",
    cta: "Sign up for free",
    eyebrow: "For students",
    role: "student",
    title: "Meet banban, your AI homework coach.",
  },
  parent: {
    body: "banban is designed to coach your child through learning and Socratic questioning instead of simply giving answers. It helps with homework, revision, writing, and practice while building a long-term picture of the areas that need support.",
    cta: "Create a free parent account",
    eyebrow: "For parents",
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
    eyebrow: "For tutors",
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

const audienceLabels: Array<{ label: string; value: Audience }> = [
  { label: "Student", value: "student" },
  { label: "Parent", value: "parent" },
  { label: "Tutor", value: "tutor" },
];

const parentComparison = [
  {
    body: [
      "The learner uploads exercises, and the AI answers diligently.",
      "The learner copies the answer, while mistakes stay hidden.",
      "The parent sees finished homework, not understanding.",
      "The learner becomes more dependent over time.",
    ],
    title: "When AI becomes a shortcut",
  },
  {
    body: [
      "The student is guided through steps, with hints before answers.",
      "Weak spots become visible and targetable.",
      "Practice adapts to the learner instead of repeating the same worksheet.",
      "Adults can follow progress without hovering.",
    ],
    title: "When AI becomes a coach",
  },
];

const parentFeatureSections = [
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
    title: "Learning modes beyond cram and drill.",
  },
];

function authHrefForAudience(audience: Audience, languageCode: UiLanguageCode) {
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
  src,
}: {
  alt: string;
  src: string;
}) {
  return (
    <div className="relative min-h-[18rem] overflow-hidden rounded-[1.5rem] border border-[color:var(--line)] bg-[#0b1020] shadow-[var(--shadow-soft)] sm:min-h-[20rem]">
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

function OversightDetails({ copy }: { copy: HeroCopy }) {
  if (!copy.overlayBody || !copy.overlayTitle) {
    return null;
  }

  return (
    <details className="group mt-5 max-w-2xl rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4 text-left">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[color:var(--foreground)] [&::-webkit-details-marker]:hidden">
        <span>{copy.overlayTitle}</span>
        <span
          aria-hidden="true"
          className="text-[color:var(--ink-muted)] transition group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        {copy.overlayBody.map((item) => (
          <li className="flex gap-2" key={item}>
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function HeroVisual({ audience }: { audience: Audience }) {
  const rows =
    audience === "student"
      ? ["Photo of homework", "Step-by-step hint", "Targeted practice"]
      : audience === "parent"
        ? ["Homework summary", "Weak points", "Support next steps"]
        : ["Session context", "Learning pattern", "Tutor notes"];

  return (
    <div className="shell-panel page-glow grid gap-5 rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
            banban workspace
          </p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            Learning, not shortcuts
          </p>
        </div>
        <span className="brand-mark brand-mark--mini" />
      </div>
      <div className="grid gap-3">
        {rows.map((row, index) => (
          <div
            className="rounded-[1.15rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3"
            key={row}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
              0{index + 1}
            </p>
            <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
              {row}
            </p>
          </div>
        ))}
      </div>
      <MediaFrame
        alt="Abstract product motion preview"
        src={
          audience === "parent"
            ? "/landing/abstract-flow-1.gif"
            : audience === "tutor"
              ? "/landing/abstract-flow-3.gif"
              : "/landing/abstract-flow-2.gif"
        }
      />
    </div>
  );
}

function ParentFeatures() {
  return (
    <div id="for-parents" className="grid gap-16 sm:gap-20">
      <section className="grid gap-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-5xl">
            AI should not replace the learner&apos;s thinking. It should help them build it.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {parentComparison.map((card) => (
            <article
              className="shell-card rounded-[1.5rem] p-5 sm:p-6"
              key={card.title}
            >
              <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                {card.title}
              </h3>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                {card.body.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--highlight)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <MediaFrame
          alt="Side-by-side comparison preview"
          src="/landing/abstract-flow-1.gif"
        />
      </section>

      {parentFeatureSections.map((section) => (
        <section className="grid gap-6" key={section.title}>
          <h2 className="max-w-5xl font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
            {section.title}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {section.cards.map((card) => (
              <FeatureCard body={card.body} key={card.title} title={card.title} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TutorFeatures({
  tutorPlaceholder,
}: {
  tutorPlaceholder: TutorPlaceholderCopy;
}) {
  const rows = [
    {
      cards: tutorPlaceholder.featureCards,
      media: "/landing/abstract-flow-1.gif",
      title: "Prepare with the context already in hand.",
    },
    {
      cards: tutorPlaceholder.contentCards,
      media: "/landing/abstract-flow-2.gif",
      title: "Use session history as a starting point.",
    },
    {
      cards: tutorPlaceholder.sharingCards,
      media: "/landing/abstract-flow-3.gif",
      title: "Keep follow-up organized across sessions.",
    },
  ];

  return (
    <div className="grid gap-16 sm:gap-20">
      {rows.map((row, index) => (
        <section
          className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]"
          key={row.title}
        >
          <div className={index % 2 === 1 ? "lg:order-2" : ""}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
              Tutor placeholder
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
              {row.title}
            </h2>
            <div className="mt-5 grid gap-4">
              {row.cards.map((card) => (
                <FeatureCard body={card.body} key={card.title} title={card.title} />
              ))}
            </div>
          </div>
          <MediaFrame alt={row.title} src={row.media} />
        </section>
      ))}
    </div>
  );
}

export function PublicLandingPage({
  languageCode,
  tutorPlaceholder,
}: PublicLandingPageProps) {
  const [audience, setAudience] = useState<Audience>("parent");
  const selectedCopy = heroCopy[audience];
  const ctaHref = authHrefForAudience(audience, languageCode);

  return (
    <main className="px-5 pb-16 pt-28 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[92rem] gap-16 sm:gap-20">
        <section
          className="grid items-center gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,0.96fr)_minmax(24rem,0.84fr)] lg:py-12"
          id="hero"
        >
          <div>
            <div className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-1">
              {audienceLabels.map((item) => (
                <button
                  aria-pressed={audience === item.value}
                  className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                    audience === item.value
                      ? "bg-[color:var(--surface-raised)] text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                      : "text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
                  }`}
                  key={item.value}
                  onClick={() => setAudience(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
              {selectedCopy.eyebrow}
            </p>
            <h1 className="mt-4 max-w-5xl font-[family-name:var(--font-heading)] text-5xl leading-[0.96] sm:text-6xl lg:text-[5.25rem]">
              {selectedCopy.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[color:var(--ink-soft)]">
              {selectedCopy.body}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link className="button-base button-primary" href={ctaHref}>
                {selectedCopy.cta}
              </Link>
              <Link
                className="button-base button-secondary"
                href={withUiLanguage("/auth", languageCode)}
              >
                Sign in
              </Link>
            </div>
            <OversightDetails copy={selectedCopy} />
          </div>

          <HeroVisual audience={audience} />
        </section>

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
