import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  fixturePassword: requireEnv("SUPABASE_FIXTURE_PASSWORD"),
};

export const FIXTURE = {
  tag: "rls_fixture_v1",
  markerReason: "rls_fixture_seed",
  emails: {
    student: "rls-student@iaduboulot.local",
    parent: "rls-parent@iaduboulot.local",
    tutor: "rls-tutor@iaduboulot.local",
    admin: "rls-admin@iaduboulot.local",
  },
  displayNames: {
    student: "RLS Student Fixture",
    parent: "RLS Parent Fixture",
    tutor: "RLS Tutor Fixture",
    admin: "RLS Admin Fixture",
  },
  ids: {
    parentLink: "11111111-1111-4111-8111-111111111111",
    tutorLink: "22222222-2222-4222-8222-222222222222",
    conversation: "33333333-3333-4333-8333-333333333333",
    studentMessage: "44444444-4444-4444-8444-444444444444",
    assistantMessage: "55555555-5555-4555-8555-555555555555",
    attachment: "66666666-6666-4666-8666-666666666666",
    workspaceState: "77777777-7777-4777-8777-777777777777",
    summaryStudent: "88888888-8888-4888-8888-888888888881",
    summaryParent: "88888888-8888-4888-8888-888888888882",
    summaryTutor: "88888888-8888-4888-8888-888888888883",
    tutorNote: "99999999-9999-4999-8999-999999999999",
    subscription: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    usageCounter: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    moderationEvent: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    auditLog: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    memoryItemStrength: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    memoryItemWeakness: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  },
  buckets: {
    homeworkAttachments: "homework-attachments",
    processingArtifacts: "processing-artifacts",
  },
  subscription: {
    providerCustomerId: "rls-fixture-parent",
    providerSubscriptionId: "rls-fixture-subscription",
    planKey: "fixture-mvp-plan",
  },
};

export function createAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAnonClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function listFixtureAuthUsers(adminClient) {
  const users = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage) {
    const { data, error } = await adminClient.auth.admin.listUsers({
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

  return users.filter((user) =>
    Object.values(FIXTURE.emails).includes(user.email ?? ""),
  );
}

export async function deleteFixtureRows(adminClient) {
  const fixedIdDeletes = [
    ["moderation_events", FIXTURE.ids.moderationEvent],
    ["audit_logs", FIXTURE.ids.auditLog],
    ["session_summaries", FIXTURE.ids.summaryStudent],
    ["session_summaries", FIXTURE.ids.summaryParent],
    ["session_summaries", FIXTURE.ids.summaryTutor],
    ["workspace_states", FIXTURE.ids.workspaceState],
    ["tutor_notes", FIXTURE.ids.tutorNote],
    ["attachments", FIXTURE.ids.attachment],
    ["messages", FIXTURE.ids.studentMessage],
    ["messages", FIXTURE.ids.assistantMessage],
    ["conversations", FIXTURE.ids.conversation],
    ["usage_counters", FIXTURE.ids.usageCounter],
    ["subscriptions", FIXTURE.ids.subscription],
    ["tutor_student_links", FIXTURE.ids.tutorLink],
    ["parent_student_links", FIXTURE.ids.parentLink],
    ["student_memory_items", FIXTURE.ids.memoryItemStrength],
    ["student_memory_items", FIXTURE.ids.memoryItemWeakness],
  ];

  for (const [table, id] of fixedIdDeletes) {
    const { error } = await adminClient.from(table).delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  const { error: deleteFixtureAuditError } = await adminClient
    .from("audit_logs")
    .delete()
    .like("action", "rls_fixture_%");

  if (deleteFixtureAuditError) {
    throw deleteFixtureAuditError;
  }

  const { error: deleteFixtureModerationError } = await adminClient
    .from("moderation_events")
    .delete()
    .eq("reason", FIXTURE.markerReason);

  if (deleteFixtureModerationError) {
    throw deleteFixtureModerationError;
  }

  const { error: deleteFixtureSubscriptionError } = await adminClient
    .from("subscriptions")
    .delete()
    .eq("provider_customer_id", FIXTURE.subscription.providerCustomerId);

  if (deleteFixtureSubscriptionError) {
    throw deleteFixtureSubscriptionError;
  }
}

export async function deleteFixtureAuthUsers(adminClient) {
  const users = await listFixtureAuthUsers(adminClient);

  for (const user of users) {
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }
  }
}

export async function ensureFixtureBuckets(adminClient) {
  const bucketPlan = [
    {
      id: FIXTURE.buckets.homeworkAttachments,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "application/pdf",
      ],
      fileSizeLimit: 20 * 1024 * 1024,
    },
    {
      id: FIXTURE.buckets.processingArtifacts,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "text/plain",
      ],
      fileSizeLimit: 20 * 1024 * 1024,
    },
  ];

  for (const bucket of bucketPlan) {
    const { data, error } = await adminClient.storage.getBucket(bucket.id);

    if (data && !error) {
      const { error: updateError } = await adminClient.storage.updateBucket(
        bucket.id,
        {
          public: false,
          allowedMimeTypes: bucket.allowedMimeTypes,
          fileSizeLimit: bucket.fileSizeLimit,
        },
      );

      if (updateError) {
        throw updateError;
      }

      continue;
    }

    const { error: createError } = await adminClient.storage.createBucket(
      bucket.id,
      {
        public: false,
        allowedMimeTypes: bucket.allowedMimeTypes,
        fileSizeLimit: bucket.fileSizeLimit,
      },
    );

    if (createError && !String(createError.message).includes("already exists")) {
      throw createError;
    }
  }
}

