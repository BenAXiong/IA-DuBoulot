import { createHash } from "node:crypto";
import {
  FIXTURE,
  createAdminClient,
  env as fixtureEnv,
  resolveFixtureUserIds,
} from "./rls-fixture-shared.mjs";
import {
  createSmokeHttpClient,
  expectOkJson,
  startLocalNextServer,
  stopLocalNextServer,
} from "./smoke-app-harness.mjs";

const requestPrefix = `smoke_adult_oversight_${Date.now()}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function startLocalServer() {
  return startLocalNextServer({
    smokeCommand: "npm run smoke:adult-oversight",
    startPort: 3144,
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
    signInErrorLabel: roleLabel,
  });
}

async function main() {
  const adminClient = createAdminClient();
  const fixtureUserIds = await resolveFixtureUserIds(adminClient);
  const state = {
    createdNoteId: null,
    createdLearnerUserId: null,
    pendingInvitationId: null,
  };
  let startedServer = false;
  let childProcess = null;
  let baseUrl = process.env.SMOKE_APP_URL ?? null;

  assert(fixtureUserIds.student, "Missing seeded student fixture user id.");

  try {
    if (!baseUrl) {
      const server = await startLocalServer();
      startedServer = true;
      childProcess = server.childProcess;
      baseUrl = server.baseUrl;
    }

    const parent = buildHttpClient(baseUrl, "parent");
    const tutor = buildHttpClient(baseUrl, "tutor");
    const admin = buildHttpClient(baseUrl, "admin");

    await Promise.all([
      parent.signInFixture(FIXTURE.emails.parent),
      tutor.signInFixture(FIXTURE.emails.tutor),
      admin.signInFixture(FIXTURE.emails.admin),
    ]);

    const approvalRelationshipLabel = `Smoke approval ${Date.now()}`;
    const { data: pendingInvitation, error: pendingInvitationError } =
      await adminClient
        .from("account_link_invitations")
        .insert({
          invitation_kind: "parent_approval",
          invitation_status: "pending",
          student_user_id: fixtureUserIds.student,
          inviter_user_id: fixtureUserIds.student,
          target_role: "parent",
          target_email: FIXTURE.emails.parent,
          relationship_label: approvalRelationshipLabel,
          token_hash: createHash("sha256")
            .update(`smoke_parent_pending_${Date.now()}`)
            .digest("hex"),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            source: "smoke-adult-oversight",
          },
        })
        .select("id")
        .single();

    if (pendingInvitationError || !pendingInvitation?.id) {
      throw new Error("Failed to create the temporary pending parent approval.");
    }

    state.pendingInvitationId = pendingInvitation.id;

    const parentDashboardPage = await parent.requestText("/app");
    assert(
      parentDashboardPage.response.ok &&
        parentDashboardPage.text.includes(approvalRelationshipLabel),
      "Parent dashboard did not render the pending approval request section.",
    );

    const createdLearnerEmail = `smoke-parent-learner-${Date.now()}@iaduboulot.local`;
    const createdLearnerPassword = "PilotFlowTemp2026!";
    const createdLearnerName = "Smoke Parent Learner";
    const createLearnerResult = await parent.requestJson("/api/parent/students", {
      method: "POST",
      body: JSON.stringify({
        displayName: createdLearnerName,
        learnerEmail: createdLearnerEmail,
        temporaryPassword: createdLearnerPassword,
        preferredUiLanguage: "fr",
        aiHelpLanguage: "fr",
        ageBand: "nine_ten",
        relationshipLabel: "Parent smoke",
      }),
    });
    const createLearnerPayload = expectOkJson(
      createLearnerResult,
      "Parent failed to create a learner account from the dashboard flow",
    );
    const createdLearner = createLearnerPayload.data?.learner ?? null;
    assert(createdLearner?.id, "Learner creation did not return the new learner id.");
    state.createdLearnerUserId = createdLearner.id;

    const parentDashboardAfterCreate = await parent.requestText("/app");
    assert(
      parentDashboardAfterCreate.response.ok &&
        parentDashboardAfterCreate.text.includes(createdLearnerName),
      "Parent dashboard did not surface the newly created learner.",
    );

    const managedLearner = buildHttpClient(baseUrl, "managed_learner");
    await managedLearner.signInPassword(
      createdLearnerEmail,
      createdLearnerPassword,
    );
    const managedLearnerMe = await managedLearner.requestJson("/api/auth/me");
    const managedLearnerMePayload = expectOkJson(
      managedLearnerMe,
      "Parent-created learner could not resolve authenticated profile state",
    );
    assert(
      managedLearnerMePayload.data?.appUser?.role === "student",
      "Parent-created learner did not resolve as a student account.",
    );

    const managedLearnerAppPage = await managedLearner.requestText("/app");
    assert(
      managedLearnerAppPage.response.ok,
      "Parent-created learner could not load the authenticated app surface.",
    );

    const acceptPendingApprovalResult = await parent.requestJson(
      "/api/auth/parent-approval/confirm",
      {
        method: "POST",
        body: JSON.stringify({
          invitationId: pendingInvitation.id,
        }),
      },
    );
    expectOkJson(
      acceptPendingApprovalResult,
      "Parent failed to accept the pending approval from the dashboard path",
    );

    const { data: acceptedInvitation, error: acceptedInvitationError } =
      await adminClient
        .from("account_link_invitations")
        .select("invitation_status, accepted_by_user_id")
        .eq("id", pendingInvitation.id)
        .maybeSingle();

    if (acceptedInvitationError) {
      throw acceptedInvitationError;
    }

    assert(
      acceptedInvitation?.invitation_status === "accepted" &&
        acceptedInvitation.accepted_by_user_id,
      "Dashboard acceptance did not mark the parent approval as accepted.",
    );

    const parentStudentPage = await parent.requestText(
      `/app/students/${fixtureUserIds.student}`,
    );
    assert(
      parentStudentPage.response.ok &&
        parentStudentPage.text.includes(FIXTURE.displayNames.student),
      "Parent student detail page did not render the linked student view.",
    );

    const parentReviewPage = await parent.requestText(
      `/app/review/${FIXTURE.ids.conversation}`,
    );
    assert(
      parentReviewPage.response.ok &&
        parentReviewPage.text.includes("Résumé parent"),
      "Parent review page did not render the parent summary surface.",
    );

    const parentConversationResult = await parent.requestJson(
      `/api/conversations/${FIXTURE.ids.conversation}`,
    );
    const parentConversationPayload = expectOkJson(
      parentConversationResult,
      "Parent failed to load the linked conversation detail",
    );
    const parentSummaries = parentConversationPayload.data?.detail?.summaries ?? [];
    assert(
      parentSummaries.length > 0 &&
        parentSummaries.every((summary) => summary.audience === "parent"),
      "Parent conversation detail returned the wrong summary audience.",
    );

    const parentForbiddenNoteResult = await parent.requestJson("/api/tutor/notes", {
      method: "POST",
      body: JSON.stringify({
        studentUserId: fixtureUserIds.student,
        conversationId: FIXTURE.ids.conversation,
        noteText: "Parent should not create tutor notes.",
        isPinned: false,
      }),
    });
    assert(
      parentForbiddenNoteResult.response.status === 403,
      `Parent tutor-note write should fail with 403, saw ${parentForbiddenNoteResult.response.status}.`,
    );

    const tutorStudentPage = await tutor.requestText(
      `/app/students/${fixtureUserIds.student}`,
    );
    assert(
      tutorStudentPage.response.ok &&
        tutorStudentPage.text.includes(FIXTURE.displayNames.student),
      "Tutor student detail page did not render the linked student view.",
    );

    const tutorReviewPage = await tutor.requestText(
      `/app/review/${FIXTURE.ids.conversation}`,
    );
    assert(
      tutorReviewPage.response.ok &&
        tutorReviewPage.text.includes("Synthèse tuteur"),
      "Tutor review page did not render the tutor summary surface.",
    );

    const tutorConversationResult = await tutor.requestJson(
      `/api/conversations/${FIXTURE.ids.conversation}`,
    );
    const tutorConversationPayload = expectOkJson(
      tutorConversationResult,
      "Tutor failed to load the linked conversation detail",
    );
    const tutorSummaries = tutorConversationPayload.data?.detail?.summaries ?? [];
    assert(
      tutorSummaries.length > 0 &&
        tutorSummaries.every((summary) => summary.audience === "tutor"),
      "Tutor conversation detail returned the wrong summary audience.",
    );

    const createNoteResult = await tutor.requestJson("/api/tutor/notes", {
      method: "POST",
      body: JSON.stringify({
        studentUserId: fixtureUserIds.student,
        conversationId: FIXTURE.ids.conversation,
        noteText: `Adult oversight smoke note ${new Date().toISOString()}`,
        isPinned: true,
      }),
    });
    const createNotePayload = expectOkJson(
      createNoteResult,
      "Tutor failed to create a private note",
    );
    const createdNote = createNotePayload.data?.note ?? null;

    assert(createdNote?.id, "Tutor note creation did not return a note id.");
    state.createdNoteId = createdNote.id;

    const updateNoteResult = await tutor.requestJson(
      `/api/tutor/notes/${createdNote.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          noteText: "Adult oversight smoke note updated.",
          isPinned: false,
        }),
      },
    );
    const updateNotePayload = expectOkJson(
      updateNoteResult,
      "Tutor failed to update the private note",
    );
    assert(
      updateNotePayload.data?.note?.noteText === "Adult oversight smoke note updated.",
      "Tutor note update did not persist the expected body.",
    );

    const deleteNoteResult = await tutor.requestJson(
      `/api/tutor/notes/${createdNote.id}`,
      {
        method: "DELETE",
      },
    );
    expectOkJson(deleteNoteResult, "Tutor failed to delete the private note");
    state.createdNoteId = null;

    const adminAuditResult = await admin.requestJson(
      "/api/admin/audit/access-events",
    );
    const adminAuditPayload = expectOkJson(
      adminAuditResult,
      "Admin failed to load the access audit feed",
    );
    const actions = new Set(
      (adminAuditPayload.data?.snapshot?.events ?? []).map((event) => event.action),
    );

    for (const action of [
      "parent_session_review_view",
      "tutor_session_review_view",
      "tutor_note_create",
      "tutor_note_update",
      "tutor_note_delete",
    ]) {
      assert(actions.has(action), `Admin audit feed is missing action ${action}.`);
    }

    const adminAuditPage = await admin.requestText("/app/audit");
    assert(
      adminAuditPage.response.ok &&
        adminAuditPage.text.includes(FIXTURE.displayNames.student),
      "Admin audit page did not render the access-audit surface.",
    );

    console.info(
      JSON.stringify(
        {
          ok: true,
          baseUrl,
          startedServer,
          checks: [
            "parent student detail page rendered",
            "parent dashboard surfaced a pending approval request",
            "parent dashboard created a learner account and showed it in the learner rail",
            "parent-created learner account could sign in as a student",
            "parent dashboard acceptance route marked the request accepted",
            "parent session review page rendered",
            "parent API detail stayed filtered to parent summaries",
            "parent could not create tutor notes",
            "tutor student detail page rendered",
            "tutor session review page rendered",
            "tutor API detail stayed filtered to tutor summaries",
            "tutor private note create/update/delete succeeded",
            "admin audit API captured adult review and note actions",
            "admin audit page rendered",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    if (state.createdNoteId) {
      const { error } = await adminClient
        .from("tutor_notes")
        .delete()
        .eq("id", state.createdNoteId);

      if (error) {
        console.error("Cleanup warning: failed to delete the temporary tutor note.");
        console.error(error);
      }
    }

    if (state.createdLearnerUserId) {
      const { error } = await adminClient.auth.admin.deleteUser(
        state.createdLearnerUserId,
      );

      if (error) {
        console.error(
          "Cleanup warning: failed to delete the temporary parent-created learner.",
        );
        console.error(error);
      }
    }

    if (state.pendingInvitationId) {
      const { error } = await adminClient
        .from("account_link_invitations")
        .delete()
        .eq("id", state.pendingInvitationId);

      if (error) {
        console.error(
          "Cleanup warning: failed to delete the temporary pending parent approval.",
        );
        console.error(error);
      }
    }

    await stopLocalServer(childProcess);
  }
}

main().catch((error) => {
  console.error("Adult-oversight smoke failed.");
  console.error(error);
  process.exitCode = 1;
});
