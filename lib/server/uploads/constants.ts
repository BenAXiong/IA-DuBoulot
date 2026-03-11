import "server-only";

import {
  ATTACHMENT_MAX_OBJECT_BYTES,
  ATTACHMENT_POLICY_BY_MIME,
} from "@/lib/uploads/attachment-policy";

export const HOMEWORK_ATTACHMENTS_BUCKET = "homework-attachments";
export const PROCESSING_ARTIFACTS_BUCKET = "processing-artifacts";
export const ATTACHMENT_READ_URL_TTL_SECONDS = 60 * 5;
export const ATTACHMENT_MAX_PER_CONVERSATION = 5;
export const ATTACHMENT_MAX_TOTAL_BYTES = 50 * 1024 * 1024;
export const ATTACHMENT_MAX_OBJECT_UPLOAD_BYTES = ATTACHMENT_MAX_OBJECT_BYTES;
export const ALLOWED_ATTACHMENT_RULES = ATTACHMENT_POLICY_BY_MIME;

export type AllowedAttachmentMimeType = keyof typeof ALLOWED_ATTACHMENT_RULES;
export type UploadSource =
  | "file_picker"
  | "camera"
  | "paste"
  | "drag_drop";
