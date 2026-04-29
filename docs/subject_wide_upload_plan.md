# Subject-Wide Upload Plan

Related: [README](../README.md) | [Pilot_todo](pilot_todo.md) | [Storage and attachment rules](storage_attachment_rules.md) | [Student workbench V1](student_workbench_v1.md) | [AI ops and economics V1](ai_ops_economics_v1.md) | [Supabase schema V1](supabase_schema_v1.md)

## Purpose

`P2.7` moves long-lived course PDFs and notes out of the per-chat attachment-only model. The product should let a student upload a resource once for a subject, reuse the extracted text across conversations, and later retrieve only relevant chunks instead of resending a whole document to the coach.

## Target Direction

- Add a subject resource layer keyed by `student_user_id + subject_tag`, separate from conversation attachments.
- Upload to private storage, extract once, and store reusable full text plus metadata: filename, MIME, byte size, page count, status, source attachment, source storage path, hash, summary, and outline.
- Link resources into conversations through explicit `conversation_resource_links` so a learner can later toggle which subject resources are active in a chat.
- Split resources into stable chunks after extraction, starting with page-aware boundaries and then using headings or sections when detectable.
- Use lexical retrieval for v1: rank selected chunks against the current learner message, include compact summaries and top chunks with page/section refs, and keep embeddings for a later slice.
- Never send long-lived PDFs wholesale on every message.
- Test the late-page-marker case so a PDF can be proven retrievable beyond the first pages.

## Product Decisions And Gates

Current decisions:

- Shorthand: use `subject docs` in planning conversation, `subject resources` in code/docs where it maps to the existing schema, and learner-facing copy such as `Sources` or `Ressources` in UI.
- Subject docs are distinct from chat-only uploads. Chat-only upload tools must stay chat-only.
- Subject docs must have a dedicated upload UI outside the chat textarea/upload controls.
- Do not silently promote chat attachments into subject resources during the Pilot.
- Subject-doc upload should support at least PDF, TXT, MD, JSON, DOC, and DOCX when the extraction path supports them safely.
- The learner-facing library and per-conversation toggles can be batched: the subject page and the live chat should both expose relevant subject docs, with chat-level selected/unselected state.
- Older subject docs should be visible but not auto-selected for a new conversation unless the learner chooses them.
- A subject doc uploaded from a subject/chat resource context can be selected for that current context, but that is different from promoting a chat-only attachment.
- Outlines and summaries are separate. If a structure outline is unavailable or poor, the UI should omit the outline or say structure is unavailable; it should not turn the outline into a summary.
- Do not reprocess old PDFs solely to improve outlines during the current Pilot slice.

Ask before implementing if a future change would:

- merge chat-only attachments with subject docs
- change whether uploads become long-lived by default
- change old-resource auto-selection defaults
- change unlink/delete/purge semantics
- widen parent/tutor visibility beyond conversation-linked resources
- introduce a new surface for subject docs that was not already specified

## Task Breakdown

`P2.7` is now an umbrella task in [Pilot_todo](pilot_todo.md), split into smaller subject-wide upload subtasks:

- `P2.7.1` plan and architecture documentation
- `P2.7.2` durable resource storage, conversation links, promotion, and hash reuse
- `P2.7.3` deterministic chunk storage
- `P2.7.4` retrieval v1 into coach context
- `P2.7.5` first late-page retrieval regression guard
- `P2.7.6` hosted migration and RLS verification (complete)
- `P2.7.7` learner-facing subject resource library UI
- `P2.7.8` per-conversation resource toggles
- `P2.7.9` upload entry points and chat-only versus subject-saved semantics
- `P2.7.10` better PDF preview and section outline formatting
- `P2.7.11` resource lifecycle, deletion, purge, and adult/tutor visibility
- `P2.7.12` broader retrieval evaluation, observability, and token-impact measurement

## Slice 1

This first implementation slice is intentionally smaller than the final feature:

- create the durable subject resource and conversation-link schema
- promote successful PDF attachment extraction into a subject resource
- reuse an existing same-student, same-subject, same-hash ready resource before making another provider extraction call
- automatically link the resource to the conversation that introduced or reused it
- keep the existing attachment UI and coach prompt behavior unchanged

## Slice 2

The second slice adds durable chunk storage without changing coach prompt behavior yet:

- create `subject_resource_chunks` as a child table of `subject_resources`
- create deterministic chunks after successful PDF extraction or same-hash reuse
- prefer explicit page markers when present, otherwise use page-count estimates or document-length splits
- store chunk index, stable chunk ID, page range, optional section title, character count, token estimate, extraction confidence, and chunker metadata
- keep retrieval, learner toggles, and coach-context injection deferred

## Slice 3

The third slice adds retrieval v1 while keeping the learner library UI deferred:

- read only resources selected through `conversation_resource_links`
- lexically rank stored chunks against the current learner message
- include only a bounded set of top chunk excerpts in the coach prompt, with filename and page or section references
- backfill chunks for selected ready resources if they were promoted before chunk rows existed
- log chunk retrieval counts and selected chunk IDs for troubleshooting
- fail open if retrieval cannot run, so a missing retrieval context does not block the live homework chat

## Slice 4

The fourth slice adds a small regression fixture for the original late-page failure class:

- add `late_page_marker_circuit_fr` to the sample attachment corpus as an extracted-text retrieval fixture
- add `npm run verify:subject-resource-retrieval`
- assert that a query about `court-circuit` ranks page 6 or later above front-loaded PDF content

## Deferred

- stronger section-aware chunking and formatting improvements
- broader retrieval evaluation beyond the first late-page fixture
- old-PDF backfill and weak-outline cleanup
- embeddings
- provider or local page-aware extraction fallback

## Slice 5

The fifth slice adds the first learner-facing resource controls:

- list subject resources on the subject page and inside the live chat side rail
- add per-conversation selected/unselected toggles backed by `conversation_resource_links.selected`
- add a dedicated subject-resource upload entry point outside the chat attachment controls
- support PDF, TXT, MD, JSON, DOC, and DOCX subject-resource uploads through the subject-resource path
- keep chat-only attachments separate; no chat-to-subject promotion UI is implemented in this Pilot slice
- keep the richer below-composer tab layout for History, Resources, and Instructions as a remaining `P2.7.9` UI refinement

## Pitfalls To Guard

- Extraction complete and coach-visible context are separate states.
- Conversation attachment deletion must not silently imply subject-resource deletion once resources become user-visible.
- Resource deletion must eventually purge raw text, chunks, links, and any private storage object owned by the resource.
- Uploaded text is untrusted source material, not prompt instructions.
- Adult and tutor visibility should be explicit: linked resources can be visible for review, but the full subject library should remain student/admin controlled until a later product decision.
