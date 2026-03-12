import "server-only";

import {
  getMemoryFallbackGeneratedCopy,
  getMemoryServerCopy,
} from "@/lib/i18n/dashboard-copy";
import {
  requireActiveAppUser,
  requireAppUserContext,
} from "@/lib/server/auth/authorization";
import type {
  AppUserRecord,
  AuthenticatedUserContext,
  UiLanguageCode,
} from "@/lib/server/auth/types";
import type {
  ConversationAttachmentRecord,
  MemoryGenerationItem,
} from "@/lib/server/ai/types";
import { getAiProvider } from "@/lib/server/ai/provider";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import {
  logRuntimeInfo,
} from "@/lib/server/audit/runtime-logger";
import type {
  ConversationMessageRecord,
  ConversationRecord,
  SessionSummaryRecord,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";
import { AppError } from "@/lib/server/errors/app-error";
import {
  requireViewerCanAccessStudent,
} from "@/lib/server/oversight/access";
import { recordStudentAiUsageBestEffort } from "@/lib/server/usage/service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ManualMemoryCategory,
  MemoryCategory,
  StudentMemoryItemRecord,
  StudentMemoryMutation,
  StudentMemoryMutationResult,
  StudentMemoryProfileRecord,
  StudentMemorySnapshot,
  UpsertStudentMemoryItemInput,
} from "@/lib/server/memory/types";
import { MEMORY_CATEGORIES } from "@/lib/server/memory/types";

const MEMORY_RETENTION_DAYS = 180;
const MAX_MEMORY_ITEMS_PER_STUDENT = 24;

type MemoryServerCopy = ReturnType<typeof getMemoryServerCopy>;

const SENSITIVE_MEMORY_PATTERNS = [
  /\badhd\b/i,
  /\bautis/i,
  /\bdyslex/i,
  /\bdysprax/i,
  /\banxi/i,
  /\bdepress/i,
  /\btrauma/i,
  /\btherapy\b/i,
  /\btherapie\b/i,
  /\bmental\b/i,
  /\bhealth\b/i,
  /\bsante\b/i,
  /\bdiagnos/i,
  /\bmedicat/i,
  /\biq\b/i,
  /\bqi\b/i,
  /\brelig/i,
  /\bmuslim/i,
  /\bchrist/i,
  /\bjew/i,
  /\bsexual/i,
  /\bgender/i,
  /\brace\b/i,
  /\bethnic/i,
  /\bnationalit/i,
  /\bpolitic/i,
  /\bvote\b/i,
  /\bdivorc/i,
  /\bfamily\b/i,
  /\bparents?\b/i,
  /\bhome address\b/i,
  /\baddress\b/i,
  /\blocation\b/i,
  /\bfinancial\b/i,
  /\bincome\b/i,
  /\brich\b/i,
  /\bpoor\b/i,
  /\blazy\b/i,
  /\bparesse/i,
  /\bstupid\b/i,
  /\bgenius\b/i,
  /\bgifted\b/i,
  /\baggress/i,
  /\bviolent\b/i,
  /\bhyperactive\b/i,
  /\btroublemaker\b/i,
];

type MemoryProfileRow = {
  student_user_id: string;
  strengths_summary: string | null;
  weaknesses_summary: string | null;
  preferences_summary: string | null;
  last_reviewed_at: string | null;
  updated_at: string | null;
};

type MemoryItemRow = {
  id: string;
  student_user_id: string;
  source_conversation_id: string | null;
  category: MemoryCategory;
  title: string;
  detail: string | null;
  confidence: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type LoadMemorySnapshotInput = {
  viewer: AppUserRecord;
  studentUserId: string;
  auditContext?: {
    action: string;
    route: string;
    requestId: string;
  };
};

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
}

function rawMemoryNotFound(languageCode: UiLanguageCode = "fr") {
  const copy = getMemoryServerCopy(languageCode);
  return new AppError({
    code: "not_found",
    message: copy.notFound,
    status: 404,
  });
}

