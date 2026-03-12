"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getMemoryCategoryLabel,
  getMemoryPanelCopy,
} from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ManualMemoryCategory,
  MemoryCategory,
  StudentMemoryItemRecord,
  StudentMemorySnapshot,
} from "@/lib/server/memory/types";

type MemoryPanelProps = {
  title: string;
  intro: string;
  studentUserId: string;
  languageCode: UiLanguageCode;
  snapshot: StudentMemorySnapshot;
};

type MemoryPatchResponse = {
  ok?: boolean;
  error?: {
    message?: string;
  };
};

const categoryOrder: MemoryCategory[] = [
  "strength",
  "weakness",
  "preference",
  "topic",
  "learning_note",
];

const manualCategories: ManualMemoryCategory[] = [
  "strength",
  "weakness",
  "preference",
  "topic",
];

function buildInitialFormState() {
  return {
    itemId: "",
    category: "strength" as ManualMemoryCategory,
    title: "",
    detail: "",
  };
}

function formatConfidence(value: number | null) {
  if (value === null) {
    return null;
  }

  return `${Math.round(value * 100)}%`;
}

export function MemoryPanel({
  title,
  intro,
  studentUserId,
  languageCode,
  snapshot,
}: MemoryPanelProps) {
  const router = useRouter();
  const copy = getMemoryPanelCopy(languageCode);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState(buildInitialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEditing = formState.itemId.length > 0;

  function resetForm() {
    setFormState(buildInitialFormState());
  }

  function beginEdit(item: StudentMemoryItemRecord) {
    if (
      item.category !== "strength" &&
      item.category !== "weakness" &&
      item.category !== "preference" &&
      item.category !== "topic"
    ) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setFormState({
      itemId: item.id,
      category: item.category,
      title: item.title,
      detail: item.detail ?? "",
    });
  }

  function submitMutation(body: Record<string, unknown>, successLabel: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/students/${studentUserId}/memory`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as
        | MemoryPatchResponse
        | null;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(
          payload?.error?.message ?? copy.errorFallback,
        );
        return;
      }

      setSuccessMessage(successLabel);
      resetForm();
      router.refresh();
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMutation(
      {
        action: "upsert",
        itemId: formState.itemId || undefined,
        category: formState.category,
        title: formState.title,
        detail: formState.detail,
      },
      isEditing ? copy.success.updated : copy.success.created,
    );
  }

  function handleDelete(itemId: string) {
    submitMutation(
      {
        action: "delete",
        itemId,
      },
      copy.success.deleted,
    );
  }

  return (
    <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
      <div className="space-y-3">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{intro}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.summaries.strength}
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {snapshot.profile.strengthsSummary ?? copy.emptySummaries.strength}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.summaries.weakness}
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {snapshot.profile.weaknessesSummary ?? copy.emptySummaries.weakness}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.summaries.preference}
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {snapshot.profile.preferencesSummary ?? copy.emptySummaries.preference}
          </p>
        </article>
      </div>

      {errorMessage ? (
        <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm leading-6 text-[#8d3b1f]">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-[1.25rem] border border-[#8fb58a] bg-[#eef8ec] px-4 py-3 text-sm leading-6 text-[#31512e]">
          {successMessage}
        </p>
      ) : null}

      {snapshot.canEdit ? (
        <form
          className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium">
              {isEditing ? copy.form.edit : copy.form.add}
            </p>
            {isEditing ? (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                onClick={resetForm}
                type="button"
              >
                {copy.form.cancel}
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-[13rem_1fr]">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">{copy.form.category}</span>
              <select
                className="min-h-11 rounded-[1rem] border border-[color:var(--line)] bg-white px-3 py-2"
                disabled={isPending}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    category: event.target.value as ManualMemoryCategory,
                  }))
                }
                value={formState.category}
              >
                {manualCategories.map((category) => (
                  <option key={category} value={category}>
                    {getMemoryCategoryLabel(category, languageCode)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">{copy.form.title}</span>
              <input
                className="min-h-11 rounded-[1rem] border border-[color:var(--line)] bg-white px-3 py-2"
                disabled={isPending}
                maxLength={120}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder={copy.form.titlePlaceholder}
                value={formState.title}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">{copy.form.detail}</span>
            <textarea
              className="min-h-[6rem] rounded-[1rem] border border-[color:var(--line)] bg-white px-3 py-2"
              disabled={isPending}
              maxLength={320}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  detail: event.target.value,
                  }))
                }
              placeholder={copy.form.detailPlaceholder}
              value={formState.detail}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#b34f32] bg-[#cb5d3c] px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
              disabled={isPending}
              type="submit"
            >
              {isPending ? copy.form.pending : isEditing ? copy.form.update : copy.form.create}
            </button>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.form.note}
            </p>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4">
        {categoryOrder.map((category) => {
          const items = snapshot.itemsByCategory[category];

          if (items.length === 0) {
            return null;
          }

          return (
            <article
              className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
              key={category}
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {getMemoryCategoryLabel(category, languageCode)}
                </p>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.activeItems(items.length)}
                </p>
              </div>

              <div className="grid gap-3">
                {items.map((item) => (
                  <div
                    className="grid gap-3 rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-4"
                    key={item.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium">{item.title}</p>
                        {item.detail ? (
                          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                            {item.detail}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-2 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
                        {formatConfidence(item.confidence) ? (
                          <p>{copy.confidence(formatConfidence(item.confidence) ?? "")}</p>
                        ) : null}
                        {item.expiresAt ? (
                          <p>
                            {copy.expiry(
                              formatDateLabel(item.expiresAt, languageCode) ?? item.expiresAt,
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {snapshot.canEdit && category !== "learning_note" ? (
                      <div className="flex flex-wrap gap-3">
                        <button
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                          disabled={isPending}
                          onClick={() => beginEdit(item)}
                          type="button"
                        >
                          {copy.edit}
                        </button>
                        <button
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d07c5b] bg-[#fff0ea] px-4 py-2 text-sm font-medium text-[#8d3b1f] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id)}
                          type="button"
                        >
                          {copy.delete}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          );
        })}

        {snapshot.items.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.empty}
          </div>
        ) : null}
      </div>
    </section>
  );
}
