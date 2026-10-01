import path from "node:path";
import { resolveInside } from "./artifact-paths.mjs";

function finite(value, label) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative.`);
  return value;
}

function ffmpegText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%");
}

export function createEditedTimeline(rawTimeline, waitRetainSeconds = 1.5) {
  const waitStart = finite(rawTimeline.wait?.startSeconds, "wait start");
  const waitEnd = finite(rawTimeline.wait?.endSeconds, "wait end");
  const rawDuration = finite(rawTimeline.rawDurationSeconds, "raw duration");
  if (waitEnd <= waitStart || rawDuration <= waitEnd) {
    throw new Error("Raw timeline must contain a bounded provider wait before the final response.");
  }
  const retained = Math.min(waitRetainSeconds, waitEnd - waitStart);
  const targets = {
    "s01-matt-dashboard": 4,
    "s02-open-mathematics": 5,
    "s03-choose-source": 6,
    "s04-ask-question": 9,
    "s05-live-wait": retained,
    "live-wait": retained,
    "s06-plan-and-hint": 17,
    "s07-value-hold": 3,
  };
  let cursor = 0;
  const scenes = rawTimeline.scenes.map((scene) => {
    const targetSeconds = targets[scene.id];
    if (!Number.isFinite(targetSeconds)) throw new Error(`No edited duration is configured for ${scene.id}.`);
    const edited = {
      ...scene,
      id: scene.id === "live-wait" ? "s05-live-wait" : scene.id,
      targetSeconds,
      editedStartSeconds: cursor,
      editedEndSeconds: cursor + targetSeconds,
    };
    cursor += targetSeconds;
    return edited;
  });
  return {
    ...rawTimeline,
    edit: {
      waitRetainSeconds: retained,
      removedWaitSeconds: waitEnd - waitStart - retained,
      removedRawSeconds: rawDuration - cursor,
      durationSeconds: cursor,
    },
    scenes,
  };
}

export function buildEditedMp4Command({
  runDir,
  inputPath,
  outputPath,
  timeline,
  width = 1920,
  height = 1080,
  fps = 30,
} = {}) {
  const input = resolveInside(runDir, path.relative(runDir, path.resolve(inputPath)));
  const output = resolveInside(runDir, path.relative(runDir, path.resolve(outputPath)));
  const parts = [];
  const labels = [];
  let partIndex = 0;
  for (const scene of timeline.scenes) {
    const rawDuration = scene.rawEndSeconds - scene.rawStartSeconds;
    if (scene.id === "s05-live-wait") {
      const half = scene.targetSeconds / 2;
      parts.push(`[0:v]trim=start=${scene.rawStartSeconds.toFixed(3)}:end=${(scene.rawStartSeconds + half).toFixed(3)},setpts=PTS-STARTPTS[v${partIndex}]`);
      labels.push(`[v${partIndex}]`);
      partIndex += 1;
      parts.push(`[0:v]trim=start=${Math.max(scene.rawStartSeconds, scene.rawEndSeconds - half).toFixed(3)}:end=${scene.rawEndSeconds.toFixed(3)},setpts=PTS-STARTPTS[v${partIndex}]`);
      labels.push(`[v${partIndex}]`);
      partIndex += 1;
      continue;
    }
    let rawStart = scene.rawStartSeconds;
    let rawEnd = scene.rawEndSeconds;
    let adjustment = "";
    if (scene.id === "s01-matt-dashboard" && rawDuration > scene.targetSeconds) {
      rawStart = rawEnd - scene.targetSeconds;
    } else if (rawDuration > scene.targetSeconds) {
      adjustment = `,setpts=${(scene.targetSeconds / rawDuration).toFixed(6)}*PTS`;
    } else if (rawDuration < scene.targetSeconds) {
      adjustment = `,tpad=stop_mode=clone:stop_duration=${(scene.targetSeconds - rawDuration).toFixed(3)}`;
    }
    parts.push(`[0:v]trim=start=${rawStart.toFixed(3)}:end=${rawEnd.toFixed(3)},setpts=PTS-STARTPTS${adjustment}[v${partIndex}]`);
    labels.push(`[v${partIndex}]`);
    partIndex += 1;
  }
  const overlayFilters = timeline.scenes
    .filter((scene) => scene.overlay && scene.editedEndSeconds > scene.editedStartSeconds)
    .map((scene) =>
      `drawbox=x=96:y=h-190:w=iw-192:h=102:color=black@0.62:t=fill:enable='between(t,${scene.editedStartSeconds.toFixed(3)},${scene.editedEndSeconds.toFixed(3)})',` +
      `drawtext=text='${ffmpegText(scene.overlay)}':fontcolor=white:fontsize=38:x=132:y=h-154:enable='between(t,${scene.editedStartSeconds.toFixed(3)},${scene.editedEndSeconds.toFixed(3)})'`,
    );
  const filters = [
    ...parts,
    `${labels.join("")}concat=n=${labels.length}:v=1:a=0,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${fps}${overlayFilters.length ? `,${overlayFilters.join(",")}` : ""}[outv]`,
  ].join(";");
  return {
    command: "ffmpeg",
    args: [
      "-y", "-i", input, "-filter_complex", filters, "-map", "[outv]",
      "-c:v", "libx264", "-preset", "medium", "-crf", "20",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", output,
    ],
  };
}

export function buildOverlayMp4Command({ runDir, inputPath, outputPath, timeline } = {}) {
  const input = resolveInside(runDir, path.relative(runDir, path.resolve(inputPath)));
  const output = resolveInside(runDir, path.relative(runDir, path.resolve(outputPath)));
  const filters = timeline.scenes
    .filter((scene) => scene.overlay)
    .flatMap((scene) => [
      `drawbox=x=96:y=h-190:w=iw-192:h=102:color=black@0.62:t=fill:enable='between(t,${scene.editedStartSeconds.toFixed(3)},${scene.editedEndSeconds.toFixed(3)})'`,
      `drawtext=text='${ffmpegText(scene.overlay)}':fontcolor=white:fontsize=38:x=132:y=h-154:enable='between(t,${scene.editedStartSeconds.toFixed(3)},${scene.editedEndSeconds.toFixed(3)})'`,
    ]);
  return {
    command: "ffmpeg",
    args: [
      "-y", "-i", input, "-vf", filters.join(","), "-an",
      "-c:v", "libx264", "-preset", "medium", "-crf", "20",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", output,
    ],
  };
}

function assTime(seconds) {
  const centiseconds = Math.round(seconds * 100);
  const hours = Math.floor(centiseconds / 360000);
  const minutes = Math.floor((centiseconds % 360000) / 6000);
  const secs = Math.floor((centiseconds % 6000) / 100);
  const cents = centiseconds % 100;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(cents).padStart(2, "0")}`;
}