function emptyProfile(studentUserId: string): StudentMemoryProfileRecord {
  return {
    studentUserId,
    strengthsSummary: null,
    weaknessesSummary: null,
    preferencesSummary: null,
    lastReviewedAt: null,
    updatedAt: null,
  };
}

function toProfileRecord(
  studentUserId: string,
  row: MemoryProfileRow | null,
): StudentMemoryProfileRecord {
  if (!row) {
    return emptyProfile(studentUserId);
  }

  return {
    studentUserId: row.student_user_id,
    strengthsSummary: row.strengths_summary,
    weaknessesSummary: row.weaknesses_summary,
    preferencesSummary: row.preferences_summary,
    lastReviewedAt: row.last_reviewed_at,
    updatedAt: row.updated_at,
  };
}

function toItemRecord(row: MemoryItemRow): StudentMemoryItemRecord {
  return {
    id: row.id,
    studentUserId: row.student_user_id,
    sourceConversationId: row.source_conversation_id,
    category: row.category,
    title: row.title,
    detail: row.detail,
    confidence: row.confidence,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function addDaysIso(value: string, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function isExpired(expiresAt: string | null) {
  return Boolean(expiresAt && expiresAt <= new Date().toISOString());
}

function createEmptyCategoryMap() {
  return {
    strength: [] as StudentMemoryItemRecord[],
    weakness: [] as StudentMemoryItemRecord[],
    preference: [] as StudentMemoryItemRecord[],
    topic: [] as StudentMemoryItemRecord[],
    learning_note: [] as StudentMemoryItemRecord[],
  };
}

function sortItems(left: StudentMemoryItemRecord, right: StudentMemoryItemRecord) {
  const confidenceGap = (right.confidence ?? -1) - (left.confidence ?? -1);

  if (confidenceGap !== 0) {
    return confidenceGap;
  }

  return right.updatedAt.localeCompare(left.updatedAt);
}

function buildItemsByCategory(items: StudentMemoryItemRecord[]) {
  const grouped = createEmptyCategoryMap();

  for (const item of items) {
    grouped[item.category].push(item);
  }

  for (const category of MEMORY_CATEGORIES) {
    grouped[category].sort(sortItems);
  }

  return grouped;
}

function buildCategorySummary(items: StudentMemoryItemRecord[]) {
  if (items.length === 0) {
    return null;
  }

  return items
    .slice(0, 3)
    .map((item) => {
      const detail = normalizeText(item.detail);
      return detail ? `${item.title}: ${detail}` : item.title;
    })
    .join(" | ");
}

function containsSensitiveMemoryText(value: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return false;
  }

  return SENSITIVE_MEMORY_PATTERNS.some((pattern) => pattern.test(normalized));
}

function toTitleFromWeaknessTag(tag: string) {
  return tag
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildFallbackGeneratedItems(input: {
  appUser: AppUserRecord;
  conversation: ConversationRecord;
  summaries: SessionSummaryRecord[];
}): MemoryGenerationItem[] {
  const copy = getMemoryFallbackGeneratedCopy(input.appUser.ai_help_language);
  const nextItems: MemoryGenerationItem[] = [];
  const subjectTitle = normalizeText(input.conversation.subject_tag);

  if (subjectTitle) {
    nextItems.push({
      category: "topic",
      title: subjectTitle,
      detail: copy.topicDetail,
      confidence: 0.62,
    });
  }

  const weaknessTags = input.summaries.flatMap((summary) => summary.weakness_tags);

  for (const tag of weaknessTags.slice(0, 2)) {
    nextItems.push({
      category: "weakness",
      title: toTitleFromWeaknessTag(tag),
      detail: copy.weaknessDetail,
      confidence: 0.58,
    });
  }

  nextItems.push({
    category: "preference",
    title: copy.preferenceTitle,
    detail: copy.preferenceDetail,
    confidence: 0.73,
  });

  return nextItems;
}

function sanitizeCandidateItem(
  item: MemoryGenerationItem,
): MemoryGenerationItem | null {
  const title = normalizeText(item.title);
  const detail = normalizeText(item.detail);

  if (!title || title.length > 120) {
    return null;
  }

  if (detail && detail.length > 320) {
    return null;
  }

  if (containsSensitiveMemoryText(title) || containsSensitiveMemoryText(detail)) {
    return null;
  }

  return {
    category: item.category,
    title,
    detail,
    confidence:
      typeof item.confidence === "number" &&
      Number.isFinite(item.confidence) &&
      item.confidence >= 0 &&
      item.confidence <= 1
        ? Number(item.confidence.toFixed(2))
        : null,
  };
}

function requireBodyObject(body: unknown, copy: MemoryServerCopy) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: copy.expectedObject,
      status: 400,
    });
  }

  return body as Record<string, unknown>;
}