export async function createFixtureAuthUsers(adminClient) {
  const rolePlan = [
    ["student", FIXTURE.emails.student],
    ["parent", FIXTURE.emails.parent],
    ["tutor", FIXTURE.emails.tutor],
    ["admin", FIXTURE.emails.admin],
  ];

  const createdUsers = {};

  for (const [role, email] of rolePlan) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: env.fixturePassword,
      email_confirm: true,
      user_metadata: {
        fixture_role: role,
        fixture_tag: FIXTURE.tag,
      },
    });

    if (error) {
      throw error;
    }

    createdUsers[role] = data.user;
  }

  return createdUsers;
}

export async function signInFixture(email) {
  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: env.fixturePassword,
  });

  if (error) {
    throw error;
  }

  return {
    client,
    session: data.session,
    user: data.user,
  };
}

export function fixtureAttachmentPath(studentUserId) {
  return `student/${studentUserId}/conversation/${FIXTURE.ids.conversation}/attachment/${FIXTURE.ids.attachment}/source.pdf`;
}

export async function resolveFixtureUserIds(adminClient) {
  const users = await listFixtureAuthUsers(adminClient);
  const byEmail = new Map(users.map((user) => [user.email, user.id]));

  return {
    student: byEmail.get(FIXTURE.emails.student),
    parent: byEmail.get(FIXTURE.emails.parent),
    tutor: byEmail.get(FIXTURE.emails.tutor),
    admin: byEmail.get(FIXTURE.emails.admin),
  };
}

export async function snapshotFixtureUsageState(adminClient, studentUserId) {
  const { data, error } = await adminClient
    .from("usage_counters")
    .select("*")
    .eq("student_user_id", studentUserId)
    .order("period_start", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function restoreFixtureUsageState(
  adminClient,
  studentUserId,
  snapshot,
) {
  const { error: deleteError } = await adminClient
    .from("usage_counters")
    .delete()
    .eq("student_user_id", studentUserId);

  if (deleteError) {
    throw deleteError;
  }

  if (snapshot.length === 0) {
    return;
  }

  const { error: restoreError } = await adminClient
    .from("usage_counters")
    .insert(snapshot);

  if (restoreError) {
    throw restoreError;
  }
}
