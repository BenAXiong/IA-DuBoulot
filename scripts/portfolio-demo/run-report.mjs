import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { toArtifactName } from "./artifact-paths.mjs";

const REDACTED_KEY_PATTERN = /(password|secret|token|key|credential|authorization|cookie)/i;
const ABSOLUTE_PATH_PATTERN = /^(?:[a-zA-Z]:[\\/]|\\\\|\/|file:\/\/)/i;

export async function hashFile(filePath) {
  const bytes = await fs.readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

export function redactReportValue(value, key = "") {
  if (REDACTED_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactReportValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        redactReportValue(childValue, childKey),
      ]),
    );
  }

  if (typeof value === "string" && ABSOLUTE_PATH_PATTERN.test(value)) {
    return "[private-path-redacted]";
  }

  return value;
}

export function buildRunReport({
  runId,
  sourceRevision,
  deployRevision,
  captureOrigin,
  storyboard,
  viewport,
  selectedResource,
  providerEvidence,
  acceptance,
  retryCount,
  timings,
  artifacts = [],
  startedAt,
  completedAt,
} = {}) {
  return redactReportValue({
    schemaVersion: 1,
    runId,
    sourceRevision,
    deployRevision,
    captureOrigin,
    storyboard: {
      id: storyboard?.id,
      schemaVersion: storyboard?.schemaVersion,
    },
    viewport,
    selectedResource,
    providerEvidence,
    acceptance,
    retryCount,
    timings,
    artifacts,
    startedAt,
    completedAt,
  });
}

export async function describeArtifact(runDir, artifactPath, media = {}) {
  const stats = await fs.stat(artifactPath);

  return Object.freeze({
    ...redactReportValue(media),
    name: toArtifactName(runDir, artifactPath),
    bytes: stats.size,
    sha256: await hashFile(artifactPath),
  });
}

export async function writeRunReport(reportPath, report) {
  const directory = path.dirname(reportPath);
  const temporaryPath = `${reportPath}.tmp`;
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    temporaryPath,
    `${JSON.stringify(redactReportValue(report), null, 2)}\n`,
    "utf8",
  );
  await fs.rename(temporaryPath, reportPath);
  return reportPath;
}
