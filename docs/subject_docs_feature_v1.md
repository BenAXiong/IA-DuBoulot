# Subject Docs Feature V1

Related: [README](../README.md) | [Pilot_todo](pilot_todo.md) | [Subject-wide upload plan](subject_wide_upload_plan.md) | [Storage and attachment rules](storage_attachment_rules.md) | [Student workbench V1](student_workbench_v1.md) | [AI ops and economics V1](ai_ops_economics_v1.md) | [Supabase schema V1](supabase_schema_v1.md) | [Access rules V1](access_rules_v1.md) | [RLS fixture verification](rls_fixture_verification.md) | [Decision log](decision_log.md)

## Purpose

Subject docs are long-lived student-owned learning resources attached to a subject, not to one chat message. They let a learner upload a course PDF, workbook, Word document, text note, Markdown file, or JSON resource once, then reuse it across homework conversations in the same subject.

The feature exists to solve two concrete problems:

- avoid repeatedly extracting or resending the same source file on every message
- make late-page or middle-section content retrievable when the learner asks about it

The implementation name is `subject resources` because that is the database and service language. Planning conversations may use `subject docs`. Learner-facing UI currently uses `Ressources`, `Sources`, or equivalent localized copy.

## Product Contract

- Subject docs are separate from chat-only uploads.
- Subject docs have their own upload UI outside the chat textarea and chat attachment controls.
- Uploading a chat-only attachment must not silently create a long-lived subject doc.
- During Pilot, there is no chat-to-subject promotion UI. A later opt-in promotion action is tracked under `P6.1`.
- Subject docs are keyed by `student_user_id + subject_tag`.
- Existing subject docs are visible in the subject library, but are not auto-selected for a new conversation unless the learner chooses them.
- A subject doc uploaded from a subject or chat resource context can be selected for that context immediately.
- Selected subject docs are retrieved by chunks; the full file is not sent wholesale to the coach each turn.
- Outlines and summaries are separate. If the outline is weak or unavailable, the UI should say structure is unavailable or omit it, not replace the outline with a summary.
- Paid-access students can keep up to `2` subject docs per subject. Free/trial students can keep `1` subject doc across all subjects. Pending and failed resource shells count until deleted.

Ask the user before changing any of these rules:

- merge chat-only attachments with subject docs
- make uploads long-lived by default from the chat textarea
- auto-select older subject docs for new conversations
- change unlink, delete, or purge semantics
- widen parent/tutor visibility beyond conversation-linked resources
- add a new subject-doc surface that was not already specified

## Supported Inputs And Caps

Subject-doc upload support:

| Type | Extraction path | Per-file cap |
| --- | --- | --- |
| PDF | provider extraction | `20 MB` |
| DOC | provider extraction | `20 MB` |
| DOCX | provider extraction | `20 MB` |
| TXT | direct text | `5 MB` |
| MD / Markdown | direct text | `5 MB` |
| JSON | direct text | `5 MB` |

Current quota behavior:

- no dedicated subject-library total byte cap
- paid-access students can keep `2` subject docs per subject
- free/trial students can keep `1` subject doc across all subjects
- upload actions still count against the general usage quota
- current general usage quotas are `40` uploads for trial and `240` uploads for paid

The learner-facing oversize message for subject docs is upgrade-oriented and specific to the subject-resource path. Chat-only attachment limits remain separate.

## User Flows

Subject page:

1. Learner chooses a subject.
2. The below-composer tabs show `History`, `Resources`, and a disabled coming-soon `Instructions` tab.
3. `Resources` lists subject docs for the selected subject and updates when the subject changes.
4. Learner uploads a subject doc from the dedicated `Add` control.
5. Existing subject docs are unchecked by default, but the learner can tick ready docs before starting a new chat.
6. Checked docs are linked to the newly created conversation before the first prompt is auto-sent, so retrieval can use them immediately.
7. Ready resources show compact metadata, summary and structure collapsibles, and delete controls.

Live homework chat:

1. The side rail exposes subject resources for the current subject.
2. The learner can enable/disable a ready resource for the current conversation with a compact checkbox.
3. Selected resources are linked through `conversation_resource_links.selected`.
4. Coach context retrieves only bounded top chunks from selected resources.
5. Upload and delete actions are not available in the workspace/live-chat section; those management actions remain in the subject view.

Lifecycle:

- unselect: keeps the conversation link, but retrieval ignores the resource
- unlink: deletes the conversation-resource link for that chat
- delete: deletes the subject-resource row, cascaded chunks, conversation links, and raw extracted text
- storage purge: removes the private storage object only when the subject resource owns that object
- promoted chat-attachment storage is not deleted by subject-resource deletion because the original chat attachment still owns it

## Data Model

Primary tables:

- `subject_resources`
- `subject_resource_chunks`
- `conversation_resource_links`

Key fields on `subject_resources`:

