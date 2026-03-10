import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/server/errors/app-error";
import { logRuntimeError } from "@/lib/server/audit/runtime-logger";
import type { AppUserRole } from "@/lib/server/auth/types";

type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { [key: string]: AuditMetadataValue };

export type RecordAuditEventInput = {
  actorUserId?: string | null;
  actorRole?: AppUserRole | null;
  action: string;
  targetTable: string;
  targetId?: string | null;
  studentUserId?: string | null;
  conversationId?: string | null;
  metadata?: Record<string, AuditMetadataValue>;
  requestId?: string;
};

export async function recordAuditEvent(input: RecordAuditEventInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_user_id: input.actorUserId ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      target_table: input.targetTable,
      target_id: input.targetId ?? null,
      student_user_id: input.studentUserId ?? null,
      conversation_id: input.conversationId ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logRuntimeError({
      message: "Failed to record audit event",
      requestId: input.requestId,
      route: typeof input.metadata?.route === "string" ? input.metadata.route : undefined,
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? null,
      errorCode: "internal_error",
      targetStudentUserId: input.studentUserId ?? null,
      details: {
        action: input.action,
        targetTable: input.targetTable,
        error:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : { value: String(error) },
      },
    });

    throw new AppError({
      code: "internal_error",
      message: "Failed to record audit event.",
      status: 500,
      cause: error,
    });
  }
}
