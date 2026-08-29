import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  env as fixtureEnv,
} from "./rls-fixture-shared.mjs";
import {
  createSmokeHttpClient,
  expectOkJson,
  readErrorMessage,
  startLocalNextServer,
  stopLocalNextServer,
} from "./smoke-app-harness.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function startLocalServer() {
  return startLocalNextServer({
    smokeCommand: "npm run smoke:student-flow",
    startPort: 3123,
  });
}

function stopLocalServer(childProcess) {
  return stopLocalNextServer(childProcess);
}

function buildHttpClient(baseUrl) {
  const client = createSmokeHttpClient({
    baseUrl,
    requestPrefix,
    supabaseUrl: fixtureEnv.supabaseUrl,
    supabaseAnonKey: fixtureEnv.supabaseAnonKey,
    fixturePassword: fixtureEnv.fixturePassword,
    signInErrorLabel: "smoke learner",
    assertAuthCookie: true,
    requestIdFactory: ({ prefix, sequence, pathname }) =>
      `${prefix}_${sequence}_${pathname
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase()}`,
  });

  return {
    ...client,
    requestText(pathname, init = {}) {
      return client.requestText(pathname, {
        redirect: "manual",
        ...init,
      });
    },
  };
}

async function createIsolatedSmokeStudent(adminClient) {
  const timestamp = Date.now();
  const email = `smoke-student-${timestamp}@iaduboulot.local`;
  const displayName = "Smoke First Homework Student";
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password: fixtureEnv.fixturePassword,
      email_confirm: true,
      user_metadata: {
        app_role: "student",
        display_name: displayName,
        preferred_ui_language: "fr",
        ai_help_language: "fr",
        age_band: "thirteen_fifteen",
        is_under_13: false,
        account_status: "active",
        onboarding_completed: true,
        app_profile_version: 1,
        smoke_tag: requestPrefix,
      },
    });

  if (authError || !authData.user) {
    throw authError ?? new Error("Smoke learner auth creation returned no user.");
  }

  const userId = authData.user.id;
  const { error: userError } = await adminClient.from("users").insert({
    id: userId,
    role: "student",
    account_status: "active",
    display_name: displayName,
    preferred_ui_language: "fr",
    ai_help_language: "fr",
    age_band: "thirteen_fifteen",
    is_under_13: false,
    birth_date: "2011-08-29",
    country_of_study: "TW",
    grade_level: "college",
  });

  if (userError) {
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    throw userError;
  }

  const { error: profileError } = await adminClient
    .from("student_profiles")
    .insert({
      student_user_id: userId,
      current_grade_level: "college",
      preferred_help_style: "step_by_step",
      recurring_subjects: [],
      parental_approval_required: false,
      parent_approved_at: null,
      learning_notes: null,
    });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    throw profileError;
  }

  return {
    email,
    userId,
  };
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
  const smokeStudent = await createIsolatedSmokeStudent(adminClient);
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
    authUserId: smokeStudent.userId,
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
    await http.signInPassword(smokeStudent.email, fixtureEnv.fixturePassword);

    const firstHomeworkPage = await http.requestText("/app?view=homework");
    assert(
      firstHomeworkPage.response.status === 200,
      `First-homework page should load with 200, saw ${firstHomeworkPage.response.status}.`,
    );
    assert(
      firstHomeworkPage.text.includes('data-homework-state="first"'),
      "Zero-history learner did not receive the first-homework launcher.",
    );

    const createConversationResult = await http.requestJson("/api/conversations?mode=shell", {
      method: "POST",
      body: JSON.stringify({
        title: "Subject_001",
        subjectTag: "mathematiques",
        gradedHomework: false,
        attachmentReferences: [
          {
            name: sampleAttachmentName,
            category: "pdf",
            byteSize: (await readFile(sampleAttachmentPath)).byteLength,
          },
        ],
      }),
    });
    const createConversationPayload = expectOkJson(
      createConversationResult,
      "Failed to create the subject quick-start conversation shell",
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
      initialDetail.messages.length === 0,
      `Fresh quick-start conversation should be bare, saw ${initialDetail.messages.length} messages.`,
    );
    assert(
      initialDetail.attachments.length === 0,
      "Fresh conversation should not have attachments before upload.",
    );

    const returningHomeworkPage = await http.requestText(
      "/app?view=homework&subject=mathematiques",
    );
    assert(
      returningHomeworkPage.response.status === 200 &&
        returningHomeworkPage.text.includes('data-homework-state="returning"'),
      "Created subject shell did not move the learner into the returning-homework state.",
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
          extractedTextBlock
            .slice("[Source: fractions-partage.pdf]".length)
            .trim().length > 0,
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

    const repeatedConfirmResult = await http.requestJson("/api/uploads/confirm", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        attachmentId: attachment.id,
      }),
    });
    const repeatedConfirmPayload = expectOkJson(
      repeatedConfirmResult,
      "Failed to reuse the confirmed attachment extraction",
    );
    const repeatedConfirmAttachment =
      repeatedConfirmPayload.data?.attachment ?? null;
    const repeatedExtractedTextBlock =
      repeatedConfirmPayload.data?.extractedTextBlock ?? null;
    const repeatedWarningMessage =
      repeatedConfirmPayload.data?.warningMessage ?? null;

    assert(
      repeatedConfirmAttachment?.updated_at === confirmedAttachment.updated_at,
      "Repeated upload confirmation should reuse the existing extraction result.",
    );
    assert(
      repeatedConfirmAttachment?.extraction_status === extractionStatus,
      "Repeated upload confirmation changed the extraction status unexpectedly.",
    );
    assert(
      repeatedExtractedTextBlock === extractedTextBlock,
      "Repeated upload confirmation changed the extracted text block unexpectedly.",
    );
    assert(
      repeatedWarningMessage === warningMessage,
      "Repeated upload confirmation changed the extraction warning unexpectedly.",
    );

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
          replyMode: "thinking",
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

    const { data: initialSummaryRows, error: initialSummaryError } =
      await adminClient
        .from("session_summaries")
        .select("audience, language_code")
        .eq("conversation_id", conversationId);

    if (initialSummaryError) {
      throw initialSummaryError;
    }

    const initialStoredSummarySnapshot = (initialSummaryRows ?? [])
      .map((row) => `${row.audience}:${row.language_code}`)
      .sort()
      .join("|");
    const { data: initialMemoryProfile, error: initialMemoryProfileError } =
      await adminClient
        .from("student_memory_profiles")
        .select("updated_at")
        .eq("student_user_id", completedConversation.student_user_id)
        .maybeSingle();

    if (initialMemoryProfileError) {
      throw initialMemoryProfileError;
    }

    const repeatedCompleteResult = await http.requestJson(
      `/api/conversations/${conversationId}/complete`,
      {
        method: "POST",
      },
    );
    const repeatedCompletePayload = expectOkJson(
      repeatedCompleteResult,
      "Failed to reuse the completed conversation",
    );
    const repeatedReturnedSummaries =
      repeatedCompletePayload.data?.summaries ?? [];

    assert(
      repeatedCompletePayload.data?.conversation?.status === "completed",
      "Repeated completion should still report completed status.",
    );
    assert(
      Array.isArray(repeatedReturnedSummaries) &&
        repeatedReturnedSummaries.length === 1 &&
        repeatedReturnedSummaries[0]?.audience === "student",
      "Repeated completion should stay filtered to the existing student summary.",
    );
    assert(
      repeatedReturnedSummaries[0]?.summary_text === returnedSummaries[0]?.summary_text,
      "Repeated completion should reuse the stored student summary.",
    );

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

    const storedSummarySnapshot = (summaryRows ?? [])
      .map((row) => `${row.audience}:${row.language_code}`)
      .sort()
      .join("|");
    assert(
      storedSummarySnapshot === initialStoredSummarySnapshot,
      "Repeated completion should not create or remove stored summary variants.",
    );

    const { data: repeatedMemoryProfile, error: repeatedMemoryProfileError } =
      await adminClient
        .from("student_memory_profiles")
        .select("updated_at")
        .eq("student_user_id", completedConversation.student_user_id)
        .maybeSingle();

    if (repeatedMemoryProfileError) {
      throw repeatedMemoryProfileError;
    }

    assert(
      (repeatedMemoryProfile?.updated_at ?? null) ===
        (initialMemoryProfile?.updated_at ?? null),
      "Repeated completion should not refresh the student memory profile again.",
    );

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
            "zero-history dashboard exposed the first-homework launcher",
            "subject quick-start created a bare conversation shell",
            "dashboard transitioned to the returning-homework state",
            "PDF upload confirmed with extraction or graceful manual-review fallback",
            "repeated confirm and complete calls reused existing expensive artifacts",
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
    if (state.authUserId) {
      await adminClient.auth.admin.deleteUser(state.authUserId).catch(() => {});
    }
    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error("Student-flow smoke failed.");
  console.error(error);
  process.exitCode = 1;
});
