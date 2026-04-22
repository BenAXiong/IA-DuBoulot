"use client";

import { getClientUploadCopy } from "@/lib/i18n/student-flow-copy";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UploadSource } from "@/lib/server/uploads/constants";
import { resolveAttachmentMimeType } from "@/lib/uploads/attachment-policy";

type UploadStepResult = {
  attachment: ConversationAttachmentRecord;
  extractedTextBlock: string | null;
  warningMessage: string | null;
};

export type ConversationUploadPhase = "prepare" | "upload" | "extract";

type CreateUploadResponse =
  | {
      ok: true;
      data: {
        attachment: ConversationAttachmentRecord;
        uploadTarget: {
          bucket: string;
          path: string;
          token: string;
        };
      };
    }
  | {
      ok?: false;
      error?: {
        message?: string;
        fieldErrors?: Record<string, string>;
      };
    };

type ConfirmUploadResponse =
  | {
      ok: true;
      data: UploadStepResult;
    }
  | {
      ok?: false;
      error?: {
        message?: string;
        fieldErrors?: Record<string, string>;
      };
    };

function getResponseErrorMessage(
  payload: CreateUploadResponse | ConfirmUploadResponse | null,
) {
  if (!payload || payload.ok) {
    return null;
  }

  const fieldError = payload.error?.fieldErrors
    ? Object.values(payload.error.fieldErrors)[0]
    : null;

  return fieldError ?? payload.error?.message ?? null;
}

export async function uploadConversationFiles(input: {
  conversationId: string;
  files: File[];
  uploadSource?: UploadSource;
  languageCode?: UiLanguageCode;
  onProgress?: (progress: {
    fileIndex: number;
    fileCount: number;
    phase: ConversationUploadPhase;
    completedPhases: number;
    totalPhases: number;
  }) => void;
}) {
  const supabase = createSupabaseBrowserClient();
  const results: UploadStepResult[] = [];
  const copy = getClientUploadCopy(input.languageCode ?? "fr");
  const totalPhases = input.files.length * 3;

  for (const [fileIndex, file] of input.files.entries()) {
    const baseCompletedPhases = fileIndex * 3;
    input.onProgress?.({
      fileIndex,
      fileCount: input.files.length,
      phase: "prepare",
      completedPhases: baseCompletedPhases,
      totalPhases,
    });
    const resolvedMimeType =
      resolveAttachmentMimeType({
        mimeType: file.type,
        originalFilename: file.name,
      }) ?? file.type;
    const createResponse = await fetch("/api/uploads/create", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        conversationId: input.conversationId,
        originalFilename: file.name,
        mimeType: resolvedMimeType,
        byteSize: file.size,
        uploadSource: input.uploadSource ?? "file_picker",
      }),
    });
    const createPayload = (await createResponse
      .json()
      .catch(() => null)) as CreateUploadResponse | null;

    if (
      !createResponse.ok ||
      !createPayload?.ok ||
      !createPayload.data?.uploadTarget?.token
    ) {
      throw new Error(
        getResponseErrorMessage(createPayload) ??
          copy.prepareUpload(file.name),
      );
    }

    input.onProgress?.({
      fileIndex,
      fileCount: input.files.length,
      phase: "upload",
      completedPhases: baseCompletedPhases + 1,
      totalPhases,
    });
    const uploadResult = await supabase.storage
      .from(createPayload.data.uploadTarget.bucket)
      .uploadToSignedUrl(
        createPayload.data.uploadTarget.path,
        createPayload.data.uploadTarget.token,
        file,
      );

    if (uploadResult.error) {
      throw new Error(copy.transferUpload(file.name, uploadResult.error.message));
    }

    input.onProgress?.({
      fileIndex,
      fileCount: input.files.length,
      phase: "extract",
      completedPhases: baseCompletedPhases + 2,
      totalPhases,
    });
    const confirmResponse = await fetch("/api/uploads/confirm", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        conversationId: input.conversationId,
        attachmentId: createPayload.data.attachment.id,
      }),
    });
    const confirmPayload = (await confirmResponse
      .json()
      .catch(() => null)) as ConfirmUploadResponse | null;

    if (!confirmResponse.ok || !confirmPayload?.ok || !confirmPayload.data) {
      throw new Error(
        getResponseErrorMessage(confirmPayload) ??
          copy.confirmUpload(file.name),
      );
    }

    results.push(confirmPayload.data);
  }

  return results;
}
