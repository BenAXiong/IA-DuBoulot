"use client";

import type { StudentReplyMode } from "@/lib/server/conversations/types";

export type PendingConversationBootstrap = {
  promptText: string;
  stagedFiles: File[];
  replyMode: StudentReplyMode;
  subjectTag: string;
  createdAt: number;
};

const pendingConversationBootstraps = new Map<
  string,
  PendingConversationBootstrap
>();

export function setPendingConversationBootstrap(
  conversationId: string,
  bootstrap: PendingConversationBootstrap,
) {
  pendingConversationBootstraps.set(conversationId, bootstrap);
}

export function takePendingConversationBootstrap(conversationId: string) {
  const bootstrap = pendingConversationBootstraps.get(conversationId) ?? null;

  if (bootstrap) {
    pendingConversationBootstraps.delete(conversationId);
  }

  return bootstrap;
}

export function clearPendingConversationBootstrap(conversationId: string) {
  pendingConversationBootstraps.delete(conversationId);
}
