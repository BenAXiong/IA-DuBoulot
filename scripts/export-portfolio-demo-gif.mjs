import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  DEFAULT_ARTIFACT_ROOT,
  getRunPaths,
  resolveInside,
} from "./portfolio-demo/artifact-paths.mjs";
import { buildGifRenderCommands } from "./portfolio-demo/render-helpers.mjs";
import {
  describeArtifact,
  writeRunReport,
} from "./portfolio-demo/run-report.mjs";

const SCENE_ID_PATTERN = /^s\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseGifExportArgs(argv = process.argv.slice(2)) {
  const runId = argv
    .find((value) => value.startsWith("--run-id="))
    ?.slice("--run-id=".length);
  const sceneId = argv
    .find((value) => value.startsWith("--scene-id="))
    ?.slice("--scene-id=".length);

  if (!runId) {
    throw new Error("GIF export requires --run-id=<capture run id>.");
  }
  if (!sceneId || !SCENE_ID_PATTERN.test(sceneId)) {
    throw new Error(
      "GIF export requires --scene-id=<stable storyboard scene id>.",
    );
  }

  return { runId, sceneId };
}

export function resolveEditedSceneRange(timeline, sceneId) {
  if (!timeline?.edit || !Array.isArray(timeline.scenes)) {
    throw new Error("Scene timeline has not been rendered yet.");
  }

  const scene = timeline.scenes.find((candidate) => candidate.id === sceneId);
  if (!scene) {
    throw new Error(`Scene "${sceneId}" does not exist in the edited timeline.`);
  }
  if (
    !Number.isFinite(scene.editedStartSeconds) ||
    !Number.isFinite(scene.editedEndSeconds) ||
    scene.editedEndSeconds <= scene.editedStartSeconds
  ) {
    throw new Error(`Scene "${sceneId}" has an invalid edited time range.`);
  }

  return Object.freeze({
    sceneId,
    startSeconds: scene.editedStartSeconds,
    endSeconds: scene.editedEndSeconds,
  });
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(
        new Error(`${command} failed (${code}): ${stderr.slice(-1800)}`),
      );
    });
  });
}

async function gifMetadata(filePath) {
  const output = await runProcess("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,avg_frame_rate:format=duration",
    "-of",
    "json",
    filePath,
  ]);
  const parsed = JSON.parse(output);

  return {
    durationSeconds: Number(parsed.format?.duration ?? 0),
    width: parsed.streams?.[0]?.width ?? null,
    height: parsed.streams?.[0]?.height ?? null,
    frameRate: parsed.streams?.[0]?.avg_frame_rate ?? null,
  };
}

async function main() {
  const { runId, sceneId } = parseGifExportArgs();
  const runPaths = getRunPaths({
    runId,
    artifactRoot: DEFAULT_ARTIFACT_ROOT,
  });
  const [timeline, report] = await Promise.all([
    fs.readFile(runPaths.sceneTimelinePath, "utf8").then(JSON.parse),
    fs.readFile(runPaths.runReportPath, "utf8").then(JSON.parse),
  ]);
  const range = resolveEditedSceneRange(timeline, sceneId);
  const inputPath = resolveInside(
    runPaths.runDir,
    "rendered",
    "portfolio-demo-v1.mp4",
  );
  const outputPath = resolveInside(
    runPaths.runDir,
    "rendered",
    `${sceneId}.gif`,
  );
  const palettePath = resolveInside(
    runPaths.runDir,
    "rendered",
    `${sceneId}-palette.png`,
  );
  const commands = buildGifRenderCommands({
    runDir: runPaths.runDir,
    inputPath,
    outputPath,
    palettePath,
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds,
  });

  try {
    for (const command of commands) {
      await runProcess(command.command, command.args);
    }
  } finally {
    await fs.rm(palettePath, { force: true });
  }

  const metadata = await gifMetadata(outputPath);
  const artifact = await describeArtifact(runPaths.runDir, outputPath, {
    type: "scene-gif",
    sceneId,
    ...metadata,
  });
  const existingArtifacts = (report.artifacts ?? []).filter(
    (candidate) =>
      !(candidate.type === "scene-gif" && candidate.sceneId === sceneId),
  );
  await writeRunReport(runPaths.runReportPath, {
    ...report,
    artifacts: [...existingArtifacts, artifact],
    lastGifExportedAt: new Date().toISOString(),
  });

  console.log(
    JSON.stringify(
      {
        runId,
        sceneId,
        range,
        output: artifact.name,
        durationSeconds: metadata.durationSeconds,
        width: metadata.width,
        height: metadata.height,
        frameRate: metadata.frameRate,
        sha256: artifact.sha256,
      },
      null,
      2,
    ),
  );
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
