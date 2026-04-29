"use client";

import { getClientUploadCopy } from "@/lib/i18n/student-flow-copy";
import {
  resolveSubjectResourceMimeType,
  type SubjectResourceMimeType,
} from "@/lib/subject-resources/subject-resource-policy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ConversationResourceLinkRecord,
  SubjectResourceRecord,
} from "@/lib/server/subject-resources/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SubjectResourceUploadPhase = "prepare" | "upload" | "extract";

export type SubjectResourceUploadResult = {
  resource: SubjectResourceRecord;
  link: ConversationResourceLinkRecord | null;
  chunkCount: number;
  warningMessage: string | null;
};

type CreateSubjectResourceResponse =
  | {
      ok: true;
      data: {
        resource: SubjectResourceRecord;
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

type ConfirmSubjectResourceResponse =
  | {
      ok: true;
      data: SubjectResourceUploadResult;
    }
  | {
      ok?: false;
      error?: {
        message?: string;
        fieldErrors?: Record<string, string>;
      };
    };

function getResponseErrorMessage(
  payload: CreateSubjectResourceResponse | ConfirmSubjectResourceResponse | null,
) {
  if (!payload || payload.ok) {
    return null;
  }

  const fieldError = payload.error?.fieldErrors
    ? Object.values(payload.error.fieldErrors)[0]
    : null;

  return fieldError ?? payload.error?.message ?? null;
}

export async function uploadSubjectResourceFiles(input: {
  subjectTag: string;
  files: File[];
  conversationId?: string | null;
  selectForConversation?: boolean;
  languageCode?: UiLanguageCode;
  onProgress?: (progress: {
    fileIndex: number;
    fileCount: number;
    phase: SubjectResourceUploadPhase;
    completedPhases: number;
    totalPhases: number;
  }) => void;
}) {
  const supabase = createSupabaseBrowserClient();
  const results: SubjectResourceUploadResult[] = [];
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
      resolveSubjectResourceMimeType({
        mimeType: file.type,
        originalFilename: file.name,
      }) ?? (file.type as SubjectResourceMimeType);
    const createResponse = await fetch("/api/subject-resources", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        subjectTag: input.subjectTag,
        originalFilename: file.name,
        mimeType: resolvedMimeType,
        byteSize: file.size,
      }),
    });
    const createPayload = (await createResponse
      .json()
      .catch(() => null)) as CreateSubjectResourceResponse | null;

    if (
      !createResponse.ok ||
      !createPayload?.ok ||
      !createPayload.data?.uploadTarget?.token
    ) {
      throw new Error(
        getResponseErrorMessage(createPayload) ?? copy.prepareUpload(file.name),
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
    const confirmResponse = await fetch("/api/subject-resources/confirm", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        resourceId: createPayload.data.resource.id,
        conversationId: input.conversationId ?? null,
        selected: input.selectForConversation ?? Boolean(input.conversationId),
      }),
    });
    const confirmPayload = (await confirmResponse
      .json()
      .catch(() => null)) as ConfirmSubjectResourceResponse | null;

    if (!confirmResponse.ok || !confirmPayload?.ok || !confirmPayload.data) {
      throw new Error(
        getResponseErrorMessage(confirmPayload) ?? copy.confirmUpload(file.name),
      );
    }

    results.push(confirmPayload.data);
  }

  return results;
}