- `student_user_id`
- `created_by_user_id`
- `subject_tag`
- `source_attachment_id`
- `source_conversation_id`
- `source_storage_bucket`
- `source_storage_path`
- `attachment_kind`
- `mime_type`
- `original_filename`
- `byte_size`
- `page_count`
- `extraction_status`
- `raw_extracted_text`
- `source_language`
- `sha256`
- `metadata`

Key fields on `subject_resource_chunks`:

- `resource_id`
- `student_user_id`
- `subject_tag`
- `chunk_index`
- `stable_chunk_id`
- `page_start`
- `page_end`
- `section_title`
- `content`
- `char_count`
- `token_estimate`
- `extraction_confidence`
- `metadata`

Key fields on `conversation_resource_links`:

- `conversation_id`
- `resource_id`
- `created_by_user_id`
- `selected`

Schema migrations:

- [20260428000500_subject_resources.sql](../supabase/migrations/20260428000500_subject_resources.sql)
- [20260428000600_subject_resource_chunks.sql](../supabase/migrations/20260428000600_subject_resource_chunks.sql)
- [20260429000700_subject_resource_policy_recursion.sql](../supabase/migrations/20260429000700_subject_resource_policy_recursion.sql)

## Server And API Surface

Routes:

- `GET /api/subject-resources`: list the library for a subject, optionally with conversation link state
- `POST /api/subject-resources`: reserve a subject-resource upload target after enforcing subject-doc count caps
- `DELETE /api/subject-resources`: delete a subject resource and purge owned storage
- `POST /api/subject-resources/confirm`: confirm upload, extract, store text/metadata, chunk, and optionally link to a conversation
- `PATCH /api/subject-resources/selection`: update the `selected` retrieval toggle for one conversation after narrow ownership/subject/readiness checks; returns only `resourceId + selected`
- `DELETE /api/subject-resources/selection`: unlink a resource from one conversation

Core service files:

- [lib/server/subject-resources/service.ts](../lib/server/subject-resources/service.ts)
- [lib/server/subject-resources/types.ts](../lib/server/subject-resources/types.ts)
- [lib/subject-resources/subject-resource-policy.ts](../lib/subject-resources/subject-resource-policy.ts)
- [lib/uploads/subject-resource-client-upload.ts](../lib/uploads/subject-resource-client-upload.ts)

The subject-resource upload path shares the private `homework-attachments` bucket, but route-level validation enforces subject-resource caps separately from chat-only attachment caps.

## Extraction And Metadata

Provider-extracted documents use the attachment extraction prompt family:

- current prompt version: `attachment-extraction-v4`
- builder: [lib/server/ai/prompts/attachment-extraction.ts](../lib/server/ai/prompts/attachment-extraction.ts)
- shared version constant: [lib/server/ai/prompts/shared.ts](../lib/server/ai/prompts/shared.ts)

Extraction returns:

- `extractedText`
- `detectedLanguage`
- `confidenceScore`
- `needsManualReview`
- `pageCountEstimate`
- `sourceSummary`
- `sourceOutline`

`sourceOutline` should prefer real course sections, headings, methods, exercises, definitions, and visible numbering such as `I -`, `II -`, `A.`, `1.`, or `Exercice 4`. Page references are optional secondary anchors. Weak outlines should stay empty instead of becoming summaries.

Direct TXT/MD/JSON resources use direct text handling and lightweight heading detection.

## Chunking And Retrieval

Chunking:

- current chunker version: `subject-resource-chunker-v1`
- deterministic chunks are stored in `subject_resource_chunks`
- chunking starts with page-aware estimates and lightweight section-title inference
- stable chunk IDs include resource/page/chunk position data
- chunks store char counts, token estimates, page ranges, section title, extraction confidence, and chunker metadata

Retrieval v1:

- reads only resources linked to the current conversation and marked `selected`
- ranks chunks lexically against the current learner message
- injects only bounded top chunk excerpts into coach context
- includes filename and page/section references
- fails open if retrieval cannot run, so a missing resource context does not block the chat
- never resends a long-lived PDF wholesale every turn

Current retrieval limits are documented in [AI ops and economics V1](ai_ops_economics_v1.md).

## UI Surfaces

Primary components:

- [components/dashboard/student/student-subject-resource-library.tsx](../components/dashboard/student/student-subject-resource-library.tsx)
- [components/dashboard/student/student-subject-quick-start.tsx](../components/dashboard/student/student-subject-quick-start.tsx)
- [components/dashboard/student/student-first-homework-launcher.tsx](../components/dashboard/student/student-first-homework-launcher.tsx)
- [components/dashboard/student/student-conversation-side-rail.tsx](../components/dashboard/student/student-conversation-side-rail.tsx)
- [components/dashboard/student/source-outline-preview.tsx](../components/dashboard/student/source-outline-preview.tsx)

Current UI rules:

