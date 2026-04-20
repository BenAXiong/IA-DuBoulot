"use client";

const CONVERSATION_TITLE_UPDATED_EVENT = "student-conversation-title-updated";
const SESSION_STORAGE_KEY_PREFIX = "student-conversation-title:";

export type ConversationTitleUpdatedDetail = {
  conversationId: string;
  title: string;
  subjectTag: string | null;
};

function isClientRuntime() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function getSessionStorageKey(conversationId: string) {
  return `${SESSION_STORAGE_KEY_PREFIX}${conversationId}`;
}

function persistConversationTitle(detail: ConversationTitleUpdatedDetail) {
  if (!isClientRuntime()) {
    return;
  }

  window.sessionStorage.setItem(
    getSessionStorageKey(detail.conversationId),
    JSON.stringify(detail),
  );
}

export function dispatchConversationTitleUpdated(
  detail: ConversationTitleUpdatedDetail,
) {
  if (typeof window === "undefined") {
    return;
  }

  persistConversationTitle(detail);
  window.dispatchEvent(
    new CustomEvent<ConversationTitleUpdatedDetail>(
      CONVERSATION_TITLE_UPDATED_EVENT,
      { detail },
    ),
  );
}

export function readStoredConversationTitle(
  conversationId: string,
): ConversationTitleUpdatedDetail | null {
  if (!isClientRuntime()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(getSessionStorageKey(conversationId));
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ConversationTitleUpdatedDetail>;
    if (
      parsed.conversationId !== conversationId ||
      typeof parsed.title !== "string"
    ) {
      return null;
    }

    return {
      conversationId,
      title: parsed.title,
      subjectTag:
        typeof parsed.subjectTag === "string" ? parsed.subjectTag : null,
    };
  } catch {
    return null;
  }
}

export function addConversationTitleUpdatedListener(
  handler: (detail: ConversationTitleUpdatedDetail) => void,
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ConversationTitleUpdatedDetail>;
    if (!customEvent.detail) {
      return;
    }

    handler(customEvent.detail);
  };

  window.addEventListener(CONVERSATION_TITLE_UPDATED_EVENT, listener);

  return () => {
    window.removeEventListener(CONVERSATION_TITLE_UPDATED_EVENT, listener);
  };
}
