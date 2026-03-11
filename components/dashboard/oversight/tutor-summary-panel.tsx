import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import type { SessionSummaryRecord } from "@/lib/server/conversations/types";

type TutorSummaryPanelProps = {
  summaries: SessionSummaryRecord[];
};

export function TutorSummaryPanel({ summaries }: TutorSummaryPanelProps) {
  const summary = summaries[0] ?? null;

  if (!summary) {
    return (
      <article className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
        <p className="font-medium">Synthese tuteur indisponible.</p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
          La session n&apos;a pas encore produit d&apos;insight tuteur exploitable.
        </p>
      </article>
    );
  }

  return (
    <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          Synthese tuteur
        </p>
        <div className="flex flex-wrap gap-2">
          <StudentStatusPill label={summary.language_code.toUpperCase()} tone="accent" />
          {summary.weakness_tags.map((tag) => (
            <StudentStatusPill key={tag} label={tag} tone="warning" />
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
        <p className="whitespace-pre-line text-sm leading-6 text-[color:var(--foreground)]">
          {summary.summary_text}
        </p>
      </div>

      {summary.next_step_recommendation ? (
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
          Prochaine intervention conseillee: {summary.next_step_recommendation}
        </div>
      ) : null}
    </article>
  );
}
