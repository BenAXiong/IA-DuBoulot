"use client";

import { useState, useTransition } from "react";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import { getTutorNotesPanelCopy } from "@/lib/i18n/oversight-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { TutorNoteRecord } from "@/lib/server/oversight/types";

type TutorNoteResponse =
  | {
      ok: true;
      data: {
        note: TutorNoteRecord;
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
        fieldErrors?: Record<string, string>;
      };
    };

type TutorNotesPanelProps = {
  initialNotes: TutorNoteRecord[];
  languageCode: UiLanguageCode;
  studentUserId: string;
  conversationId?: string | null;
  title: string;
  body: string;
};

function sortNotes(notes: TutorNoteRecord[]) {
  return [...notes].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function TutorNotesPanel({
  initialNotes,
  languageCode,
  studentUserId,
  conversationId = null,
  title,
  body,
}: TutorNotesPanelProps) {
  const copy = getTutorNotesPanelCopy(languageCode);
  const [notes, setNotes] = useState(sortNotes(initialNotes));
  const [newNoteText, setNewNoteText] = useState("");
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingPinned, setEditingPinned] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetEditor() {
    setEditingNoteId(null);
    setEditingText("");
    setEditingPinned(false);
  }

  function beginEdit(note: TutorNoteRecord) {
    setEditingNoteId(note.id);
    setEditingText(note.noteText);
    setEditingPinned(note.isPinned);
    setErrorMessage(null);
  }

  function createNote() {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/tutor/notes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          studentUserId,
          conversationId,
          noteText: newNoteText,
          isPinned: newNotePinned,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | TutorNoteResponse
        | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (!response.ok || !payload?.ok || !payload.data?.note) {
        setErrorMessage(routeErrorMessage ?? copy.createError);
        return;
      }

      setNotes((current) => sortNotes([payload.data.note, ...current]));
      setNewNoteText("");
      setNewNotePinned(false);
    });
  }

  function saveEdit(noteId: string) {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tutor/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          noteText: editingText,
          isPinned: editingPinned,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | TutorNoteResponse
        | null;
      const routeErrorMessage =
        payload && "error" in payload ? payload.error?.message : null;

      if (!response.ok || !payload?.ok || !payload.data?.note) {
        setErrorMessage(routeErrorMessage ?? copy.updateError);
        return;
      }

      setNotes((current) =>
        sortNotes(
          current.map((note) =>
            note.id === noteId ? payload.data.note : note,
          ),
        ),
      );
      resetEditor();
    });
  }

  function deleteNote(noteId: string) {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/tutor/notes/${noteId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;

      if (!response.ok || !payload?.ok) {
        setErrorMessage(payload?.error?.message ?? copy.deleteError);
        return;
      }

      setNotes((current) => current.filter((note) => note.id !== noteId));
      if (editingNoteId === noteId) {
        resetEditor();
      }
    });
  }

  return (
    <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{body}</p>
      </div>

      {errorMessage ? (
        <p className="rounded-[1.25rem] border border-[#d07c5b] bg-[#fff0ea] px-4 py-3 text-sm text-[#8d3b1f]">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
        <textarea
          className="min-h-32 rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[color:var(--accent)]"
          onChange={(event) => setNewNoteText(event.target.value)}
          placeholder={
            conversationId
              ? copy.placeholders.session
              : copy.placeholders.general
          }
          value={newNoteText}
        />
        <label className="inline-flex items-center gap-2 text-sm text-[color:var(--ink-soft)]">
          <input
            checked={newNotePinned}
            onChange={(event) => setNewNotePinned(event.target.checked)}
            type="checkbox"
          />
          {copy.pinLabel}
        </label>
        <button
          className="justify-self-start rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
          onClick={createNote}
          type="button"
        >
          {isPending ? copy.saving : copy.addNote}
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.empty}
        </div>
      ) : (
        <div className="grid gap-3">
          {notes.map((note) => {
            const isEditing = note.id === editingNoteId;

            return (
              <article
                className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                key={note.id}
              >
                <div className="flex flex-wrap gap-2">
                  {note.isPinned ? (
                    <StudentStatusPill label={copy.pinned} tone="accent" />
                  ) : null}
                  {note.conversationId ? (
                    <StudentStatusPill label={copy.linkedToSession} />
                  ) : (
                    <StudentStatusPill label={copy.generalNote} />
                  )}
                </div>

                {isEditing ? (
                  <div className="grid gap-3">
                    <textarea
                      className="min-h-28 rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[color:var(--accent)]"
                      onChange={(event) => setEditingText(event.target.value)}
                      value={editingText}
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-[color:var(--ink-soft)]">
                      <input
                        checked={editingPinned}
                        onChange={(event) => setEditingPinned(event.target.checked)}
                        type="checkbox"
                      />
                      {copy.pinLabel}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5"
                        onClick={() => saveEdit(note.id)}
                        type="button"
                      >
                        {copy.save}
                      </button>
                      <button
                        className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                        onClick={resetEditor}
                        type="button"
                      >
                        {copy.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm leading-6 text-[color:var(--foreground)]">
                    {note.noteText}
                  </p>
                )}

                {!isEditing ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                      onClick={() => beginEdit(note)}
                      type="button"
                    >
                      {copy.edit}
                    </button>
                    <button
                      className="rounded-full border border-[#d07c5b] bg-[#fff0ea] px-4 py-2 text-sm font-medium text-[#8d3b1f] transition hover:-translate-y-0.5"
                      onClick={() => deleteNote(note.id)}
                      type="button"
                    >
                      {copy.delete}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