function parseMemoryCategory(
  value: unknown,
  copy: MemoryServerCopy,
): ManualMemoryCategory {
  if (
    value === "strength" ||
    value === "weakness" ||
    value === "preference" ||
    value === "topic"
  ) {
    return value;
  }

  throw new AppError({
    code: "validation_error",
    message: copy.invalidFields,
    status: 400,
    fieldErrors: {
      category: copy.fieldErrors.category,
    },
  });
}

function parseMemoryTitle(value: unknown, copy: MemoryServerCopy) {
  if (typeof value !== "string") {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        title: copy.fieldErrors.titleRequired,
      },
    });
  }

  const title = normalizeText(value);

  if (!title || title.length > 120) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        title: copy.fieldErrors.titleRequired,
      },
    });
  }

  if (containsSensitiveMemoryText(title)) {
    throw new AppError({
      code: "validation_error",
      message: copy.sensitiveText,
      status: 400,
      fieldErrors: {
        title: copy.fieldErrors.titleSensitive,
      },
    });
  }

  return title;
}

function parseMemoryDetail(value: unknown, copy: MemoryServerCopy) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        detail: copy.fieldErrors.detailText,
      },
    });
  }

  const detail = normalizeText(value);

  if (detail && detail.length > 320) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        detail: copy.fieldErrors.detailLength,
      },
    });
  }

  if (containsSensitiveMemoryText(detail)) {
    throw new AppError({
      code: "validation_error",
      message: copy.sensitiveText,
      status: 400,
      fieldErrors: {
        detail: copy.fieldErrors.detailSensitive,
      },
    });
  }

  return detail;
}

function parseUuid(
  value: unknown,
  fieldName: "itemId",
  copy: MemoryServerCopy,
) {
  if (typeof value !== "string" || !/^[0-9a-fA-F-]{36}$/.test(value)) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        [fieldName]: copy.fieldErrors.itemId,
      },
    });
  }

  return value;
}

async function loadActiveMemoryRows(studentUserId: string) {
  const supabase = await createSupabaseServerClient();
  const [profileResult, itemsResult] = await Promise.all([
    supabase
      .from("student_memory_profiles")
      .select(
        "student_user_id, strengths_summary, weaknesses_summary, preferences_summary, last_reviewed_at, updated_at",
      )
      .eq("student_user_id", studentUserId)
      .maybeSingle<MemoryProfileRow>(),
    supabase
      .from("student_memory_items")
      .select(
        "id, student_user_id, source_conversation_id, category, title, detail, confidence, is_active, expires_at, created_at, updated_at",
      )
      .eq("student_user_id", studentUserId)
      .eq("is_active", true),
  ]);

  if (profileResult.error) {
    throw toServiceError("Unable to load the student memory profile.", profileResult.error);
  }

  if (itemsResult.error) {
    throw toServiceError("Unable to load student memory items.", itemsResult.error);
  }

  return {
    profile: profileResult.data ?? null,
    items: ((itemsResult.data ?? []) as MemoryItemRow[])
      .filter((row) => !isExpired(row.expires_at))
      .map(toItemRecord)
      .sort(sortItems),
  };
}

