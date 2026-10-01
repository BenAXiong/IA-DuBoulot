import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(moduleDir, "..", "..");
export const DEFAULT_ARTIFACT_ROOT = path.join(
  REPO_ROOT,
  "artifacts",
  "portfolio-demo",
);

const RUN_ID_PATTERN = /^\d{8}T\d{6}Z-[a-z0-9][a-z0-9-]{0,47}$/;

export function createRunId({ now = new Date(), suffix = "capture" } = {}) {
  const normalizedSuffix = String(suffix)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  if (!normalizedSuffix) {
    throw new Error("Run suffix must contain at least one letter or number.");
  }

  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  return `${timestamp}-${normalizedSuffix}`;
}

export function assertRunId(runId) {
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error(
      "Run ID must match YYYYMMDDTHHMMSSZ followed by a lowercase slug.",
    );
  }

  return runId;
}

export function resolveInside(parentDir, ...segments) {
  const parent = path.resolve(parentDir);
  const resolved = path.resolve(parent, ...segments);
  const relative = path.relative(parent, resolved);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return resolved;
  }

  throw new Error("Artifact path must stay inside its assigned run directory.");
}

export function getRunPaths({
  runId,
  artifactRoot = DEFAULT_ARTIFACT_ROOT,
} = {}) {
  assertRunId(runId);
  const runDir = resolveInside(artifactRoot, runId);

  return Object.freeze({
    artifactRoot: path.resolve(artifactRoot),
    runDir,
    rawDir: resolveInside(runDir, "raw"),
    screenshotsDir: resolveInside(runDir, "screenshots"),
    renderedDir: resolveInside(runDir, "rendered"),
    manifestsDir: resolveInside(runDir, "manifests"),
    runReportPath: resolveInside(runDir, "manifests", "run-report.json"),
    sceneTimelinePath: resolveInside(runDir, "manifests", "scene-timeline.json"),
  });
}

export async function prepareRunDirectories(runPaths) {
  for (const directory of [
    runPaths.rawDir,
    runPaths.screenshotsDir,
    runPaths.renderedDir,
    runPaths.manifestsDir,
  ]) {
    await fs.mkdir(directory, { recursive: true });
  }

  return runPaths;
}

export function toArtifactName(runDir, artifactPath) {
  const relative = path.relative(path.resolve(runDir), path.resolve(artifactPath));

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Reported artifact must be a file inside the current run.");
  }

  return relative.split(path.sep).join("/");
}
