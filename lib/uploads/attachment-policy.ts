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

export const ATTACHMENT_ACCEPT_ATTR = Object.keys(ATTACHMENT_POLICY_BY_MIME).join(
  ",",
);
export const ATTACHMENT_MAX_OBJECT_BYTES = ATTACHMENT_MAX_PDF_BYTES;

export type SharedAttachmentMimeType = keyof typeof ATTACHMENT_POLICY_BY_MIME;
export type SharedAttachmentCategory =
  (typeof ATTACHMENT_POLICY_BY_MIME)[SharedAttachmentMimeType]["category"];

export function resolveAttachmentPolicy(mimeType: string) {
  if (mimeType in ATTACHMENT_POLICY_BY_MIME) {
    return ATTACHMENT_POLICY_BY_MIME[mimeType as SharedAttachmentMimeType];
  }

  return null;
}
