import {
  FIXTURE,
  createAdminClient,
  env as fixtureEnv,
  resolveFixtureUserIds,
} from "./rls-fixture-shared.mjs";
import {
  createSmokeHttpClient,
  startLocalNextServer,
  stopLocalNextServer,
} from "./smoke-app-harness.mjs";

const requestPrefix = `smoke_privacy_${Date.now()}`;

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

function startLocalServer() {
  return startLocalNextServer({
    smokeCommand: "npm run smoke:privacy",
    startPort: 3185,
  });
}

function stopLocalServer(childProcess) {
  return stopLocalNextServer(childProcess);
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
  return createSmokeHttpClient({
    baseUrl,
    requestPrefix,
    roleLabel,
    supabaseUrl: fixtureEnv.supabaseUrl,
    supabaseAnonKey: fixtureEnv.supabaseAnonKey,
    fixturePassword: fixtureEnv.fixturePassword,
    signInErrorLabel: `fixture ${roleLabel}`,
  });
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
