# Student Workbench V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student session persistence V1](student_session_persistence_v1.md) | [Student history and summary V1](student_history_summary_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Storage and attachment rules](storage_attachment_rules.md)

## Purpose

Describe the first real student session workbench so future sessions can extend the coaching flow without guessing which parts are already persisted, interactive, or still placeholder.

## Scope

This document covers `A3.4.1` to `A3.4.4`:

- real transcript rendering on `/app/conversations/[conversationId]`
- chat-first layout with a secondary sources rail and a lighter completion area
- the still-persisted workspace data that now sits mostly behind the learner-facing UI
- attachment controls inside the live composer
- iPad-width layout validation for the conversation workbench

## Source Files

- Conversation page: `app/app/conversations/[conversationId]/page.tsx`
- Message route: `app/api/conversations/[conversationId]/messages/route.ts`
- Workspace route: `app/api/conversations/[conversationId]/workspace/route.ts`
- Workbench UI: `components/dashboard/student/student-conversation-workbench.tsx`
- Thread UI: `components/dashboard/student/student-chat-thread.tsx`
- Composer UI: `components/dashboard/student/student-conversation-composer.tsx`
- Side rail UI: `components/dashboard/student/student-conversation-side-rail.tsx`
- Hidden workspace UI: `components/dashboard/student/student-workspace-panel.tsx`
- Conversation service: `lib/server/conversations/conversation-service.ts`
- Upload client helper: `lib/uploads/client-upload.ts`
- Pending bootstrap store: `lib/conversations/pending-bootstrap-store.ts`
- Upload service: `lib/server/uploads/service.ts`
- Student flow localization copy: `lib/i18n/student-flow-copy.ts`
- Gemini provider: `lib/server/ai/gemini-provider.ts`
- Moderation service: `lib/server/moderation/service.ts`
- Conversation types: `lib/server/conversations/types.ts`

## Current Behavior

When the student opens `/app/conversations/[conversationId]`, the app now:

1. loads the persisted conversation, messages, and workspace state
2. loads the persisted attachments and visible summaries
3. if the conversation was just created from the subject launcher, the workbench can now consume a client bootstrap payload so the real conversation route itself owns the pending first learner turn, pending banban placeholder, staged upload work, and first-turn send
4. renders the transcript as a real thread instead of a static detail card, and now keeps it closer to a minimal chat surface by removing the old role or timestamp line above every learner-visible turn
5. lets the student send a freeform message, ask for a hint, or request a summary
6. sends message turns through the Gemini-backed coach flow plus moderation checks before persisting assistant output, now falls back to a learner-facing retry reply if the provider call fails instead of leaking the older internal draft-coach text, and on the first successful learner turn now also asks Gemini for a shorter conversation title
7. still keeps the persisted workspace fields and save route under the hood, but no longer foregrounds the old workspace panel in the learner UI
8. uploads attachments through signed upload targets, confirms them, keeps the current file list in a minimal right-side rail, and now accepts pasted clipboard images in both the homework quick-start and the live conversation composer
9. lets the student remove an uploaded file directly from that rail, with a confirmation step before the server-owned delete, now opens uploaded images directly inside the right rail first, and now also retries provider-failed attachment extraction once automatically when the conversation opens
10. keeps the right rail pinned under the student header as a true split pane instead of letting it stretch alongside the full transcript length, and now lets desktop users resize that rail manually
11. adds hover copy controls under each learner-visible turn, keeps those controls aligned to the message body rather than the avatar column, and now shows a lightweight copied toast when a turn is copied
12. renders assistant turns through a markdown-plus-math path, so simple LaTeX like `$v = d/t$` can display as formatted math instead of raw markup, and now also supports GitHub-flavored markdown tables so pipe-table outputs render as real tables instead of raw source text
13. keeps the live composer pinned at the bottom of the conversation view, now shows a chevron jump-to-latest control above it when the transcript is scrolled upward, appends the learner's message optimistically with a lightweight pending banban placeholder so the prompt no longer looks stuck in the textarea during the round trip, no longer renders the provisional conversation title or last-activity chrome inside the live chat body, and now seeds new shell conversations with a neutral per-subject `Subject_###` placeholder until a later AI summary can replace it
14. reuses the same learner avatar style as the profile dock for student turns, so the thread feels like one consistent messaging surface instead of mixing unrelated identity treatments
15. exposes a small reply-mode switch directly in the chat tools, and now keeps only `fast` and `thinking` learner-visible while routing them as real prompt-level coaching variants; `interactive` remains an internal or future-facing mode and is intentionally hidden again until the richer diagram or embedded-tool path exists
16. renders only one explicit completion control at the bottom of the right rail, keeping completion available without the older session-summary card dominating the active chat
17. localizes the workbench shell, composer, the reply-mode switch, and the side rail through `lib/i18n/student-flow-copy.ts`
18. treats uploaded files honestly inside the live coach path: banban only knows the extracted text or workspace context that the server actually provides, and it must not claim to have read image pixels or PDF pages directly when no reliable extracted text is present

