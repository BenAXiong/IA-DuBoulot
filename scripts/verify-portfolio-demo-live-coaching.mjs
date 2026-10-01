import process from "node:process";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  createSmokeHttpClient,
  expectOkJson,
} from "./smoke-app-harness.mjs";
import { evaluateCoachingResponse } from "./portfolio-demo/acceptance-contract.mjs";
import { normalizeCaptureTarget } from "./portfolio-demo/preflight.mjs";

const DEMO_TAG = "portfolio_demo_matt_v1";
const SUBJECT_TAG = "mathematiques";
const SOURCE_FILENAME = "fractions_add_prod.pdf";
const MATT_QUESTION = "what's the answer to b?? i don't get fractions";
const DEFAULT_MAX_ATTEMPTS = 3;

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function parseMaxAttempts(argv = process.argv.slice(2)) {
  const value = argv.find((argument) => argument.startsWith("--max-attempts="));

  if (!value) {
    return DEFAULT_MAX_ATTEMPTS;
  }

  const rawValue = value.slice("--max-attempts=".length);

  if (!/^[1-3]$/.test(rawValue)) {
    throw new Error("--max-attempts must be an integer from 1 to 3.");
  }

  return Number.parseInt(rawValue, 10);
}

function loadConfig(argv) {
  if (!argv.includes("--confirm-hosted-write")) {
    throw new Error(
      "Hosted writes are disabled. Re-run with --confirm-hosted-write after reviewing the configured Matt demo account.",
    );
  }

  const target = normalizeCaptureTarget(requireEnv("PORTFOLIO_DEMO_APP_URL"));

  if (!target.isSecure || target.isLoopback) {
    throw new Error("The live coaching proof requires a remote HTTPS deployment.");
  }

  return {
    appOrigin: target.origin,
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    studentEmail: requireEnv("PORTFOLIO_DEMO_EMAIL").toLowerCase(),
    studentPassword: requireEnv("PORTFOLIO_DEMO_PASSWORD"),
    maxAttempts: parseMaxAttempts(argv),
  };
}

