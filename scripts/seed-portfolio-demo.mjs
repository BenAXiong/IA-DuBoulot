import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  createSmokeHttpClient,
  expectOkJson,
  startLocalNextServer,
  stopLocalNextServer,
} from "./smoke-app-harness.mjs";

const demoTag = "portfolio_demo_matt_v1";
const subjectTag = "mathematiques";
const expectedResourceNames = [
  "fractions_add_prod.pdf",
  "fractions.pdf",
  "suite_d_operations.pdf",
];
const maxResourceBytes = 20 * 1024 * 1024;
const stableIds = {
  parentLink: "70a70000-0000-4000-8000-000000000001",
  subscription: "70a70000-0000-4000-8000-000000000002",
  conversation: "70a70000-0000-4000-8000-000000000003",
  studentMessage: "70a70000-0000-4000-8000-000000000004",
  assistantMessage: "70a70000-0000-4000-8000-000000000005",
  workspace: "70a70000-0000-4000-8000-000000000006",
  summary: "70a70000-0000-4000-8000-000000000007",
  usage: "70a70000-0000-4000-8000-000000000008",
};

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function loadConfig() {
  const config = {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    studentEmail: requireEnv("PORTFOLIO_DEMO_EMAIL").toLowerCase(),
    studentPassword: requireEnv("PORTFOLIO_DEMO_PASSWORD"),
    guardianEmail: requireEnv("PORTFOLIO_DEMO_GUARDIAN_EMAIL").toLowerCase(),
    guardianPassword: requireEnv("PORTFOLIO_DEMO_GUARDIAN_PASSWORD"),
    resourceDirectory: path.resolve(requireEnv("PORTFOLIO_DEMO_RESOURCE_DIR")),
    appUrl: process.env.PORTFOLIO_DEMO_APP_URL?.trim() || null,
  };

  if (config.studentEmail === config.guardianEmail) {
    throw new Error("Matt and the demo guardian must use different email addresses.");
  }

  return config;
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

function createAnonClient(config) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function nowIso() {
  return new Date().toISOString();
}

function addDaysIso(days) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

function daysAgoIso(days) {
  return addDaysIso(-days);
}

function currentUsagePeriod() {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  );

  return {
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
  };
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function loadResourcePlan(config) {
  const directoryInfo = await stat(config.resourceDirectory).catch(() => null);

  if (!directoryInfo?.isDirectory()) {
    throw new Error(
      "PORTFOLIO_DEMO_RESOURCE_DIR must point to the directory containing the three Math5 PDFs.",
    );
  }

  const resources = await Promise.all(
    expectedResourceNames.map(async (filename) => {
      const filePath = path.join(config.resourceDirectory, filename);
      const buffer = await readFile(filePath).catch(() => null);

      if (!buffer) {
        throw new Error(`Missing portfolio demo resource: ${filename}`);
      }

      if (buffer.byteLength <= 0) {
        throw new Error(`Portfolio demo resource is empty: ${filename}`);
      }

      if (buffer.byteLength > maxResourceBytes) {
        throw new Error(`Portfolio demo resource exceeds the 20 MiB product limit: ${filename}`);
      }

      if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        throw new Error(`Portfolio demo resource is not a valid PDF header: ${filename}`);
      }

      return {
        filename,
        filePath,
        buffer,
        byteSize: buffer.byteLength,
        sha256: sha256(buffer),
        mimeType: "application/pdf",
      };
    }),
  );
  const uniqueHashes = new Set(resources.map((resource) => resource.sha256));

  if (uniqueHashes.size !== resources.length) {
    throw new Error("Portfolio demo resources must contain three distinct PDF files.");
  }

  return resources;
}

async function listAllAuthUsers(admin) {
  const users = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    users.push(...data.users);
    lastPage = data.lastPage || 1;
    page += 1;
  }

  return users;
}

