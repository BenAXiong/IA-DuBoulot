import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import {
  createRunId,
  getRunPaths,
  prepareRunDirectories,
  resolveInside,
} from "./portfolio-demo/artifact-paths.mjs";
import { evaluateCoachingResponse } from "./portfolio-demo/acceptance-contract.mjs";
import { CAPTURE_OVERLAY_INIT_SCRIPT } from "./portfolio-demo/capture-overlay.mjs";
import {
  authenticateTaggedMatt,
  browserCookies,
  createHostedDemoClients,
  loadDemoBaseline,
  removeDemoConversation,
  restoreAndVerifyBaseline,
} from "./portfolio-demo/hosted-demo-state.mjs";
import { assertStoryboardLocators } from "./portfolio-demo/locators.mjs";
import { normalizeCaptureTarget, runPreflight } from "./portfolio-demo/preflight.mjs";
import { createPortfolioRecorderLocators } from "./portfolio-demo/recorder-locators.mjs";
import { describeArtifact, writeRunReport } from "./portfolio-demo/run-report.mjs";
import {
  PORTFOLIO_DEMO_EDIT,
  PORTFOLIO_DEMO_QUESTION,
  PORTFOLIO_DEMO_RESOURCE,
  PORTFOLIO_DEMO_STORYBOARD,
} from "./portfolio-demo/storyboard.mjs";

const REQUIRED_ENV = [
  "PORTFOLIO_DEMO_APP_URL",
  "PORTFOLIO_DEMO_EMAIL",
  "PORTFOLIO_DEMO_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function parseRecorderArgs(argv = process.argv.slice(2)) {
  if (!argv.includes("--confirm-hosted-write")) {
    throw new Error("Hosted recording writes are disabled. Add --confirm-hosted-write after reviewing the Matt account.");
  }
  const maxRaw = argv.find((value) => value.startsWith("--max-attempts="))?.split("=")[1] ?? "3";
  if (!/^[1-3]$/.test(maxRaw)) throw new Error("--max-attempts must be an integer from 1 to 3.");
  return { maxAttempts: Number(maxRaw) };
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(`${command} failed (${code}): ${stderr.slice(-1200)}`)));
  });
}

async function gitRevision() {
  return run("git", ["rev-parse", "HEAD"], process.cwd());
}

function secondsSince(startedAt) {
  return Number(((Date.now() - startedAt) / 1000).toFixed(3));
}

