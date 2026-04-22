export const ATTACHMENT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_MAX_PDF_BYTES = 20 * 1024 * 1024;

export const ATTACHMENT_POLICY_BY_MIME = {
  "image/jpeg": {
    category: "image",
    attachmentKind: "image",
    extension: "jpg",
    maxBytes: ATTACHMENT_MAX_IMAGE_BYTES,
  },
  "image/png": {
    category: "image",
    attachmentKind: "image",
    extension: "png",
    maxBytes: ATTACHMENT_MAX_IMAGE_BYTES,
  },
  "image/webp": {
    category: "image",
    attachmentKind: "image",
    extension: "webp",
    maxBytes: ATTACHMENT_MAX_IMAGE_BYTES,
  },
  "image/heic": {
    category: "image",
    attachmentKind: "image",
    extension: "heic",
    maxBytes: ATTACHMENT_MAX_IMAGE_BYTES,
  },
  "application/pdf": {
    category: "pdf",
    attachmentKind: "pdf",
    extension: "pdf",
    maxBytes: ATTACHMENT_MAX_PDF_BYTES,
  },
} as const;

const ATTACHMENT_MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  pdf: "application/pdf",
} as const;

export const ATTACHMENT_ACCEPT_ATTR = Object.keys(ATTACHMENT_POLICY_BY_MIME).join(
  ",",
);
export const ATTACHMENT_MAX_OBJECT_BYTES = ATTACHMENT_MAX_PDF_BYTES;

export type SharedAttachmentMimeType = keyof typeof ATTACHMENT_POLICY_BY_MIME;
export type SharedAttachmentCategory =
  (typeof ATTACHMENT_POLICY_BY_MIME)[SharedAttachmentMimeType]["category"];

function extractNormalizedExtension(originalFilename: string | undefined) {
  const filename = originalFilename?.trim().toLowerCase() ?? "";

  if (!filename.includes(".")) {
    return null;
  }

  const extension = filename.split(".").pop()?.trim() ?? "";
  return extension || null;
}

export function resolveAttachmentPolicy(mimeType: string) {
  if (mimeType in ATTACHMENT_POLICY_BY_MIME) {
    return ATTACHMENT_POLICY_BY_MIME[mimeType as SharedAttachmentMimeType];
  }

  return null;
}

export function resolveAttachmentMimeType(input: {
  mimeType: string;
  originalFilename?: string;
}) {
  const mimeType = input.mimeType.trim();

  if (mimeType in ATTACHMENT_POLICY_BY_MIME) {
    return mimeType as SharedAttachmentMimeType;
  }

  const extension = extractNormalizedExtension(input.originalFilename);

  if (!extension) {
    return null;
  }

  return ATTACHMENT_MIME_BY_EXTENSION[
    extension as keyof typeof ATTACHMENT_MIME_BY_EXTENSION
  ] ?? null;
}

export function resolveAttachmentPolicyInput(input: {
  mimeType: string;
  originalFilename?: string;
}) {
  const resolvedMimeType = resolveAttachmentMimeType(input);

  if (!resolvedMimeType) {
    return null;
  }

  return {
    resolvedMimeType,
    policy: ATTACHMENT_POLICY_BY_MIME[resolvedMimeType],
  };
}