export function assertDedicatedTaggedAccount(user, roleLabel) {
  if (!user) {
    return;
  }

  if (user.user_metadata?.portfolio_demo_tag !== demoTag) {
    throw new Error(
      `Refusing to adopt the existing ${roleLabel} email because it is not tagged as the dedicated portfolio demo account.`,
    );
  }
}

async function ensureAuthUser({
  admin,
  existingUsers,
  email,
  password,
  role,
  displayName,
  createMissing,
}) {
  const existing = existingUsers.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );
  assertDedicatedTaggedAccount(existing, role);

  const userMetadata = {
    app_role: role,
    display_name: displayName,
    preferred_ui_language: "en",
    ai_help_language: "en",
    account_status: "active",
    onboarding_completed: true,
    app_profile_version: 1,
    portfolio_demo_tag: demoTag,
  };

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error || !data.user) {
      throw error ?? new Error(`Unable to update the ${role} demo auth user.`);
    }

    return data.user;
  }

  if (!createMissing) {
    throw new Error(
      `The tagged ${role} demo account does not exist. Run the seed command first.`,
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error || !data.user) {
    throw error ?? new Error(`Unable to create the ${role} demo auth user.`);
  }

  return data.user;
}

async function requireTaggedAuthUsers(admin, config) {
  const users = await listAllAuthUsers(admin);
  const student = users.find(
    (user) => user.email?.toLowerCase() === config.studentEmail,
  );
  const guardian = users.find(
    (user) => user.email?.toLowerCase() === config.guardianEmail,
  );

  assert(student, "The Matt demo auth account does not exist.");
  assert(guardian, "The guardian demo auth account does not exist.");
  assertDedicatedTaggedAccount(student, "student");
  assertDedicatedTaggedAccount(guardian, "guardian");

  return { student, guardian };
}

async function ensureDemoAccounts(admin, config, { createMissing }) {
  const existingUsers = await listAllAuthUsers(admin);
  const guardian = await ensureAuthUser({
    admin,
    existingUsers,
    email: config.guardianEmail,
    password: config.guardianPassword,
    role: "parent",
    displayName: "Matt's guardian",
    createMissing,
  });
  const student = await ensureAuthUser({
    admin,
    existingUsers,
    email: config.studentEmail,
    password: config.studentPassword,
    role: "student",
    displayName: "Matt",
    createMissing,
  });

  const { error: usersError } = await admin.from("users").upsert(
    [
      {
        id: guardian.id,
        role: "parent",
        account_status: "active",
        display_name: "Matt's guardian",
        preferred_ui_language: "en",
        ai_help_language: "en",
        age_band: null,
        is_under_13: false,
        deletion_requested_at: null,
        birth_date: null,
        country_of_study: "TW",
        school_name: null,
        grade_level: null,
      },
      {
        id: student.id,
        role: "student",
        account_status: "active",
        display_name: "Matt",
        preferred_ui_language: "en",
        ai_help_language: "en",
        age_band: "eleven_twelve",
        is_under_13: true,
        deletion_requested_at: null,
        birth_date: "2014-11-12",
        country_of_study: "TW",
        school_name: "Taipei European School - French Section",
        grade_level: "5e",
      },
    ],
    { onConflict: "id" },
  );

  if (usersError) {
    throw usersError;
  }

  const { error: profileError } = await admin.from("student_profiles").upsert(
    {
      student_user_id: student.id,
      current_grade_level: "5e",
      preferred_help_style: "step_by_step",
      recurring_subjects: [subjectTag],
      parental_approval_required: true,
      parent_approved_at: nowIso(),
      learning_notes:
        "Portfolio demo learner: use short plans and one hint at a time before revealing an answer.",
    },
    { onConflict: "student_user_id" },
  );

  if (profileError) {
    throw profileError;
  }

  const { error: linkError } = await admin.from("parent_student_links").upsert(
    {
      id: stableIds.parentLink,
      parent_user_id: guardian.id,
      student_user_id: student.id,
      link_status: "active",
      relationship_label: "guardian",
      approved_at: nowIso(),
      revoked_at: null,
    },
    { onConflict: "parent_user_id,student_user_id" },
  );

  if (linkError) {
    throw linkError;
  }

  const { error: subscriptionError } = await admin.from("subscriptions").upsert(
    {
      id: stableIds.subscription,
      payer_user_id: guardian.id,
      provider: "lemonsqueezy",
      provider_customer_id: "portfolio-demo-guardian-v1",
      provider_subscription_id: "portfolio-demo-family-v1",
      plan_key: "portfolio-demo-family",
      status: "active",
      trial_ends_at: null,
      current_period_starts_at: nowIso(),
      current_period_ends_at: addDaysIso(366),
      canceled_at: null,
    },
    { onConflict: "provider_subscription_id" },
  );

  if (subscriptionError) {
    throw subscriptionError;
  }

  return { student, guardian };
}

