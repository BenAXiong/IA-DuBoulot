import "server-only";

import { requireAppUserRole } from "@/lib/server/auth/authorization";
import type { AppUserRecord } from "@/lib/server/auth/types";
import { AppError } from "@/lib/server/errors/app-error";
import type { AdminAccessAuditSnapshot } from "@/lib/server/oversight/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AuditRow = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  student_user_id: string | null;
  conversation_id: string | null;
  metadata: Record<string, unknown> | null;
};

type UserRow = {
  id: string;
  display_name: string;
};

const SENSITIVE_ACCESS_ACTIONS = [
  "parent_session_review_view",
  "tutor_session_review_view",
  "tutor_note_create",
  "tutor_note_update",
  "tutor_note_delete",
] as const;

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
}

export async function loadAdminAccessAuditSnapshot(
  appUser: AppUserRecord,
): Promise<AdminAccessAuditSnapshot> {
  requireAppUserRole(appUser, ["admin"]);

  const supabase = createSupabaseAdminClient();
  const { data: auditRows, error: auditError } = await supabase
    .from("audit_logs")
    .select(
      "id, created_at, actor_user_id, actor_role, action, target_table, target_id, student_user_id, conversation_id, metadata",
    )
    .in("action", [...SENSITIVE_ACCESS_ACTIONS])
    .order("created_at", { ascending: false })
    .limit(100);

  if (auditError) {
    throw toServiceError("Unable to load access audit events.", auditError);
  }

  const rows = (auditRows ?? []) as AuditRow[];
  const userIds = Array.from(
    new Set(
      rows.flatMap((row) =>
        [row.actor_user_id, row.student_user_id].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ),
  );

  let usersById = new Map<string, UserRow>();

  if (userIds.length > 0) {
    const { data: userRows, error: userError } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", userIds);

    if (userError) {
      throw toServiceError("Unable to load audit user metadata.", userError);
    }

    usersById = new Map(
      ((userRows ?? []) as UserRow[]).map((user) => [user.id, user]),
    );
  }

  return {
    events: rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      actorUserId: row.actor_user_id,
      actorRole: row.actor_role,
      actorDisplayName: row.actor_user_id
        ? (usersById.get(row.actor_user_id)?.display_name ?? null)
        : null,
      action: row.action,
      targetTable: row.target_table,
      targetId: row.target_id,
      studentUserId: row.student_user_id,
      studentDisplayName: row.student_user_id
        ? (usersById.get(row.student_user_id)?.display_name ?? null)
        : null,
      conversationId: row.conversation_id,
      metadata: row.metadata ?? {},
    })),
  };
}
