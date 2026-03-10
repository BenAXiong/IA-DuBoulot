import Link from "next/link";
import { HighlightCard } from "@/components/highlight-card";
import { PublicShell } from "@/components/layout/public-shell";

const pillars = [
  {
    title: "Supervised by design",
    body: "Student help stays visible to parents and tutors instead of disappearing inside a private chatbot.",
  },
  {
    title: "Coach, not answer machine",
    body: "The product is being shaped around hints, attempts, and learning signals before full solutions.",
  },
  {
    title: "Built for real homework intake",
    body: "Photos, screenshots, and PDFs are first-class inputs because students use iPad and laptop workflows.",
  },
];

const buildTrack = [
  "Vercel project created and ready for root deployment.",
  "Gemini-first AI path with swappable provider boundary.",
  "Lemon Squeezy chosen for billing.",
  "Under-13 MVP baseline documented before auth and schema work.",
];

export default function Home() {
  return (
    <PublicShell>
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-8">
        <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur md:grid-cols-[1.25fr_0.75fr] md:p-10">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 text-sm text-[color:var(--ink-soft)]">
              <span className="rounded-full border border-[color:var(--line)] bg-white/60 px-3 py-1">
                IA DuBoulot
              </span>
              <span className="rounded-full border border-[color:var(--line)] bg-white/60 px-3 py-1">
                FR-first AI
              </span>
              <span className="rounded-full border border-[color:var(--line)] bg-white/60 px-3 py-1">
                FR / EN / ZH UI
              </span>
              <span className="rounded-full border border-[color:var(--line)] bg-white/60 px-3 py-1">
                Vercel-ready
              </span>
            </div>

            <div className="space-y-4">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.28em] text-[color:var(--ink-soft)]">
                Build scaffold
              </p>
              <h1 className="max-w-3xl font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl lg:text-6xl">
                A supervised AI homework coach for students, parents, and tutors.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:var(--ink-soft)] sm:text-lg">
                The repo now has the planning spine, role model, under-13
                baseline, and initial Next.js scaffold needed to start real MVP
                implementation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
                href="/auth"
              >
                Open auth flow
              </Link>
              <Link
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5"
                href="/auth?mode=sign_up&role=student"
              >
                Start as student
              </Link>
              <Link
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5"
                href="/auth?mode=sign_up&role=parent&intent=parent_link"
              >
                Start as parent
              </Link>
              <Link
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5"
                href="/auth?mode=sign_up&role=tutor&intent=tutor_link"
              >
                Start as tutor
              </Link>
              <a
                className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
                href="https://github.com/BenAXiong/IA-DuBoulot"
                rel="noreferrer"
                target="_blank"
              >
                Open GitHub repo
              </a>
              <a
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5"
                href="https://vercel.com/bmavmartinez-8475s-projects/ia-du-boulot"
                rel="noreferrer"
                target="_blank"
              >
                Open Vercel project
              </a>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Current track
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--foreground)]">
              {buildTrack.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <HighlightCard
              body={pillar.body}
              key={pillar.title}
              title={pillar.title}
            />
          ))}
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.88fr_1.12fr] md:p-8">
          <article className="space-y-4">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
              Public track
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              La couche publique ne depend plus d&apos;une simple page placeholder.
            </h2>
            <p className="text-base leading-7 text-[color:var(--ink-soft)]">
              Landing, pricing et auth partagent maintenant le meme squelette,
              ce qui reduit le risque de derive visuelle avant les phases produit
              plus lourdes.
            </p>
          </article>

          <article className="grid gap-4 sm:grid-cols-2">
            <HighlightCard
              body="Le shell protege bascule vers une vraie navigation responsive avec variantes eleve, parent, tuteur et admin."
              title="App shell"
            />
            <HighlightCard
              body="Le pricing MVP reste volontairement simple pour ne pas inventer de packaging definitif avant Lemon Squeezy."
              title="Pricing shell"
            />
          </article>
        </section>
        </div>
      </main>
    </PublicShell>
  );
}