async function removeStorageObjects(admin, attachments) {
  const byBucket = new Map();

  for (const attachment of attachments) {
    if (!attachment.storage_bucket || !attachment.storage_path) {
      continue;
    }

    const paths = byBucket.get(attachment.storage_bucket) ?? [];
    paths.push(attachment.storage_path);
    byBucket.set(attachment.storage_bucket, paths);
  }

  for (const [bucket, paths] of byBucket.entries()) {
    const { error } = await admin.storage.from(bucket).remove(paths);

    if (error) {
      throw new Error(
        `Unable to remove Matt's reset-scoped storage objects from ${bucket}: ${error.message}`,
      );
    }
  }
}

async function resetMattRuntimeState(admin, studentUserId) {
  const { data: conversations, error: conversationsError } = await admin
    .from("conversations")
    .select("id")
    .eq("student_user_id", studentUserId);

  if (conversationsError) {
    throw conversationsError;
  }

  const conversationIds = (conversations ?? []).map((row) => row.id);

  if (conversationIds.length > 0) {
    const { data: attachments, error: attachmentsError } = await admin
      .from("attachments")
      .select("storage_bucket,storage_path")
      .in("conversation_id", conversationIds);

    if (attachmentsError) {
      throw attachmentsError;
    }

    await removeStorageObjects(admin, attachments ?? []);

    const conversationScopedDeletes = [
      ["audit_logs", "conversation_id"],
      ["moderation_events", "conversation_id"],
    ];

    for (const [table, column] of conversationScopedDeletes) {
      const { error } = await admin
        .from(table)
        .delete()
        .in(column, conversationIds);

      if (error) {
        throw error;
      }
    }
  }

  const accountScopedDeletes = [
    ["audit_logs", "student_user_id"],
    ["moderation_events", "actor_user_id"],
    ["usage_counters", "student_user_id"],
    ["student_memory_items", "student_user_id"],
  ];

  for (const [table, column] of accountScopedDeletes) {
    const { error } = await admin
      .from(table)
      .delete()
      .eq(column, studentUserId);

    if (error) {
      throw error;
    }
  }

  const { error: conversationsDeleteError } = await admin
    .from("conversations")
    .delete()
    .eq("student_user_id", studentUserId);

  if (conversationsDeleteError) {
    throw conversationsDeleteError;
  }

  const { error: memoryProfileError } = await admin
    .from("student_memory_profiles")
    .upsert(
      {
        student_user_id: studentUserId,
        strengths_summary: null,
        weaknesses_summary: null,
        preferences_summary: "Prefers short step-by-step hints in English.",
        last_reviewed_at: nowIso(),
      },
      { onConflict: "student_user_id" },
    );

  if (memoryProfileError) {
    throw memoryProfileError;
  }
}

