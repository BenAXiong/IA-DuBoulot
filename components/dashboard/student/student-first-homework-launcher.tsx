"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { StudentSubjectQuickStart } from "@/components/dashboard/student/student-subject-quick-start";
import {
  getIntakeSubjectOptions,
} from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ListConversationSummary } from "@/lib/server/conversations/types";
import type { SubjectResourceLibraryItem } from "@/lib/server/subject-resources/types";

type StudentFirstHomeworkLauncherProps = {
  initialDraft?: string | null;
  initialSelectedSubject?: string | null;
  title?: string;
  knownSubjects?: string[];
  conversations?: ListConversationSummary[];
  subjectCounts?: Record<string, number>;
  subjectResourcesBySubject?: Record<string, SubjectResourceLibraryItem[]>;
  subjectResourceUploadDisabledReason?: string | null;
  languageCode: UiLanguageCode;
};

type SubjectShortcut = {
  value: string;
  label: string;
  kind: "default" | "known" | "custom";
};

type SubjectShortcutPreferences = {
  hiddenDefaultSubjects: string[];
  customSubjects: string[];
  subjectOrder: string[];
};

type SubjectResourceListResponse =
  | {
      ok: true;
      data: {
        resources: SubjectResourceLibraryItem[];
      };
    }
  | {
      ok?: false;
      error?: unknown;
    };

const SUBJECT_SHORTCUT_PREFS_KEY = "iadb-student-subject-shortcuts-v1";
const HOMEWORK_SUBJECT_SELECTED_EVENT = "iadb-homework-subject-selected";

function getFirstHomeworkCopy(languageCode: UiLanguageCode) {
  switch (languageCode) {
    case "en":
      return {
        addCustomSubject: "Add subject",
        cancel: "Cancel",
        customSubjectPlaceholder: "Type the subject name",
        deleteSubject: "Delete",
        editSubject: "Edit",
        emptyRecentChats: "No homework saved yet.",
        selectSubjectFirst: "Choose a subject first.",
        disabledReplyMode: "Thinking",
        activeHomeworkCount: (count: number) =>
          `${count} ${count === 1 ? "to finish" : "to finish"}`,
        menuLabel: "Edit subjects",
        recentChatsTitle: "My homework",
        reorder: "Drag to reorder",
        saveSubject: "Save",
        subjectVisibility: "Visible subjects",
      };
    case "zh":
      return {
        addCustomSubject: "新增科目",
        cancel: "取消",
        customSubjectPlaceholder: "輸入科目名稱",
        deleteSubject: "刪除",
        editSubject: "編輯",
        emptyRecentChats: "目前還沒有儲存的作業。",
        selectSubjectFirst: "請先選擇科目。",
        disabledReplyMode: "思考",
        activeHomeworkCount: (count: number) => `${count} 個待完成`,
        menuLabel: "編輯科目",
        recentChatsTitle: "我的作業",
        reorder: "拖曳排序",
        saveSubject: "儲存",
        subjectVisibility: "顯示科目",
      };
    default:
      return {
        addCustomSubject: "Ajouter une matière",
        cancel: "Annuler",
        customSubjectPlaceholder: "Écrire le nom de la matière",
        deleteSubject: "Supprimer",
        editSubject: "Modifier",
        emptyRecentChats: "Aucun devoir enregistré.",
        selectSubjectFirst: "Choisis d'abord une matière.",
        disabledReplyMode: "Réflexion",
        activeHomeworkCount: (count: number) =>
          `${count} à terminer`,
        menuLabel: "Modifier les matières",
        recentChatsTitle: "Mes devoirs",
        reorder: "Glisser pour réordonner",
        saveSubject: "Enregistrer",
        subjectVisibility: "Matières visibles",
      };
  }
}

