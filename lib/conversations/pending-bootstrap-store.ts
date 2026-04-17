"use client";

import type { StudentReplyMode } from "@/lib/server/conversations/types";

export type PendingConversationBootstrap = {
  promptText: string;
  stagedFiles: File[];
  replyMode: StudentReplyMode;
  subjectTag: string;
  createdAt: number;
};

type SerializablePendingConversationBootstrap = Omit<
  PendingConversationBootstrap,
  "stagedFiles"
> & {
  stagedFileCount: number;
};

const pendingConversationBootstraps = new Map<
  string,
  PendingConversationBootstrap
>();
const SESSION_STORAGE_KEY_PREFIX = "student-pending-bootstrap:";
const MAX_BOOTSTRAP_AGE_MS = 10 * 60 * 1000;

function isClientRuntime() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function getSessionStorageKey(conversationId: string) {
  return `${SESSION_STORAGE_KEY_PREFIX}${conversationId}`;
}

function writeSerializableBootstrap(
  conversationId: string,
  bootstrap: PendingConversationBootstrap,
) {
  if (!isClientRuntime()) {
    return;
  }

  const serializableBootstrap: SerializablePendingConversationBootstrap = {
    promptText: bootstrap.promptText,
    replyMode: bootstrap.replyMode,
    subjectTag: bootstrap.subjectTag,
    createdAt: bootstrap.createdAt,
    stagedFileCount: bootstrap.stagedFiles.length,
  };

  window.sessionStorage.setItem(
    getSessionStorageKey(conversationId),
    JSON.stringify(serializableBootstrap),
  );
}

function readSerializableBootstrap(conversationId: string) {
  if (!isClientRuntime()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(getSessionStorageKey(conversationId));
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SerializablePendingConversationBootstrap>;
    if (
      typeof parsed.promptText !== "string" ||
      typeof parsed.replyMode !== "string" ||
      typeof parsed.subjectTag !== "string" ||
      typeof parsed.createdAt !== "number"
    ) {
      window.sessionStorage.removeItem(getSessionStorageKey(conversationId));
      return null;
    }

    if (Date.now() - parsed.createdAt > MAX_BOOTSTRAP_AGE_MS) {
      window.sessionStorage.removeItem(getSessionStorageKey(conversationId));
      return null;
    }

    return {
      promptText: parsed.promptText,
      stagedFiles: [],
      replyMode: parsed.replyMode as StudentReplyMode,
      subjectTag: parsed.subjectTag,
      createdAt: parsed.createdAt,
      stagedFileCount:
        typeof parsed.stagedFileCount === "number" ? parsed.stagedFileCount : 0,
    };
  } catch {
    window.sessionStorage.removeItem(getSessionStorageKey(conversationId));
    return null;
  }
}

function clearSerializableBootstrap(conversationId: string) {
  if (!isClientRuntime()) {
    return;
  }

  window.sessionStorage.removeItem(getSessionStorageKey(conversationId));
}

export function setPendingConversationBootstrap(
  conversationId: string,
  bootstrap: PendingConversationBootstrap,
) {
  pendingConversationBootstraps.set(conversationId, bootstrap);
  writeSerializableBootstrap(conversationId, bootstrap);
}

export function takePendingConversationBootstrap(conversationId: string) {
  const bootstrap = pendingConversationBootstraps.get(conversationId) ?? null;

  if (bootstrap) {
    pendingConversationBootstraps.delete(conversationId);
    clearSerializableBootstrap(conversationId);
    return bootstrap;
  }

  const serializableBootstrap = readSerializableBootstrap(conversationId);
  if (serializableBootstrap) {
    clearSerializableBootstrap(conversationId);
    return {
      promptText: serializableBootstrap.promptText,
      stagedFiles: [],
      replyMode: serializableBootstrap.replyMode,
      subjectTag: serializableBootstrap.subjectTag,
      createdAt: serializableBootstrap.createdAt,
    };
  }

  return null;
}

export function clearPendingConversationBootstrap(conversationId: string) {
  pendingConversationBootstraps.delete(conversationId);
  clearSerializableBootstrap(conversationId);
}