async function seedBelievableHistory(admin, studentUserId) {
  const completedAt = daysAgoIso(5);
  const { error: conversationError } = await admin.from("conversations").insert({
    id: stableIds.conversation,
    student_user_id: studentUserId,
    created_by_user_id: studentUserId,
    title: "Comparing fractions",
    subject_tag: subjectTag,
    status: "completed",
    graded_homework: false,
    assignment_text: "Compare 3/4 and 5/8 and explain which fraction is larger.",
    edited_extracted_text: null,
    source_language: "en",
    last_message_at: completedAt,
    completed_at: completedAt,
    created_at: daysAgoIso(6),
    updated_at: completedAt,
  });

  if (conversationError) {
    throw conversationError;
  }

  const { error: messagesError } = await admin.from("messages").insert([
    {
      id: stableIds.studentMessage,
      conversation_id: stableIds.conversation,
      author_user_id: studentUserId,
      role: "student",
      content_text: "is 5/8 bigger because 5 is bigger than 3?",
      content_language: "en",
      moderation_status: "allowed",
      created_at: daysAgoIso(6),
    },
    {
      id: stableIds.assistantMessage,
      conversation_id: stableIds.conversation,
      author_user_id: null,
      role: "assistant",
      content_text:
        "Good question. First put both fractions over a common denominator, then compare the numerators. What denominator could both 4 and 8 use?",
      content_language: "en",
      model_provider: "portfolio_demo_seed",
      model_name: "curated-history-v1",
      moderation_status: "allowed",
      created_at: completedAt,
    },
  ]);

  if (messagesError) {
    throw messagesError;
  }

  const { error: workspaceError } = await admin.from("workspace_states").insert({
    id: stableIds.workspace,
    conversation_id: stableIds.conversation,
    assignment_text: "Compare 3/4 and 5/8.",
    plan_text: "1. Find a common denominator. 2. Compare the numerators.",
    draft_answer_text: "",
    student_notes: "Denominators need to match before comparing.",
    last_saved_by_user_id: studentUserId,
  });

  if (workspaceError) {
    throw workspaceError;
  }

  const { error: summaryError } = await admin.from("session_summaries").insert({
    id: stableIds.summary,
    conversation_id: stableIds.conversation,
    audience: "student",
    language_code: "en",
    summary_text:
      "You compared two fractions by rewriting them with the same denominator before checking their numerators.",
    weakness_tags: ["fraction_comparison"],
    next_step_recommendation:
      "Try one more comparison where neither denominator divides the other.",
    generated_model_name: "curated-history-v1",
  });

  if (summaryError) {
    throw summaryError;
  }
}

async function seedUsageBaseline(admin, studentUserId) {
  const { periodStart, periodEnd } = currentUsagePeriod();
  const { error } = await admin.from("usage_counters").upsert(
    {
      id: stableIds.usage,
      student_user_id: studentUserId,
      period_start: periodStart,
      period_end: periodEnd,
      sessions_count: 1,
      uploads_count: expectedResourceNames.length,
      assistant_message_count: 1,
      input_tokens: 180,
      output_tokens: 260,
    },
    { onConflict: "student_user_id,period_start,period_end" },
  );

  if (error) {
    throw error;
  }
}

function createDemoHttpClient(config, baseUrl) {
  return createSmokeHttpClient({
    baseUrl,
    requestPrefix: `portfolio_demo_seed_${Date.now()}`,
    roleLabel: "Matt portfolio demo",
    requestTimeoutMs: 180000,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    signInErrorLabel: "the Matt portfolio demo account",
    assertAuthCookie: true,
  });
}

async function resolveAppServer(config, commandLabel) {
  if (config.appUrl) {
    return {
      baseUrl: config.appUrl.replace(/\/$/, ""),
      childProcess: null,
      startedServer: false,
    };
  }

  const server = await startLocalNextServer({
    smokeCommand: commandLabel,
    startPort: 3190,
  });

  return {
    ...server,
    startedServer: true,
  };
}

async function deleteResourceThroughProduct(http, resourceId) {
  const result = await http.requestJson("/api/subject-resources", {
    method: "DELETE",
    body: JSON.stringify({ resourceId }),
  });
  expectOkJson(result, "Failed to remove an obsolete Matt subject resource");
}