## Interaction Rules

- message appends stay server-owned through `POST /api/conversations/[conversationId]/messages`
- workspace saves stay server-owned through `PATCH /api/conversations/[conversationId]/workspace`
- attachment upload/confirm/extract stays server-owned through `/api/uploads/...`, private attachment access stays behind `/api/attachments/[attachmentId]/access`, and attachment removal now stays server-owned through `DELETE /api/attachments/[attachmentId]`
- provider-failed attachment extraction can now be retried through `POST /api/uploads/extract`; the workbench uses that same server-owned path both for its automatic one-time recovery attempt and the manual retry affordance on a failed file pill
- image preview in the right rail reuses the same server-owned private attachment access route, so learner-visible previews still stay behind the signed attachment boundary, and the larger overlay view is now a secondary hover-triggered expansion path instead of the default click behavior
- only the student owner or an admin can mutate the conversation state
- moderation outcomes are recorded before blocked or flagged content leaves the server boundary
- the student-facing shell still assumes the conversation shell already exists before the live workbench opens, but it can now receive a one-time client bootstrap payload from the homework launcher so the workbench itself owns the optimistic first-turn handoff
- reply modes are not separate models; they are prompt-policy variants on the same student coach path, selected per message through the live composer or subject quick-start
- the current learner-visible switch intentionally excludes `interactive`, even though the backend type still preserves that enum for compatibility with older payloads and future restoration

## Important Boundaries

- the current local workbench is already on the real provider/upload path, and a fixture-backed end-to-end smoke now passes locally, but the latest run still exercised provider fallbacks
- the live conversation area intentionally hides the stored conversation title inside the transcript body, but the shared student shell header now listens for conversation-title updates from the workbench and shows the title once it is no longer the neutral `Subject_###` placeholder seed; until then the route stays on the quieter subject-only header treatment
- the live coach reply path does not directly inspect image pixels or PDF page renders; it only receives extracted attachment text plus the persisted conversation or workspace context, so any learner-facing claim about what was "read" from a file must stay grounded in that text context
- moderation is currently local-rule based, not yet provider-assisted or admin-tunable
- once the session is marked complete, the workbench becomes read-only for student writes
- adult review surfaces now live separately under [Oversight surfaces V1](oversight_surfaces_v1.md); the student workbench remains a student-only mutation surface
- the core student workbench path now localizes its server-side validation messages, upload warnings, moderation-safe fallback reply, and learner-facing provider-retry fallback through `lib/i18n/student-flow-copy.ts`; the remaining language risk near this surface is now mostly the broader accented-French or Unicode audit and any residual generic provider or service fallback strings
- this redesign still keeps explicit completion as the current backend contract; it does not yet auto-generate summaries on an implicit chat-close event
- the workbench still uses the persisted workspace fields under the hood, even though the learner no longer sees that workspace as a full separate product surface
- attachment removal currently deletes the file record plus private storage object, but it does not yet scrub extracted text that may already have been copied into the hidden workspace
- only provider-failure extraction states auto-retry; attachments that failed because no safe or usable text was found still stay manual so the app does not mask a genuinely unreadable source behind endless retries
- image preview can still feel slower than a public image gallery because the rail currently fetches the original private file through the authenticated attachment-access route plus signed redirect; there is no dedicated thumbnail generation layer yet
- the first-turn bootstrap path now uses a hybrid client handoff: a fast in-memory payload still carries staged `File` objects during a normal same-tab route transition, while a session-scoped serializable shadow preserves the first prompt and reply mode so the conversation no longer opens as a blank shell if client module state is reset during navigation; staged file blobs still depend on the in-memory handoff and are not yet recoverable from the serializable shadow alone

## Validation Record

- Date: `2026-03-11`
- Method: repeatable Playwright tablet-emulation smoke via `scripts/smoke-tablet-emulation.mjs`
- Widths checked: `820x1180` portrait and `1180x820` landscape
- Routes checked: `/app`, the subject-level homework launcher on `/app?view=homework&subject=...`, and `/app/conversations/[conversationId]`
- Result: no horizontal overflow detected, no sub-`44x44` controls detected on the checked student surfaces, and the transcript surface plus workspace save control remained reachable at both widths

## Next Extension Points

- [Student history and summary V1](student_history_summary_v1.md): the workbench now feeds explicit completion and multi-audience summary behavior
- improve provider reliability so the workbench hits the learner-facing retry fallback less often
- tighten upload guardrails and attachment metadata capture to match the storage contract exactly
- decide later whether completion should become optional and whether summaries should auto-generate when the learner simply leaves or closes the chat
