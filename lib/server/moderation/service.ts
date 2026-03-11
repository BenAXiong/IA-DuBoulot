import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppUserRole } from "@/lib/server/auth/types";
import type { AiProviderLogContext } from "@/lib/server/ai/types";
import type {
  ModerationReasonCode,
  ModerationResult,
  ModerationSource,
} from "@/lib/server/moderation/types";

const BLOCK_PATTERNS: Array<{
  code: ModerationReasonCode;
  pattern: RegExp;
}> = [
  {
    code: "self_harm",
    pattern:
      /\b(suicide|suicider|me tuer|kill myself|self harm|scarifier|auto[- ]?mutilation)\b/i,
  },
  {
    code: "sexual_content",
    pattern:
      /\b(sex explicite|porn|porno|nudes?|sexual content|contenu sexuel)\b/i,
  },
  {
    code: "violent_content",
    pattern:
      /\b(build a bomb|fabriquer une bombe|stab|poignarder|shoot someone|tuer quelqu'un)\b/i,
  },
];

const FLAG_PATTERNS: Array<{
  code: ModerationReasonCode;
  pattern: RegExp;
}> = [
  {
    code: "personal_data",
    pattern:
      /\b(adresse|address|telephone|phone number|numero de telephone|social security|mot de passe|password)\b/i,
  },
  {
    code: "cheating_request",
    pattern:
      /\b(donne moi juste la reponse|just give me the answer|fais le devoir a ma place|do it for me|copie complete|full solution only)\b/i,
  },
];

function assessText(text: string): ModerationResult {
  const blockedCodes = BLOCK_PATTERNS
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.code);

  if (blockedCodes.length > 0) {
    return {
      status: "blocked",
      reasonCodes: blockedCodes,
      note: "Le contenu declenche une regle de blocage.",
    };
  }

  const flaggedCodes = FLAG_PATTERNS
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.code);

  if (flaggedCodes.length > 0) {
    return {
      status: "flagged",
      reasonCodes: flaggedCodes,
      note: "Le contenu demande un recadrage ou une vigilance.",
    };
  }

  return {
    status: "allowed",
    reasonCodes: [],
    note: null,
  };
}

export function moderateUserInput(text: string) {
  return assessText(text);
}

export function moderateAssistantOutput(text: string) {
  return assessText(text);
}

export function moderateExtraction(text: string) {
  return assessText(text);
}

export async function recordModerationEvent(input: {
  source: ModerationSource;
  result: ModerationResult;
  actorUserId: string | null;
  actorRole: AppUserRole | null;
  conversationId: string | null;
  attachmentId?: string | null;
  messageId?: string | null;
  requestContext: AiProviderLogContext;
  textPreview?: string | null;
}) {
  if (input.result.status === "allowed") {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("moderation_events").insert({
    conversation_id: input.conversationId,
    message_id: input.messageId ?? null,
    attachment_id: input.attachmentId ?? null,
    actor_user_id: input.actorUserId,
    event_source: input.source,
    status: input.result.status,
    provider: "local_rules",
    reason:
      input.result.reasonCodes.length > 0
        ? input.result.reasonCodes.join(",")
        : "unknown",
    details: {
      request_id: input.requestContext.requestId,
      route: input.requestContext.route,
      note: input.result.note,
      preview: input.textPreview ?? null,
    },
  });
}