async function upsertMemoryProfile(input: {
  studentUserId: string;
  items: StudentMemoryItemRecord[];
  reviewedAt: string;
  copy?: MemoryServerCopy;
}) {
  const grouped = buildItemsByCategory(input.items);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("student_memory_profiles").upsert(
    {
      student_user_id: input.studentUserId,
      strengths_summary: buildCategorySummary(grouped.strength),
      weaknesses_summary: buildCategorySummary(grouped.weakness),
      preferences_summary: buildCategorySummary(grouped.preference),
      last_reviewed_at: input.reviewedAt,
    },
    {
      onConflict: "student_user_id",
    },
  );

  if (error) {
    throw toServiceError(
      (input.copy ?? getMemoryServerCopy("fr")).service.updateProfile,
      error,
    );
  }
}

async function ensureMemoryItemBudget(
  studentUserId: string,
  copy: MemoryServerCopy,
) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("student_memory_items")
    .select("id", { count: "exact", head: true })
    .eq("student_user_id", studentUserId)
    .eq("is_active", true);

  if (error) {
    throw toServiceError(copy.service.verifyLimit, error);
  }

  if ((count ?? 0) >= MAX_MEMORY_ITEMS_PER_STUDENT) {
    throw new AppError({
      code: "conflict",
      message: copy.activeLimitReached,
      status: 409,
    });
  }
}

async function loadOwnedMemoryItem(
  studentUserId: string,
  itemId: string,
  copy: MemoryServerCopy,
) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("student_memory_items")
    .select(
      "id, student_user_id, source_conversation_id, category, title, detail, confidence, is_active, expires_at, created_at, updated_at",
    )
    .eq("student_user_id", studentUserId)
    .eq("id", itemId)
    .maybeSingle<MemoryItemRow>();

  if (error) {
    throw toServiceError(copy.service.loadItem, error);
  }

  if (!data) {
    throw new AppError({
      code: "not_found",
      message: copy.itemNotFound,
      status: 404,
    });
  }

  return data;
}

