import {
  formatBytes,
  INTAKE_MAX_ATTACHMENTS,
  INTAKE_MAX_TOTAL_UPLOAD_BYTES,
} from "@/lib/intake/intake-config";

type IntakeReadinessCardProps = {
  canStartHomework: boolean;
  filesCount: number;
  pastedTextLength: number;
  extractionDraftLength: number;
  totalBytes: number;
  titleReady: boolean;
  subjectReady: boolean;
  reviewMessage: string | null;
};

function getReadinessLabel(isReady: boolean) {
  return isReady ? "pret" : "a faire";
}

export function IntakeReadinessCard({
  canStartHomework,
  filesCount,
  pastedTextLength,
  extractionDraftLength,
  totalBytes,
  titleReady,
  subjectReady,
  reviewMessage,
}: IntakeReadinessCardProps) {
  return (
    <aside className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
          Controle rapide
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          Le brouillon d&apos;intake reste local tant que `A3.3` n&apos;est pas branche.
        </h2>
      </div>

      <div className="grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">Etat</p>
          <p>{canStartHomework ? "Depart autorise" : "Depart bloque par le statut du compte"}</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">Titre</p>
          <p>{getReadinessLabel(titleReady)}</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">Matiere</p>
          <p>{getReadinessLabel(subjectReady)}</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">Sources</p>
          <p>
            {filesCount} fichier{filesCount > 1 ? "s" : ""} | {pastedTextLength} caracteres colles
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">Texte relu</p>
          <p>{extractionDraftLength} caracteres dans le panneau d&apos;edition</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">Limites</p>
          <p>
            {filesCount}/{INTAKE_MAX_ATTACHMENTS} fichiers | {formatBytes(totalBytes)} /
            {" "}
            {formatBytes(INTAKE_MAX_TOTAL_UPLOAD_BYTES)}
          </p>
        </div>
      </div>

      {reviewMessage ? (
        <p className="rounded-[1.25rem] border border-[rgba(203,95,44,0.24)] bg-[rgba(203,95,44,0.12)] px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]">
          {reviewMessage}
        </p>
      ) : null}
    </aside>
  );
}
