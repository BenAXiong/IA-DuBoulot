import {
  ATTACHMENT_ACCEPT_ATTR,
  ATTACHMENT_MAX_IMAGE_BYTES,
  ATTACHMENT_MAX_PDF_BYTES,
  resolveAttachmentPolicy,
  type SharedAttachmentCategory,
} from "@/lib/uploads/attachment-policy";

export const INTAKE_SUBJECT_OPTIONS = [
  { value: "mathematiques", label: "Mathematiques" },
  { value: "francais", label: "Francais" },
  { value: "anglais", label: "Anglais" },
  { value: "histoire-geographie", label: "Histoire-geographie" },
  { value: "sciences", label: "Sciences" },
  { value: "physique-chimie", label: "Physique-chimie" },
  { value: "svt", label: "SVT" },
  { value: "autre", label: "Autre matiere" },
] as const;

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
  return resolveAttachmentPolicy(file.type)?.category ?? null;
}

export function stageIntakeFiles(input: {
  existingFiles: StagedIntakeFile[];
  incomingFiles: File[];
}) {
  const acceptedFiles = [...input.existingFiles];
  const errors: string[] = [];
  let totalBytes = acceptedFiles.reduce((sum, staged) => sum + staged.file.size, 0);

  for (const file of input.incomingFiles) {
    const category = resolveIntakeCategory(file);

    if (!category) {
      errors.push(`${file.name}: format non accepte.`);
      continue;
    }

    const maxBytes =
      category === "pdf" ? ATTACHMENT_MAX_PDF_BYTES : ATTACHMENT_MAX_IMAGE_BYTES;

    if (file.size > maxBytes) {
      errors.push(
        `${file.name}: ${formatBytes(maxBytes)} maximum pour ce type de fichier.`,
      );
      continue;
    }

    if (acceptedFiles.length >= INTAKE_MAX_ATTACHMENTS) {
      errors.push(
        `Limite atteinte: ${INTAKE_MAX_ATTACHMENTS} fichiers maximum par devoir.`,
      );
      break;
    }

    if (totalBytes + file.size > INTAKE_MAX_TOTAL_UPLOAD_BYTES) {
      errors.push(
        `Budget depasse: ${formatBytes(INTAKE_MAX_TOTAL_UPLOAD_BYTES)} maximum pour l'ensemble des fichiers.`,
      );
      continue;
    }

    acceptedFiles.push({
      id: createFileId(),
      file,
      category,
    });
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
}) {
  const pastedText = input.pastedText.trim();

  if (pastedText) {
    return pastedText;
  }

  if (input.files.length === 0) {
    return "";
  }

  const fileLines = input.files.map((file) => {
    const kindLabel = file.category === "pdf" ? "PDF" : "image/capture";
    return `- ${file.file.name} (${kindLabel}, ${formatBytes(file.file.size)})`;
  });

  return [
    "[Brouillon d'extraction provisoire]",
    "",
    "Fichiers ajoutes:",
    ...fileLines,
    "",
    "Ajoute ici une transcription manuelle, les consignes importantes, ou les zones a faire relire avant l'ouverture de la conversation.",
  ].join("\n");
}

export function isProvisionalExtractionDraft(value: string) {
  return value.trim().startsWith("[Brouillon d'extraction provisoire]");
}