function formatSubjectDisplay(subject: string) {
  const trimmed = subject.trim();
  if (!trimmed) {
    return subject;
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function normalizeSubjectValue(value: string) {
  return value.trim().toLowerCase();
}

function isActiveHomework(conversation: ListConversationSummary) {
  return conversation.status === "active";
}

function readSubjectHomeworkStatus(
  conversations: ListConversationSummary[],
  subjectTag: string,
) {
  const subjectConversations = conversations.filter(
    (conversation) =>
      normalizeSubjectValue(conversation.subject_tag) ===
      normalizeSubjectValue(subjectTag),
  );
  const activeCount = subjectConversations.filter(isActiveHomework).length;
  const completedCount = subjectConversations.filter(
    (conversation) => conversation.status === "completed",
  ).length;

  if (activeCount > 0) {
    return {
      activeCount,
      status: "active" as const,
    };
  }

  if (completedCount > 0) {
    return {
      activeCount: 0,
      status: "complete" as const,
    };
  }

  return {
    activeCount: 0,
    status: "empty" as const,
  };
}

function getSubjectShortcutClassName(input: {
  isSelected: boolean;
  status: "active" | "complete" | "empty";
}) {
  const statusClassName =
    input.status === "active"
      ? "student-subject-chip--active"
      : input.status === "complete"
        ? "student-subject-chip--complete"
        : "border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]";

  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm transition ${statusClassName} ${
    input.isSelected ? "ring-2 ring-[color:var(--foreground)]/35" : ""
  }`;
}

function getHomeworkStatusPillClassName(status: ListConversationSummary["status"]) {
  if (status === "active") {
    return "student-homework-status-pill student-homework-status-pill--active";
  }

  if (status === "completed") {
    return "student-homework-status-pill student-homework-status-pill--complete";
  }

  return "student-homework-status-pill";
}

function readStoredShortcutPreferences(): SubjectShortcutPreferences {
  if (typeof window === "undefined") {
    return {
      hiddenDefaultSubjects: [],
      customSubjects: [],
      subjectOrder: [],
    };
  }

  const stored = window.localStorage.getItem(SUBJECT_SHORTCUT_PREFS_KEY);
  if (!stored) {
    return {
      hiddenDefaultSubjects: [],
      customSubjects: [],
      subjectOrder: [],
    };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<SubjectShortcutPreferences>;
    return {
      hiddenDefaultSubjects: Array.isArray(parsed.hiddenDefaultSubjects)
        ? parsed.hiddenDefaultSubjects.filter((item) => typeof item === "string")
        : [],
      customSubjects: Array.isArray(parsed.customSubjects)
        ? parsed.customSubjects.filter((item) => typeof item === "string")
        : [],
      subjectOrder: Array.isArray(parsed.subjectOrder)
        ? parsed.subjectOrder.filter((item) => typeof item === "string")
        : [],
    };
  } catch {
    return {
      hiddenDefaultSubjects: [],
      customSubjects: [],
      subjectOrder: [],
    };
  }
}

function sortConversationsByRecentActivity(
  conversations: ListConversationSummary[],
) {
  return [...conversations].sort((left, right) => {
    const leftDate =
      left.last_message_at ?? left.completed_at ?? left.created_at ?? "";
    const rightDate =
      right.last_message_at ?? right.completed_at ?? right.created_at ?? "";

    return rightDate.localeCompare(leftDate);
  });
}

function moveSubjectValue(
  currentOrder: string[],
  visibleSubjects: SubjectShortcut[],
  draggedValue: string,
  targetValue: string,
) {
  if (draggedValue === targetValue) {
    return currentOrder;
  }

  const orderedValues =
    currentOrder.length > 0
      ? [
          ...currentOrder.filter((value) =>
            visibleSubjects.some((subject) => subject.value === value),
          ),
          ...visibleSubjects
            .map((subject) => subject.value)
            .filter((value) => !currentOrder.includes(value)),
        ]
      : visibleSubjects.map((subject) => subject.value);
  const withoutDragged = orderedValues.filter((value) => value !== draggedValue);
  const targetIndex = withoutDragged.indexOf(targetValue);

  if (targetIndex === -1) {
    return orderedValues;
  }

  withoutDragged.splice(targetIndex, 0, draggedValue);
  return withoutDragged;
}

function renderRecentConversationRows(input: {
  conversations: ListConversationSummary[];
  languageCode: UiLanguageCode;
}) {
  return (
    <div className="divide-y divide-[color:var(--line)]">
      {input.conversations.map((conversation) => (
        <Link
          className="grid grid-cols-[minmax(0,1fr)_minmax(13rem,auto)] items-center gap-4 py-4 transition hover:bg-[color:var(--surface-strong)]"
          href={`/app/conversations/${conversation.id}?subject=${encodeURIComponent(conversation.subject_tag)}`}
          key={conversation.id}
        >
          <div className="min-w-0">
            <h3 className="flex min-w-0 items-center gap-2 font-[family-name:var(--font-heading)] text-xl leading-tight">
              <span className={getHomeworkStatusPillClassName(conversation.status)}>
                {getConversationStatusLabel(
                  conversation.status,
                  input.languageCode,
                )}
              </span>
              <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {conversation.title}
              </span>
            </h3>
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-3 text-sm text-[color:var(--ink-soft)]">
            <span className="min-w-0 truncate text-right">
              {formatSubjectDisplay(conversation.subject_tag)}
            </span>
            <span className="w-[6.5rem] shrink-0 text-right">
              {formatDateLabel(
                conversation.last_message_at ??
                  conversation.completed_at ??
                  conversation.created_at,
                input.languageCode,
              ) ?? ""}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function readSubjectResources(
  subjectResourcesBySubject: Record<string, SubjectResourceLibraryItem[]>,
  subjectTag: string,
) {
  const normalizedSubjectTag = normalizeSubjectValue(subjectTag);

  return (
    Object.entries(subjectResourcesBySubject).find(
      ([key]) => normalizeSubjectValue(key) === normalizedSubjectTag,
    )?.[1] ?? []
  );
}

function writeHomeworkSubjectUrl(subjectTag: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("view", "homework");

  if (subjectTag?.trim()) {
    url.searchParams.set("subject", subjectTag.trim());
  } else {
    url.searchParams.delete("subject");
  }

  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}?${url.searchParams.toString()}${url.hash}`,
  );
}

function renderDisabledComposer(input: {
  placeholder: string;
  replyModeLabel: string;
}) {
  return (
    <form
      className="grid gap-2 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-2 opacity-70"
    >
      <textarea
        className="student-chat-textarea min-h-6 resize-none appearance-none border-0 bg-transparent px-1 py-0 text-sm leading-5 placeholder:text-[color:var(--ink-soft)]"
        disabled
        placeholder={input.placeholder}
      />

      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full text-[color:var(--ink-soft)]"
            disabled
            type="button"
          >
            +
          </button>
          <button
            className="inline-flex h-8 items-center justify-center rounded-full px-2 text-sm text-[color:var(--ink-soft)]"
            disabled
            type="button"
          >
            {input.replyModeLabel}
          </button>
          <button
            className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full text-[color:var(--ink-soft)]"
            disabled
            type="button"
          >
            ⌕
          </button>
        </div>

        <button
          className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center text-[color:var(--ink-soft)]"
          disabled
          type="submit"
        >
          ↗
        </button>
      </div>
    </form>
  );
}

export function StudentFirstHomeworkLauncher({
  initialDraft = null,
  initialSelectedSubject = null,
  title,
  knownSubjects = [],
  conversations = [],
  subjectResourcesBySubject = {},
  subjectResourceUploadDisabledReason = null,
  languageCode,
}: StudentFirstHomeworkLauncherProps) {
  const copy = getFirstHomeworkCopy(languageCode);
  const [selectedSubject, setSelectedSubject] = useState<SubjectShortcut | null>(
    null,
  );
  const syncedUrlSubjectRef = useRef<string | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [draggedSubjectValue, setDraggedSubjectValue] = useState<string | null>(
    null,
  );
  const [customSubjectDraft, setCustomSubjectDraft] = useState("");
  const [editingCustomSubject, setEditingCustomSubject] = useState<string | null>(
    null,
  );
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const [hiddenDefaultSubjects, setHiddenDefaultSubjects] = useState<string[]>(
    [],
  );
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [subjectOrder, setSubjectOrder] = useState<string[]>([]);
  const [resourcesBySubject, setResourcesBySubject] = useState(
    subjectResourcesBySubject,
  );
  const subjectOptions = useMemo<SubjectShortcut[]>(() => {
    const baseOptions = getIntakeSubjectOptions(languageCode);
    const standardOptions = baseOptions.filter((option) => option.value !== "autre");
    const knownOptions = knownSubjects
      .map((subject) => subject.trim())
      .filter(Boolean)
      .filter(
        (subject, index, collection) =>
          collection.findIndex((value) => value.toLowerCase() === subject.toLowerCase()) === index,
      )
      .filter(
        (subject) =>
          !standardOptions.some(
            (option) => option.value.toLowerCase() === subject.toLowerCase(),
          ),
      )
      .map((subject) => ({
        value: subject,
        label: formatSubjectDisplay(subject),
        kind: "known" as const,
      }));
    const customOptions = customSubjects
      .map((subject) => subject.trim())
      .filter(Boolean)
      .filter(
        (subject, index, collection) =>
          collection.findIndex(
            (value) => normalizeSubjectValue(value) === normalizeSubjectValue(subject),
          ) === index,
      )
      .filter(
        (subject) =>
          !standardOptions.some(
            (option) =>
              normalizeSubjectValue(option.value) === normalizeSubjectValue(subject),
          ) &&
          !knownOptions.some(
            (option) =>
              normalizeSubjectValue(option.value) === normalizeSubjectValue(subject),
          ),
      )
      .map((subject) => ({
        value: subject,
        label: formatSubjectDisplay(subject),
        kind: "custom" as const,
      }));
    const defaultOptions = standardOptions.map((option) => ({
      ...option,
      kind: "default" as const,
    }));

    const mergedOptions = [...defaultOptions, ...knownOptions, ...customOptions]
      .filter(
        (option) =>
          option.kind !== "default" ||
          !hiddenDefaultSubjects.includes(option.value),
      )
      .filter(
        (option, index, collection) =>
          collection.findIndex(
            (item) =>
              normalizeSubjectValue(item.value) === normalizeSubjectValue(option.value),
          ) === index,
      );

    if (subjectOrder.length === 0) {
      return mergedOptions;
    }

    return [...mergedOptions].sort((left, right) => {
      const leftIndex = subjectOrder.indexOf(left.value);
      const rightIndex = subjectOrder.indexOf(right.value);

      if (leftIndex === -1 && rightIndex === -1) {
        return 0;
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    });
  }, [
    customSubjects,
    hiddenDefaultSubjects,
    knownSubjects,
    languageCode,
    subjectOrder,
  ]);
  const allDefaultOptions = useMemo(
    () =>
      getIntakeSubjectOptions(languageCode)
        .filter((option) => option.value !== "autre")
        .map((option) => ({
          ...option,
          kind: "default" as const,
        })),
    [languageCode],
  );
  const recentConversations = useMemo(
    () => sortConversationsByRecentActivity(conversations),
    [conversations],
  );
  const activeHomeworkCount = useMemo(
    () => recentConversations.filter(isActiveHomework).length,
    [recentConversations],
  );
  const selectedSubjectConversations = useMemo(() => {
    if (!selectedSubject) {
      return recentConversations;
    }

    return recentConversations.filter(
      (conversation) =>
        normalizeSubjectValue(conversation.subject_tag) ===
        normalizeSubjectValue(selectedSubject.value),
    );
  }, [recentConversations, selectedSubject]);
  const selectedSubjectResources = selectedSubject
    ? readSubjectResources(resourcesBySubject, selectedSubject.value)
    : [];
  const selectedSubjectTitle = selectedSubject?.label ?? title;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setResourcesBySubject(subjectResourcesBySubject);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [subjectResourcesBySubject]);

  useEffect(() => {
    const normalizedInitialSubject = initialSelectedSubject?.trim()
      ? normalizeSubjectValue(initialSelectedSubject)
      : null;

    if (syncedUrlSubjectRef.current === normalizedInitialSubject) {
      return;
    }

    if (!normalizedInitialSubject) {
      const timeoutId = window.setTimeout(() => {
        setSelectedSubject(null);
        syncedUrlSubjectRef.current = null;
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const matchingOption = subjectOptions.find(
      (option) =>
        normalizeSubjectValue(option.value) === normalizedInitialSubject,
    );

    if (!matchingOption) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSelectedSubject(matchingOption);
      syncedUrlSubjectRef.current = normalizedInitialSubject;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialSelectedSubject, subjectOptions]);

  useEffect(() => {
    function handleHomeworkSubjectSelected(event: Event) {
      const subjectTag =
        event instanceof CustomEvent &&
        typeof event.detail?.subjectTag === "string"
          ? event.detail.subjectTag
          : null;
      const normalizedSubjectTag = subjectTag
        ? normalizeSubjectValue(subjectTag)
        : null;

      if (!normalizedSubjectTag) {
        setSelectedSubject(null);
        syncedUrlSubjectRef.current = null;
        return;
      }

      const matchingOption = subjectOptions.find(
        (option) => normalizeSubjectValue(option.value) === normalizedSubjectTag,
      );

      if (!matchingOption) {
        return;
      }

      setSelectedSubject(matchingOption);
      syncedUrlSubjectRef.current = normalizedSubjectTag;
    }

    window.addEventListener(
      HOMEWORK_SUBJECT_SELECTED_EVENT,
      handleHomeworkSubjectSelected,
    );
    return () =>
      window.removeEventListener(
        HOMEWORK_SUBJECT_SELECTED_EVENT,
        handleHomeworkSubjectSelected,
      );
  }, [subjectOptions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const preferences = readStoredShortcutPreferences();
      setHiddenDefaultSubjects(preferences.hiddenDefaultSubjects);
      setCustomSubjects(preferences.customSubjects);
      setSubjectOrder(preferences.subjectOrder);
      setPreferencesHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!preferencesHydrated) {
      return;
    }

    window.localStorage.setItem(
      SUBJECT_SHORTCUT_PREFS_KEY,
      JSON.stringify({
        hiddenDefaultSubjects,
        customSubjects,
        subjectOrder,
      }),
    );
  }, [
    customSubjects,
    hiddenDefaultSubjects,
    preferencesHydrated,
    subjectOrder,
  ]);

  useEffect(() => {
    if (
      selectedSubject &&
      !subjectOptions.some(
        (option) =>
          normalizeSubjectValue(option.value) ===
          normalizeSubjectValue(selectedSubject.value),
      )
    ) {
      const timeoutId = window.setTimeout(() => {
        setSelectedSubject(null);
        writeHomeworkSubjectUrl(null);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [selectedSubject, subjectOptions]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!selectedSubject) {
      return;
    }

    const normalizedSubjectTag = normalizeSubjectValue(selectedSubject.value);
    const hasResourcesForSubject = Object.keys(resourcesBySubject).some(
      (subjectTag) => normalizeSubjectValue(subjectTag) === normalizedSubjectTag,
    );

    if (hasResourcesForSubject) {
      return;
    }

    const controller = new AbortController();
    const subjectTag = selectedSubject.value;

    async function loadSelectedSubjectResources() {
      try {
        const response = await fetch(
          `/api/subject-resources?subjectTag=${encodeURIComponent(subjectTag)}`,
          {
            signal: controller.signal,
          },
        );
        const payload = (await response
          .json()
          .catch(() => null)) as SubjectResourceListResponse | null;

        if (!response.ok || !payload?.ok) {
          return;
        }

        setResourcesBySubject((current) => ({
          ...current,
          [subjectTag]: payload.data.resources,
        }));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    void loadSelectedSubjectResources();

    return () => controller.abort();
  }, [resourcesBySubject, selectedSubject]);

  function saveCustomSubject() {
    const trimmed = customSubjectDraft.trim();
    if (!trimmed) {
      return;
    }

    setCustomSubjects((current) => {
      const withoutEditing = editingCustomSubject
        ? current.filter((subject) => subject !== editingCustomSubject)
        : current;

      if (
        withoutEditing.some(
          (subject) => normalizeSubjectValue(subject) === normalizeSubjectValue(trimmed),
        )
      ) {
        return withoutEditing;
      }

      return [...withoutEditing, trimmed];
    });

    setSubjectOrder((current) => {
      const nextOrder = editingCustomSubject
        ? current.map((value) => (value === editingCustomSubject ? trimmed : value))
        : [...current, trimmed];
      return Array.from(new Set(nextOrder));
    });
    setEditingCustomSubject(null);
    setCustomSubjectDraft("");
  }

  return (
    <div
      className="grid gap-4"
      data-homework-state={knownSubjects.length === 0 ? "first" : "returning"}
    >
      {selectedSubjectTitle ? (
        <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
          {selectedSubjectTitle}
        </h1>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {subjectOptions.map((option) => {
          const isSelected =
            selectedSubject?.value &&
            normalizeSubjectValue(selectedSubject.value) ===
              normalizeSubjectValue(option.value);
          const homeworkStatus = readSubjectHomeworkStatus(
            conversations,
            option.value,
          );

          return (
            <button
              aria-pressed={Boolean(isSelected)}
              className={getSubjectShortcutClassName({
                isSelected: Boolean(isSelected),
                status: homeworkStatus.status,
              })}
              draggable={reorderEnabled}
              key={option.value}
              onDragEnd={() => setDraggedSubjectValue(null)}
              onDragOver={(event) => {
                if (!reorderEnabled || !draggedSubjectValue) {
                  return;
                }

                event.preventDefault();
              }}
              onDragStart={(event) => {
                if (!reorderEnabled) {
                  event.preventDefault();
                  return;
                }

                setDraggedSubjectValue(option.value);
              }}
              onDrop={(event) => {
                if (!reorderEnabled || !draggedSubjectValue) {
                  return;
                }

                event.preventDefault();
                setSubjectOrder((current) =>
                  moveSubjectValue(
                    current,
                    subjectOptions,
                    draggedSubjectValue,
                    option.value,
                  ),
                );
                setDraggedSubjectValue(null);
              }}
              onClick={(event) => {
                if (reorderEnabled) {
                  event.preventDefault();
                  return;
                }

                setSelectedSubject(option);
                syncedUrlSubjectRef.current = normalizeSubjectValue(option.value);
                writeHomeworkSubjectUrl(option.value);
              }}
              title={reorderEnabled ? copy.reorder : undefined}
              type="button"
            >
              <span>{option.label}</span>
              {homeworkStatus.activeCount > 0 ? (
                <span className="student-subject-chip__badge inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.7rem] font-bold leading-none">
                  {homeworkStatus.activeCount}
                </span>
              ) : null}
            </button>
          );
        })}

        <div className="relative" ref={menuRef}>
          <button
            aria-expanded={menuOpen}
            aria-label={copy.menuLabel}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 text-lg font-semibold leading-none text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            onClick={() => setMenuOpen((current) => !current)}
            title={copy.menuLabel}
            type="button"
          >
            ⋮
          </button>

          {menuOpen ? (
            <div className="absolute left-0 z-30 mt-2 grid w-[min(22rem,calc(100vw-3rem))] gap-4 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4 shadow-[var(--shadow)]">
              <button
                aria-pressed={reorderEnabled}
                className={`inline-flex min-h-10 items-center justify-center rounded-full border px-3 text-sm font-medium transition ${
                  reorderEnabled
                    ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-[color:var(--background)]"
                    : "border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                }`}
                onClick={() => setReorderEnabled((current) => !current)}
                type="button"
              >
                {copy.reorder}
              </button>

              <div className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
                  {copy.subjectVisibility}
                </p>
                {allDefaultOptions.map((option) => (
                  <label
                    className="flex items-center justify-between gap-3 text-sm"
                    key={option.value}
                  >
                    <span>{option.label}</span>
                    <input
                      checked={!hiddenDefaultSubjects.includes(option.value)}
                      className="h-5 w-5 accent-[color:var(--accent)]"
                      onChange={(event) => {
                        setHiddenDefaultSubjects((current) =>
                          event.target.checked
                            ? current.filter((value) => value !== option.value)
                            : [...current, option.value],
                        );
                      }}
                      type="checkbox"
                    />
                  </label>
                ))}
              </div>

              <div className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
                  {copy.addCustomSubject}
                </p>
                <div className="flex gap-2">
                  <input
                    className="min-h-10 min-w-0 flex-1 rounded-[0.9rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 text-sm text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--accent)]"
                    onChange={(event) => setCustomSubjectDraft(event.target.value)}
                    placeholder={copy.customSubjectPlaceholder}
                    value={customSubjectDraft}
                  />
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-[color:var(--foreground)] px-3 text-sm font-medium text-[color:var(--background)]"
                    onClick={saveCustomSubject}
                    type="button"
                  >
                    {copy.saveSubject}
                  </button>
                  {editingCustomSubject ? (
                    <button
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:var(--line)] px-3 text-sm text-[color:var(--foreground)]"
                      onClick={() => {
                        setEditingCustomSubject(null);
                        setCustomSubjectDraft("");
                      }}
                      type="button"
                    >
                      {copy.cancel}
                    </button>
                  ) : null}
                </div>

                {customSubjects.length > 0 ? (
                  <div className="grid gap-1">
                    {customSubjects.map((subject) => (
                      <div
                        className="flex items-center justify-between gap-2 rounded-[0.9rem] bg-[color:var(--surface-strong)] px-3 py-2 text-sm"
                        key={subject}
                      >
                        <span className="truncate">{formatSubjectDisplay(subject)}</span>
                        <span className="flex shrink-0 gap-1">
                          <button
                            className="rounded-full px-2 py-1 text-xs text-[color:var(--ink-soft)] transition hover:text-[color:var(--foreground)]"
                            onClick={() => {
                              setEditingCustomSubject(subject);
                              setCustomSubjectDraft(subject);
                            }}
                            type="button"
                          >
                            {copy.editSubject}
                          </button>
                          <button
                            className="rounded-full px-2 py-1 text-xs text-[#b34f32] transition hover:text-[#cb5d3c]"
                            onClick={() => {
                              setCustomSubjects((current) =>
                                current.filter((value) => value !== subject),
                              );
                              setSubjectOrder((current) =>
                                current.filter((value) => value !== subject),
                              );
                            }}
                            type="button"
                          >
                            {copy.deleteSubject}
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {selectedSubject ? (
        <StudentSubjectQuickStart
          conversations={selectedSubjectConversations}
          existingConversationCount={selectedSubjectConversations.length}
          initialDraft={initialDraft}
          initialSubjectResources={selectedSubjectResources}
          languageCode={languageCode}
          subjectResourceUploadDisabledReason={
            subjectResourceUploadDisabledReason
          }
          subjectTag={selectedSubject.value}
        />
      ) : (
        <>
          {renderDisabledComposer({
            placeholder: copy.selectSubjectFirst,
            replyModeLabel: copy.disabledReplyMode,
          })}

          <section className="grid gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                {copy.recentChatsTitle}
              </h2>
              {activeHomeworkCount > 0 ? (
                <span className="student-homework-active-label rounded-full px-2.5 py-1 text-xs font-semibold">
                  {copy.activeHomeworkCount(activeHomeworkCount)}
                </span>
              ) : null}
            </div>
            {recentConversations.length > 0 ? (
              renderRecentConversationRows({
                conversations: recentConversations,
                languageCode,
              })
            ) : (
              <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
                {copy.emptyRecentChats}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
