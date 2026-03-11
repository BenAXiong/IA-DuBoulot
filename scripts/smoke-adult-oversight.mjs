import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createServerClient } from "@supabase/ssr";
import {
  FIXTURE,
  createAdminClient,
  env as fixtureEnv,
  resolveFixtureUserIds,
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
const requestPrefix = `smoke_adult_oversight_${Date.now()}`;
const requestTimeoutMs = 90000;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureBuildArtifact() {
  try {
    await access(buildIdPath);
  } catch {
    throw new Error(
      "Missing .next build output. Run `npm run build` before `npm run smoke:adult-oversight`.",
    );
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
    toHeader() {
      return Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    },
  };
}

async function findAvailablePort(startPort = 3144) {
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

  throw new Error("Unable to find an open local port for the adult smoke server.");
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
      // Retry until ready.
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

function readErrorMessage(payload, fallbackMessage) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallbackMessage;
}

function expectOkJson(result, fallbackMessage) {
  const { response, payload } = result;

  if (!response.ok) {
    throw new Error(
      `${fallbackMessage} (${response.status}): ${readErrorMessage(payload, "Unknown error")}`,
    );
  }

  if (!payload || typeof payload !== "object" || payload.ok !== true) {
    throw new Error(`${fallbackMessage}: route returned an unexpected payload.`);
  }

  return payload;
}

function buildHttpClient(baseUrl, roleLabel) {
  const cookieJar = createCookieJar();
  let requestSequence = 0;

  return {
    async signInFixture(email) {
      const supabase = createServerClient(
        fixtureEnv.supabaseUrl,
        fixtureEnv.supabaseAnonKey,
        {
          cookies: cookieJar,
        },
      );
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: fixtureEnv.fixturePassword,
      });

      if (error) {
        throw new Error(`Fixture ${roleLabel} sign-in failed: ${error.message}`);
      }
    },
    async requestJson(pathname, init = {}) {
      requestSequence += 1;
      const requestId = `${requestPrefix}_${roleLabel}_${requestSequence}`;
      const headers = new Headers(init.headers ?? {});

      headers.set("x-request-id", requestId);

      if (cookieJar.toHeader()) {
        headers.set("cookie", cookieJar.toHeader());
      }

      if (
        init.body !== undefined &&
        !headers.has("content-type") &&
        typeof init.body === "string"
      ) {
        headers.set("content-type", "application/json");
      }

      const response = await fetch(`${baseUrl}${pathname}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(requestTimeoutMs),
      });

      cookieJar.applyResponseCookies(response);
      const payload = await response.json().catch(() => null);

      return {
        requestId,
        response,
        payload,
      };
    },
    async requestText(pathname, init = {}) {
      requestSequence += 1;
      const requestId = `${requestPrefix}_${roleLabel}_${requestSequence}`;
      const headers = new Headers(init.headers ?? {});

      headers.set("x-request-id", requestId);

      if (cookieJar.toHeader()) {
        headers.set("cookie", cookieJar.toHeader());
      }

      const response = await fetch(`${baseUrl}${pathname}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(requestTimeoutMs),
      });

      cookieJar.applyResponseCookies(response);
      const text = await response.text();

      return {
        requestId,
        response,
        text,
      };
    },
  };
}

