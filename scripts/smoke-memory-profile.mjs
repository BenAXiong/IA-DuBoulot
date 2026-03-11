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
const requestPrefix = `smoke_memory_${Date.now()}`;
const requestTimeoutMs = 90000;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeAssertionText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureBuildArtifact() {
  try {
    await access(buildIdPath);
  } catch {
    throw new Error(
      "Missing .next build output. Run `npm run build` before `npm run smoke:memory`.",
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

async function findAvailablePort(startPort = 3195) {
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

  throw new Error("Unable to find an open local port for the memory smoke server.");
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
      env: {
        ...process.env,
        NEXT_PUBLIC_APP_URL: baseUrl,
      },
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
  }
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
          cookies: {
            getAll() {
              const header = cookieJar.toHeader();

              if (!header) {
                return [];
              }

              return header.split("; ").map((segment) => {
                const separatorIndex = segment.indexOf("=");

                return {
                  name: segment.slice(0, separatorIndex),
                  value: segment.slice(separatorIndex + 1),
                };
              });
            },
            setAll(cookiesToSet) {
              const response = new Response(null);

              for (const cookie of cookiesToSet) {
                response.headers.append(
                  "set-cookie",
                  `${cookie.name}=${cookie.value}`,
                );
              }

              cookieJar.applyResponseCookies(response);
            },
          },
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
        location: response.headers.get("location"),
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
        location: response.headers.get("location"),
      };
    },
  };
}

async function snapshotMemoryState(adminClient, studentUserId) {
  const [{ data: profile, error: profileError }, { data: items, error: itemsError }] =
    await Promise.all([
      adminClient
        .from("student_memory_profiles")
        .select("*")
        .eq("student_user_id", studentUserId)
        .maybeSingle(),
      adminClient
        .from("student_memory_items")
        .select("*")
        .eq("student_user_id", studentUserId)
        .order("created_at", { ascending: true }),
    ]);

  if (profileError) {
    throw profileError;
  }

  if (itemsError) {
    throw itemsError;
  }

  return {
    profile,
    items: items ?? [],
  };
}

async function restoreMemoryState(adminClient, studentUserId, snapshot) {
  const { error: deleteItemsError } = await adminClient
    .from("student_memory_items")
    .delete()
    .eq("student_user_id", studentUserId);

  if (deleteItemsError) {
    throw deleteItemsError;
  }

  const { error: deleteProfileError } = await adminClient
    .from("student_memory_profiles")
    .delete()
    .eq("student_user_id", studentUserId);

  if (deleteProfileError) {
    throw deleteProfileError;
  }

  if (snapshot.profile) {
    const { error: restoreProfileError } = await adminClient
      .from("student_memory_profiles")
      .insert(snapshot.profile);

    if (restoreProfileError) {
      throw restoreProfileError;
    }
  }

  if (snapshot.items.length > 0) {
    const { error: restoreItemsError } = await adminClient
      .from("student_memory_items")
      .insert(snapshot.items);

    if (restoreItemsError) {
      throw restoreItemsError;
    }
  }
}

async function cleanupConversation(adminClient, conversationId) {
  await adminClient.from("conversations").delete().eq("id", conversationId);
  await adminClient.from("audit_logs").delete().eq("conversation_id", conversationId);
}