async function uploadResourceThroughProduct({ http, storageClient, resource }) {
  const createResult = await http.requestJson("/api/subject-resources", {
    method: "POST",
    body: JSON.stringify({
      subjectTag,
      originalFilename: resource.filename,
      mimeType: resource.mimeType,
      byteSize: resource.byteSize,
    }),
  });
  const createPayload = expectOkJson(
    createResult,
    `Failed to create the upload target for ${resource.filename}`,
  );
  const resourceShell = createPayload.data?.resource;
  const uploadTarget = createPayload.data?.uploadTarget;

  assert(resourceShell?.id, `Missing resource shell for ${resource.filename}.`);
  assert(uploadTarget?.bucket, `Missing upload bucket for ${resource.filename}.`);
  assert(uploadTarget?.path, `Missing upload path for ${resource.filename}.`);
  assert(uploadTarget?.token, `Missing upload token for ${resource.filename}.`);

  const fileBlob = new Blob([resource.buffer], { type: resource.mimeType });
  const uploadResult = await storageClient.storage
    .from(uploadTarget.bucket)
    .uploadToSignedUrl(uploadTarget.path, uploadTarget.token, fileBlob, {
      contentType: resource.mimeType,
    });

  if (uploadResult.error) {
    throw new Error(
      `Signed upload failed for ${resource.filename}: ${uploadResult.error.message}`,
    );
  }

  const confirmResult = await http.requestJson("/api/subject-resources/confirm", {
    method: "POST",
    body: JSON.stringify({
      resourceId: resourceShell.id,
      conversationId: null,
      selected: false,
    }),
  });
  const confirmPayload = expectOkJson(
    confirmResult,
    `Failed to confirm ${resource.filename}`,
  );
  const confirmed = confirmPayload.data?.resource;

  assert(
    confirmed?.extraction_status === "ready",
    `${resource.filename} did not reach ready extraction status.`,
  );
  assert(
    confirmed.sha256 === resource.sha256,
    `${resource.filename} stored an unexpected content hash.`,
  );

  return confirmed;
}

async function reconcileResources({
  admin,
  http,
  storageClient,
  studentUserId,
  resourcePlan,
}) {
  const { data: rows, error } = await admin
    .from("subject_resources")
    .select(
      "id,original_filename,sha256,extraction_status,raw_extracted_text,student_user_id,subject_tag",
    )
    .eq("student_user_id", studentUserId)
    .eq("subject_tag", subjectTag);

  if (error) {
    throw error;
  }

  const expectedByHash = new Map(resourcePlan.map((resource) => [resource.sha256, resource]));
  const preservedByHash = new Map();

  for (const row of rows ?? []) {
    const expected = expectedByHash.get(row.sha256);
    const preserve =
      expected &&
      row.original_filename === expected.filename &&
      row.extraction_status === "ready" &&
      typeof row.raw_extracted_text === "string" &&
      row.raw_extracted_text.trim().length > 0;

    if (preserve) {
      preservedByHash.set(row.sha256, row);
      continue;
    }

    await deleteResourceThroughProduct(http, row.id);
  }

  const results = [];

  for (const resource of resourcePlan) {
    const preserved = preservedByHash.get(resource.sha256);

    if (preserved) {
      results.push({ ...preserved, preserved: true });
      continue;
    }

    const uploaded = await uploadResourceThroughProduct({
      http,
      storageClient,
      resource,
    });
    results.push({ ...uploaded, preserved: false });
  }

  return results;
}

async function signInDirectClient(config, email, password) {
  const client = createAnonClient(config);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw error ?? new Error("Portfolio demo direct sign-in returned no user.");
  }

  return { client, user: data.user };
}