async function main() {
  const adminClient = createAdminClient();
  const fixtureUserIds = await resolveFixtureUserIds(adminClient);
  const state = {
    createdNoteId: null,
  };
  let startedServer = false;
  let childProcess = null;
  let baseUrl = process.env.SMOKE_APP_URL ?? null;

  assert(fixtureUserIds.student, "Missing seeded student fixture user id.");

  try {
    if (!baseUrl) {
      const server = await startLocalServer();
      startedServer = true;
      childProcess = server.childProcess;
      baseUrl = server.baseUrl;
    }

    const parent = buildHttpClient(baseUrl, "parent");
    const tutor = buildHttpClient(baseUrl, "tutor");
    const admin = buildHttpClient(baseUrl, "admin");

    await Promise.all([
      parent.signInFixture(FIXTURE.emails.parent),
      tutor.signInFixture(FIXTURE.emails.tutor),
      admin.signInFixture(FIXTURE.emails.admin),
    ]);

    const parentStudentPage = await parent.requestText(
      `/app/students/${fixtureUserIds.student}`,
    );
    assert(
      parentStudentPage.response.ok &&
        parentStudentPage.text.includes(FIXTURE.displayNames.student),
      "Parent student detail page did not render the linked student view.",
    );

    const parentReviewPage = await parent.requestText(
      `/app/review/${FIXTURE.ids.conversation}`,
    );
    assert(
      parentReviewPage.response.ok &&
        parentReviewPage.text.includes("Resume parent"),
      "Parent review page did not render the parent summary surface.",
    );

    const parentConversationResult = await parent.requestJson(
      `/api/conversations/${FIXTURE.ids.conversation}`,
    );
    const parentConversationPayload = expectOkJson(
      parentConversationResult,
      "Parent failed to load the linked conversation detail",
    );
    const parentSummaries = parentConversationPayload.data?.detail?.summaries ?? [];
    assert(
      parentSummaries.length > 0 &&
        parentSummaries.every((summary) => summary.audience === "parent"),
      "Parent conversation detail returned the wrong summary audience.",
    );

    const parentForbiddenNoteResult = await parent.requestJson("/api/tutor/notes", {
      method: "POST",
      body: JSON.stringify({
        studentUserId: fixtureUserIds.student,
        conversationId: FIXTURE.ids.conversation,
        noteText: "Parent should not create tutor notes.",
        isPinned: false,
      }),
    });
    assert(
      parentForbiddenNoteResult.response.status === 403,
      `Parent tutor-note write should fail with 403, saw ${parentForbiddenNoteResult.response.status}.`,
    );

    const tutorStudentPage = await tutor.requestText(
      `/app/students/${fixtureUserIds.student}`,
    );
    assert(
      tutorStudentPage.response.ok &&
        tutorStudentPage.text.includes(FIXTURE.displayNames.student),
      "Tutor student detail page did not render the linked student view.",
    );

    const tutorReviewPage = await tutor.requestText(
      `/app/review/${FIXTURE.ids.conversation}`,
    );
    assert(
      tutorReviewPage.response.ok &&
        tutorReviewPage.text.includes("Synthese tuteur"),
      "Tutor review page did not render the tutor summary surface.",
    );

    const tutorConversationResult = await tutor.requestJson(
      `/api/conversations/${FIXTURE.ids.conversation}`,
    );
    const tutorConversationPayload = expectOkJson(
      tutorConversationResult,
      "Tutor failed to load the linked conversation detail",
    );
    const tutorSummaries = tutorConversationPayload.data?.detail?.summaries ?? [];
    assert(
      tutorSummaries.length > 0 &&
        tutorSummaries.every((summary) => summary.audience === "tutor"),
      "Tutor conversation detail returned the wrong summary audience.",
    );

    const createNoteResult = await tutor.requestJson("/api/tutor/notes", {
      method: "POST",
      body: JSON.stringify({
        studentUserId: fixtureUserIds.student,
        conversationId: FIXTURE.ids.conversation,
        noteText: `Adult oversight smoke note ${new Date().toISOString()}`,
        isPinned: true,
      }),
    });
    const createNotePayload = expectOkJson(
      createNoteResult,
      "Tutor failed to create a private note",
    );
    const createdNote = createNotePayload.data?.note ?? null;

    assert(createdNote?.id, "Tutor note creation did not return a note id.");
    state.createdNoteId = createdNote.id;

    const updateNoteResult = await tutor.requestJson(
      `/api/tutor/notes/${createdNote.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          noteText: "Adult oversight smoke note updated.",
          isPinned: false,
        }),
      },
    );
    const updateNotePayload = expectOkJson(
      updateNoteResult,
      "Tutor failed to update the private note",
    );
    assert(
      updateNotePayload.data?.note?.noteText === "Adult oversight smoke note updated.",
      "Tutor note update did not persist the expected body.",
    );

    const deleteNoteResult = await tutor.requestJson(
      `/api/tutor/notes/${createdNote.id}`,
      {
        method: "DELETE",
      },
    );
    expectOkJson(deleteNoteResult, "Tutor failed to delete the private note");
    state.createdNoteId = null;

    const adminAuditResult = await admin.requestJson(
      "/api/admin/audit/access-events",
    );
    const adminAuditPayload = expectOkJson(
      adminAuditResult,
      "Admin failed to load the access audit feed",
    );
    const actions = new Set(
      (adminAuditPayload.data?.snapshot?.events ?? []).map((event) => event.action),
    );

    for (const action of [
      "parent_session_review_view",
      "tutor_session_review_view",
      "tutor_note_create",
      "tutor_note_update",
      "tutor_note_delete",
    ]) {
      assert(actions.has(action), `Admin audit feed is missing action ${action}.`);
    }

    const adminAuditPage = await admin.requestText("/app/audit");
    assert(
      adminAuditPage.response.ok &&
        adminAuditPage.text.includes("Lectures adultes"),
      "Admin audit page did not render the access-audit surface.",
    );

    console.info(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          startedServer,
          checks: [
            "parent student detail page rendered",
            "parent session review page rendered",
            "parent API detail stayed filtered to parent summaries",
            "parent could not create tutor notes",
            "tutor student detail page rendered",
            "tutor session review page rendered",
            "tutor API detail stayed filtered to tutor summaries",
            "tutor private note create/update/delete succeeded",
            "admin audit API captured adult review and note actions",
            "admin audit page rendered",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    if (state.createdNoteId) {
      const { error } = await adminClient
        .from("tutor_notes")
        .delete()
        .eq("id", state.createdNoteId);

      if (error) {
        console.error("Cleanup warning: failed to delete the temporary tutor note.");
        console.error(error);
      }
    }

    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error("Adult-oversight smoke failed.");
  console.error(error);
  process.exitCode = 1;
});