function createAdminClient(config) {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function createDemoHttpClient(config) {
  return createSmokeHttpClient({
    baseUrl: config.appOrigin,
    requestPrefix: `portfolio_demo_live_coaching_${Date.now()}`,
    roleLabel: "Matt live coaching proof",
    requestTimeoutMs: 180000,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    signInErrorLabel: "the tagged Matt portfolio demo account",
    assertAuthCookie: true,
  });
}

function sortedRows(rows, key = "id") {
  return [...rows].sort((left, right) =>
    String(left[key]).localeCompare(String(right[key])),
  );
}

function usageKey(row) {
  return `${row.period_start}:${row.period_end}`;
}

function comparableUsage(rows) {
  return sortedRows(
    rows.map((row) => ({
      period_start: row.period_start,
      period_end: row.period_end,
      sessions_count: row.sessions_count,
      uploads_count: row.uploads_count,
      assistant_message_count: row.assistant_message_count,
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
    })),
    "period_start",
  );
}

async function loadBaseline(admin, studentUserId) {
  const [conversationResult, resourceResult, usageResult] = await Promise.all([
    admin
      .from("conversations")
      .select("id,title,subject_tag,status,last_message_at,completed_at,updated_at")
      .eq("student_user_id", studentUserId),
    admin
      .from("subject_resources")
      .select("id,subject_tag,original_filename,sha256,extraction_status,updated_at")
      .eq("student_user_id", studentUserId),
    admin
      .from("usage_counters")
      .select("*")
      .eq("student_user_id", studentUserId),
  ]);

  if (conversationResult.error) {
    throw conversationResult.error;
  }
  if (resourceResult.error) {
    throw resourceResult.error;
  }
  if (usageResult.error) {
    throw usageResult.error;
  }

  return {
    conversations: sortedRows(conversationResult.data ?? []),
    resources: sortedRows(resourceResult.data ?? []),
    usage: sortedRows(usageResult.data ?? [], "period_start"),
  };
}

async function restoreUsageBaseline(admin, studentUserId, baselineUsage) {
  const { data: currentUsage, error: currentUsageError } = await admin
    .from("usage_counters")
    .select("*")
    .eq("student_user_id", studentUserId);

  if (currentUsageError) {
    throw currentUsageError;
  }

  const baselineKeys = new Set(baselineUsage.map(usageKey));

  for (const row of currentUsage ?? []) {
    if (baselineKeys.has(usageKey(row))) {
      continue;
    }

    const { error } = await admin
      .from("usage_counters")
      .delete()
      .eq("id", row.id)
      .eq("student_user_id", studentUserId);

    if (error) {
      throw error;
    }
  }

  if (baselineUsage.length > 0) {
    const { error } = await admin.from("usage_counters").upsert(
      baselineUsage.map((row) => ({
        id: row.id,
        student_user_id: row.student_user_id,
        period_start: row.period_start,
        period_end: row.period_end,
        sessions_count: row.sessions_count,
        uploads_count: row.uploads_count,
        assistant_message_count: row.assistant_message_count,
        input_tokens: row.input_tokens,
        output_tokens: row.output_tokens,
        created_at: row.created_at,
      })),
      { onConflict: "student_user_id,period_start,period_end" },
    );

    if (error) {
      throw error;
    }
  }
}

async function removeTemporaryConversation(admin, conversationId) {
  if (!conversationId) {
    return;
  }

  for (const table of ["audit_logs", "moderation_events"]) {
    const { error } = await admin
      .from(table)
      .delete()
      .eq("conversation_id", conversationId);

    if (error) {
      throw error;
    }
  }

  const { error } = await admin
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
}

async function assertBaselineRestored(admin, studentUserId, baseline) {
  const restored = await loadBaseline(admin, studentUserId);

  assert(
    JSON.stringify(restored.conversations) === JSON.stringify(baseline.conversations),
    "Matt's conversation baseline changed during live-coaching cleanup.",
  );
  assert(
    JSON.stringify(restored.resources) === JSON.stringify(baseline.resources),
    "Matt's private resource library changed during live-coaching cleanup.",
  );
  assert(
    JSON.stringify(comparableUsage(restored.usage)) ===
      JSON.stringify(comparableUsage(baseline.usage)),
    "Matt's visible usage counters were not restored after live-coaching cleanup.",
  );

  return {
    conversationsPreserved: restored.conversations.length,
    resourcesPreserved: restored.resources.length,
    usageCountersRestored: true,
  };
}

function retrievalEvidence(debugCapture, resourceId) {
  const diagnostics =
    debugCapture?.metadata?.subjectResourceRetrieval ?? null;
  const chunkRefs = Array.isArray(diagnostics?.chunkRefs)
    ? diagnostics.chunkRefs
    : [];

  return {
    selectedResourceCount: diagnostics?.selectedResourceCount ?? 0,
    candidateChunkCount: diagnostics?.candidateChunkCount ?? 0,
    returnedChunkCount: diagnostics?.returnedChunkCount ?? 0,
    selectedSourceReturned: chunkRefs.some(
      (chunk) => chunk.resourceId === resourceId,
    ),
    fallbackToFirstChunks: diagnostics?.fallbackToFirstChunks ?? null,
  };
}

async function runAttempt({ admin, http, resource, attemptNumber }) {
  let conversationId = null;

  try {
    const createResult = await http.requestJson("/api/conversations?mode=shell", {
      method: "POST",
      body: JSON.stringify({
        title: `Portfolio proof ${attemptNumber}`,
        subjectTag: SUBJECT_TAG,
        gradedHomework: false,
        attachmentReferences: [],
      }),
    });
    const createPayload = expectOkJson(
      createResult,
      "Failed to create a temporary Matt conversation",
    );
    conversationId = createPayload.data?.conversationId ?? null;
    assert(conversationId, "The temporary conversation response omitted its id.");

    const selectionResult = await http.requestJson(
      "/api/subject-resources/selection",
      {
        method: "PATCH",
        body: JSON.stringify({
          conversationId,
          resourceId: resource.id,
          selected: true,
        }),
      },
    );
    const selectionPayload = expectOkJson(
      selectionResult,
      "Failed to select the fractions source for the temporary conversation",
    );
    assert(
      selectionPayload.data?.resourceId === resource.id &&
        selectionPayload.data?.selected === true,
      "The fractions source was not selected for the temporary conversation.",
    );

    const startedAt = Date.now();
    const messageResult = await http.requestJson(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          intent: "student_message",
          replyMode: "thinking",
          contentText: MATT_QUESTION,
        }),
      },
    );
    const latencyMs = Date.now() - startedAt;
    const messagePayload = expectOkJson(
      messageResult,
      "Failed to run Matt's live coaching turn",
    );
    const studentMessage = messagePayload.data?.studentMessage ?? null;
    const assistantMessage = messagePayload.data?.assistantMessage ?? null;

    assert(
      studentMessage?.content_text === MATT_QUESTION,
      "The product did not persist Matt's exact configured question.",
    );
    assert(
      typeof assistantMessage?.content_text === "string" &&
        assistantMessage.content_text.trim().length > 0,
      "The product did not return a usable assistant message.",
    );

    const { data: debugCapture, error: debugError } = await admin
      .from("ai_generation_debug_captures")
      .select(
        "provider,model_name,prompt_version,reply_mode,usage_snapshot,metadata",
      )
      .eq("conversation_id", conversationId)
      .eq("request_id", messageResult.requestId)
      .maybeSingle();

    if (debugError) {
      throw debugError;
    }

    const acceptance = evaluateCoachingResponse(assistantMessage.content_text);
    const retrieval = retrievalEvidence(debugCapture, resource.id);
    const providerPassed =
      assistantMessage.model_provider === "gemini" &&
      typeof assistantMessage.model_name === "string" &&
      assistantMessage.model_name.length > 0 &&
      debugCapture?.provider === "gemini" &&
      debugCapture?.reply_mode === "thinking";
    const retrievalPassed =
      retrieval.selectedResourceCount === 1 &&
      retrieval.returnedChunkCount > 0 &&
      retrieval.selectedSourceReturned;

    return {
      attempt: attemptNumber,
      accepted: acceptance.accepted && providerPassed && retrievalPassed,
      latencyMs,
      source: {
        filename: SOURCE_FILENAME,
        selected: true,
        retrieval,
      },
      provider: {
        provider: assistantMessage.model_provider,
        model: assistantMessage.model_name,
        promptVersion: debugCapture?.prompt_version ?? null,
        replyMode: debugCapture?.reply_mode ?? null,
        usedFallbackModel: debugCapture?.metadata?.usedFallback ?? null,
        inputTokens: debugCapture?.usage_snapshot?.inputTokens ?? null,
        outputTokens: debugCapture?.usage_snapshot?.outputTokens ?? null,
        liveProviderOutput: providerPassed,
      },
      acceptance,
      replyText: assistantMessage.content_text,
      failedProofChecks: [
        ...(!providerPassed ? ["live-provider-evidence"] : []),
        ...(!retrievalPassed ? ["selected-source-retrieval"] : []),
        ...acceptance.failedCheckIds,
      ],
    };
  } finally {
    await removeTemporaryConversation(admin, conversationId);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const config = loadConfig(argv);
  const admin = createAdminClient(config);
  const http = createDemoHttpClient(config);

  await http.signInPassword(config.studentEmail, config.studentPassword);
  const meResult = await http.requestJson("/api/auth/me");
  const mePayload = expectOkJson(
    meResult,
    "Matt's authenticated profile route failed",
  );
  const studentUserId = mePayload.data?.appUser?.id ?? null;

  assert(studentUserId, "Matt's authenticated profile omitted its user id.");

  const { data: taggedAuth, error: taggedAuthError } =
    await admin.auth.admin.getUserById(studentUserId);

  if (taggedAuthError) {
    throw taggedAuthError;
  }

  assert(
    taggedAuth.user?.email?.toLowerCase() === config.studentEmail &&
      taggedAuth.user?.user_metadata?.portfolio_demo_tag === DEMO_TAG,
    "Refusing to operate because the authenticated account is not the dedicated tagged Matt account.",
  );

  const libraryResult = await http.requestJson(
    `/api/subject-resources?subjectTag=${encodeURIComponent(SUBJECT_TAG)}`,
  );
  const libraryPayload = expectOkJson(
    libraryResult,
    "Matt's subject-resource library route failed",
  );
  const resources = libraryPayload.data?.resources ?? [];
  const resource = resources.find(
    (item) => item.original_filename === SOURCE_FILENAME,
  );

  assert(
    resources.length === 3,
    `Expected Matt's three-resource Mathematics baseline, found ${resources.length}.`,
  );
  assert(
    resource?.extraction_status === "ready" && resource.chunk_count > 0,
    `${SOURCE_FILENAME} is not ready and chunked.`,
  );

  const baseline = await loadBaseline(admin, studentUserId);
  const attempts = [];
  let cleanupEvidence = null;
  let runError = null;

  try {
    for (
      let attemptNumber = 1;
      attemptNumber <= config.maxAttempts;
      attemptNumber += 1
    ) {
      const attempt = await runAttempt({
        admin,
        http,
        resource,
        attemptNumber,
      });
      attempts.push(attempt);

      if (attempt.accepted) {
        break;
      }
    }
  } catch (error) {
    runError = error;
  } finally {
    try {
      await restoreUsageBaseline(admin, studentUserId, baseline.usage);
      cleanupEvidence = await assertBaselineRestored(
        admin,
        studentUserId,
        baseline,
      );
    } catch (cleanupError) {
      runError = runError
        ? new AggregateError(
            [runError, cleanupError],
            "The proof failed and cleanup could not fully restore Matt's baseline.",
          )
        : cleanupError;
    }
  }

  const acceptedAttempt = attempts.find((attempt) => attempt.accepted) ?? null;
  const report = {
    schemaVersion: 1,
    contract: "matt-fractions-plan-and-hint-v1",
    targetOrigin: config.appOrigin,
    sourceFilename: SOURCE_FILENAME,
    question: MATT_QUESTION,
    maxAttempts: config.maxAttempts,
    attempts,
    accepted: Boolean(acceptedAttempt) && !runError,
    acceptedAttempt: acceptedAttempt?.attempt ?? null,
    cleanup: cleanupEvidence,
    error: runError
      ? {
          name: runError.name,
          message: runError.message,
        }
      : null,
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.accepted) {
    throw new Error(
      "The hosted Matt live-coaching proof did not satisfy its provider, retrieval, acceptance, and cleanup gates.",
    );
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
