import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { chromium, devices } from "playwright";
import {
  createAdminClient,
  FIXTURE,
  env,
  listFixtureAuthUsers,
} from "./rls-fixture-shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const nextBinPath = path.join(
  repoRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const buildIdPath = path.join(repoRoot, ".next", "BUILD_ID");
const BASE_URL = normalizeBaseUrl(
  process.argv[2] ?? process.env.SMOKE_APP_URL ?? "",
);
const SMOKE_THEME_MODE = normalizeThemeMode(
  process.env.SMOKE_THEME_MODE ?? "light",
);
const SMOKE_UI_LANGUAGE = normalizeUiLanguage(
  process.env.SMOKE_UI_LANGUAGE ?? "fr",
);
const SCREENSHOT_DIR_PREFIX = path.join(os.tmpdir(), "iadb-tablet-emulation-");
const DEVICE_PLAN = [
  {
    name: "portrait",
    device: devices["iPad (gen 7)"],
  },
  {
    name: "landscape",
    device: devices["iPad (gen 7) landscape"],
  },
];
const LANGUAGE_PLAN = {
  fr: {
    locale: "fr-FR",
    pages: [
      {
        name: "dashboard",
        path: "/app",
        selectors: [
          "role=link[name=\"Tableau\"]",
          "text=Choisir une matière, reprendre une discussion, ou en lancer une nouvelle.",
          "text=Discussions récentes",
          "text=mathematiques",
        ],
        criticalTargets: ["Tableau"],
      },
      {
        name: "subject-launcher",
        path: "/app?view=homework&subject=mathematiques&draft=Smoke",
        selectors: [
          "text=mathematiques",
          "text=Discussions récentes",
          "textarea[placeholder=\"Écris directement ta question sur ce devoir...\"]",
          "role=button[name=\"Lancer le chat\"]",
        ],
        criticalTargets: ["Lancer le chat", "Ouvrir"],
      },
      {
        name: "conversation",
        path: `/app/conversations/${FIXTURE.ids.conversation}`,
        selectors: [
          "text=Sources",
          "text=Pièces privées et texte récupéré",
          "role=button[name=\"Envoyer\"]",
        ],
        criticalTargets: ["Ajouter une pièce", "Envoyer"],
      },
    ],
  },
  en: {
    locale: "en-US",
    pages: [
      {
        name: "dashboard",
        path: "/app",
        selectors: [
          "role=link[name=\"Dashboard\"]",
          "text=Pick a subject, continue a discussion, or start a fresh one.",
          "text=Recent homework chats",
          "text=mathematiques",
        ],
        criticalTargets: ["Dashboard"],
      },
      {
        name: "subject-launcher",
        path: "/app?view=homework&subject=mathematiques&draft=Smoke",
        selectors: [
          "text=mathematiques",
          "text=Recent homework chats",
          "textarea[placeholder=\"Ask anything about this homework...\"]",
          "role=button[name=\"Start chat\"]",
        ],
        criticalTargets: ["Start chat", "Open"],
      },
      {
        name: "conversation",
        path: `/app/conversations/${FIXTURE.ids.conversation}`,
        selectors: [
          "text=Sources",
          "text=Private files and recovered text",
          "role=button[name=\"Send\"]",
        ],
        criticalTargets: ["Add attachment", "Send"],
      },
    ],
  },
  zh: {
    locale: "zh-TW",
    pages: [
      {
        name: "dashboard",
        path: "/app",
        selectors: [
          "role=link[name=\"總覽\"]",
          "text=選擇科目、接續對話，或開始新的作業。",
          "text=最近作業對話",
          "text=mathematiques",
        ],
        criticalTargets: ["總覽"],
      },
      {
        name: "subject-launcher",
        path: "/app?view=homework&subject=mathematiques&draft=Smoke",
        selectors: [
          "text=mathematiques",
          "text=最近作業對話",
          "textarea[placeholder=\"直接輸入你對這份作業的問題...\"]",
          "role=button[name=\"開始聊天\"]",
        ],
        criticalTargets: ["開始聊天", "打開"],
      },
      {
        name: "conversation",
        path: `/app/conversations/${FIXTURE.ids.conversation}`,
        selectors: [
          "text=來源",
          "text=私人檔案與擷取文字",
          "role=button[name=\"送出\"]",
        ],
        criticalTargets: ["加入附件", "送出"],
      },
    ],
  },
};
const ACTIVE_LANGUAGE_PLAN = LANGUAGE_PLAN[SMOKE_UI_LANGUAGE];

function normalizeThemeMode(value) {
  return value === "dark" ? "dark" : "light";
}