async function hold(milliseconds) {
  if (milliseconds > 0) await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function captureAttempt({ attempt, browser, config, cookies, runPaths, admin, baseline }) {
  const attemptDir = resolveInside(runPaths.rawDir, `attempt-${attempt}`);
  await fs.mkdir(attemptDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: PORTFOLIO_DEMO_EDIT.captureWidth, height: PORTFOLIO_DEMO_EDIT.captureHeight },
    colorScheme: PORTFOLIO_DEMO_EDIT.theme,
    locale: "en-US",
    recordVideo: {
      dir: attemptDir,
      size: { width: PORTFOLIO_DEMO_EDIT.captureWidth, height: PORTFOLIO_DEMO_EDIT.captureHeight },
    },
  });
  await context.addCookies(cookies);
  await context.addInitScript((theme) => {
    window.localStorage.setItem("iadb-theme", theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, PORTFOLIO_DEMO_EDIT.theme);
  await context.addInitScript(CAPTURE_OVERLAY_INIT_SCRIPT);
  const page = await context.newPage();
  const video = page.video();
  const locatorAdapter = createPortfolioRecorderLocators();
  assertStoryboardLocators(PORTFOLIO_DEMO_STORYBOARD, locatorAdapter);
  const startedAt = Date.now();
  const scenes = [];
  let conversationId = null;
  let responsePayload = null;
  let accepted = false;
  let providerEvidence = null;
  let acceptance = null;

  const scene = async (id, action) => {
    const definition = PORTFOLIO_DEMO_STORYBOARD.scenes.find((item) => item.id === id);
    const rawStartSeconds = secondsSince(startedAt);
    await action();
    await hold(definition?.holdMs ?? 0);
    const rawEndSeconds = secondsSince(startedAt);
    scenes.push({ id, title: definition?.title, overlay: definition?.overlay, rawStartSeconds, rawEndSeconds });
    await page.screenshot({ path: resolveInside(runPaths.screenshotsDir, `take-${attempt}-${String(scenes.length).padStart(2, "0")}-${id}.png`) });
  };

  try {
    await scene("s01-matt-dashboard", async () => {
      await page.goto(`${config.appOrigin}/app`, { waitUntil: "networkidle" });
      await locatorAdapter.resolve(page, "dashboard.heading").waitFor({ state: "visible" });
      await page.mouse.move(1020, 470, { steps: 18 });
    });
    await scene("s02-open-mathematics", async () => {
      await locatorAdapter.resolve(page, "dashboard.mathematics").click();
      await page.waitForURL(/view=homework.*subject=mathematiques|subject=mathematiques.*view=homework/);
      await locatorAdapter.resolve(page, "homework.question").waitFor({ state: "visible" });
      await locatorAdapter.resolve(page, "homework.sourcesTab").click();
      await page.getByText("fractions_add_prod.pdf", { exact: true }).waitFor({ state: "visible" });
      await page.getByText("fractions.pdf", { exact: true }).waitFor({ state: "visible" });
      await page.getByText("equations.pdf", { exact: true }).waitFor({ state: "visible" });
    });
    await scene("s03-choose-source", async () => {
      const source = locatorAdapter.resolve(page, "homework.fractionsSource");
      await source.waitFor({ state: "visible" });
      await source.check();
      await page.getByText("Selected for this question", { exact: true }).waitFor({ state: "visible" });
    });
    let waitStartSeconds = 0;
    let waitEndSeconds = 0;
    const questionDefinition = PORTFOLIO_DEMO_STORYBOARD.scenes.find((item) => item.id === "s04-ask-question");
    const questionStart = secondsSince(startedAt);
    let messageResponse;
    await (async () => {
      const question = locatorAdapter.resolve(page, "homework.question");
      await question.click();
      await question.pressSequentially(PORTFOLIO_DEMO_QUESTION, { delay: 42 });
      await hold(questionDefinition.holdMs);
      messageResponse = page.waitForResponse(
        (response) => response.request().method() === "POST" && /\/api\/conversations\/[^/]+\/messages$/.test(new URL(response.url()).pathname),
        { timeout: 180000 },
      );
      await locatorAdapter.resolve(page, "homework.startChat").click();
      waitStartSeconds = secondsSince(startedAt);
      await page.waitForURL(/\/app\/conversations\/([0-9a-f-]+)/i, {
        timeout: 180000,
      });
      conversationId = page.url().match(/\/app\/conversations\/([0-9a-f-]+)/i)?.[1] ?? null;
    })();
    scenes.push({ id: questionDefinition.id, title: questionDefinition.title, overlay: questionDefinition.overlay, rawStartSeconds: questionStart, rawEndSeconds: waitStartSeconds });
    await page.screenshot({ path: resolveInside(runPaths.screenshotsDir, `take-${attempt}-04-s04-ask-question.png`) });
    const response = await messageResponse;
      waitEndSeconds = secondsSince(startedAt);
      responsePayload = await response.json();
    const liveWaitDefinition = PORTFOLIO_DEMO_STORYBOARD.scenes.find((item) => item.id === "s05-live-wait");
    scenes.push({
      id: "s05-live-wait",
      title: liveWaitDefinition.title,
      overlay: liveWaitDefinition.overlay,
      rawStartSeconds: waitStartSeconds,
      rawEndSeconds: waitEndSeconds,
    });
    const assistant = responsePayload?.data?.assistantMessage;
    acceptance = evaluateCoachingResponse(assistant?.content_text ?? "");
    const { data: debugCapture, error: debugError } = await admin
      .from("ai_generation_debug_captures")
      .select("provider,model_name,prompt_version,reply_mode,usage_snapshot,metadata")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (debugError) throw debugError;
    const retrieval = debugCapture?.metadata?.subjectResourceRetrieval ?? {};
    const selectedSourceReturned =
      Array.isArray(retrieval.chunkRefs) &&
      retrieval.chunkRefs.some((chunk) => chunk.resourceId === config.selectedResourceId);
    providerEvidence = {
      provider: assistant?.model_provider ?? null,
      model: assistant?.model_name ?? null,
      promptVersion: debugCapture?.prompt_version ?? null,
      replyMode: debugCapture?.reply_mode ?? null,
      selectedResourceCount: retrieval.selectedResourceCount ?? 0,
      returnedChunkCount: retrieval.returnedChunkCount ?? 0,
      selectedSourceReturned,
      liveProviderOutput: assistant?.model_provider === "gemini" && debugCapture?.provider === "gemini",
    };
    accepted = acceptance.accepted && providerEvidence.liveProviderOutput && providerEvidence.selectedResourceCount === 1 && providerEvidence.returnedChunkCount > 0 && providerEvidence.selectedSourceReturned;
    await scene("s06-plan-and-hint", async () => {
      await locatorAdapter.resolve(page, "workbench.assistantReply").waitFor({ state: "visible", timeout: 30000 });
      await locatorAdapter.resolve(page, "workbench.assistantReply").scrollIntoViewIfNeeded();
    });
    await scene("s07-value-hold", async () => {});
    const rawDurationSeconds = secondsSince(startedAt);
    await context.close();
    const recordedPath = await video.path();
    const rawPath = resolveInside(runPaths.rawDir, `take-${attempt}.webm`);
    await fs.rename(recordedPath, rawPath);
    await fs.rm(attemptDir, { recursive: true, force: true });
    return {
      attempt,
      accepted,
      conversationId,
      rawPath,
      providerEvidence,
      acceptance,
      timeline: {
        schemaVersion: 1,
        runId: path.basename(runPaths.runDir),
        storyboardId: PORTFOLIO_DEMO_STORYBOARD.id,
        take: attempt,
        rawDurationSeconds,
        wait: { startSeconds: waitStartSeconds, endSeconds: waitEndSeconds },
        scenes: scenes.sort((left, right) => left.rawStartSeconds - right.rawStartSeconds),
      },
    };
  } catch (error) {
    await context.close().catch(() => {});
    const recordedPath = await video.path().catch(() => null);
    if (recordedPath) {
      const failedPath = resolveInside(runPaths.rawDir, `take-${attempt}-failed.webm`);
      await fs.rename(recordedPath, failedPath).catch(() => {});
    }
    throw error;
  } finally {
    const current = await loadDemoBaseline(admin, config.studentUserId);
    for (const row of current.conversations) {
      if (!baseline.conversations.some((item) => item.id === row.id)) await removeDemoConversation(admin, row.id);
    }
  }
}

async function main() {
  const { maxAttempts } = parseRecorderArgs();
  const target = normalizeCaptureTarget(required("PORTFOLIO_DEMO_APP_URL"));
  if (!target.isSecure || target.isLoopback) throw new Error("Portfolio recording requires the hosted HTTPS deployment.");
  const sourceRevision = await gitRevision();
  const runId = createRunId({ suffix: "matt-demo" });
  const runPaths = getRunPaths({ runId });
  await prepareRunDirectories(runPaths);
  const preflight = await runPreflight({
    targetUrl: target.origin,
    deployRevision: sourceRevision,
    requiredEnvNames: REQUIRED_ENV,
    runPaths,
  });
  if (!preflight.passed) throw new Error(`Recorder preflight failed: ${preflight.failedCheckIds.join(", ")}`);
  const config = {
    appOrigin: target.origin,
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    email: required("PORTFOLIO_DEMO_EMAIL").toLowerCase(),
    password: required("PORTFOLIO_DEMO_PASSWORD"),
  };
  const { admin, http } = createHostedDemoClients(config);
  config.studentUserId = await authenticateTaggedMatt({ admin, http, email: config.email, password: config.password });
  const baseline = await loadDemoBaseline(admin, config.studentUserId);
  const selectedResource = baseline.resources.find(
    (resource) => resource.original_filename === PORTFOLIO_DEMO_RESOURCE,
  );
  if (!selectedResource || selectedResource.extraction_status !== "ready") {
    throw new Error(`${PORTFOLIO_DEMO_RESOURCE} is not ready in Matt's baseline.`);
  }
  config.selectedResourceId = selectedResource.id;
  const cookies = browserCookies(http, config.appOrigin);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const attempts = [];
  let cleanup = null;
  let accepted = null;
  let failure = null;
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const result = await captureAttempt({ attempt, browser, config, cookies, runPaths, admin, baseline });
      attempts.push({ attempt, accepted: result.accepted, providerEvidence: result.providerEvidence, acceptance: result.acceptance });
      if (result.accepted) { accepted = result; break; }
    }
  } catch (error) {
    failure = error;
  } finally {
    await browser.close().catch(() => {});
    try {
      cleanup = await restoreAndVerifyBaseline(admin, config.studentUserId, baseline);
    } catch (cleanupError) {
      failure = failure ? new AggregateError([failure, cleanupError], "Recording and cleanup failed.") : cleanupError;
    }
  }
  if (!accepted || failure) throw failure ?? new Error("No accepted live coaching take was captured.");
  await writeRunReport(runPaths.sceneTimelinePath, accepted.timeline);
  const rawArtifact = await describeArtifact(runPaths.runDir, accepted.rawPath, { type: "raw-video", take: accepted.attempt });
  const report = {
    schemaVersion: 1,
    runId,
    sourceRevision,
    deployRevision: sourceRevision,
    captureOrigin: config.appOrigin,
    storyboard: { id: PORTFOLIO_DEMO_STORYBOARD.id, schemaVersion: PORTFOLIO_DEMO_STORYBOARD.schemaVersion },
    viewport: {
      width: PORTFOLIO_DEMO_EDIT.captureWidth,
      height: PORTFOLIO_DEMO_EDIT.captureHeight,
      theme: PORTFOLIO_DEMO_EDIT.theme,
      outputWidth: PORTFOLIO_DEMO_EDIT.width,
      outputHeight: PORTFOLIO_DEMO_EDIT.height,
    },
    selectedResource: PORTFOLIO_DEMO_RESOURCE,
    retryCount: accepted.attempt - 1,
    acceptedTake: accepted.attempt,
    providerEvidence: accepted.providerEvidence,
    acceptance: accepted.acceptance,
    cleanup,
    attempts,
    artifacts: [rawArtifact],
    startedAt: new Date(Date.now() - accepted.timeline.rawDurationSeconds * 1000).toISOString(),
    completedAt: new Date().toISOString(),
  };
  await writeRunReport(runPaths.runReportPath, report);
  console.log(JSON.stringify({ runId, acceptedTake: accepted.attempt, rawVideo: rawArtifact.name, timeline: "manifests/scene-timeline.json", renderCommand: `npm run render:portfolio-demo -- --run-id=${runId}` }, null, 2));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
