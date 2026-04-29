import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readNumberArg(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  const value = raw ? Number(raw) : fallback;

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid --${name} value: ${raw}`);
  }

  return value;
}

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getRetrieval(metadata) {
  const value = metadata?.subjectResourceRetrieval;

  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function hasRetrievalMetadata(metadata) {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      !Array.isArray(metadata) &&
      Object.prototype.hasOwnProperty.call(metadata, "subjectResourceRetrieval"),
  );
}

function summarize(rows) {
  const measured = rows.filter(
    (row) => row.inputTokens !== null || row.outputTokens !== null,
  );
  const inputTokens = measured.reduce(
    (sum, row) => sum + (row.inputTokens ?? 0),
    0,
  );
  const outputTokens = measured.reduce(
    (sum, row) => sum + (row.outputTokens ?? 0),
    0,
  );
  const retrievalContextEstimatedTokens = rows.reduce(
    (sum, row) => sum + (row.retrievalContextEstimatedTokens ?? 0),
    0,
  );

  return {
    turns: rows.length,
    measuredTurns: measured.length,
    inputTokens,
    outputTokens,
    avgInputTokens: measured.length ? Math.round(inputTokens / measured.length) : null,
    avgOutputTokens: measured.length
      ? Math.round(outputTokens / measured.length)
      : null,
    retrievalContextEstimatedTokens,
    avgRetrievalContextEstimatedTokens: rows.length
      ? Math.round(retrievalContextEstimatedTokens / rows.length)
      : null,
  };
}

async function loadMessagesById(supabase, ids) {
  const messages = new Map();

  for (const idsChunk of chunk(ids, 100)) {
    const { data, error } = await supabase
      .from("messages")
      .select("id,input_tokens,output_tokens")
      .in("id", idsChunk);

    if (error) {
      throw error;
    }

    for (const message of data ?? []) {
      messages.set(message.id, message);
    }
  }

  return messages;
}

async function main() {
  const days = readNumberArg("days", 14);
  const limit = readNumberArg("limit", 500);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data: captures, error } = await supabase
    .from("ai_generation_debug_captures")
    .select(
      "id,created_at,conversation_id,assistant_message_id,model_name,usage_snapshot,metadata",
    )
    .eq("operation", "coach_reply")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const assistantMessageIds = Array.from(
    new Set(
      (captures ?? [])
        .map((capture) => capture.assistant_message_id)
        .filter((id) => typeof id === "string" && id),
    ),
  );
  const messagesById = await loadMessagesById(supabase, assistantMessageIds);
  const rows = (captures ?? []).map((capture) => {
    const retrieval = getRetrieval(capture.metadata);
    const persistedMessage = messagesById.get(capture.assistant_message_id);
    const usageSnapshot =
      capture.usage_snapshot &&
      typeof capture.usage_snapshot === "object" &&
      !Array.isArray(capture.usage_snapshot)
        ? capture.usage_snapshot
        : {};

    return {
      captureId: capture.id,
      createdAt: capture.created_at,
      conversationId: capture.conversation_id,
      modelName: capture.model_name,
      hasRetrieval: Boolean(
        retrieval && asNumber(retrieval.selectedResourceCount) > 0,
      ),
      retrievalReturnedChunkCount: asNumber(retrieval?.returnedChunkCount),
      retrievalContextEstimatedTokens: asNumber(
        retrieval?.estimatedContextTokens,
      ),
      inputTokens:
        asNumber(persistedMessage?.input_tokens) ??
        asNumber(usageSnapshot.inputTokens),
      outputTokens:
        asNumber(persistedMessage?.output_tokens) ??
        asNumber(usageSnapshot.outputTokens),
      tokenSource: persistedMessage ? "messages" : "debug_capture_usage_snapshot",
    };
  });
  const withRetrieval = rows.filter((row) => row.hasRetrieval);
  const withoutRetrieval = rows.filter((row) => !row.hasRetrieval);
  const missingRetrievalMetadata = rows.filter(
    (row) =>
      !hasRetrievalMetadata(
        captures?.find((capture) => capture.id === row.captureId)?.metadata,
      ),
  ).length;

  console.log(
    JSON.stringify(
      {
        period: {
          since,
          days,
          limit,
        },
        source:
          "ai_generation_debug_captures joined to persisted messages.input_tokens/output_tokens when available",
        total: summarize(rows),
        withSubjectResourceRetrieval: summarize(withRetrieval),
        withoutSubjectResourceRetrieval: summarize(withoutRetrieval),
        diagnostics: {
          captures: rows.length,
          capturesWithPersistedMessageTokens: rows.filter(
            (row) => row.tokenSource === "messages",
          ).length,
          capturesMissingRetrievalMetadata: missingRetrievalMetadata,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
