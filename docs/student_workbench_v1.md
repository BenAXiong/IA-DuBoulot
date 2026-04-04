# Student Workbench V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student session persistence V1](student_session_persistence_v1.md) | [Student history and summary V1](student_history_summary_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Storage and attachment rules](storage_attachment_rules.md)

## Purpose

Describe the first real student session workbench so future sessions can extend the coaching flow without guessing which parts are already persisted, interactive, or still placeholder.

## Scope

This document covers `A3.4.1` to `A3.4.4`:

- real transcript rendering on `/app/conversations/[conversationId]`
- chat-first layout with a secondary sources/notes rail
- workspace editing and saving during the session
- hint, summarize, and attachment controls
- iPad-width layout validation for the conversation workbench

## Source Files

- Conversation page: `app/app/conversations/[conversationId]/page.tsx`
- Message route: `app/api/conversations/[conversationId]/messages/route.ts`
- Workspace route: `app/api/conversations/[conversationId]/workspace/route.ts`
- Workbench UI: `components/dashboard/student/student-conversation-workbench.tsx`
- Thread UI: `components/dashboard/student/student-chat-thread.tsx`
- Composer UI: `components/dashboard/student/student-conversation-composer.tsx`
- Attachment UI: `components/dashboard/student/student-attachment-list.tsx`
- Workspace UI: `components/dashboard/student/student-workspace-panel.tsx`
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
3. renders the transcript as a real thread instead of a static detail card, and now flattens it into a chat-first conversation surface rather than one bordered message card per turn
4. lets the student send a freeform message, ask for a hint, or request a summary
5. sends message turns through the Gemini-backed coach flow plus moderation checks before persisting assistant output, and falls back to the older deterministic draft coach if the provider call fails
6. saves workspace edits through a dedicated server route, but now demotes most of that workspace to a secondary notes rail instead of a primary split-screen panel
7. uploads attachments through signed upload targets, confirms them, shows their extraction state, lets the student retry failed extraction, and keeps the file plus warning if extraction fails
8. renders the summary/closure panel that now drives `A3.5`, but with lighter learner-facing wording and a quieter presence in the right rail
9. localizes the workbench shell, composer, attachment list, workspace panel, and completion panel through `lib/i18n/student-flow-copy.ts`

## Interaction Rules

- message appends stay server-owned through `POST /api/conversations/[conversationId]/messages`
- workspace saves stay server-owned through `PATCH /api/conversations/[conversationId]/workspace`
- attachment upload/confirm/extract stays server-owned through `/api/uploads/...` plus private attachment access through `/api/attachments/[attachmentId]/access`
- only the student owner or an admin can mutate the conversation state
- moderation outcomes are recorded before blocked or flagged content leaves the server boundary

## Important Boundaries

- the current local workbench is already on the real provider/upload path, and a fixture-backed end-to-end smoke now passes locally, but the latest run still exercised provider fallbacks
- moderation is currently local-rule based, not yet provider-assisted or admin-tunable
- once the session is marked complete, the workbench becomes read-only for student writes
- adult review surfaces now live separately under [Oversight surfaces V1](oversight_surfaces_v1.md); the student workbench remains a student-only mutation surface
- the core student workbench path now localizes its server-side validation messages, upload warnings, moderation-safe fallback reply, and deterministic coach fallback through `lib/i18n/student-flow-copy.ts`; the remaining language risk near this surface is now mostly the broader accented-French or Unicode audit and any residual generic provider or service fallback strings
- this redesign still keeps explicit completion as the current backend contract; it does not yet auto-generate summaries on an implicit chat-close event
- the workbench still uses the persisted workspace fields under the hood, even though the student now sees them as lighter notes rather than a full separate workspace product

## Validation Record

- Date: `2026-03-11`
- Method: repeatable Playwright tablet-emulation smoke via `scripts/smoke-tablet-emulation.mjs`
- Widths checked: `820x1180` portrait and `1180x820` landscape
- Routes checked: `/app`, `/app/new`, and `/app/conversations/[conversationId]`
- Result: no horizontal overflow detected, no sub-`44x44` controls detected on the checked student surfaces, and the transcript surface plus workspace save control remained reachable at both widths

## Next Extension Points

- [Student history and summary V1](student_history_summary_v1.md): the workbench now feeds explicit completion and multi-audience summary behavior
- improve provider reliability or add a secondary fallback so the workbench does not need the deterministic coach path as often
- tighten upload guardrails and attachment metadata capture to match the storage contract exactly
- decide later whether completion should become optional and whether summaries should auto-generate when the learner simply leaves or closes the chat