async function applyThemePreference(context) {
  await context.addInitScript(
    ({ themeMode }) => {
      window.localStorage.setItem("iadb-theme", themeMode);
      document.documentElement.dataset.theme = themeMode;
      document.documentElement.style.colorScheme = themeMode;
    },
    { themeMode: SMOKE_THEME_MODE },
  );
}

function normalizeUiLanguage(value) {
  if (value === "fr" || value === "en" || value === "zh") {
    return value;
  }

  throw new Error(
    `Unsupported SMOKE_UI_LANGUAGE "${value}". Expected one of fr, en, or zh.`,
  );
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function prepareFixtureStudentUiLanguage(languageCode) {
  const admin = createAdminClient();
  const authUsers = await listFixtureAuthUsers(admin);
  const studentAuthUser = authUsers.find(
    (user) => user.email === FIXTURE.emails.student,
  );

  if (!studentAuthUser?.id) {
    throw new Error("Fixture student auth user was not found.");
  }

  const { data: studentRow, error: userError } = await admin
    .from("users")
    .select("preferred_ui_language")
    .eq("id", studentAuthUser.id)
    .single();

  if (userError || !studentRow) {
    throw new Error("Fixture student app profile could not be loaded.");
  }

  const originalLanguage = studentRow.preferred_ui_language ?? "fr";

  if (originalLanguage === languageCode) {
    return async () => {};
  }

  const { error: updateUserError } = await admin
    .from("users")
    .update({ preferred_ui_language: languageCode })
    .eq("id", studentAuthUser.id);

  if (updateUserError) {
    throw updateUserError;
  }

  const originalMetadata = studentAuthUser.user_metadata ?? {};
  const { error: updateAuthError } = await admin.auth.admin.updateUserById(
    studentAuthUser.id,
    {
      user_metadata: {
        ...originalMetadata,
        preferred_ui_language: languageCode,
      },
    },
  );

  if (updateAuthError) {
    throw updateAuthError;
  }

  return async () => {
    await admin
      .from("users")
      .update({ preferred_ui_language: originalLanguage })
      .eq("id", studentAuthUser.id);
    await admin.auth.admin.updateUserById(studentAuthUser.id, {
      user_metadata: originalMetadata,
    });
  };
}

async function ensureBuildArtifact() {
  try {
    await access(buildIdPath);
  } catch {
    throw new Error(
      "Missing .next build output. Run `npm run build` before `npm run smoke:tablet-emulation` without a URL override.",
    );
  }
}

async function findAvailablePort(startPort = 3143) {
  let port = startPort;

  while (port < startPort + 50) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();

        server.once("error", reject);
        server.listen(port, "127.0.0.1", () => {
          server.close((closeError) => {
            if (closeError) {
              reject(closeError);
              return;
            }

            resolve(null);
          });
        });
      });

      return port;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === "EADDRINUSE") {
          port += 1;
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error("Unable to find an open local port for the tablet smoke server.");
}

