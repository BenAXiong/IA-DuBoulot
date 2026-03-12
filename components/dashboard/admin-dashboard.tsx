import Link from "next/link";
import { getAdminDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type AdminDashboardProps = {
  auditEventCount: number;
  languageCode?: UiLanguageCode;
};

export function AdminDashboard({
  auditEventCount,
  languageCode = "fr",
}: AdminDashboardProps) {
  const copy = getAdminDashboardCopy(languageCode);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.operations}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.overview.auditTitle}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.overview.auditBody}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.volume}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.overview.volumeTitle(auditEventCount)}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.overview.volumeBody}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.route}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.overview.routeTitle}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.overview.routeBody}
          </p>
        </article>
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.92fr_1.08fr]"
        id="operations"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.ops.eyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {copy.ops.title}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.ops.body}
          </p>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>{copy.ops.support}</p>
          <Link
            className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
            href="/app/audit"
          >
            {copy.ops.open}
          </Link>
        </article>
      </section>
    </div>
  );
}
