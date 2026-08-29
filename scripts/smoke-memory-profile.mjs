import {
  FIXTURE,
  createAdminClient,
  env as fixtureEnv,
  restoreFixtureUsageState,
  resolveFixtureUserIds,
  snapshotFixtureUsageState,
} from "./rls-fixture-shared.mjs";
import {
  createSmokeHttpClient,
  startLocalNextServer,
  stopLocalNextServer,
} from "./smoke-app-harness.mjs";

const requestPrefix = `smoke_memory_${Date.now()}`;

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
    smokeCommand: "npm run smoke:memory",
    startPort: 3195,
  });
}

function stopLocalServer(childProcess) {
  return stopLocalNextServer(childProcess);
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

async function main() {
  const adminClient = createAdminClient();
  const fixtureUserIds = await resolveFixtureUserIds(adminClient);
  assert(fixtureUserIds.student, "Missing fixture student user id.");
  assert(fixtureUserIds.parent, "Missing fixture parent user id.");

  const memorySnapshot = await snapshotMemoryState(
    adminClient,
    fixtureUserIds.student,
  );
  const usageSnapshot = await snapshotFixtureUsageState(
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
    await restoreFixtureUsageState(
      adminClient,
      fixtureUserIds.student,
      usageSnapshot,
    ).catch(() => {});
    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
