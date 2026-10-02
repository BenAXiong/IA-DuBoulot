import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { DEFAULT_ARTIFACT_ROOT, getRunPaths, resolveInside } from "./portfolio-demo/artifact-paths.mjs";
import { buildAssOverlayDocument, buildAssOverlayMp4Command, createEditedTimeline } from "./portfolio-demo/render-plan.mjs";
import { describeArtifact, writeRunReport } from "./portfolio-demo/run-report.mjs";
import { PORTFOLIO_DEMO_EDIT } from "./portfolio-demo/storyboard.mjs";

export function parseRenderArgs(argv = process.argv.slice(2)) {
  const runId = argv.find((value) => value.startsWith("--run-id="))?.slice("--run-id=".length);
  if (!runId) throw new Error("Render requires --run-id=<capture run id>.");
  return { runId };
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(`${command} failed (${code}): ${stderr.slice(-1800)}`)));
  });
}

async function mediaMetadata(filePath) {
  const output = await runProcess("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,avg_frame_rate:format=duration",
    "-of", "json", filePath,
  ]);
  const parsed = JSON.parse(output);
  return {
    durationSeconds: Number(parsed.format?.duration ?? 0),
    width: parsed.streams?.[0]?.width ?? null,
    height: parsed.streams?.[0]?.height ?? null,
    frameRate: parsed.streams?.[0]?.avg_frame_rate ?? null,
  };
}

async function renderSegments(rawPath, runPaths, timeline, viewport) {
  const segmentDir = resolveInside(runPaths.renderedDir, "segments");
  await fs.mkdir(segmentDir, { recursive: true });
  const segmentPaths = [];
  const crop = `crop=${viewport.width}:${viewport.height}:0:0`;
  for (const [index, scene] of timeline.scenes.entries()) {
    const segmentPath = resolveInside(segmentDir, `${String(index + 1).padStart(2, "0")}-${scene.id}.mp4`);
    const rawDuration = scene.rawEndSeconds - scene.rawStartSeconds;
    let filter;
    if (scene.id === "s05-live-wait") {
      const half = scene.targetSeconds / 2;
      filter = [
        `[0:v]trim=start=${scene.rawStartSeconds.toFixed(3)}:end=${(scene.rawStartSeconds + half).toFixed(3)},setpts=PTS-STARTPTS[a]`,
        `[0:v]trim=start=${Math.max(scene.rawStartSeconds, scene.rawEndSeconds - half).toFixed(3)}:end=${scene.rawEndSeconds.toFixed(3)},setpts=PTS-STARTPTS[b]`,
        `[a][b]concat=n=2:v=1:a=0,${crop},scale=1920:1080,fps=30[outv]`,
      ].join(";");
      await runProcess("ffmpeg", ["-y", "-i", rawPath, "-filter_complex", filter, "-map", "[outv]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", segmentPath]);
    } else {
      let start = scene.rawStartSeconds;
      let duration = rawDuration;
      let adjustment = "";
      if (scene.id === "s01-matt-dashboard" && rawDuration > scene.targetSeconds) {
        start = scene.rawEndSeconds - scene.targetSeconds;
        duration = scene.targetSeconds;
      } else if (rawDuration > scene.targetSeconds) {
        adjustment = `,setpts=${(scene.targetSeconds / rawDuration).toFixed(6)}*PTS`;
      } else if (rawDuration < scene.targetSeconds) {
        adjustment = `,tpad=stop_mode=clone:stop_duration=${(scene.targetSeconds - rawDuration).toFixed(3)}`;
      }
      filter = `${crop},scale=1920:1080,fps=30,setpts=PTS-STARTPTS${adjustment}`;
      await runProcess("ffmpeg", ["-y", "-ss", start.toFixed(3), "-t", duration.toFixed(3), "-i", rawPath, "-vf", filter, "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", segmentPath]);
    }
    segmentPaths.push(segmentPath);
  }
  const concatPath = resolveInside(segmentDir, "concat.txt");
  await fs.writeFile(concatPath, `${segmentPaths.map((value) => `file '${value.replace(/\\/g, "/")}'`).join("\n")}\n`, "utf8");
  const joinedPath = resolveInside(runPaths.renderedDir, "portfolio-demo-v1-no-overlays.mp4");
  await runProcess("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", "-movflags", "+faststart", joinedPath]);
  return { joinedPath, segmentDir };
}

async function main() {
  const { runId } = parseRenderArgs();
  const runPaths = getRunPaths({ runId, artifactRoot: DEFAULT_ARTIFACT_ROOT });
  const [rawTimeline, report] = await Promise.all([
    fs.readFile(runPaths.sceneTimelinePath, "utf8").then(JSON.parse),
    fs.readFile(runPaths.runReportPath, "utf8").then(JSON.parse),
  ]);
  const editedTimeline = createEditedTimeline(rawTimeline, PORTFOLIO_DEMO_EDIT.waitRetainSeconds);
  if (
    editedTimeline.edit.durationSeconds < PORTFOLIO_DEMO_EDIT.minimumDurationSeconds ||
    editedTimeline.edit.durationSeconds > PORTFOLIO_DEMO_EDIT.maximumDurationSeconds
  ) {
    throw new Error(
      `Edited duration ${editedTimeline.edit.durationSeconds.toFixed(2)}s is outside the locked ${PORTFOLIO_DEMO_EDIT.minimumDurationSeconds}-${PORTFOLIO_DEMO_EDIT.maximumDurationSeconds}s range.`,
    );
  }
  const rawPath = resolveInside(runPaths.runDir, `raw/take-${report.acceptedTake}.webm`);
  const outputPath = resolveInside(runPaths.runDir, "rendered/portfolio-demo-v1.mp4");
  const { joinedPath, segmentDir } = await renderSegments(rawPath, runPaths, editedTimeline, report.viewport);
  const subtitlePath = resolveInside(runPaths.manifestsDir, "overlays.ass");
  await fs.writeFile(subtitlePath, buildAssOverlayDocument(editedTimeline), "utf8");
  const command = buildAssOverlayMp4Command({ runDir: runPaths.runDir, inputPath: joinedPath, outputPath, subtitlePath });
  await runProcess(command.command, command.args);
  const [metadata, cleanMetadata] = await Promise.all([
    mediaMetadata(outputPath),
    mediaMetadata(joinedPath),
  ]);
  if (metadata.width !== 1920 || metadata.height !== 1080) {
    throw new Error(`Rendered video is ${metadata.width}x${metadata.height}, expected 1920x1080.`);
  }
  const renderedArtifact = await describeArtifact(runPaths.runDir, outputPath, {
    type: "edited-mp4",
    ...metadata,
  });
  const cleanArtifact = await describeArtifact(runPaths.runDir, joinedPath, {
    type: "edited-mp4-clean",
    ...cleanMetadata,
  });
  await writeRunReport(runPaths.sceneTimelinePath, editedTimeline);
  await writeRunReport(runPaths.runReportPath, {
    ...report,
    timings: editedTimeline.edit,
    artifacts: [
      ...(report.artifacts ?? []).filter(
        (artifact) => artifact.type !== "edited-mp4" && artifact.type !== "edited-mp4-clean",
      ),
      renderedArtifact,
      cleanArtifact,
    ],
    renderedAt: new Date().toISOString(),
  });
  await fs.rm(segmentDir, { recursive: true, force: true });
  console.log(JSON.stringify({
    runId,
    output: renderedArtifact.name,
    cleanOutput: cleanArtifact.name,
    ...metadata,
    sha256: renderedArtifact.sha256,
  }, null, 2));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