async function main() {
  const adminClient = createAdminClient();
  const fixtureUserIds = await resolveFixtureUserIds(adminClient);
  assert(fixtureUserIds.student, "Missing fixture student user id.");
  assert(fixtureUserIds.parent, "Missing fixture parent user id.");

  const memorySnapshot = await snapshotMemoryState(
    adminClient,
    fixtureUserIds.student,
  );

  let childProcess = null;
  let conversationId = null;

  try {
    const server = await startLocalServer();
    childProcess = server.childProcess;

    const student = buildHttpClient(server.baseUrl, "student");
    const parent = buildHttpClient(server.baseUrl, "parent");
    const tutor = buildHttpClient(server.baseUrl, "tutor");

    await student.signInFixture(FIXTURE.emails.student);
    await parent.signInFixture(FIXTURE.emails.parent);
    await tutor.signInFixture(FIXTURE.emails.tutor);

    const studentPageResult = await student.requestText("/app");
    assert(studentPageResult.response.ok, "Student dashboard did not render.");
    assert(
      normalizeAssertionText(studentPageResult.text).includes("memoire pedagogique"),
      "Student dashboard did not surface the memory panel.",
    );

    const createConversationResult = await student.requestJson("/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        title: `Smoke memory ${new Date().toISOString()}`,
        subjectTag: "memoire_smoke",
        gradedHomework: false,
        pastedText:
          "Je dois expliquer comment trouver le perimetre d'une figure composee.",
        editedExtractedText:
          "Je dois expliquer comment trouver le perimetre d'une figure composee.",
        attachmentReferences: [],
      }),
    });
    assert(
      createConversationResult.response.status === 201 &&
        createConversationResult.payload?.ok === true,
      "Student draft conversation creation failed for the memory smoke.",
    );
    conversationId = createConversationResult.payload.data.conversationId;

    const messageResult = await student.requestJson(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          intent: "student_message",
          contentText:
            "Je comprends l'addition des longueurs, mais je melange encore les cotes a reprendre.",
        }),
      },
    );
    assert(
      messageResult.response.ok && messageResult.payload?.ok === true,
      "Student message append failed during the memory smoke.",
    );

    const completeResult = await student.requestJson(
      `/api/conversations/${conversationId}/complete`,
      {
        method: "POST",
      },
    );
    assert(
      completeResult.response.ok && completeResult.payload?.ok === true,
      "Conversation completion failed during the memory smoke.",
    );

    const { data: generatedItems, error: generatedItemsError } = await adminClient
      .from("student_memory_items")
      .select("id, category, source_conversation_id")
      .eq("student_user_id", fixtureUserIds.student)
      .eq("source_conversation_id", conversationId);

    if (generatedItemsError) {
      throw generatedItemsError;
    }

    assert(
      (generatedItems ?? []).length >= 1,
      "Conversation completion did not create or refresh any conversation-linked memory item.",
    );

    const studentMemoryResult = await student.requestJson(
      `/api/students/${fixtureUserIds.student}/memory`,
    );
    assert(
      studentMemoryResult.response.ok &&
        studentMemoryResult.payload?.ok === true &&
        Array.isArray(studentMemoryResult.payload?.data?.snapshot?.items),
      "Student memory route did not return the expected snapshot.",
    );

    const manualTitle = `Perimetre detail ${Date.now()}`;
    const createMemoryResult = await student.requestJson(
      `/api/students/${fixtureUserIds.student}/memory`,
      {
        method: "PATCH",
        body: JSON.stringify({
          action: "upsert",
          category: "topic",
          title: manualTitle,
          detail: "Revient souvent quand la figure composee change de forme.",
        }),
      },
    );
    assert(
      createMemoryResult.response.ok &&
        createMemoryResult.payload?.ok === true &&
        createMemoryResult.payload?.data?.result?.changedItemId,
      "Student memory create did not succeed.",
    );
    const createdItemId = createMemoryResult.payload.data.result.changedItemId;

    const updateMemoryResult = await student.requestJson(
      `/api/students/${fixtureUserIds.student}/memory`,
      {
        method: "PATCH",
        body: JSON.stringify({
          action: "upsert",
          itemId: createdItemId,
          category: "topic",
          title: manualTitle,
          detail: "Revient souvent quand la figure composee change et demande un plan clair.",
        }),
      },
    );
    assert(
      updateMemoryResult.response.ok && updateMemoryResult.payload?.ok === true,
      "Student memory update did not succeed.",
    );

    const deleteMemoryResult = await student.requestJson(
      `/api/students/${fixtureUserIds.student}/memory`,
      {
        method: "PATCH",
        body: JSON.stringify({
          action: "delete",
          itemId: createdItemId,
        }),
      },
    );
    assert(
      deleteMemoryResult.response.ok && deleteMemoryResult.payload?.ok === true,
      "Student memory delete did not succeed.",
    );

    const parentMemoryResult = await parent.requestJson(
      `/api/students/${fixtureUserIds.student}/memory`,
    );
    assert(
      parentMemoryResult.response.ok &&
        parentMemoryResult.payload?.ok === true &&
        parentMemoryResult.payload?.data?.snapshot?.canEdit === true,
      "Parent memory route did not expose the linked student snapshot.",
    );

    const parentPageResult = await parent.requestText(
      `/app/students/${fixtureUserIds.student}`,
    );
    assert(parentPageResult.response.ok, "Parent student detail page did not render.");
    assert(
      normalizeAssertionText(parentPageResult.text).includes("memoire pedagogique"),
      "Parent student detail page did not surface the memory panel.",
    );

    const tutorMemoryResult = await tutor.requestJson(
      `/api/students/${fixtureUserIds.student}/memory`,
    );
    assert(
      tutorMemoryResult.response.status === 404,
      "Tutor unexpectedly gained access to raw student memory.",
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl: server.baseUrl,
          checks: [
            "student dashboard rendered the memory panel",
            "conversation completion refreshed conversation-linked memory",
            "student memory route returned the snapshot",
            "student memory create/update/delete mutations succeeded",
            "parent memory route and linked-student page rendered",
            "tutor raw memory access stayed blocked",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    if (conversationId) {
      await cleanupConversation(adminClient, conversationId).catch(() => {});
    }

    await restoreMemoryState(
      adminClient,
      fixtureUserIds.student,
      memorySnapshot,
    ).catch(() => {});
    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
