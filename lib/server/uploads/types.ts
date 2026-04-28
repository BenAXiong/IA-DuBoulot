import "server-only";

import type { AuthenticatedUserContext } from "@/lib/server/auth/types";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { SubjectResourceRecord } from "@/lib/server/subject-resources/types";
import type { UploadSource } from "@/lib/server/uploads/constants";

export type CreateUploadTargetInput = {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
  conversationId: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  uploadSource: UploadSource;
};

export type CreateUploadTargetResult = {
  attachment: ConversationAttachmentRecord;
  uploadTarget: {
    bucket: string;
    path: string;
    token: string;
  };
};

export type ConfirmUploadInput = {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
  conversationId: string;
  attachmentId: string;
};

export type ConfirmUploadResult = {
  attachment: ConversationAttachmentRecord;
  subjectResource: SubjectResourceRecord | null;
  extractedTextBlock: string | null;
  warningMessage: string | null;
};

export type RetryAttachmentExtractionInput = ConfirmUploadInput;

export type RetryAttachmentExtractionResult = ConfirmUploadResult;

export type AttachmentAccessInput = {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
  attachmentId: string;
};

export type AttachmentAccessResult = {
  signedUrl: string;
};

export type DeleteAttachmentInput = {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
  attachmentId: string;
};

export type DeleteAttachmentResult = {
  attachmentId: string;
  conversationId: string;
};
