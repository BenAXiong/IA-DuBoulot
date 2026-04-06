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
- Upload service: `lib/server/uploads/service.ts`
- Student flow localization copy: `lib/i18n/student-flow-copy.ts`
- Gemini provider: `lib/server/ai/gemini-provider.ts`
- Moderation service: `lib/server/moderation/service.ts`
- Conversation types: `lib/server/conversations/types.ts`

## Current Behavior

When the student opens `/app/conversations/[conversationId]`, the app now:

1. loads the persisted conversation, messages, and workspace state
2. loads the persisted attachments and visible summaries
3. renders the transcript as a real thread instead of a static detail card, and now keeps it closer to a minimal chat surface by removing the old role or timestamp line above every learner-visible turn
4. lets the student send a freeform message, ask for a hint, or request a summary
5. sends message turns through the Gemini-backed coach flow plus moderation checks before persisting assistant output, and now falls back to a learner-facing retry reply if the provider call fails instead of leaking the older internal draft-coach text
6. still keeps the persisted workspace fields and save route under the hood, but no longer foregrounds the old workspace panel in the learner UI
7. uploads attachments through signed upload targets, confirms them, keeps the current file list in a minimal right-side rail, and now accepts pasted clipboard images in both the homework quick-start and the live conversation composer
8. lets the student remove an uploaded file directly from that rail, with a confirmation step before the server-owned delete, and now opens uploaded images in an overlay preview when their file pill is clicked
9. keeps the right rail pinned under the student header as a true split pane instead of letting it stretch alongside the full transcript length
10. renders only one explicit completion control at the bottom of the right rail, keeping completion available without the older session-summary card dominating the active chat
11. localizes the workbench shell, composer, and side rail through `lib/i18n/student-flow-copy.ts`

## Interaction Rules

- message appends stay server-owned through `POST /api/conversations/[conversationId]/messages`
- workspace saves stay server-owned through `PATCH /api/conversations/[conversationId]/workspace`
- attachment upload/confirm/extract stays server-owned through `/api/uploads/...`, private attachment access stays behind `/api/attachments/[attachmentId]/access`, and attachment removal now stays server-owned through `DELETE /api/attachments/[attachmentId]`
- image preview in the right rail reuses the same server-owned private attachment access route, so learner-visible previews still stay behind the signed attachment boundary
- only the student owner or an admin can mutate the conversation state
- moderation outcomes are recorded before blocked or flagged content leaves the server boundary
- the student-facing shell now assumes the conversation already exists before the live workbench opens; the newer subject quick-start creates that shell and first turn before routing here

## Important Boundaries

- the current local workbench is already on the real provider/upload path, and a fixture-backed end-to-end smoke now passes locally, but the latest run still exercised provider fallbacks
- moderation is currently local-rule based, not yet provider-assisted or admin-tunable
- once the session is marked complete, the workbench becomes read-only for student writes
- adult review surfaces now live separately under [Oversight surfaces V1](oversight_surfaces_v1.md); the student workbench remains a student-only mutation surface
- the core student workbench path now localizes its server-side validation messages, upload warnings, moderation-safe fallback reply, and learner-facing provider-retry fallback through `lib/i18n/student-flow-copy.ts`; the remaining language risk near this surface is now mostly the broader accented-French or Unicode audit and any residual generic provider or service fallback strings
- this redesign still keeps explicit completion as the current backend contract; it does not yet auto-generate summaries on an implicit chat-close event
- the workbench still uses the persisted workspace fields under the hood, even though the learner no longer sees that workspace as a full separate product surface
- attachment removal currently deletes the file record plus private storage object, but it does not yet scrub extracted text that may already have been copied into the hidden workspace

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
