import path from "node:path";
import { resolveInside } from "./artifact-paths.mjs";

function assertPositiveNumber(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
}

function assertNonNegativeNumber(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
}

function assertArtifactPath(runDir, candidate, label) {
  const resolved = path.resolve(candidate);
  const guarded = resolveInside(runDir, path.relative(runDir, resolved));

  if (guarded !== resolved) {
    throw new Error(`${label} must stay inside the run directory.`);
  }

  return resolved;
}

export function buildMp4RenderCommand({
  runDir,
  inputPath,
  outputPath,
  width = 1920,
  height = 1080,
  fps = 30,
  crf = 20,
} = {}) {
  assertPositiveNumber(width, "width");
  assertPositiveNumber(height, "height");
  assertPositiveNumber(fps, "fps");
  assertPositiveNumber(crf, "crf");

  const input = assertArtifactPath(runDir, inputPath, "inputPath");
  const output = assertArtifactPath(runDir, outputPath, "outputPath");

  return Object.freeze({
    command: "ffmpeg",
    args: Object.freeze([
      "-y",
      "-i",
      input,
      "-vf",
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${fps}`,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      output,
    ]),
  });
}

export function buildGifRenderCommands({
  runDir,
  inputPath,
  outputPath,
  palettePath,
  startSeconds,
  endSeconds,
  width = 960,
  fps = 12,
} = {}) {
  assertNonNegativeNumber(startSeconds, "startSeconds");
  assertPositiveNumber(endSeconds, "endSeconds");
  assertPositiveNumber(width, "width");
  assertPositiveNumber(fps, "fps");

  if (endSeconds <= startSeconds) {
    throw new Error("endSeconds must be greater than startSeconds.");
  }

  const input = assertArtifactPath(runDir, inputPath, "inputPath");
  const output = assertArtifactPath(runDir, outputPath, "outputPath");
  const palette = assertArtifactPath(runDir, palettePath, "palettePath");
  const duration = endSeconds - startSeconds;
  const filter = `fps=${fps},scale=${width}:-1:flags=lanczos`;

  return Object.freeze([
    Object.freeze({
      command: "ffmpeg",
      args: Object.freeze([
        "-y",
        "-ss",
        String(startSeconds),
        "-t",
        String(duration),
        "-i",
        input,
        "-vf",
        `${filter},palettegen=stats_mode=diff`,
        palette,
      ]),
    }),
    Object.freeze({
      command: "ffmpeg",
      args: Object.freeze([
        "-y",
        "-ss",
        String(startSeconds),
        "-t",
        String(duration),
        "-i",
        input,
        "-i",
        palette,
        "-lavfi",
        `${filter}[x];[x][1:v]paletteuse=dither=sierra2_4a`,
        "-loop",
        "0",
        output,
      ]),
    }),
  ]);
}
