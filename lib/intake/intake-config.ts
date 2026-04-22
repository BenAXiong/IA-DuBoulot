import {
  ATTACHMENT_ACCEPT_ATTR,
  ATTACHMENT_MAX_IMAGE_BYTES,
  ATTACHMENT_MAX_PDF_BYTES,
  resolveAttachmentPolicyInput,
  type SharedAttachmentCategory,
} from "@/lib/uploads/attachment-policy";
import { getIntakeConfigCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

export const INTAKE_MAX_ATTACHMENTS = 5;
export const INTAKE_MAX_TOTAL_UPLOAD_BYTES = 50 * 1024 * 1024;
export const INTAKE_ACCEPT_ATTR = ATTACHMENT_ACCEPT_ATTR;

export type IntakeAttachmentCategory = SharedAttachmentCategory;

export type StagedIntakeFile = {
  id: string;
  file: File;
  category: IntakeAttachmentCategory;
};

function createFileId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `intake-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function resolveIntakeCategory(
  file: File,
): IntakeAttachmentCategory | null {
  return (
    resolveAttachmentPolicyInput({
      mimeType: file.type,
      originalFilename: file.name,
    })?.policy.category ?? null
  );
}

export function extractClipboardFiles(input: DataTransfer | null) {
  if (!input) {
    return [];
  }

  const files: File[] = [];

  for (const item of Array.from(input.items ?? [])) {
    if (!item.type.startsWith("image/")) {
      continue;
    }

    const file = item.getAsFile();
    if (file) {
      files.push(file);
    }
  }

  return files;
}

export function stageIntakeFiles(input: {
  existingFiles: StagedIntakeFile[];
  incomingFiles: File[];
  languageCode?: UiLanguageCode;
  existingCount?: number;
  existingTotalBytes?: number;
}) {
  const acceptedFiles = [...input.existingFiles];
  const errors: string[] = [];
  let acceptedCount = input.existingCount ?? acceptedFiles.length;
  let totalBytes =
    input.existingTotalBytes ??
    acceptedFiles.reduce((sum, staged) => sum + staged.file.size, 0);
  const copy = getIntakeConfigCopy(input.languageCode ?? "fr");

  for (const file of input.incomingFiles) {
    const category = resolveIntakeCategory(file);

    if (!category) {
      errors.push(copy.stageErrors.unsupportedFormat(file.name));
      continue;
    }

    const maxBytes =
      category === "pdf" ? ATTACHMENT_MAX_PDF_BYTES : ATTACHMENT_MAX_IMAGE_BYTES;

    if (file.size > maxBytes) {
      errors.push(copy.stageErrors.maxBytes(file.name, formatBytes(maxBytes)));
      continue;
    }

    if (acceptedCount >= INTAKE_MAX_ATTACHMENTS) {
      errors.push(copy.stageErrors.tooManyFiles(INTAKE_MAX_ATTACHMENTS));
      break;
    }

    if (totalBytes + file.size > INTAKE_MAX_TOTAL_UPLOAD_BYTES) {
      errors.push(
        copy.stageErrors.totalBudgetExceeded(
          formatBytes(INTAKE_MAX_TOTAL_UPLOAD_BYTES),
        ),
      );
      continue;
    }

    acceptedFiles.push({
      id: createFileId(),
      file,
      category,
    });
    acceptedCount += 1;
    totalBytes += file.size;
  }

  return {
    acceptedFiles,
    errors,
    totalBytes,
  };
}

export function buildExtractionDraftSeed(input: {
  pastedText: string;
  files: StagedIntakeFile[];
  languageCode?: UiLanguageCode;
}) {
  const pastedText = input.pastedText.trim();

  if (pastedText) {
    return pastedText;
  }

  if (input.files.length === 0) {
    return "";
  }

  const copy = getIntakeConfigCopy(input.languageCode ?? "fr");
  const fileLines = input.files.map((file) => {
    const kindLabel =
      file.category === "pdf" ? copy.category.pdf : copy.category.image;
    return `- ${file.file.name} (${kindLabel}, ${formatBytes(file.file.size)})`;
  });

  return [
    copy.provisionalDraft.marker,
    "",
    copy.provisionalDraft.filesAdded,
    ...fileLines,
    "",
    copy.provisionalDraft.helper,
  ].join("\n");
}

export function isProvisionalExtractionDraft(value: string) {
  return ["fr", "en", "zh"].some((languageCode) =>
    value
      .trim()
      .startsWith(
        getIntakeConfigCopy(languageCode as UiLanguageCode).provisionalDraft.marker,
      ),
  );
}
