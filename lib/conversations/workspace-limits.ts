export const WORKSPACE_SOURCE_TEXT_MAX_CHARS = 20_000;
export const WORKSPACE_SUPPORT_TEXT_MAX_CHARS = 8_000;

const SOURCE_TRUNCATION_NOTE =
  "[Texte extrait raccourci pour rester dans la limite de l'espace de travail. La piece jointe conserve l'extraction complete.]";
const SUPPORT_TRUNCATION_NOTE =
  "[Notes raccourcies pour rester dans la limite de l'espace de travail.]";

function clampWithNote(value: string, maxChars: number, note: string) {
  const normalized = value.trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  const suffix = `\n\n${note}`;
  const contentLimit = Math.max(0, maxChars - suffix.length);

  return `${normalized.slice(0, contentLimit).trimEnd()}${suffix}`;
}

export function clampWorkspaceSourceText(value: string) {
  return clampWithNote(
    value,
    WORKSPACE_SOURCE_TEXT_MAX_CHARS,
    SOURCE_TRUNCATION_NOTE,
  );
}

export function clampWorkspaceSupportText(value: string) {
  return clampWithNote(
    value,
    WORKSPACE_SUPPORT_TEXT_MAX_CHARS,
    SUPPORT_TRUNCATION_NOTE,
  );
}

export function mergeWorkspaceSourceTextBlocks(
  existingText: string,
  blocks: string[],
) {
  return clampWorkspaceSourceText(
    [existingText.trim(), ...blocks.map((block) => block.trim())]
      .filter(Boolean)
      .join("\n\n"),
  );
}

export function mergeWorkspaceSupportTextBlocks(
  existingText: string,
  blocks: string[],
) {
  return clampWorkspaceSupportText(
    [existingText.trim(), ...blocks.map((block) => block.trim())]
      .filter(Boolean)
      .join("\n"),
  );
}
