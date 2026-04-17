"use client";

const CONVERSATION_TITLE_UPDATED_EVENT = "student-conversation-title-updated";

export type ConversationTitleUpdatedDetail = {
  conversationId: string;
  title: string;
  subjectTag: string | null;
};

export function dispatchConversationTitleUpdated(
  detail: ConversationTitleUpdatedDetail,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ConversationTitleUpdatedDetail>(
      CONVERSATION_TITLE_UPDATED_EVENT,
      { detail },
    ),
  );
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