async function verifyDemoState({
  admin,
  config,
  accounts,
  resourcePlan,
  baseUrl,
}) {
  const studentDirect = await signInDirectClient(
    config,
    config.studentEmail,
    config.studentPassword,
  );
  const guardianDirect = await signInDirectClient(
    config,
    config.guardianEmail,
    config.guardianPassword,
  );

  assert(
    studentDirect.user.id === accounts.student.id,
    "Matt authenticated as an unexpected user.",
  );
  assert(
    guardianDirect.user.id === accounts.guardian.id,
    "The demo guardian authenticated as an unexpected user.",
  );

  const { data: studentVisibleUsers, error: studentUsersError } = await studentDirect.client
    .from("users")
    .select("id,role,display_name")
    .neq("id", accounts.student.id);

  if (studentUsersError) {
    throw studentUsersError;
  }

  assert(
    (studentVisibleUsers ?? []).length === 0,
    "Matt can see an unrelated app user through RLS.",
  );

  const { data: studentResources, error: studentResourcesError } = await studentDirect.client
    .from("subject_resources")
    .select("id,student_user_id,subject_tag,original_filename,sha256,extraction_status")
    .eq("subject_tag", subjectTag);

  if (studentResourcesError) {
    throw studentResourcesError;
  }

  assert(
    (studentResources ?? []).every(
      (resource) => resource.student_user_id === accounts.student.id,
    ),
    "Matt can see another student's subject resource through RLS.",
  );

  const { data: guardianVisibleStudent, error: guardianStudentError } =
    await guardianDirect.client
      .from("users")
      .select("id")
      .eq("id", accounts.student.id)
      .single();

  if (guardianStudentError) {
    throw guardianStudentError;
  }

  assert(
    guardianVisibleStudent.id === accounts.student.id,
    "The approved guardian cannot read Matt's linked profile through RLS.",
  );

  const { data: guardianResources, error: guardianResourcesError } =
    await guardianDirect.client
      .from("subject_resources")
      .select("id")
      .eq("student_user_id", accounts.student.id);

  if (guardianResourcesError) {
    throw guardianResourcesError;
  }

  assert(
    (guardianResources ?? []).length === 0,
    "The guardian can browse Matt's unlinked private subject library.",
  );

  const http = createDemoHttpClient(config, baseUrl);
  await http.signInPassword(config.studentEmail, config.studentPassword);
  const meResult = await http.requestJson("/api/auth/me");
  const mePayload = expectOkJson(meResult, "Matt's authenticated profile route failed");
  assert(
    mePayload.data?.appUser?.id === accounts.student.id,
    "Profile route returned the wrong user.",
  );

  const libraryResult = await http.requestJson(
    `/api/subject-resources?subjectTag=${encodeURIComponent(subjectTag)}`,
  );
  const libraryPayload = expectOkJson(
    libraryResult,
    "Matt's subject-resource library route failed",
  );
  const library = libraryPayload.data?.resources ?? [];
  const expectedHashes = new Set(resourcePlan.map((resource) => resource.sha256));
  const expectedNames = new Set(expectedResourceNames);

  assert(
    library.length === expectedResourceNames.length,
    `Expected ${expectedResourceNames.length} Mathematics resources, found ${library.length}.`,
  );
  assert(
    library.every(
      (resource) =>
        resource.extraction_status === "ready" &&
        expectedHashes.has(resource.sha256) &&
        expectedNames.has(resource.original_filename) &&
        resource.chunk_count > 0,
    ),
    "The Mathematics resource library does not match the ready, chunked demo corpus.",
  );

  const { data: profile, error: profileError } = await admin
    .from("student_profiles")
    .select("current_grade_level,parental_approval_required,parent_approved_at")
    .eq("student_user_id", accounts.student.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  assert(profile.current_grade_level === "5e", "Matt's grade is not 5e.");
  assert(profile.parental_approval_required, "Matt is not marked as requiring approval.");
  assert(profile.parent_approved_at, "Matt's guardian approval is missing.");

  const { data: link, error: linkError } = await admin
    .from("parent_student_links")
    .select("link_status,approved_at")
    .eq("parent_user_id", accounts.guardian.id)
    .eq("student_user_id", accounts.student.id)
    .single();

  if (linkError) {
    throw linkError;
  }

  assert(link.link_status === "active" && link.approved_at, "Guardian link is not active.");

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select("status,current_period_ends_at,plan_key")
    .eq("provider_subscription_id", "portfolio-demo-family-v1")
    .single();

  if (subscriptionError) {
    throw subscriptionError;
  }

  assert(subscription.status === "active", "Demo subscription is not active.");
  assert(
    Date.parse(subscription.current_period_ends_at) > Date.now(),
    "Demo subscription period has expired.",
  );

  const { data: baselineConversation, error: baselineError } = await admin
    .from("conversations")
    .select("id,status,subject_tag,title")
    .eq("id", stableIds.conversation)
    .eq("student_user_id", accounts.student.id)
    .single();

  if (baselineError) {
    throw baselineError;
  }

  assert(
    baselineConversation.status === "completed" &&
      baselineConversation.subject_tag === subjectTag,
    "Matt's believable completed Mathematics history is missing.",
  );

  return {
    checks: [
      "Matt and guardian authenticate",
      "student RLS does not expose unrelated users or resources",
      "approved guardian RLS exposes Matt's linked profile",
      "guardian RLS does not expose the unlinked subject library",
      "authenticated profile and resource routes respond",
      "three expected resources are ready and chunked",
      "5e profile and approved guardian state are active",
      "artificial paid demo subscription is current",
      "completed Mathematics history is present",
    ],
    resourceNames: library.map((resource) => resource.original_filename).sort(),
  };
}

export function parseMode(argv = process.argv.slice(2)) {
  const requested = ["--seed", "--reset", "--verify"].filter((flag) =>
    argv.includes(flag),
  );

  if (requested.length !== 1) {
    throw new Error("Choose exactly one mode: --seed, --reset, or --verify.");
  }

  return requested[0].slice(2);
}

export function assertMutationConfirmed(mode, argv = process.argv.slice(2)) {
  const writeMode = mode === "seed" || mode === "reset";

  if (writeMode && !argv.includes("--confirm-hosted-write")) {
    throw new Error(
      "Hosted writes are disabled. Re-run with --confirm-hosted-write after reviewing the configured demo account and resource directory.",
    );
  }
}

async function main() {
  const mode = parseMode();
  assertMutationConfirmed(mode);
  const config = loadConfig();
  const resourcePlan = await loadResourcePlan(config);
  const writeMode = mode === "seed" || mode === "reset";

  const admin = createAdminClient(config);
  let appServer = null;

  try {
    appServer = await resolveAppServer(
      config,
      mode === "verify"
        ? "npm run verify:portfolio-demo"
        : `npm run ${mode}:portfolio-demo -- --confirm-hosted-write`,
    );

    let accounts;
    let resourceResults = [];

    if (writeMode) {
      accounts = await ensureDemoAccounts(admin, config, {
        createMissing: mode === "seed",
      });
      await resetMattRuntimeState(admin, accounts.student.id);

      const http = createDemoHttpClient(config, appServer.baseUrl);
      await http.signInPassword(config.studentEmail, config.studentPassword);
      const storageClient = createAnonClient(config);
      resourceResults = await reconcileResources({
        admin,
        http,
        storageClient,
        studentUserId: accounts.student.id,
        resourcePlan,
      });
      await seedBelievableHistory(admin, accounts.student.id);
      await seedUsageBaseline(admin, accounts.student.id);
    } else {
      accounts = await requireTaggedAuthUsers(admin, config);
    }

    const verification = await verifyDemoState({
      admin,
      config,
      accounts,
      resourcePlan,
      baseUrl: appServer.baseUrl,
    });

    console.info(
      JSON.stringify(
        {
          ok: true,
          mode,
          account: "Matt",
          appTarget: appServer.startedServer ? "local-build" : "configured-url",
          resources: verification.resourceNames,
          ...(writeMode
            ? {
                resourceActions: resourceResults.map((resource) => ({
                  filename: resource.original_filename,
                  action: resource.preserved ? "preserved_by_hash" : "uploaded",
                })),
              }
            : {}),
          checks: verification.checks,
        },
        null,
        2,
      ),
    );
  } finally {
    await stopLocalNextServer(appServer?.childProcess ?? null);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;

if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error("Portfolio demo data operation failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
