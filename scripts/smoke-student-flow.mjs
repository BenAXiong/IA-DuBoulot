import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  FIXTURE,
  createAdminClient,
  env as fixtureEnv,
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
const sampleAttachmentPath = path.join(
  repoRoot,
  "fixtures",
  "homework-samples",
  "attachments",
  "fractions-partage.pdf",
);
const sampleAttachmentName = "fractions-partage.pdf";
const sampleAttachmentMimeType = "application/pdf";
const requestPrefix = `smoke_student_flow_${Date.now()}`;
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
      "Missing .next build output. Run `npm run build` before `npm run smoke:student-flow`.",
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

async function findAvailablePort(startPort = 3123) {
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

  throw new Error("Unable to find an open local port for the smoke server.");
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

function buildHttpClient(baseUrl) {
  const cookieJar = createCookieJar();
  let requestSequence = 0;

  return {
    cookieJar,
    async signInFixtureStudent() {
      const supabase = createServerClient(
        fixtureEnv.supabaseUrl,
        fixtureEnv.supabaseAnonKey,
        {
          cookies: cookieJar,
        },
      );
      const { error } = await supabase.auth.signInWithPassword({
        email: FIXTURE.emails.student,
        password: fixtureEnv.fixturePassword,
      });

      if (error) {
        throw new Error(
          `Fixture sign-in failed. Rerun \`npm run seed:rls-fixtures\` and retry. ${error.message}`,
        );
      }

      assert(
        cookieJar.toHeader().includes("sb-"),
        "Supabase SSR auth cookie was not created after fixture sign-in.",
      );
    },
    async requestJson(pathname, init = {}) {
      requestSequence += 1;
      const requestId = `${requestPrefix}_${requestSequence}_${pathname
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase()}`;
      const headers = new Headers(init.headers ?? {});
      const hasBody = init.body !== undefined;

      headers.set("x-request-id", requestId);

      if (cookieJar.toHeader()) {
        headers.set("cookie", cookieJar.toHeader());
      }

      if (
        hasBody &&
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
  };
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

async function cleanupConversation(adminClient, state) {
  if (state.uploadedObject) {
    const { bucket, path: storagePath } = state.uploadedObject;
    const { error: removeError } = await adminClient.storage
      .from(bucket)
      .remove([storagePath]);

    if (removeError) {
      console.error("Cleanup warning: failed to remove uploaded storage object.");
      console.error(removeError);
    }
  }

  if (!state.conversationId) {
    return;
  }

  const deletePlan = [
    ["audit_logs", "conversation_id", state.conversationId],
    ["moderation_events", "conversation_id", state.conversationId],
    ["session_summaries", "conversation_id", state.conversationId],
    ["workspace_states", "conversation_id", state.conversationId],
    ["attachments", "conversation_id", state.conversationId],
    ["messages", "conversation_id", state.conversationId],
    ["conversations", "id", state.conversationId],
  ];

  for (const [table, column, value] of deletePlan) {
    const { error } = await adminClient.from(table).delete().eq(column, value);

    if (error) {
      console.error(`Cleanup warning: failed to delete ${table} rows.`);
      console.error(error);
    }
  }
}

async function main() {
  const adminClient = createAdminClient();
  const storageClient = createClient(
    fixtureEnv.supabaseUrl,
    fixtureEnv.supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
  const state = {
    conversationId: null,
    uploadedObject: null,
  };
  const warnings = [];
  let startedServer = false;
  let childProcess = null;
  let baseUrl = process.env.SMOKE_APP_URL ?? null;

  try {
    if (!baseUrl) {
      const server = await startLocalServer();
      startedServer = true;
      childProcess = server.childProcess;
      baseUrl = server.baseUrl;
    }

    const http = buildHttpClient(baseUrl);
    await http.signInFixtureStudent();

    const createConversationResult = await http.requestJson("/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        title: `Smoke A4 flow ${new Date().toISOString()}`,
        subjectTag: "mathematiques",
        gradedHomework: true,
        pastedText: "",
        editedExtractedText:
          "Brouillon initial avant upload et extraction du PDF.",
        attachmentReferences: [],
      }),
    });
    const createConversationPayload = expectOkJson(
      createConversationResult,
      "Failed to create the conversation draft",
    );
    const conversationId =
      createConversationPayload.data?.conversationId ?? null;

    assert(conversationId, "Create conversation response did not include a conversation id.");
    state.conversationId = conversationId;

    const initialDetailResult = await http.requestJson(
      `/api/conversations/${conversationId}`,
    );
    const initialDetailPayload = expectOkJson(
      initialDetailResult,
      "Failed to load the fresh conversation detail",
    );
    const initialDetail = initialDetailPayload.data?.detail;

    assert(initialDetail, "Conversation detail payload is missing.");
    assert(
      initialDetail.conversation.status === "active",
      "Fresh conversation should start in active status.",
    );
    assert(
      initialDetail.messages.length === 1,
      `Fresh conversation should have one initial message, saw ${initialDetail.messages.length}.`,
    );
    assert(
      initialDetail.attachments.length === 0,
      "Fresh conversation should not have attachments before upload.",
    );

    const sampleBuffer = await readFile(sampleAttachmentPath);
    const sampleFile = new File([sampleBuffer], sampleAttachmentName, {
      type: sampleAttachmentMimeType,
    });
    const createUploadResult = await http.requestJson("/api/uploads/create", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        originalFilename: sampleAttachmentName,
        mimeType: sampleAttachmentMimeType,
        byteSize: sampleFile.size,
        uploadSource: "file_picker",
      }),
    });
    const createUploadPayload = expectOkJson(
      createUploadResult,
      "Failed to create the upload target",
    );
    const uploadTarget = createUploadPayload.data?.uploadTarget ?? null;
    const attachment = createUploadPayload.data?.attachment ?? null;

    assert(uploadTarget?.bucket, "Upload target is missing its bucket.");
    assert(uploadTarget?.path, "Upload target is missing its storage path.");
    assert(uploadTarget?.token, "Upload target is missing its signed upload token.");
    assert(attachment?.id, "Upload target response did not include the attachment shell.");

    state.uploadedObject = {
      bucket: uploadTarget.bucket,
      path: uploadTarget.path,
    };

    const uploadResult = await storageClient.storage
      .from(uploadTarget.bucket)
      .uploadToSignedUrl(uploadTarget.path, uploadTarget.token, sampleFile);

    if (uploadResult.error) {
      throw new Error(
        `Signed storage upload failed: ${uploadResult.error.message}`,
      );
    }

    const confirmUploadResult = await http.requestJson("/api/uploads/confirm", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        attachmentId: attachment.id,
      }),
    });
    const confirmUploadPayload = expectOkJson(
      confirmUploadResult,
      "Failed to confirm the uploaded attachment",
    );
    const confirmedAttachment = confirmUploadPayload.data?.attachment ?? null;
    const extractedTextBlock =
      confirmUploadPayload.data?.extractedTextBlock ?? null;
    const warningMessage = confirmUploadPayload.data?.warningMessage ?? null;

    assert(confirmedAttachment, "Confirm upload did not return the attachment row.");

    const extractionStatus = confirmedAttachment.extraction_status;

    assert(
      extractionStatus === "ready" || extractionStatus === "failed",
      `Attachment extraction should resolve to ready or failed, saw ${extractionStatus ?? "unknown"}.`,
    );

    if (extractionStatus === "ready") {
      assert(
        typeof extractedTextBlock === "string" &&
          extractedTextBlock.startsWith("[Source: fractions-partage.pdf]") &&
          normalizeAssertionText(extractedTextBlock).includes("exercice") &&
          extractedTextBlock.trim().length >= 40,
        `Extracted text block is unexpectedly empty or malformed. Received: ${extractedTextBlock}`,
      );
    } else {
      assert(
        extractedTextBlock === null,
        "Failed extraction should not return an extracted text block.",
      );
      assert(
        typeof warningMessage === "string" && warningMessage.trim().length > 0,
        "Failed extraction should return a manual-review warning.",
      );
      warnings.push(
        "Attachment extraction fell back to manual review after provider failure.",
      );
    }

    const workspaceExtractedText =
      extractedTextBlock ?? "Brouillon initial avant upload et extraction du PDF.";

    const workspacePatchResult = await http.requestJson(
      `/api/conversations/${conversationId}/workspace`,
      {
        method: "PATCH",
        body: JSON.stringify({
          assignmentText:
            "Lisa partage 3 tartes entre 4 amis. Quelle fraction recoit chaque ami ?",
          editedExtractedText: workspaceExtractedText,
          planText:
            "1. Convertir 3 tartes en quarts. 2. Repartir 12 quarts entre 4 amis.",
          draftAnswerText:
            "Chaque ami recoit 3/4 de tarte, mais je dois mieux expliquer pourquoi.",
          studentNotes: warningMessage ?? "Smoke note: PDF extraction synced.",
        }),
      },
    );
    const workspacePatchPayload = expectOkJson(
      workspacePatchResult,
      "Failed to persist the extracted workspace state",
    );
    const persistedWorkspace = workspacePatchPayload.data?.workspace ?? null;

    assert(
      persistedWorkspace?.edited_extracted_text === workspaceExtractedText,
      "Workspace did not retain the expected extracted-text state.",
    );

    const detailAfterUploadResult = await http.requestJson(
      `/api/conversations/${conversationId}`,
    );
    const detailAfterUploadPayload = expectOkJson(
      detailAfterUploadResult,
      "Failed to reload the conversation detail after upload",
    );
    const detailAfterUpload = detailAfterUploadPayload.data?.detail ?? null;

    assert(
      detailAfterUpload?.attachments?.length === 1,
      `Conversation detail should show one attachment, saw ${detailAfterUpload?.attachments?.length ?? 0}.`,
    );
    assert(
      detailAfterUpload?.workspace?.edited_extracted_text === workspaceExtractedText,
      "Conversation detail did not return the synced extracted-text state.",
    );

    const appendMessageResult = await http.requestJson(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          intent: "student_message",
          contentText:
            "Je pense que chaque ami recoit trois quarts, mais je n'arrive pas a formuler les etapes clairement.",
        }),
      },
    );
    const appendMessagePayload = expectOkJson(
      appendMessageResult,
      "Failed to append the student conversation turn",
    );
    const studentMessage = appendMessagePayload.data?.studentMessage ?? null;
    const assistantMessage =
      appendMessagePayload.data?.assistantMessage ?? null;

    assert(
      studentMessage?.role === "student",
      "Message route did not return the student message.",
    );
    assert(
      assistantMessage?.role === "assistant" &&
        assistantMessage.content_text.trim().length > 0,
        "Message route did not return a usable assistant reply.",
    );

    if (
      typeof assistantMessage?.content_text === "string" &&
      /^(Coach brouillon|Indice de depart|Resume de session)/.test(
        assistantMessage.content_text,
      )
    ) {
      warnings.push("Coach reply used the deterministic fallback.");
    }

    const completeResult = await http.requestJson(
      `/api/conversations/${conversationId}/complete`,
      {
        method: "POST",
      },
    );
    const completePayload = expectOkJson(
      completeResult,
      "Failed to complete the conversation",
    );
    const completedConversation = completePayload.data?.conversation ?? null;
    const returnedSummaries = completePayload.data?.summaries ?? [];

    assert(
      completedConversation?.status === "completed",
      "Completion route did not mark the conversation completed.",
    );
    assert(
      Array.isArray(returnedSummaries) && returnedSummaries.length === 1,
      `Student completion response should expose exactly one visible summary, saw ${returnedSummaries.length}.`,
    );
    assert(
      returnedSummaries[0]?.audience === "student",
      "Student completion response leaked a non-student summary audience.",
    );
    assert(
      returnedSummaries[0]?.summary_text?.trim().length > 0,
      "Student completion response returned an empty summary.",
    );

    if (returnedSummaries[0]?.generated_model_name === "deterministic-summary-v1") {
      warnings.push("Student summary used the deterministic fallback.");
    }

    const readOnlyMessageResult = await http.requestJson(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          intent: "hint",
          contentText: "",
        }),
      },
    );

    assert(
      readOnlyMessageResult.response.status === 409,
      `Completed conversations should reject new turns with 409, saw ${readOnlyMessageResult.response.status}.`,
    );
    assert(
      readErrorMessage(
        readOnlyMessageResult.payload,
        "",
      ) === "Completed sessions are read-only.",
      "Completed conversation rejection returned an unexpected message.",
    );

    const finalDetailResult = await http.requestJson(
      `/api/conversations/${conversationId}`,
    );
    const finalDetailPayload = expectOkJson(
      finalDetailResult,
      "Failed to reload the completed conversation detail",
    );
    const finalDetail = finalDetailPayload.data?.detail ?? null;

    assert(
      finalDetail?.conversation?.status === "completed",
      "Completed detail route did not return completed status.",
    );
    assert(
      finalDetail?.summaries?.length === 1 &&
        finalDetail.summaries[0]?.audience === "student",
      "Completed detail route did not stay filtered to the student summary.",
    );

    const { data: summaryRows, error: summaryError } = await adminClient
      .from("session_summaries")
      .select("audience, language_code")
      .eq("conversation_id", conversationId);

    if (summaryError) {
      throw summaryError;
    }

    const summaryKeys = new Set(
      (summaryRows ?? []).map((row) => `${row.audience}:${row.language_code}`),
    );

    const allowedSummaryKeys = new Set([
      "student:fr",
      "parent:fr",
      "parent:en",
      "parent:zh",
      "tutor:fr",
    ]);
    const unexpectedSummaryKeys = Array.from(summaryKeys).filter(
      (key) => !allowedSummaryKeys.has(key),
    );

    assert(
      summaryKeys.has("student:fr"),
      "Stored summaries are missing the required student summary.",
    );
    assert(
      unexpectedSummaryKeys.length === 0,
      `Stored summaries contained unexpected audience/language variants: ${unexpectedSummaryKeys.join(", ")}`,
    );

    const missingOptionalSummaryKeys = [
      "parent:fr",
      "parent:en",
      "parent:zh",
      "tutor:fr",
    ].filter((key) => !summaryKeys.has(key));

    if (missingOptionalSummaryKeys.length > 0) {
      warnings.push(
        `Optional adult summary variants missing: ${missingOptionalSummaryKeys.join(", ")}`,
      );
    }

    const { data: moderationRows, error: moderationError } = await adminClient
      .from("moderation_events")
      .select("event_source, status")
      .eq("conversation_id", conversationId);

    if (moderationError) {
      throw moderationError;
    }

    assert(
      Array.isArray(moderationRows) && moderationRows.length === 0,
      `Safe smoke content should not create moderation events, saw ${moderationRows?.length ?? 0}.`,
    );

    const { data: auditRows, error: auditError } = await adminClient
      .from("audit_logs")
      .select("action")
      .eq("conversation_id", conversationId);

    if (auditError) {
      throw auditError;
    }

    const auditActions = new Set((auditRows ?? []).map((row) => row.action));

    for (const action of ["conversation_create", "conversation_complete"]) {
      assert(auditActions.has(action), `Missing audit log action ${action}.`);
    }

    const { data: attachmentRows, error: attachmentError } = await adminClient
      .from("attachments")
      .select("extraction_status, metadata, source_language")
      .eq("conversation_id", conversationId);

    if (attachmentError) {
      throw attachmentError;
    }

    assert(
      Array.isArray(attachmentRows) && attachmentRows.length === 1,
      `Expected one stored attachment row, saw ${attachmentRows?.length ?? 0}.`,
    );
    assert(
      attachmentRows[0]?.extraction_status === extractionStatus,
      `Stored attachment row should stay ${extractionStatus}, saw ${attachmentRows[0]?.extraction_status ?? "unknown"}.`,
    );

    if (extractionStatus === "ready") {
      assert(
        attachmentRows[0]?.source_language === "fr",
        `Stored attachment language should be fr, saw ${attachmentRows[0]?.source_language ?? "unknown"}.`,
      );
    } else {
      assert(
        attachmentRows[0]?.metadata?.extraction_error === "provider_failure",
        "Failed extraction should persist provider failure metadata.",
      );
    }

    console.info(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          startedServer,
          conversationId,
          checks: [
          "student auth cookie established",
          "draft conversation created",
          "PDF upload confirmed with extraction or graceful manual-review fallback",
          "workspace synced with extracted text",
          "coach reply appended",
            "student completion response filtered to one summary",
          "completed conversation became read-only",
          "stored summaries include the required student variant and any available adult variants",
          "moderation and audit rows persisted",
        ],
        warnings,
        storedSummaryVariants: Array.from(summaryKeys).sort(),
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanupConversation(adminClient, state);
    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error("Student-flow smoke failed.");
  console.error(error);
  process.exitCode = 1;
});