async function recordMemoryAuditBestEffort(input: {
  actor: AppUserRecord;
  action: string;
  studentUserId: string;
  targetId: string | null;
  requestId: string;
  route: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  try {
    await recordAuditEvent({
      actorUserId: input.actor.id,
      actorRole: input.actor.role,
      action: input.action,
      targetTable: "student_memory_items",
      targetId: input.targetId,
      studentUserId: input.studentUserId,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        ...input.metadata,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block user-facing flows.
  }
}

function canEditMemory(viewer: AppUserRecord, studentUserId: string) {
  return (
    viewer.role === "admin" ||
    viewer.role === "parent" ||
    (viewer.role === "student" && viewer.id === studentUserId)
  );
}

async function requireViewerCanAccessRawStudentMemory(
  viewer: AppUserRecord,
  studentUserId: string,
) {
  if (viewer.role === "tutor") {
    throw rawMemoryNotFound(viewer.preferred_ui_language);
  }

  await requireViewerCanAccessStudent(viewer, studentUserId);
}

export async function loadVisibleStudentMemory(
  input: LoadMemorySnapshotInput,
): Promise<StudentMemorySnapshot> {
  await requireViewerCanAccessRawStudentMemory(input.viewer, input.studentUserId);
  const rows = await loadActiveMemoryRows(input.studentUserId);

  if (input.auditContext && input.viewer.role !== "student") {
    await recordMemoryAuditBestEffort({
      actor: input.viewer,
      action: input.auditContext.action,
      studentUserId: input.studentUserId,
      targetId: null,
      requestId: input.auditContext.requestId,
      route: input.auditContext.route,
      metadata: {
        view_role: input.viewer.role,
      },
    });
  }

  return {
    studentUserId: input.studentUserId,
    viewerRole: input.viewer.role,
    canEdit: canEditMemory(input.viewer, input.studentUserId),
    profile: toProfileRecord(input.studentUserId, rows.profile),
    items: rows.items,
    itemsByCategory: buildItemsByCategory(rows.items),
  };
}

export async function parseStudentMemoryMutation(
  request: Request,
  languageCode: UiLanguageCode = "fr",
): Promise<StudentMemoryMutation> {
  let body: unknown;
  const copy = getMemoryServerCopy(languageCode);

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError({
      code: "bad_request",
      message: copy.invalidJson,
      status: 400,
      cause: error,
    });
  }

  const payload = requireBodyObject(body, copy);

  if (payload.action === "delete") {
    return {
      action: "delete",
      itemId: parseUuid(payload.itemId, "itemId", copy),
    };
  }

  if (payload.action === "upsert") {
    return {
      action: "upsert",
      itemId:
        typeof payload.itemId === "string" && payload.itemId.length > 0
          ? parseUuid(payload.itemId, "itemId", copy)
          : undefined,
      category: parseMemoryCategory(payload.category, copy),
      title: parseMemoryTitle(payload.title, copy),
      detail: parseMemoryDetail(payload.detail, copy),
    };
  }

  throw new AppError({
    code: "validation_error",
    message: copy.invalidFields,
    status: 400,
    fieldErrors: {
      action: copy.fieldErrors.action,
    },
  });
}

async function upsertManualMemoryItem(input: {
  actor: AppUserRecord;
  studentUserId: string;
  payload: UpsertStudentMemoryItemInput;
  requestId: string;
  route: string;
}, copy: MemoryServerCopy) {
  const admin = createSupabaseAdminClient();
  const expiresAt = addDaysIso(new Date().toISOString(), MEMORY_RETENTION_DAYS);

  if (input.payload.itemId) {
    const existing = await loadOwnedMemoryItem(
      input.studentUserId,
      input.payload.itemId,
      copy,
    );

    const { data, error } = await admin
      .from("student_memory_items")
      .update({
        category: input.payload.category,
        title: input.payload.title,
        detail: input.payload.detail,
        expires_at: expiresAt,
        is_active: true,
      })
      .eq("id", existing.id)
      .eq("student_user_id", input.studentUserId)
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw toServiceError(copy.service.updateItem, error);
    }

    logRuntimeInfo({
      message: "Updated memory item",
      requestId: input.requestId,
      route: input.route,
      method: "PATCH",
      actorUserId: input.actor.id,
      actorRole: input.actor.role,
      targetStudentUserId: input.studentUserId,
      details: {
        itemId: data.id,
        category: input.payload.category,
      },
    });

    await recordMemoryAuditBestEffort({
      actor: input.actor,
      action: "student_memory_item_upsert",
      studentUserId: input.studentUserId,
      targetId: data.id,
      requestId: input.requestId,
      route: input.route,
      metadata: {
        category: input.payload.category,
        mode: "update",
      },
    });

    return data.id;
  }

  await ensureMemoryItemBudget(input.studentUserId, copy);

  const { data, error } = await admin
    .from("student_memory_items")
    .insert({
      student_user_id: input.studentUserId,
      source_conversation_id: null,
      category: input.payload.category,
      title: input.payload.title,
      detail: input.payload.detail,
      confidence: null,
      is_active: true,
      expires_at: expiresAt,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw toServiceError(copy.service.createItem, error);
  }

  logRuntimeInfo({
    message: "Created memory item",
    requestId: input.requestId,
    route: input.route,
    method: "PATCH",
    actorUserId: input.actor.id,
    actorRole: input.actor.role,
    targetStudentUserId: input.studentUserId,
    details: {
      itemId: data.id,
      category: input.payload.category,
    },
  });

  await recordMemoryAuditBestEffort({
    actor: input.actor,
    action: "student_memory_item_upsert",
    studentUserId: input.studentUserId,
    targetId: data.id,
    requestId: input.requestId,
    route: input.route,
    metadata: {
      category: input.payload.category,
      mode: "create",
    },
  });

  return data.id;
}

async function deleteMemoryItem(input: {
  actor: AppUserRecord;
  studentUserId: string;
  itemId: string;
  requestId: string;
  route: string;
}, copy: MemoryServerCopy) {
  const existing = await loadOwnedMemoryItem(
    input.studentUserId,
    input.itemId,
    copy,
  );
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("student_memory_items")
    .update({
      is_active: false,
    })
    .eq("id", existing.id)
    .eq("student_user_id", input.studentUserId);

  if (error) {
    throw toServiceError(copy.service.deleteItem, error);
  }

  logRuntimeInfo({
    message: "Deleted memory item",
    requestId: input.requestId,
    route: input.route,
    method: "PATCH",
    actorUserId: input.actor.id,
    actorRole: input.actor.role,
    targetStudentUserId: input.studentUserId,
    details: {
      itemId: existing.id,
      category: existing.category,
    },
  });

  await recordMemoryAuditBestEffort({
    actor: input.actor,
    action: "student_memory_item_delete",
    studentUserId: input.studentUserId,
    targetId: existing.id,
    requestId: input.requestId,
    route: input.route,
    metadata: {
      category: existing.category,
    },
  });

  return existing.id;
}

export async function mutateStudentMemory(input: {
  context: AuthenticatedUserContext;
  studentUserId: string;
  payload: StudentMemoryMutation;
  requestId: string;
  route: string;
}): Promise<StudentMemoryMutationResult> {
  const appUser = requireAppUserContext(input.context);
  const copy = getMemoryServerCopy(appUser.preferred_ui_language);

  if (appUser.role !== "admin") {
    requireActiveAppUser(appUser);
  }

  await requireViewerCanAccessRawStudentMemory(appUser, input.studentUserId);

  if (!canEditMemory(appUser, input.studentUserId)) {
    throw new AppError({
      code: "forbidden",
      message: copy.noAccess,
      status: 403,
    });
  }

  const changedItemId =
    input.payload.action === "delete"
      ? await deleteMemoryItem({
          actor: appUser,
          studentUserId: input.studentUserId,
          itemId: input.payload.itemId,
          requestId: input.requestId,
          route: input.route,
        }, copy)
      : await upsertManualMemoryItem({
          actor: appUser,
          studentUserId: input.studentUserId,
          payload: input.payload,
          requestId: input.requestId,
          route: input.route,
        }, copy);

  const activeRows = await loadActiveMemoryRows(input.studentUserId);
  const reviewedAt = new Date().toISOString();
  await upsertMemoryProfile({
    studentUserId: input.studentUserId,
    items: activeRows.items,
    reviewedAt,
    copy,
  });

  return {
    snapshot: await loadVisibleStudentMemory({
      viewer: appUser,
      studentUserId: input.studentUserId,
    }),
    changedItemId,
    action: input.payload.action,
  };
}

export async function refreshStudentMemoryFromConversationCompletion(input: {
  appUser: AppUserRecord;
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  attachments: ConversationAttachmentRecord[];
  summaries: SessionSummaryRecord[];
  requestId: string;
  route: string;
}) {
  const now = new Date().toISOString();
  let generatedItems: MemoryGenerationItem[] = [];
  let fallbackUsed = false;
  let rejectedItemCount = 0;

  try {
    const provider = getAiProvider();
    const result = await provider.generateMemoryProfile({
      conversation: input.conversation,
      workspace: input.workspace,
      messages: input.messages,
      attachments: input.attachments,
      summaries: input.summaries,
      languageCode: input.appUser.ai_help_language,
      requestContext: {
        requestId: input.requestId,
        route: input.route,
        actorUserId: input.appUser.id,
        actorRole: input.appUser.role,
        conversationId: input.conversation.id,
        studentUserId: input.appUser.id,
      },
    });
    await recordStudentAiUsageBestEffort({
      studentUserId: input.appUser.id,
      usage: result.usage,
    });
    generatedItems = result.items;
  } catch (error) {
    fallbackUsed = true;
    generatedItems = buildFallbackGeneratedItems({
      appUser: input.appUser,
      conversation: input.conversation,
      summaries: input.summaries,
    });

    logRuntimeInfo({
      message: "Fell back to deterministic memory refresh",
      requestId: input.requestId,
      route: input.route,
      method: "POST",
      actorUserId: input.appUser.id,
      actorRole: input.appUser.role,
      targetStudentUserId: input.appUser.id,
      details: {
        conversationId: input.conversation.id,
        reason: error instanceof Error ? error.message : "memory_provider_failure",
      },
    });
  }

  const sanitizedItems = generatedItems
    .map(sanitizeCandidateItem)
    .filter((item): item is MemoryGenerationItem => {
      const keep = item !== null;

      if (!keep) {
        rejectedItemCount += 1;
      }

      return keep;
    });
  const dedupedItems = Array.from(
    sanitizedItems.reduce<Map<string, MemoryGenerationItem>>((map, item) => {
      const key = `${item.category}:${normalizeKey(item.title)}`;
      const existing = map.get(key);

      if (!existing || (item.confidence ?? -1) > (existing.confidence ?? -1)) {
        map.set(key, item);
      }

      return map;
    }, new Map<string, MemoryGenerationItem>()),
  )
    .map(([, item]) => item)
    .slice(0, 6);

  const admin = createSupabaseAdminClient();
  const { data: existingRows, error: existingError } = await admin
    .from("student_memory_items")
    .select(
      "id, student_user_id, source_conversation_id, category, title, detail, confidence, is_active, expires_at, created_at, updated_at",
    )
    .eq("student_user_id", input.appUser.id)
    .eq("is_active", true);

  if (existingError) {
    throw toServiceError("Unable to load existing memory items.", existingError);
  }

  const existingByKey = new Map<string, MemoryItemRow>();

  for (const row of (existingRows ?? []) as MemoryItemRow[]) {
    existingByKey.set(`${row.category}:${normalizeKey(row.title)}`, row);
  }

  const expiresAt = addDaysIso(now, MEMORY_RETENTION_DAYS);

  for (const item of dedupedItems) {
    const existing = existingByKey.get(`${item.category}:${normalizeKey(item.title)}`);

    if (existing) {
      const { error } = await admin
        .from("student_memory_items")
        .update({
          title: item.title,
          detail: item.detail,
          confidence: item.confidence,
          source_conversation_id: input.conversation.id,
          expires_at: expiresAt,
          is_active: true,
        })
        .eq("id", existing.id);

      if (error) {
        throw toServiceError("Unable to refresh an existing memory item.", error);
      }

      continue;
    }

    const { error } = await admin.from("student_memory_items").insert({
      student_user_id: input.appUser.id,
      source_conversation_id: input.conversation.id,
      category: item.category,
      title: item.title,
      detail: item.detail,
      confidence: item.confidence,
      is_active: true,
      expires_at: expiresAt,
    });

    if (error) {
      throw toServiceError("Unable to persist generated memory items.", error);
    }
  }

  const snapshot = await loadVisibleStudentMemory({
    viewer: input.appUser,
    studentUserId: input.appUser.id,
  });
  await upsertMemoryProfile({
    studentUserId: input.appUser.id,
    items: snapshot.items,
    reviewedAt: now,
  });

  logRuntimeInfo({
    message: "Refreshed student memory profile",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: input.appUser.id,
    actorRole: input.appUser.role,
    targetStudentUserId: input.appUser.id,
    details: {
      conversationId: input.conversation.id,
      insertedOrUpdatedItemCount: dedupedItems.length,
      rejectedItemCount,
      fallbackUsed,
    },
  });

  await recordMemoryAuditBestEffort({
    actor: input.appUser,
    action: "student_memory_refresh",
    studentUserId: input.appUser.id,
    targetId: input.conversation.id,
    requestId: input.requestId,
    route: input.route,
    metadata: {
      fallback_used: fallbackUsed,
      item_count: dedupedItems.length,
    },
  });
}
