import {
  FIXTURE,
  createAdminClient,
  createFixtureAuthUsers,
  deleteFixtureAuthUsers,
  deleteFixtureRows,
  ensureFixtureBuckets,
  fixtureAttachmentPath,
} from "./rls-fixture-shared.mjs";

function nowIso() {
  return new Date().toISOString();
}

async function main() {
  const admin = createAdminClient();

  console.info("Seeding deterministic RLS fixtures...");

  await deleteFixtureRows(admin);
  await deleteFixtureAuthUsers(admin);
  await ensureFixtureBuckets(admin);

  const createdUsers = await createFixtureAuthUsers(admin);
  const userIds = {
    student: createdUsers.student.id,
    parent: createdUsers.parent.id,
    tutor: createdUsers.tutor.id,
    admin: createdUsers.admin.id,
  };

  const { error: usersError } = await admin.from("users").insert([
    {
      id: userIds.student,
      role: "student",
      account_status: "active",
      display_name: FIXTURE.displayNames.student,
      preferred_ui_language: "fr",
      ai_help_language: "fr",
      age_band: "eleven_twelve",
      is_under_13: true,
    },
    {
      id: userIds.parent,
      role: "parent",
      account_status: "active",
      display_name: FIXTURE.displayNames.parent,
      preferred_ui_language: "fr",
      ai_help_language: "fr",
      age_band: null,
      is_under_13: false,
    },
    {
      id: userIds.tutor,
      role: "tutor",
      account_status: "active",
      display_name: FIXTURE.displayNames.tutor,
      preferred_ui_language: "fr",
      ai_help_language: "fr",
      age_band: null,
      is_under_13: false,
    },
    {
      id: userIds.admin,
      role: "admin",
      account_status: "active",
      display_name: FIXTURE.displayNames.admin,
      preferred_ui_language: "en",
      ai_help_language: "fr",
      age_band: null,
      is_under_13: false,
    },
  ]);

  if (usersError) {
    throw usersError;
  }

  const { error: studentProfileError } = await admin.from("student_profiles").insert({
    student_user_id: userIds.student,
    current_grade_level: "6eme",
    preferred_help_style: "step_by_step",
    recurring_subjects: ["mathematiques", "sciences"],
    parental_approval_required: true,
    parent_approved_at: nowIso(),
    learning_notes: "Needs guided decomposition before final answer drafting.",
  });

  if (studentProfileError) {
    throw studentProfileError;
  }

  const { error: parentLinkError } = await admin.from("parent_student_links").insert({
    id: FIXTURE.ids.parentLink,
    parent_user_id: userIds.parent,
    student_user_id: userIds.student,
    link_status: "active",
    relationship_label: "mother",
    approved_at: nowIso(),
  });

  if (parentLinkError) {
    throw parentLinkError;
  }

  const { error: tutorLinkError } = await admin.from("tutor_student_links").insert({
    id: FIXTURE.ids.tutorLink,
    tutor_user_id: userIds.tutor,
    student_user_id: userIds.student,
    approved_by_parent_user_id: userIds.parent,
    link_status: "active",
    approved_at: nowIso(),
  });

  if (tutorLinkError) {
    throw tutorLinkError;
  }

  const { error: conversationError } = await admin.from("conversations").insert({
    id: FIXTURE.ids.conversation,
    student_user_id: userIds.student,
    created_by_user_id: userIds.student,
    title: "Fractions word problem",
    subject_tag: "mathematiques",
    status: "active",
    graded_homework: true,
    assignment_text:
      "Lisa partage 3 tartes entre 4 amis. Quelle fraction de tarte chaque ami recoit-il ?",
    edited_extracted_text:
      "Lisa partage 3 tartes entre 4 amis. Quelle fraction de tarte chaque ami recoit-il ? Explique ton raisonnement.",
    source_language: "fr",
    last_message_at: nowIso(),
  });

  if (conversationError) {
    throw conversationError;
  }

  const { error: messagesError } = await admin.from("messages").insert([
    {
      id: FIXTURE.ids.studentMessage,
      conversation_id: FIXTURE.ids.conversation,
      author_user_id: userIds.student,
      role: "student",
      content_text:
        "Je pense que c'est 3/4 mais je ne suis pas sur de l'explication.",
      content_language: "fr",
      moderation_status: "allowed",
    },
    {
      id: FIXTURE.ids.assistantMessage,
      conversation_id: FIXTURE.ids.conversation,
      author_user_id: null,
      role: "assistant",
      content_text:
        "Commence par imaginer chaque tarte coupee en 4 parts egales. Combien de quarts as-tu en tout ?",
      content_language: "fr",
      model_provider: "fixture",
      model_name: "fixture-coach-v1",
      input_tokens: 42,
      output_tokens: 56,
      moderation_status: "allowed",
    },
  ]);

  if (messagesError) {
    throw messagesError;
  }

  const { error: attachmentError } = await admin.from("attachments").insert({
    id: FIXTURE.ids.attachment,
    conversation_id: FIXTURE.ids.conversation,
    uploaded_by_user_id: userIds.student,
    storage_bucket: FIXTURE.buckets.homeworkAttachments,
    storage_path: fixtureAttachmentPath(userIds.student),
    attachment_kind: "pdf",
    mime_type: "application/pdf",
    original_filename: "fractions-homework.pdf",
    byte_size: 182341,
    page_count: 2,
    extraction_status: "ready",
    raw_extracted_text:
      "Exercice 4: Lisa partage 3 tartes entre 4 amis. Quelle fraction de tarte chaque ami recoit-il ?",
    source_language: "fr",
    metadata: {
      fixture_tag: FIXTURE.tag,
      upload_source: "file_picker",
      client_extension: "pdf",
      sha256: "fixture-fractions-sha256",
      pdf_page_count: 2,
      extraction_engine: "fixture-parser",
      extraction_version: "v1",
      detected_language: "fr",
    },
  });

  if (attachmentError) {
    throw attachmentError;
  }

  const { error: workspaceError } = await admin.from("workspace_states").insert({
    id: FIXTURE.ids.workspaceState,
    conversation_id: FIXTURE.ids.conversation,
    assignment_text:
      "Lisa partage 3 tartes entre 4 amis. Quelle fraction de tarte chaque ami recoit-il ?",
    edited_extracted_text:
      "Explique avec des quarts puis donne la fraction simplifiee si possible.",
    plan_text: "1. Convertir 3 tartes en quarts. 2. Diviser le total par 4 amis.",
    draft_answer_text:
      "Chaque ami recoit 3 quarts de tarte parce que 3 tartes = 12 quarts et 12 ÷ 4 = 3.",
    student_notes: "Je confonds encore partage et simplification.",
    last_saved_by_user_id: userIds.student,
  });

  if (workspaceError) {
    throw workspaceError;
  }

  const { error: summariesError } = await admin.from("session_summaries").insert([
    {
      id: FIXTURE.ids.summaryStudent,
      conversation_id: FIXTURE.ids.conversation,
      audience: "student",
      language_code: "fr",
      summary_text:
        "Tu as bien compris qu'il fallait partager 3 tartes entre 4 amis. Continue a relier le dessin en quarts au calcul.",
      weakness_tags: ["justification"],
      next_step_recommendation: "Refaire un exemple avec 2 tartes et 3 amis.",
      generated_model_name: "fixture-summary-v1",
    },
    {
      id: FIXTURE.ids.summaryParent,
      conversation_id: FIXTURE.ids.conversation,
      audience: "parent",
      language_code: "fr",
      summary_text:
        "Votre enfant trouve la bonne fraction mais a encore besoin d'aide pour expliquer le raisonnement en plusieurs etapes.",
      weakness_tags: ["explication"],
      next_step_recommendation:
        "Verifier qu'il peut expliquer oralement le passage de tartes entieres a quarts.",
      generated_model_name: "fixture-summary-v1",
    },
    {
      id: FIXTURE.ids.summaryTutor,
      conversation_id: FIXTURE.ids.conversation,
      audience: "tutor",
      language_code: "fr",
      summary_text:
        "Correct result path, but representation-to-explanation transfer remains weak under mild uncertainty.",
      weakness_tags: ["representation_transfer", "written_explanation"],
      next_step_recommendation:
        "Plan one short fraction-division reteach loop using diagrams before symbolic notation.",
      generated_model_name: "fixture-summary-v1",
    },
  ]);

  if (summariesError) {
    throw summariesError;
  }

  const { error: tutorNoteError } = await admin.from("tutor_notes").insert({
    id: FIXTURE.ids.tutorNote,
    tutor_user_id: userIds.tutor,
    student_user_id: userIds.student,
    conversation_id: FIXTURE.ids.conversation,
    note_text:
      "RLS fixture note: student needs clearer written explanations after correct numeric reasoning.",
    is_pinned: true,
  });

  if (tutorNoteError) {
    throw tutorNoteError;
  }

  const { error: subscriptionError } = await admin.from("subscriptions").insert({
    id: FIXTURE.ids.subscription,
    payer_user_id: userIds.parent,
    provider: "lemonsqueezy",
    provider_customer_id: FIXTURE.subscription.providerCustomerId,
    provider_subscription_id: FIXTURE.subscription.providerSubscriptionId,
    plan_key: FIXTURE.subscription.planKey,
    status: "active",
    trial_ends_at: null,
    current_period_starts_at: nowIso(),
    current_period_ends_at: nowIso(),
  });

  if (subscriptionError) {
    throw subscriptionError;
  }

  const { error: usageError } = await admin.from("usage_counters").insert({
    id: FIXTURE.ids.usageCounter,
    student_user_id: userIds.student,
    period_start: "2026-03-01",
    period_end: "2026-03-31",
    sessions_count: 3,
    uploads_count: 1,
    assistant_message_count: 5,
    input_tokens: 320,
    output_tokens: 580,
  });

  if (usageError) {
    throw usageError;
  }

  const { error: moderationError } = await admin.from("moderation_events").insert({
    id: FIXTURE.ids.moderationEvent,
    conversation_id: FIXTURE.ids.conversation,
    message_id: FIXTURE.ids.studentMessage,
    attachment_id: FIXTURE.ids.attachment,
    actor_user_id: userIds.student,
    event_source: "user_input",
    status: "allowed",
    provider: "fixture",
    reason: FIXTURE.markerReason,
    details: {
      fixture_tag: FIXTURE.tag,
    },
  });

  if (moderationError) {
    throw moderationError;
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    id: FIXTURE.ids.auditLog,
    actor_user_id: userIds.admin,
    actor_role: "admin",
    action: "rls_fixture_admin_seed_review",
    target_table: "conversations",
    target_id: FIXTURE.ids.conversation,
    student_user_id: userIds.student,
    conversation_id: FIXTURE.ids.conversation,
    metadata: {
      fixture_tag: FIXTURE.tag,
      route: "scripts/seed-rls-fixtures.mjs",
    },
  });

  if (auditError) {
    throw auditError;
  }

  const { error: memoryProfileError } = await admin
    .from("student_memory_profiles")
    .upsert(
      {
        student_user_id: userIds.student,
        strengths_summary: "Gets correct numeric result with visual prompts.",
        weaknesses_summary: "Written explanation remains fragile.",
        preferences_summary: "Responds well to step-by-step hints in French.",
        last_reviewed_at: nowIso(),
      },
      { onConflict: "student_user_id" },
    );

  if (memoryProfileError) {
    throw memoryProfileError;
  }

  const { error: memoryItemsError } = await admin.from("student_memory_items").insert([
    {
      id: FIXTURE.ids.memoryItemStrength,
      student_user_id: userIds.student,
      source_conversation_id: FIXTURE.ids.conversation,
      category: "strength",
      title: "Fraction sharing with diagrams",
      detail: "Can translate pies into quarter slices when prompted visually.",
      confidence: 0.84,
      is_active: true,
    },
    {
      id: FIXTURE.ids.memoryItemWeakness,
      student_user_id: userIds.student,
      source_conversation_id: FIXTURE.ids.conversation,
      category: "weakness",
      title: "Written justification",
      detail: "Needs help turning correct arithmetic into a full sentence explanation.",
      confidence: 0.79,
      is_active: true,
    },
  ]);

  if (memoryItemsError) {
    throw memoryItemsError;
  }

  console.info("Seed complete.");
  console.info(
    JSON.stringify(
      {
        fixtureTag: FIXTURE.tag,
        emails: FIXTURE.emails,
        userIds,
        conversationId: FIXTURE.ids.conversation,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Failed to seed RLS fixtures.");
  console.error(error);
  process.exitCode = 1;
});
