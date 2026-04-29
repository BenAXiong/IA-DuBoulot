import crypto from "node:crypto";

import {
  FIXTURE,
  createAdminClient,
  resolveFixtureUserIds,
  signInFixture,
} from "./rls-fixture-shared.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectMaybeSingle(query, message) {
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  assert(data, message);
  return data;
}

async function expectNoRow(query, message) {
  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  assert(data === null, message);
}

async function expectRows(query, message) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  assert(Array.isArray(data), message);
  return data;
}

async function main() {
  const adminClient = createAdminClient();
  const userIds = await resolveFixtureUserIds(adminClient);

  for (const [role, id] of Object.entries(userIds)) {
    assert(id, `Missing seeded fixture auth user for role: ${role}`);
  }

  const originalConversationTitle = "Fractions word problem";
  const temporaryConversationIds = [];
  const temporaryTutorNoteIds = [];
  const failures = [];
  let passed = 0;

  const student = await signInFixture(FIXTURE.emails.student);
  const parent = await signInFixture(FIXTURE.emails.parent);
  const tutor = await signInFixture(FIXTURE.emails.tutor);
  const admin = await signInFixture(FIXTURE.emails.admin);

  async function check(label, fn) {
    try {
      await fn();
      passed += 1;
      console.info(`PASS ${label}`);
    } catch (error) {
      failures.push({
        label,
        message: error instanceof Error ? error.message : String(error),
      });
      console.error(`FAIL ${label}`);
      console.error(error);
    }
  }

  try {
    await check("student reads own user/profile/conversation", async () => {
      const ownUser = await expectMaybeSingle(
        student.client
          .from("users")
          .select("id, role, display_name")
          .eq("id", userIds.student),
        "Student could not read own user row",
      );

      assert(ownUser.role === "student", "Student user row returned wrong role");

      const profile = await expectMaybeSingle(
        student.client
          .from("student_profiles")
          .select("student_user_id, parental_approval_required")
          .eq("student_user_id", userIds.student),
        "Student could not read own profile",
      );

      assert(
        profile.parental_approval_required === true,
        "Student profile fixture did not return expected approval flag",
      );

      const conversation = await expectMaybeSingle(
        student.client
          .from("conversations")
          .select("id, student_user_id, title")
          .eq("id", FIXTURE.ids.conversation),
        "Student could not read own conversation",
      );

      assert(
        conversation.student_user_id === userIds.student,
        "Student conversation row returned wrong owner",
      );
    });

    await check("student cannot read parent user row", async () => {
      await expectNoRow(
        student.client
          .from("users")
          .select("id, role")
          .eq("id", userIds.parent),
        "Student unexpectedly saw the parent user row",
      );
    });

    await check("student only sees student summary audience", async () => {
      const rows = await expectRows(
        student.client
          .from("session_summaries")
          .select("id, audience")
          .eq("conversation_id", FIXTURE.ids.conversation)
          .order("audience", { ascending: true }),
        "Student summary query failed",
      );

      assert(rows.length === 1, `Student saw ${rows.length} summary rows instead of 1`);
      assert(rows[0].audience === "student", "Student saw a non-student summary");
    });

    await check("student cannot read tutor notes or subscriptions", async () => {
      await expectNoRow(
        student.client
          .from("tutor_notes")
          .select("id")
          .eq("id", FIXTURE.ids.tutorNote),
        "Student unexpectedly saw tutor notes",
      );

      await expectNoRow(
        student.client
          .from("subscriptions")
          .select("id")
          .eq("id", FIXTURE.ids.subscription),
        "Student unexpectedly saw subscription data",
      );
    });

    await check("student can insert and delete own conversation", async () => {
      const temporaryConversationId = crypto.randomUUID();
      temporaryConversationIds.push(temporaryConversationId);

      const { data: insertData, error: insertError } = await student.client
        .from("conversations")
        .insert({
          id: temporaryConversationId,
          student_user_id: userIds.student,
          created_by_user_id: userIds.student,
          title: "RLS fixture temporary conversation",
          subject_tag: "francais",
          status: "active",
          graded_homework: false,
          assignment_text: "Ecrire une phrase simple.",
          source_language: "fr",
        })
        .select("id, student_user_id")
        .single();

      if (insertError) {
        throw insertError;
      }

      assert(
        insertData.student_user_id === userIds.student,
        "Student insert did not create the expected conversation owner",
      );

      const { data: deleteData, error: deleteError } = await student.client
        .from("conversations")
        .delete()
        .eq("id", temporaryConversationId)
        .select("id")
        .single();

      if (deleteError) {
        throw deleteError;
      }

      assert(deleteData.id === temporaryConversationId, "Student delete did not remove temp row");
    });

    await check("student manages own subject resources, links, and chunks", async () => {
      const resources = await expectRows(
        student.client
          .from("subject_resources")
          .select("id, original_filename")
          .in("id", [
            FIXTURE.ids.subjectResourceLinked,
            FIXTURE.ids.subjectResourceUnlinked,
          ])
          .order("original_filename", { ascending: true }),
        "Student subject resource query failed",
      );

      assert(resources.length === 2, `Student saw ${resources.length} subject resources instead of 2`);

      const link = await expectMaybeSingle(
        student.client
          .from("conversation_resource_links")
          .select("id, selected")
          .eq("id", FIXTURE.ids.subjectResourceLink),
        "Student could not read conversation resource link",
      );

      assert(link.selected === true, "Fixture resource link should start selected");

      const { data: updatedLink, error: updateError } = await student.client
        .from("conversation_resource_links")
        .update({ selected: false })
        .eq("id", FIXTURE.ids.subjectResourceLink)
        .select("id, selected")
        .single();

      if (updateError) {
        throw updateError;
      }

      assert(updatedLink.selected === false, "Student could not update own resource link selection");

      const { error: restoreLinkError } = await adminClient
        .from("conversation_resource_links")
        .update({ selected: true })
        .eq("id", FIXTURE.ids.subjectResourceLink);

      if (restoreLinkError) {
        throw restoreLinkError;
      }

      const chunks = await expectRows(
        student.client
          .from("subject_resource_chunks")
          .select("id, resource_id")
          .in("id", [
            FIXTURE.ids.subjectResourceChunkLinked,
            FIXTURE.ids.subjectResourceChunkUnlinked,
          ]),
        "Student subject resource chunk query failed",
      );

      assert(chunks.length === 2, `Student saw ${chunks.length} chunks instead of 2`);
    });

    await check("parent reads linked child user/profile/conversation", async () => {
      const childUser = await expectMaybeSingle(
        parent.client
          .from("users")
          .select("id, role, display_name")
          .eq("id", userIds.student),
        "Parent could not read linked child user row",
      );

      assert(childUser.role === "student", "Parent saw wrong child role");

      await expectMaybeSingle(
        parent.client
          .from("student_profiles")
          .select("student_user_id, current_grade_level")
          .eq("student_user_id", userIds.student),
        "Parent could not read child profile",
      );

      await expectMaybeSingle(
        parent.client
          .from("conversations")
          .select("id, title")
          .eq("id", FIXTURE.ids.conversation),
        "Parent could not read child conversation",
      );
    });

    await check("parent only sees parent summary audience", async () => {
      const rows = await expectRows(
        parent.client
          .from("session_summaries")
          .select("id, audience")
          .eq("conversation_id", FIXTURE.ids.conversation),
        "Parent summary query failed",
      );

      assert(rows.length === 1, `Parent saw ${rows.length} summary rows instead of 1`);
      assert(rows[0].audience === "parent", "Parent saw a non-parent summary");
    });

    await check("parent reads usage counters and memory items", async () => {
      const usageCounter = await expectMaybeSingle(
        parent.client
          .from("usage_counters")
          .select("id, student_user_id, sessions_count")
          .eq("id", FIXTURE.ids.usageCounter),
        "Parent could not read usage counter",
      );

      assert(usageCounter.student_user_id === userIds.student, "Parent usage counter owner mismatch");

      const memoryItems = await expectRows(
        parent.client
          .from("student_memory_items")
          .select("id, student_user_id, category")
          .eq("student_user_id", userIds.student)
          .order("category", { ascending: true }),
        "Parent memory item query failed",
      );

      assert(memoryItems.length >= 2, "Parent did not see the expected memory items");
    });

    await check("parent cannot read tutor notes", async () => {
      await expectNoRow(
        parent.client
          .from("tutor_notes")
          .select("id")
          .eq("id", FIXTURE.ids.tutorNote),
        "Parent unexpectedly saw tutor notes",
      );
    });

    await check("parent cannot update child conversation", async () => {
      const { data, error } = await parent.client
        .from("conversations")
        .update({
          title: "Parent should not change this title",
        })
        .eq("id", FIXTURE.ids.conversation)
        .select("id");

      if (error) {
        throw error;
      }

      assert(Array.isArray(data) && data.length === 0, "Parent update unexpectedly affected a row");
    });

    await check("parent only sees conversation-linked subject resources and chunks", async () => {
      await expectMaybeSingle(
        parent.client
          .from("subject_resources")
          .select("id, original_filename")
          .eq("id", FIXTURE.ids.subjectResourceLinked),
        "Parent could not read linked subject resource",
      );

      await expectNoRow(
        parent.client
          .from("subject_resources")
          .select("id")
          .eq("id", FIXTURE.ids.subjectResourceUnlinked),
        "Parent unexpectedly saw unlinked subject resource",
      );

      await expectMaybeSingle(
        parent.client
          .from("conversation_resource_links")
          .select("id, selected")
          .eq("id", FIXTURE.ids.subjectResourceLink),
        "Parent could not read linked conversation-resource row",
      );

      await expectMaybeSingle(
        parent.client
          .from("subject_resource_chunks")
          .select("id, page_start")
          .eq("id", FIXTURE.ids.subjectResourceChunkLinked),
        "Parent could not read linked resource chunk",
      );

      await expectNoRow(
        parent.client
          .from("subject_resource_chunks")
          .select("id")
          .eq("id", FIXTURE.ids.subjectResourceChunkUnlinked),
        "Parent unexpectedly saw unlinked subject resource chunk",
      );

      const { data, error } = await parent.client
        .from("conversation_resource_links")
        .update({ selected: false })
        .eq("id", FIXTURE.ids.subjectResourceLink)
        .select("id");

      if (error) {
        throw error;
      }

      assert(Array.isArray(data) && data.length === 0, "Parent update unexpectedly changed resource link");
    });

    await check("tutor reads linked child conversation", async () => {
      const conversation = await expectMaybeSingle(
        tutor.client
          .from("conversations")
          .select("id, student_user_id, title")
          .eq("id", FIXTURE.ids.conversation),
        "Tutor could not read linked child conversation",
      );

      assert(conversation.student_user_id === userIds.student, "Tutor saw wrong student owner");
    });

    await check("tutor only sees tutor summary audience", async () => {
      const rows = await expectRows(
        tutor.client
          .from("session_summaries")
          .select("id, audience")
          .eq("conversation_id", FIXTURE.ids.conversation),
        "Tutor summary query failed",
      );

      assert(rows.length === 1, `Tutor saw ${rows.length} summary rows instead of 1`);
      assert(rows[0].audience === "tutor", "Tutor saw a non-tutor summary");
    });

    await check("tutor reads own tutor note", async () => {
      const note = await expectMaybeSingle(
        tutor.client
          .from("tutor_notes")
          .select("id, tutor_user_id, student_user_id")
          .eq("id", FIXTURE.ids.tutorNote),
        "Tutor could not read own tutor note",
      );

      assert(note.tutor_user_id === userIds.tutor, "Tutor note ownership mismatch");
      assert(note.student_user_id === userIds.student, "Tutor note student mismatch");
    });

    await check("tutor cannot read child memory items or usage counters", async () => {
      const memoryRows = await expectRows(
        tutor.client
          .from("student_memory_items")
          .select("id")
          .eq("student_user_id", userIds.student),
        "Tutor memory query failed",
      );

      assert(memoryRows.length === 0, "Tutor unexpectedly saw memory items");

      await expectNoRow(
        tutor.client
          .from("usage_counters")
          .select("id")
          .eq("id", FIXTURE.ids.usageCounter),
        "Tutor unexpectedly saw usage counters",
      );
    });

    await check("tutor can insert and delete own tutor note", async () => {
      const temporaryNoteId = crypto.randomUUID();
      temporaryTutorNoteIds.push(temporaryNoteId);

      const { data: insertData, error: insertError } = await tutor.client
        .from("tutor_notes")
        .insert({
          id: temporaryNoteId,
          tutor_user_id: userIds.tutor,
          student_user_id: userIds.student,
          conversation_id: FIXTURE.ids.conversation,
          note_text: "Temporary tutor note created by verification script.",
          is_pinned: false,
        })
        .select("id, tutor_user_id")
        .single();

      if (insertError) {
        throw insertError;
      }

      assert(insertData.tutor_user_id === userIds.tutor, "Tutor insert note ownership mismatch");

      const { data: deleteData, error: deleteError } = await tutor.client
        .from("tutor_notes")
        .delete()
        .eq("id", temporaryNoteId)
        .select("id")
        .single();

      if (deleteError) {
        throw deleteError;
      }

      assert(deleteData.id === temporaryNoteId, "Tutor delete did not remove temp note");
    });

    await check("tutor only sees conversation-linked subject resources and chunks", async () => {
      await expectMaybeSingle(
        tutor.client
          .from("subject_resources")
          .select("id, original_filename")
          .eq("id", FIXTURE.ids.subjectResourceLinked),
        "Tutor could not read linked subject resource",
      );

      await expectNoRow(
        tutor.client
          .from("subject_resources")
          .select("id")
          .eq("id", FIXTURE.ids.subjectResourceUnlinked),
        "Tutor unexpectedly saw unlinked subject resource",
      );

      await expectMaybeSingle(
        tutor.client
          .from("subject_resource_chunks")
          .select("id, page_start")
          .eq("id", FIXTURE.ids.subjectResourceChunkLinked),
        "Tutor could not read linked resource chunk",
      );

      await expectNoRow(
        tutor.client
          .from("subject_resource_chunks")
          .select("id")
          .eq("id", FIXTURE.ids.subjectResourceChunkUnlinked),
        "Tutor unexpectedly saw unlinked subject resource chunk",
      );
    });

    await check("admin reads moderation events, audit logs, and subscriptions", async () => {
      await expectMaybeSingle(
        admin.client
          .from("moderation_events")
          .select("id, status")
          .eq("id", FIXTURE.ids.moderationEvent),
        "Admin could not read moderation event",
      );

      await expectMaybeSingle(
        admin.client
          .from("audit_logs")
          .select("id, action")
          .eq("id", FIXTURE.ids.auditLog),
        "Admin could not read audit log",
      );

      await expectMaybeSingle(
        admin.client
          .from("subscriptions")
          .select("id, status")
          .eq("id", FIXTURE.ids.subscription),
        "Admin could not read subscription",
      );

      const resources = await expectRows(
        admin.client
          .from("subject_resources")
          .select("id")
          .in("id", [
            FIXTURE.ids.subjectResourceLinked,
            FIXTURE.ids.subjectResourceUnlinked,
          ]),
        "Admin subject resource query failed",
      );

      assert(resources.length === 2, "Admin could not read all fixture subject resources");
    });

    await check("admin can update student conversation", async () => {
      const updatedTitle = "Fractions word problem [admin verification]";
      const { data, error } = await admin.client
        .from("conversations")
        .update({
          title: updatedTitle,
        })
        .eq("id", FIXTURE.ids.conversation)
        .select("id, title")
        .single();

      if (error) {
        throw error;
      }

      assert(data.title === updatedTitle, "Admin update did not persist the expected title");

      const { error: restoreError } = await adminClient
        .from("conversations")
        .update({
          title: originalConversationTitle,
        })
        .eq("id", FIXTURE.ids.conversation);

      if (restoreError) {
        throw restoreError;
      }
    });
  } finally {
    if (temporaryTutorNoteIds.length > 0) {
      const { error } = await adminClient
        .from("tutor_notes")
        .delete()
        .in("id", temporaryTutorNoteIds);

      if (error) {
        console.error("Cleanup failure for temporary tutor notes.");
        console.error(error);
      }
    }

    if (temporaryConversationIds.length > 0) {
      const { error } = await adminClient
        .from("conversations")
        .delete()
        .in("id", temporaryConversationIds);

      if (error) {
        console.error("Cleanup failure for temporary conversations.");
        console.error(error);
      }
    }

    const { error: restoreError } = await adminClient
      .from("conversations")
      .update({
        title: originalConversationTitle,
      })
      .eq("id", FIXTURE.ids.conversation);

    if (restoreError) {
      console.error("Cleanup failure while restoring fixture conversation title.");
      console.error(restoreError);
    }
  }

  console.info(
    JSON.stringify(
      {
        fixtureTag: FIXTURE.tag,
        passed,
        failed: failures.length,
        failures,
      },
      null,
      2,
    ),
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Failed to verify RLS fixtures.");
  console.error(error);
  process.exitCode = 1;
});