async function waitForServerReady(baseUrl, childProcess) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (childProcess.exitCode !== null) {
      throw new Error(
        `Next server exited early with code ${childProcess.exitCode}.`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/auth`, {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });

      if (response.status >= 200) {
        return;
      }
    } catch {
      // Retry until the boot window expires.
    }

    await wait(1000);
  }

  throw new Error("Timed out while waiting for the local Next server.");
}

async function startLocalServer() {
  await ensureBuildArtifact();

  const port = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const childProcess = spawn(
    process.execPath,
    [nextBinPath, "start", "--hostname", "127.0.0.1", "--port", `${port}`],
    {
      cwd: repoRoot,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  childProcess.stdout.on("data", (chunk) => process.stderr.write(chunk));
  childProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));

  await waitForServerReady(baseUrl, childProcess);

  return {
    baseUrl,
    childProcess,
  };
}

async function stopLocalServer(childProcess) {
  if (!childProcess || childProcess.exitCode !== null) {
    return;
  }

  childProcess.kill("SIGTERM");
  await wait(1000);

  if (childProcess.exitCode === null) {
    childProcess.kill("SIGKILL");
    await wait(500);
  }
}

function parseSetCookieHeader(headerValue) {
  const firstSegment = headerValue.split(";")[0] ?? "";
  const separatorIndex = firstSegment.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  return {
    name: firstSegment.slice(0, separatorIndex).trim(),
    value: firstSegment.slice(separatorIndex + 1),
  };
}

function createCookieJar() {
  const cookies = new Map();

  return {
    getAll() {
      return Array.from(cookies.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    },
    setAll(cookiesToSet) {
      for (const cookie of cookiesToSet) {
        if (!cookie?.name) {
          continue;
        }

        if (!cookie.value) {
          cookies.delete(cookie.name);
          continue;
        }

        cookies.set(cookie.name, cookie.value);
      }
    },
    applyResponseCookies(response) {
      const getSetCookie = response.headers.getSetCookie?.bind(response.headers);
      const setCookieHeaders = getSetCookie
        ? getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")]
          : [];

      for (const headerValue of setCookieHeaders) {
        if (!headerValue) {
          continue;
        }

        const parsed = parseSetCookieHeader(headerValue);

        if (!parsed) {
          continue;
        }

        if (!parsed.value) {
          cookies.delete(parsed.name);
          continue;
        }

        cookies.set(parsed.name, parsed.value);
      }
    },
  };
}

async function assertVisible(page, selector) {
  if (selector.startsWith("role=")) {
    const roleMatch = /^role=(?<role>[a-z]+)\[name="(?<name>.+)"\]$/i.exec(selector);

    if (!roleMatch?.groups) {
      throw new Error(`Unsupported role selector format: ${selector}`);
    }

    const locator = page.getByRole(roleMatch.groups.role, {
      name: roleMatch.groups.name,
      exact: true,
    });

    await locator.first().waitFor({ state: "visible", timeout: 30_000 });
    return;
  }

  if (selector.startsWith("text=")) {
    const locator = page.getByText(selector.slice(5), { exact: false });
    await locator.first().waitFor({ state: "visible", timeout: 30_000 });
    return;
  }

  await page.locator(selector).first().waitFor({ state: "visible", timeout: 30_000 });
}

async function measureTarget(page, label) {
  const button = page.getByRole("button", { name: label, exact: true });
  const link = page.getByRole("link", { name: label, exact: true });
  const locator = (await button.count()) > 0 ? button.first() : link.first();
  await locator.waitFor({ state: "visible", timeout: 30_000 });
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error(`Could not measure target: ${label}`);
  }

  return {
    label,
    width: Number(box.width.toFixed(1)),
    height: Number(box.height.toFixed(1)),
    meetsMinimum: box.width >= 44 && box.height >= 44,
  };
}

async function collectViewportMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const threshold = 44;
    const interactive = Array.from(
      document.querySelectorAll('a, button, input, textarea, select, [role="button"]'),
    )
      .map((element) => {
        const usesLabelTarget =
          element instanceof HTMLInputElement &&
          (element.type === "checkbox" || element.type === "radio") &&
          element.closest("label");
        const target = usesLabelTarget ? element.closest("label") : element;
        const rect = target?.getBoundingClientRect() ?? element.getBoundingClientRect();
        const style = window.getComputedStyle(target ?? element);
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none";

        return {
          label:
            element.getAttribute("aria-label") ||
            target?.getAttribute("aria-label") ||
            element.textContent?.replace(/\s+/g, " ").trim() ||
            target?.textContent?.replace(/\s+/g, " ").trim() ||
            element.getAttribute("placeholder") ||
            element.tagName.toLowerCase(),
          visible,
          width: Number(rect.width.toFixed(1)),
          height: Number(rect.height.toFixed(1)),
        };
      })
      .filter((entry) => entry.visible);

    const tooSmall = interactive
      .filter((entry) => entry.width < threshold || entry.height < threshold)
      .slice(0, 12);

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      horizontalOverflow: Number((root.scrollWidth - root.clientWidth).toFixed(1)),
      totalInteractive: interactive.length,
      tooSmall,
    };
  });
}

async function signInStudent(browser, screenshotDir) {
  const baseUrl = new URL(resolveBaseUrl());
  const cookieJar = createCookieJar();
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: cookieJar,
  });
  const { error } = await supabase.auth.signInWithPassword({
    email: FIXTURE.emails.student,
    password: env.fixturePassword,
  });

  if (error) {
    throw new Error(
      `Fixture sign-in failed. Reseed fixtures before running the tablet smoke. ${error.message}`,
    );
  }

  const ssrCookies = cookieJar.getAll();

  if (ssrCookies.length === 0) {
    throw new Error("Supabase SSR auth cookies were not created for the fixture student.");
  }

  const context = await browser.newContext({
    ...devices["iPad (gen 7)"],
    locale: ACTIVE_LANGUAGE_PLAN.locale,
  });
  await applyThemePreference(context);

  await context.addCookies(
    ssrCookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      url: `${baseUrl.origin}/`,
    })),
  );

  const page = await context.newPage();
  await page.goto(`${resolveBaseUrl()}/app`, { waitUntil: "domcontentloaded" });

  const finalPath = new URL(page.url()).pathname;

  if (finalPath.startsWith("/auth")) {
    throw new Error(
      "Fixture student stayed on /auth after SSR-cookie sign-in. Verify the fixture password and Supabase session shape.",
    );
  }

  if (finalPath.startsWith("/onboarding")) {
    throw new Error(
      `Fixture student was redirected to onboarding at ${finalPath}. Reseed fixtures before running the tablet smoke.`,
    );
  }

  const storageStatePath = path.join(screenshotDir, "storage-state.json");
  await context.storageState({ path: storageStatePath });
  await page.screenshot({
    fullPage: true,
    path: path.join(screenshotDir, "signed-in-dashboard.png"),
  });
  await context.close();

  return storageStatePath;
}

async function checkPage(browser, storageStatePath, screenshotDir, deviceConfig, pagePlan) {
  const context = await browser.newContext({
    ...deviceConfig.device,
    locale: ACTIVE_LANGUAGE_PLAN.locale,
    storageState: storageStatePath,
  });
  await applyThemePreference(context);
  const page = await context.newPage();

  await page.goto(`${resolveBaseUrl()}${pagePlan.path}`, { waitUntil: "domcontentloaded" });

  for (const selector of pagePlan.selectors) {
    await assertVisible(page, selector);
  }

  const viewportMetrics = await collectViewportMetrics(page);
  const criticalTargets = [];

  for (const label of pagePlan.criticalTargets) {
    criticalTargets.push(await measureTarget(page, label));
  }

  const screenshotPath = path.join(
    screenshotDir,
    `${deviceConfig.name}-${pagePlan.name}.png`,
  );

  await page.screenshot({
    fullPage: true,
    path: screenshotPath,
  });

  await context.close();

  return {
    device: deviceConfig.name,
    page: pagePlan.name,
    path: pagePlan.path,
    screenshotPath,
    viewportMetrics,
    criticalTargets,
  };
}

function printResult(result) {
  console.log(`\n[${result.device}] ${result.page} (${result.path})`);
  console.log(
    `- viewport: ${result.viewportMetrics.viewportWidth}x${result.viewportMetrics.viewportHeight}`,
  );
  console.log(`- horizontal overflow: ${result.viewportMetrics.horizontalOverflow}px`);
  console.log(`- interactive elements: ${result.viewportMetrics.totalInteractive}`);

  if (result.viewportMetrics.tooSmall.length === 0) {
    console.log("- small tap targets: none detected in the first scan");
  } else {
    console.log("- small tap targets:");
    for (const target of result.viewportMetrics.tooSmall) {
      console.log(
        `  - ${target.label || "<no label>"} (${target.width}x${target.height})`,
      );
    }
  }

  console.log("- critical targets:");
  for (const target of result.criticalTargets) {
    console.log(
      `  - ${target.label}: ${target.width}x${target.height}${target.meetsMinimum ? "" : " [below 44x44]"}`,
    );
  }

  console.log(`- screenshot: ${result.screenshotPath}`);
}

let runtimeBaseUrl = BASE_URL;

function resolveBaseUrl() {
  if (!runtimeBaseUrl) {
    throw new Error("Base URL is not initialized for the tablet emulation smoke.");
  }

  return runtimeBaseUrl;
}

async function main() {
  const screenshotDir = await fs.mkdtemp(SCREENSHOT_DIR_PREFIX);
  let startedServer = false;
  let childProcess = null;
  let restoreFixtureLanguage = null;
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  try {
    if (!runtimeBaseUrl) {
      const server = await startLocalServer();
      runtimeBaseUrl = server.baseUrl;
      childProcess = server.childProcess;
      startedServer = true;
    }

    restoreFixtureLanguage =
      await prepareFixtureStudentUiLanguage(SMOKE_UI_LANGUAGE);
    const storageStatePath = await signInStudent(browser, screenshotDir);
    const results = [];

    for (const deviceConfig of DEVICE_PLAN) {
      for (const pagePlan of ACTIVE_LANGUAGE_PLAN.pages) {
        results.push(
          await checkPage(
            browser,
            storageStatePath,
            screenshotDir,
            deviceConfig,
            pagePlan,
          ),
        );
      }
    }

    console.log(`Tablet emulation smoke against ${resolveBaseUrl()}`);
    console.log(`Theme mode: ${SMOKE_THEME_MODE}`);
    console.log(`UI language: ${SMOKE_UI_LANGUAGE}`);
    console.log(`Artifacts: ${screenshotDir}`);
    console.log(`Started local server: ${startedServer}`);

    let hasBlockingFailure = false;

    for (const result of results) {
      printResult(result);

      if (result.viewportMetrics.horizontalOverflow > 1) {
        hasBlockingFailure = true;
      }

      if (result.criticalTargets.some((target) => !target.meetsMinimum)) {
        hasBlockingFailure = true;
      }
    }

    if (hasBlockingFailure) {
      throw new Error(
        "Tablet emulation found horizontal overflow or a critical tap target below 44x44.",
      );
    }

    console.log("\nTablet emulation smoke passed. Real iPad Safari validation is still required for A7.1.");
  } finally {
    if (restoreFixtureLanguage) {
      await restoreFixtureLanguage();
    }
    await browser.close();
    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
