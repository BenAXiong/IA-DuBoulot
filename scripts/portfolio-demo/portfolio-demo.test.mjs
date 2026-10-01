import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  evaluateCoachingResponse,
  MATT_FRACTIONS_ACCEPTANCE_CONTRACT,
} from "./acceptance-contract.mjs";
import {
  createRunId,
  getRunPaths,
  resolveInside,
} from "./artifact-paths.mjs";
import {
  assertStoryboardLocators,
  createLocatorAdapter,
} from "./locators.mjs";
import { normalizeCaptureTarget, runPreflight } from "./preflight.mjs";
import {
  buildGifRenderCommands,
  buildMp4RenderCommand,
} from "./render-helpers.mjs";
import { buildRunReport, redactReportValue } from "./run-report.mjs";
import { validateStoryboard } from "./storyboard-schema.mjs";

function validStoryboard() {
  return {
    schemaVersion: 1,
    id: "matt-demo",
    title: "Matt demo",
    scenes: [
      {
        id: "homework",
        title: "Start homework",
        purpose: "Open a new Mathematics conversation.",
        actions: [
          { type: "navigate", path: "/app?view=homework" },
          { type: "click", target: "homework.mathSubject" },
          {
            type: "fill",
            target: "homework.question",
            valueRef: "inputs.mattQuestion",
          },
          { type: "checkpoint", name: "question-ready" },
        ],
      },
    ],
  };
}

test("storyboard validation keeps data and locators separate", () => {
  const storyboard = validateStoryboard(validStoryboard());
  assert.equal(storyboard.scenes[0].actions[2].valueRef, "inputs.mattQuestion");

  const embeddedValue = validStoryboard();
  embeddedValue.scenes[0].actions[2].value = "secret or mutable input";
  assert.throws(() => validateStoryboard(embeddedValue), /reference input data/i);
});

test("locator adapter detects unresolved storyboard keys", () => {
  const incomplete = createLocatorAdapter({
    "homework.mathSubject": (page) => page.subject,
  });
  assert.throws(
    () => assertStoryboardLocators(validStoryboard(), incomplete),
    /homework\.question/,
  );

  const complete = createLocatorAdapter({
    "homework.mathSubject": (page) => page.subject,
    "homework.question": (page) => page.question,
  });
  assert.deepEqual(assertStoryboardLocators(validStoryboard(), complete).missing, []);
});

test("Matt acceptance contract approves coaching and rejects answer dumping", () => {
  const coaching = evaluateCoachingResponse(
    "For exercise b, let's use 6/14 and 12/21. Step 1: simplify both fractions, check the denominators, then add. First hint: what number divides both 6 and 14?",
    MATT_FRACTIONS_ACCEPTANCE_CONTRACT,
  );
  assert.equal(coaching.accepted, true);

  const disclosures = [
    "The answer is 1.",
    "The sum comes to 1.",
    "That makes one whole.",
    "3/7 + 4/7 is one whole.",
    "The answer: 1.",
    "It is 1.",
  ];

  for (const disclosure of disclosures) {
    const dumping = evaluateCoachingResponse(
      `Exercise b uses 6/14 and 12/21. Plan: simplify both fractions and add them. First hint: what divides 6 and 14? ${disclosure}`,
      MATT_FRACTIONS_ACCEPTANCE_CONTRACT,
    );
    assert.equal(dumping.accepted, false, disclosure);
    assert.ok(dumping.failedCheckIds.includes("states-final-answer"), disclosure);
  }
});

test("artifact paths cannot escape their run directory", () => {
  const root = path.join(os.tmpdir(), "portfolio-demo-tests");
  const runId = createRunId({
    now: new Date("2026-10-01T12:34:56.000Z"),
    suffix: "test",
  });
  const paths = getRunPaths({ runId, artifactRoot: root });
  assert.match(paths.runDir, /20261001T123456Z-test$/);
  assert.throws(() => resolveInside(paths.runDir, "..", "escape"), /inside/);
});

test("render helpers create MP4 and palette GIF commands inside a run", () => {
  const runDir = path.join(os.tmpdir(), "portfolio-demo-render-test");
  const inputPath = path.join(runDir, "raw", "take.webm");
  const mp4Path = path.join(runDir, "rendered", "demo.mp4");
  const gifPath = path.join(runDir, "rendered", "coach.gif");
  const palettePath = path.join(runDir, "rendered", "coach-palette.png");

  const mp4 = buildMp4RenderCommand({ runDir, inputPath, outputPath: mp4Path });
  assert.equal(mp4.command, "ffmpeg");
  assert.ok(mp4.args.includes("libx264"));

  const gif = buildGifRenderCommands({
    runDir,
    inputPath,
    outputPath: gifPath,
    palettePath,
    startSeconds: 0,
    endSeconds: 5,
  });
  assert.equal(gif.length, 2);
  assert.match(gif[0].args.join(" "), /palettegen/);
  assert.match(gif[1].args.join(" "), /paletteuse/);
});

test("run reports redact credentials and private absolute paths", () => {
  const report = buildRunReport({
    runId: "20261001T123456Z-test",
    sourceRevision: "abcdef0",
    deployRevision: "abcdef0",
    captureOrigin: "https://example.test",
    storyboard: validStoryboard(),
    viewport: { width: 1920, height: 1080 },
    providerEvidence: { apiToken: "do-not-write", model: "example" },
    artifacts: [
      { sourcePath: "C:\\Users\\Someone\\private.webm" },
      { sourcePath: "\\\\server\\private\\take.webm" },
      { sourcePath: "file:///C:/Users/Someone/private.webm" },
    ],
  });
  assert.equal(report.providerEvidence.apiToken, "[redacted]");
  assert.equal(report.artifacts[0].sourcePath, "[private-path-redacted]");
  assert.equal(report.artifacts[1].sourcePath, "[private-path-redacted]");
  assert.equal(report.artifacts[2].sourcePath, "[private-path-redacted]");
  assert.equal(redactReportValue({ cookie: "secret" }).cookie, "[redacted]");
});

test("capture targets require https except on loopback hosts", () => {
  assert.equal(normalizeCaptureTarget("http://localhost:3000/app").isLoopback, true);
  assert.equal(normalizeCaptureTarget("http://127.0.0.1:3000/app").isLoopback, true);
  assert.equal(normalizeCaptureTarget("http://[::1]:3000/app").isLoopback, true);
  assert.equal(normalizeCaptureTarget("https://example.test/app").isSecure, true);
  assert.throws(
    () => normalizeCaptureTarget("http://example.test/app"),
    /must use https/i,
  );
});

test("preflight reports presence without exposing environment values", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-preflight-"));
  const runPaths = getRunPaths({
    runId: "20261001T123456Z-test",
    artifactRoot: root,
  });
  const report = await runPreflight({
    targetUrl: "https://example.test/app?private=value",
    deployRevision: "abcdef0",
    requiredEnvNames: ["DEMO_PASSWORD"],
    runPaths,
    minimumFreeBytes: 1,
    commandProbe: async () => true,
    playwrightRuntimeProbe: async () => ({
      chromeReady: true,
      recordingHelperReady: true,
    }),
    environment: { DEMO_PASSWORD: "do-not-report" },
  });

  assert.equal(normalizeCaptureTarget("https://example.test/path").origin, "https://example.test");
  assert.equal(report.captureOrigin, "https://example.test");
  assert.doesNotMatch(JSON.stringify(report), /do-not-report|private=value/);
});