function wrapAssText(text, maximum = 58) {
  const words = String(text).split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const current = lines.at(-1);
    if (current && `${current} ${word}`.length > maximum && lines.length < 2) lines.push(word);
    else lines[lines.length - 1] = current ? `${current} ${word}` : word;
  }
  return lines.join("\\N").replace(/[{}]/g, "");
}

export function buildAssOverlayDocument(timeline) {
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1920",
    "PlayResY: 1080",
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Overlay,Segoe UI,38,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB0000000,0,0,0,0,100,100,0,0,3,14,0,1,112,112,92,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const events = timeline.scenes
    .filter((scene) => scene.overlay)
    .map((scene) => `Dialogue: 0,${assTime(scene.editedStartSeconds)},${assTime(scene.editedEndSeconds)},Overlay,,0,0,0,,${wrapAssText(scene.overlay)}`);
  return `${[...header, ...events].join("\n")}\n`;
}

export function buildAssOverlayMp4Command({ runDir, inputPath, outputPath, subtitlePath } = {}) {
  const input = resolveInside(runDir, path.relative(runDir, path.resolve(inputPath)));
  const output = resolveInside(runDir, path.relative(runDir, path.resolve(outputPath)));
  const subtitles = resolveInside(runDir, path.relative(runDir, path.resolve(subtitlePath)));
  const escapedSubtitles = subtitles.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
  return {
    command: "ffmpeg",
    args: [
      "-y", "-i", input, "-vf", `ass=filename='${escapedSubtitles}'`, "-an",
      "-c:v", "libx264", "-preset", "medium", "-crf", "20",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", output,
    ],
  };
}
