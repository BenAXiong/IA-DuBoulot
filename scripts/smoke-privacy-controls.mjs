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
const requestPrefix = `smoke_privacy_${Date.now()}`;
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
      "Missing .next build output. Run `npm run build` before `npm run smoke:privacy`.",
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

async function findAvailablePort(startPort = 3185) {
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

  throw new Error("Unable to find an open local port for the privacy smoke server.");
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

function buildAuthMetadata(user) {
  return {
    app_role: user.role,
    display_name: user.display_name,
    preferred_ui_language: user.preferred_ui_language,
    ai_help_language: user.ai_help_language,
    age_band: user.age_band,
    is_under_13: user.is_under_13,
    account_status: user.account_status,
    onboarding_completed: true,
    app_profile_version: 1,
  };
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

async function resetFixtureDeletionState(adminClient, fixtureUserIds, studentRow) {
  const { error: studentResetError } = await adminClient
    .from("users")
    .update({
      account_status: "active",
      deletion_requested_at: null,
    })
    .eq("id", fixtureUserIds.student);

  if (studentResetError) {
    throw studentResetError;
  }

  const { error: tutorLinkError } = await adminClient
    .from("tutor_student_links")
    .update({
      link_status: "active",
    })
    .eq("id", FIXTURE.ids.tutorLink);

  if (tutorLinkError) {
    throw tutorLinkError;
  }

  const { error: authError } = await adminClient.auth.admin.updateUserById(
    fixtureUserIds.student,
    {
      user_metadata: buildAuthMetadata({
        ...studentRow,
        account_status: "active",
      }),
    },
  );

  if (authError) {
    throw authError;
  }
}

async function main() {
  const adminClient = createAdminClient();
  const fixtureUserIds = await resolveFixtureUserIds(adminClient);
  assert(fixtureUserIds.parent, "Missing fixture parent user id.");
  assert(fixtureUserIds.student, "Missing fixture student user id.");

  const { data: studentRow, error: studentLoadError } = await adminClient
    .from("users")
    .select(
      "id, role, account_status, display_name, preferred_ui_language, ai_help_language, age_band, is_under_13",
    )
    .eq("id", fixtureUserIds.student)
    .single();

  if (studentLoadError || !studentRow) {
    throw studentLoadError ?? new Error("Missing fixture student profile.");
  }

  let childProcess = null;

  try {
    await resetFixtureDeletionState(adminClient, fixtureUserIds, studentRow);
    const server = await startLocalServer();
    childProcess = server.childProcess;

    const parent = buildHttpClient(server.baseUrl, "parent");
    await parent.signInFixture(FIXTURE.emails.parent);

    const settingsResult = await parent.requestText("/app/settings");
    assert(settingsResult.response.ok, "Parent settings page did not render.");
    assert(
      normalizeAssertionText(settingsResult.text).includes(
        "reglages et confidentialite",
      ) &&
        normalizeAssertionText(settingsResult.text).includes("suppression et gel"),
      "Parent settings page did not surface the privacy controls copy.",
    );

    const deletionResult = await parent.requestJson(
      "/api/privacy/deletion-requests",
      {
        method: "POST",
        body: JSON.stringify({
          targetUserId: fixtureUserIds.student,
        }),
      },
    );

    assert(
      deletionResult.response.ok &&
        deletionResult.payload?.ok === true &&
        deletionResult.payload?.data?.targetUserId === fixtureUserIds.student &&
        deletionResult.payload?.data?.status === "deletion_requested",
      "Parent-linked student deletion request did not return the expected queued result.",
    );

    const { data: deletedStudentRow, error: deletedStudentError } = await adminClient
      .from("users")
      .select("account_status, deletion_requested_at")
      .eq("id", fixtureUserIds.student)
      .single();

    if (deletedStudentError) {
      throw deletedStudentError;
    }

    assert(
      deletedStudentRow.account_status === "deletion_requested" &&
        deletedStudentRow.deletion_requested_at,
      "Student profile was not marked deletion_requested.",
    );

    const { data: tutorLinkRow, error: tutorLinkLoadError } = await adminClient
      .from("tutor_student_links")
      .select("link_status")
      .eq("id", FIXTURE.ids.tutorLink)
      .single();

    if (tutorLinkLoadError) {
      throw tutorLinkLoadError;
    }

    assert(
      tutorLinkRow.link_status === "revoked",
      "Tutor access was not revoked when the student deletion request was queued.",
    );

    const student = buildHttpClient(server.baseUrl, "student");
    await student.signInFixture(FIXTURE.emails.student);

    const studentPageResult = await student.requestText("/app?view=homework", {
      redirect: "manual",
    });
    assert(
      studentPageResult.response.status >= 300 &&
        studentPageResult.response.status < 400 &&
        String(studentPageResult.location ?? "").includes("/app/settings"),
      "Deletion-requested student was not redirected to /app/settings.",
    );

    const blockedConversationResult = await student.requestJson(
      "/api/conversations",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Smoke privacy flow",
          subjectTag: "Maths",
          gradedHomework: true,
          pastedText: "Je veux tester le blocage apres suppression.",
          editedExtractedText: "",
          attachmentReferences: [],
        }),
      },
    );

    assert(
      blockedConversationResult.response.status === 409 &&
        normalizeAssertionText(
          blockedConversationResult.payload?.error?.message ?? "",
        ).includes("queued for deletion"),
      "Deletion-requested student could still create a conversation.",
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl: server.baseUrl,
          checks: [
            "parent settings page renders the new privacy controls",
            "parent can queue linked-student deletion",
            "student account is marked deletion_requested",
            "student tutor access is revoked immediately",
            "deletion-requested student is redirected to /app/settings",
            "deletion-requested student cannot create a new conversation",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await resetFixtureDeletionState(adminClient, fixtureUserIds, studentRow).catch(
      () => {},
    );
    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