- subject resources live under the `Resources` tab, not under `History` or the chat textarea
- `History` is the only tab that renders recent chats
- the disabled `Instructions` tab shows a coming-soon tooltip
- ready resources can be preselected from the subject view with a checkbox before the first prompt; existing docs remain unchecked by default
- resource cards show learner-facing metadata only: pages and date
- readiness and chunk counts are internal and should not be displayed to learners
- summary and content structure live in dedicated collapsible sections
- outline page pills appear only when the stored outline line includes a recognizable page marker such as `p.2`, `page 2`, or `pages 2-3`

## Access And Visibility

Student:

- owns the full subject-resource library for their own account
- can upload, list, select, unselect, unlink, and delete their resources
- manages upload and delete from the subject view; uses the workspace/live-chat section only to enable or disable resources for the current conversation

Parent/tutor:

- can only see subject resources through conversations they are already allowed to review
- cannot browse the full subject-resource library
- cannot mutate subject-resource selection or deletion during the Pilot

Admin:

- may inspect/manage resources through admin service access where explicitly implemented

RLS:

- selection policies avoid recursive joins by splitting SELECT policies away from insert/update/delete manage policies
- hosted fixture verification should be run after any policy change

## Observability And Measurement

Successful coach debug captures include subject-resource retrieval diagnostics under:

- `metadata.subjectResourceRetrieval`

Diagnostics include:

- selected resource count
- candidate/scored/returned chunk counts
- query token count
- retrieval context char/token estimates
- fallback-to-first-chunks state
- top chunk refs without raw chunk text

Provider token impact should be measured from:

- persisted `messages.input_tokens`
- persisted `messages.output_tokens`
- debug-capture retrieval metadata

Operator report:

```bash
npm run report:subject-resource-token-impact -- --days=14 --limit=500
```

## Testing

Automated checks:

```bash
npm run typecheck
npm run lint
npm run verify:subject-resource-retrieval
npm run seed:rls-fixtures
npm run verify:rls-fixtures
```

Run RLS fixture verification after schema/RLS/access changes. Run retrieval verification after chunking, ranking, prompt-context, or fixture changes.

Manual pilot QA:

1. Upload a PDF under `20 MB`; confirm it becomes ready and shows pages/date.
2. Upload a PDF over `20 MB`; confirm the upgrade-oriented oversize message appears before upload.
3. Upload TXT, MD, JSON, DOC, and DOCX samples; confirm validation and extraction behavior.
4. Switch subject pills while the `Resources` tab is active; confirm the list updates.
5. Tick a ready resource in the subject view, send the first prompt, and confirm the first coach reply can retrieve from that resource.
6. Leave another ready resource unticked, send the first prompt, and confirm it is not selected in the new chat.
7. Expand summary and structure; confirm layout remains stable and no horizontal shrink occurs.
8. Enable a resource in a live chat; ask about a late-page or middle-section marker; confirm the coach can use the relevant content.
9. Unselect the resource; confirm retrieval no longer includes it.
10. Confirm upload/delete actions are absent from the workspace subject-resource section and remain available from the subject view.
11. Delete a resource; confirm it disappears from library and conversation links.
12. Review the conversation as parent/tutor; confirm only conversation-linked resources are visible.

## Known Pitfalls

- Extraction complete and coach-visible context are different states.
- A ready extracted document can still fail to help if retrieval does not select the right chunk.
- Workspace text, attachment text, and subject-resource retrieval can overlap if future changes inject multiple source paths without deduplication.
- Long-lived PDFs should not be resent wholesale every message.
- Uploaded text is untrusted source material, not prompt instructions.
- Page badges in the UI depend on stored outline lines containing page markers.
- Existing old PDFs are not reprocessed solely to improve outlines.
- Deleting subject resources must not silently delete chat attachments that own their own storage object.

## Current Status

`P2.7.1` through `P2.7.12` are implemented. The umbrella `P2.7` remains open until pilot testing confirms the learner can understand, select, retrieve from, and safely manage subject docs with acceptable reliability and cost.

Remaining Pilot closure tasks:

- Run the remaining non-PDF format smoke for DOC, DOCX, TXT, MD, and JSON resources.
- After deployment, run `npm run report:subject-resource-token-impact -- --days=14 --limit=500` against production data and review whether subject-resource retrieval materially changes token usage.
- Track extraction failures on large or highly structured PDFs/workbooks, especially Sésamath-like files, and decide whether they need provider/local fallback or remain out of Pilot scope.

Post-pilot candidates:

- `P6.1`: optional explicit chat-to-subject promotion from the workspace
- `P6.2`: embeddings or stronger retrieval/reranking if lexical retrieval is insufficient
- `P6.3`: stronger section-aware chunking around course structure
- `P6.4`: decide whether old-PDF backfill is worth it
- `P6.5`: implement old-PDF backfill only if approved
