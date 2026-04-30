export const SUBJECT_RESOURCE_MAX_PROVIDER_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const SUBJECT_RESOURCE_MAX_PDF_BYTES =
  SUBJECT_RESOURCE_MAX_PROVIDER_DOCUMENT_BYTES;
export const SUBJECT_RESOURCE_MAX_TEXT_BYTES = 5 * 1024 * 1024;
export const SUBJECT_RESOURCE_MAX_DOCUMENT_BYTES =
  SUBJECT_RESOURCE_MAX_PROVIDER_DOCUMENT_BYTES;
export const SUBJECT_RESOURCE_MAX_OBJECT_UPLOAD_BYTES =
  SUBJECT_RESOURCE_MAX_PROVIDER_DOCUMENT_BYTES;

export const SUBJECT_RESOURCE_POLICY_BY_MIME = {
  "application/pdf": {
    attachmentKind: "pdf",
    extension: "pdf",
    maxBytes: SUBJECT_RESOURCE_MAX_PDF_BYTES,
    extractionPath: "provider",
  },
  "text/plain": {
    attachmentKind: "document",
    extension: "txt",
    maxBytes: SUBJECT_RESOURCE_MAX_TEXT_BYTES,
    extractionPath: "direct_text",
  },
  "text/markdown": {
    attachmentKind: "document",
    extension: "md",
    maxBytes: SUBJECT_RESOURCE_MAX_TEXT_BYTES,
    extractionPath: "direct_text",
  },
  "application/json": {
    attachmentKind: "document",
    extension: "json",
    maxBytes: SUBJECT_RESOURCE_MAX_TEXT_BYTES,
    extractionPath: "direct_text",
  },
  "application/msword": {
    attachmentKind: "document",
    extension: "doc",
    maxBytes: SUBJECT_RESOURCE_MAX_DOCUMENT_BYTES,
    extractionPath: "provider",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    attachmentKind: "document",
    extension: "docx",
    maxBytes: SUBJECT_RESOURCE_MAX_DOCUMENT_BYTES,
    extractionPath: "provider",
  },
} as const;

const SUBJECT_RESOURCE_MIME_BY_EXTENSION = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  json: "application/json",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export const SUBJECT_RESOURCE_ACCEPT_ATTR = [
  ...Object.keys(SUBJECT_RESOURCE_POLICY_BY_MIME),
  ".pdf",
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".doc",
  ".docx",
].join(",");

export const SUBJECT_RESOURCE_ALLOWED_MIME_TYPES = Object.keys(
  SUBJECT_RESOURCE_POLICY_BY_MIME,
);

export type SubjectResourceMimeType =
  keyof typeof SUBJECT_RESOURCE_POLICY_BY_MIME;

export type SubjectResourcePolicy =
  (typeof SUBJECT_RESOURCE_POLICY_BY_MIME)[SubjectResourceMimeType];

function extractNormalizedExtension(originalFilename: string | undefined) {
  const filename = originalFilename?.trim().toLowerCase() ?? "";

  if (!filename.includes(".")) {
    return null;
  }

  const extension = filename.split(".").pop()?.trim() ?? "";
  return extension || null;
}

export function resolveSubjectResourceMimeType(input: {
  mimeType: string;
  originalFilename?: string;
}) {
  const mimeType = input.mimeType.trim();

  if (mimeType in SUBJECT_RESOURCE_POLICY_BY_MIME) {
    return mimeType as SubjectResourceMimeType;
  }

  const extension = extractNormalizedExtension(input.originalFilename);

  if (!extension) {
    return null;
  }

  return SUBJECT_RESOURCE_MIME_BY_EXTENSION[
    extension as keyof typeof SUBJECT_RESOURCE_MIME_BY_EXTENSION
  ] ?? null;
}

export function resolveSubjectResourcePolicyInput(input: {
  mimeType: string;
  originalFilename?: string;
}) {
  const resolvedMimeType = resolveSubjectResourceMimeType(input);

  if (!resolvedMimeType) {
    return null;
  }

  return {
    resolvedMimeType,
    policy: SUBJECT_RESOURCE_POLICY_BY_MIME[resolvedMimeType],
  };
}
