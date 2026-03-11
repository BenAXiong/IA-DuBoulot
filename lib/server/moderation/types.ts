import "server-only";

export type ModerationDecision = "allowed" | "flagged" | "blocked";
export type ModerationSource = "user_input" | "assistant_output" | "attachment_extraction";

export type ModerationReasonCode =
  | "self_harm"
  | "sexual_content"
  | "violent_content"
  | "personal_data"
  | "cheating_request"
  | "unknown";

export type ModerationResult = {
  status: ModerationDecision;
  reasonCodes: ModerationReasonCode[];
  note: string | null;
};
