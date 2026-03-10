# Student Workbench V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student session persistence V1](student_session_persistence_v1.md) | [Student history and summary V1](student_history_summary_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Storage and attachment rules](storage_attachment_rules.md)

## Purpose

Describe the first real student session workbench so future sessions can extend the coaching flow without guessing which parts are already persisted, interactive, or still placeholder.

## Scope

This document covers `A3.4.1` to `A3.4.4`:

- real transcript rendering on `/app/conversations/[conversationId]`
- workspace editing and saving during the session
- hint, summarize, and upload-reference controls
- iPad-width layout validation for the conversation workbench

## Source Files

- Conversation page: `app/app/conversations/[conversationId]/page.tsx`
- Message route: `app/api/conversations/[conversationId]/messages/route.ts`
- Workspace route: `app/api/conversations/[conversationId]/workspace/route.ts`
- Workbench UI: `components/dashboard/student/student-conversation-workbench.tsx`
- Thread UI: `components/dashboard/student/student-chat-thread.tsx`
- Composer UI: `components/dashboard/student/student-conversation-composer.tsx`
- Workspace UI: `components/dashboard/student/student-workspace-panel.tsx`
- Conversation service: `lib/server/conversations/conversation-service.ts`
- Deterministic reply helper: `lib/server/conversations/draft-coach.ts`
- Conversation types: `lib/server/conversations/types.ts`

## Current Behavior

When the student opens `/app/conversations/[conversationId]`, the app now:

1. loads the persisted conversation, messages, and workspace state
2. renders the transcript as a real thread instead of a static detail card
3. lets the student send a freeform message, ask for a hint, or request a summary
4. saves workspace edits through a dedicated server route
5. keeps validated upload references as text in workspace notes until real attachments exist
6. renders the summary/closure panel that now drives `A3.5`

## Interaction Rules

- message appends stay server-owned through `POST /api/conversations/[conversationId]/messages`
- workspace saves stay server-owned through `PATCH /api/conversations/[conversationId]/workspace`
- only the student owner or an admin can mutate the conversation state
- the current assistant behavior is deterministic and non-provider-backed on purpose

## Important Boundaries

- the current hint and summarize actions are not real AI calls yet
- the upload control does not create `attachments` rows or store binary files
- selected files are validated with the same intake constraints, then written as human-readable references into `workspace_states.student_notes`
- once the session is marked complete, the workbench becomes read-only for student writes
- true attachment upload, extraction, and provider-backed coaching still belong to later phases

## Validation Record

- Date: `2026-03-11`
- Method: Playwright emulated tablet pass
- Widths checked: `820x1180` portrait and `1180x820` landscape
- Routes checked: `/app` and `/app/conversations/[conversationId]`
- Result: no horizontal overflow detected; the transcript surface and workspace save control remained reachable at both widths

## Next Extension Points

- [Student history and summary V1](student_history_summary_v1.md): the workbench now feeds explicit completion and summary behavior
- upload routes: replace text-only file references with real `attachments` rows and private storage objects
- `A4.1` to `A4.4`: replace the deterministic draft coach with the real provider, prompts, extraction, and moderation stack
