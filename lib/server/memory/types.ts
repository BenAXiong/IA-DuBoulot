import "server-only";

import type { AppUserRole } from "@/lib/server/auth/types";

export const MEMORY_CATEGORIES = [
  "strength",
  "weakness",
  "preference",
  "topic",
  "learning_note",
] as const;

export const MANUAL_MEMORY_CATEGORIES = [
  "strength",
  "weakness",
  "preference",
  "topic",
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];
export type ManualMemoryCategory = (typeof MANUAL_MEMORY_CATEGORIES)[number];

export type StudentMemoryProfileRecord = {
  studentUserId: string;
  strengthsSummary: string | null;
  weaknessesSummary: string | null;
  preferencesSummary: string | null;
  lastReviewedAt: string | null;
  updatedAt: string | null;
};

export type StudentMemoryItemRecord = {
  id: string;
  studentUserId: string;
  sourceConversationId: string | null;
  category: MemoryCategory;
  title: string;
  detail: string | null;
  confidence: number | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentMemorySnapshot = {
  studentUserId: string;
  viewerRole: AppUserRole;
  canEdit: boolean;
  profile: StudentMemoryProfileRecord;
  items: StudentMemoryItemRecord[];
  itemsByCategory: Record<MemoryCategory, StudentMemoryItemRecord[]>;
};

export type UpsertStudentMemoryItemInput = {
  itemId?: string;
  category: ManualMemoryCategory;
  title: string;
  detail: string | null;
};

export type StudentMemoryMutation =
  | ({
      action: "upsert";
    } & UpsertStudentMemoryItemInput)
  | {
      action: "delete";
      itemId: string;
    };

export type StudentMemoryMutationResult = {
  snapshot: StudentMemorySnapshot;
  changedItemId: string | null;
  action: StudentMemoryMutation["action"];
};
