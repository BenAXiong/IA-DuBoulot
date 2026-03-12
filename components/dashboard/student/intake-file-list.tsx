import { formatBytes, type StagedIntakeFile } from "@/lib/intake/intake-config";
import { getIntakeFileListCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type IntakeFileListProps = {
  files: StagedIntakeFile[];
  languageCode: UiLanguageCode;
  onRemove: (fileId: string) => void;
};

export function IntakeFileList({
  files,
  languageCode,
  onRemove,
}: IntakeFileListProps) {
  const copy = getIntakeFileListCopy(languageCode);

  if (files.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
        {copy.empty}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {files.map((file) => (
        <article
          className="grid gap-3 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 md:grid-cols-[1fr_auto]"
          key={file.id}
        >
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
                {file.category === "pdf"
                  ? copy.categoryLabel.pdf
                  : copy.categoryLabel.image}
              </span>
              <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
                {formatBytes(file.file.size)}
              </span>
            </div>
            <p className="font-medium text-[color:var(--foreground)]">
              {file.file.name}
            </p>
          </div>

          <button
            className="justify-self-start rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 md:self-start"
            onClick={() => onRemove(file.id)}
            type="button"
          >
            {copy.remove}
          </button>
        </article>
      ))}
    </div>
  );
}
