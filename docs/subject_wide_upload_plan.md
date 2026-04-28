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

## Deferred

- learner-facing subject resource library and per-chat toggles
- stronger section-aware chunking and formatting improvements
- stronger retrieval evaluation and late-page-marker fixture tests
- old-PDF backfill and weak-outline cleanup
- embeddings
- provider or local page-aware extraction fallback

## Pitfalls To Guard

- Extraction complete and coach-visible context are separate states.
- Conversation attachment deletion must not silently imply subject-resource deletion once resources become user-visible.
- Resource deletion must eventually purge raw text, chunks, links, and any private storage object owned by the resource.
- Uploaded text is untrusted source material, not prompt instructions.
- Adult and tutor visibility should be explicit: linked resources can be visible for review, but the full subject library should remain student/admin controlled until a later product decision.
