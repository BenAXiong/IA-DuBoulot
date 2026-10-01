import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { prepareRunDirectories } from "./artifact-paths.mjs";

const DEFAULT_MINIMUM_FREE_BYTES = 2 * 1024 * 1024 * 1024;

export function normalizeCaptureTarget(targetUrl) {
  const parsed = new URL(targetUrl);

  if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
    throw new Error("Capture target must use http or https.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Capture target must not contain credentials.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLoopback =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname);

  if (parsed.protocol === "http:" && !isLoopback) {
    throw new Error("Remote capture targets must use https.");
  }

  return Object.freeze({
    origin: parsed.origin,
    protocol: parsed.protocol,
    isSecure: parsed.protocol === "https:",
    isLoopback,
  });
}

async function commandSucceeds(command, args = ["-version"]) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: false,
      stdio: "ignore",
      windowsHide: true,
    });
    child.once("error", () => resolve(false));
    child.once("exit", (code) => resolve(code === 0));
  });
}

export async function probePlaywrightRuntime() {
  try {
    const coreEntrypoint = fileURLToPath(import.meta.resolve("playwright-core"));
    const registryModulePath = path.join(
      path.dirname(coreEntrypoint),
      "lib",
      "server",
      "registry",
      "index.js",
    );
    const { registry } = await import(pathToFileURL(registryModulePath).href);

    function isReady(name) {
      try {
        registry.findExecutable(name).executablePathOrDie("javascript");
        return true;
      } catch {
        return false;
      }
    }

    return Object.freeze({
      chromeReady: isReady("chrome"),
      recordingHelperReady: isReady("ffmpeg"),
    });
  } catch {
    return Object.freeze({
      chromeReady: false,
      recordingHelperReady: false,
    });
  }
}

async function checkFreeSpace(targetPath, minimumFreeBytes) {
  const stats = await fs.statfs(targetPath);
  const availableBytes = Number(stats.bavail) * Number(stats.bsize);

  return {
    passed: availableBytes >= minimumFreeBytes,
    availableBytes,
    minimumFreeBytes,
  };
}

function result(id, passed, detail) {
  return Object.freeze({ id, passed, detail });
}

export async function runPreflight({
  targetUrl,
  deployRevision,
  requiredEnvNames = [],
  runPaths,
  minimumFreeBytes = DEFAULT_MINIMUM_FREE_BYTES,
  commandProbe = commandSucceeds,
  playwrightRuntimeProbe = probePlaywrightRuntime,
  environment = process.env,
} = {}) {
  if (!runPaths) {
    throw new Error("runPaths are required so preflight output stays inside one run.");
  }

  const target = normalizeCaptureTarget(targetUrl);
  await prepareRunDirectories(runPaths);

  const checks = [];
  checks.push(
    result(
      "target-url",
      true,
      `Capture origin is ${target.origin}; query parameters are intentionally omitted.`,
    ),
  );
  checks.push(
    result(
      "deploy-revision",
      typeof deployRevision === "string" && deployRevision.trim().length >= 7,
      "A source/deploy revision of at least seven characters is required.",
    ),
  );

  for (const name of requiredEnvNames) {
    checks.push(
      result(
        `environment:${name}`,
        typeof environment[name] === "string" && environment[name].length > 0,
        `Environment variable ${name} is ${environment[name] ? "present" : "missing"}; its value is never reported.`,
      ),
    );
  }

  const freeSpace = await checkFreeSpace(runPaths.runDir, minimumFreeBytes);
  checks.push(
    result(
      "free-disk",
      freeSpace.passed,
      `Available bytes: ${freeSpace.availableBytes}; required bytes: ${freeSpace.minimumFreeBytes}.`,
    ),
  );

  const [ffmpegReady, ffprobeReady, playwrightRuntime] = await Promise.all([
    commandProbe("ffmpeg", ["-version"]),
    commandProbe("ffprobe", ["-version"]),
    playwrightRuntimeProbe(),
  ]);
  checks.push(result("ffmpeg", ffmpegReady, "FFmpeg is available on PATH."));
  checks.push(result("ffprobe", ffprobeReady, "ffprobe is available on PATH."));
  checks.push(
    result(
      "chrome-channel",
      playwrightRuntime.chromeReady,
      "Google Chrome is discoverable through Playwright's browser registry.",
    ),
  );
  checks.push(
    result(
      "playwright-recording-helper",
      playwrightRuntime.recordingHelperReady,
      "Playwright's managed FFmpeg recording helper is installed.",
    ),
  );

  const failedCheckIds = checks
    .filter((check) => !check.passed)
    .map((check) => check.id);

  return Object.freeze({
    schemaVersion: 1,
    passed: failedCheckIds.length === 0,
    captureOrigin: target.origin,
    artifactRootName: path.basename(runPaths.artifactRoot),
    checks: Object.freeze(checks),
    failedCheckIds: Object.freeze(failedCheckIds),
  });
}
