# Student Session Persistence V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student intake V1](student_intake_v1.md) | [Student workbench V1](student_workbench_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md)

## Purpose

Describe the first persisted student-session slice so future sessions can extend it without guessing what already moved from local UI state into Supabase.

## Scope

This document covers `A3.3.1` to `A3.3.3`:

- create a persisted conversation draft from the intake form
- support return-to-session behavior
- carry attachment references into the session history

## Source Files

- Create/list route: `app/api/conversations/route.ts`
- Detail route: `app/api/conversations/[conversationId]/route.ts`
- Student detail page: `app/app/conversations/[conversationId]/page.tsx`
- Current workbench UI: `components/dashboard/student/student-conversation-workbench.tsx`
- Conversation service: `lib/server/conversations/conversation-service.ts`
- Conversation types: `lib/server/conversations/types.ts`

## Current Behavior

When the student validates `/app/new`, the app now:

1. creates a `conversations` row
2. creates a `workspace_states` row
3. creates one initial student message with the intake summary
4. redirects to `/app/conversations/[conversationId]`

The recent-session cards on the dashboard now link back to that persisted route.

## What Is Persisted

- title
- subject tag
- graded-homework flag
- pasted assignment text
- edited extracted text
- one initial message with the intake summary
- human-readable attachment references in the initial message and workspace notes

## Important Boundary

Attachment references are persisted, but binary uploads are not yet.

That means:

- there are no `attachments` rows yet for the staged browser files
- there is no storage upload yet
- the session history shows file references as text, not as stored downloadable attachments

This is intentional. True upload persistence still belongs to the upload/extraction path.

## Why A3.3.3 Is Still Valid

The task is "support attachment references inside the session history".

V1 satisfies that by carrying the file-reference list into:

- the first persisted student message
- `workspace_states.student_notes`

This gives the history enough context to reopen the session without pretending that upload storage already exists.

## Next Extension Points

- [Student workbench V1](student_workbench_v1.md): extend the persisted session into a real chat/workspace interaction loop
- upload routes: replace text-only attachment references with real `attachments` rows and storage objects
- `A4.3`: bind the workspace review text to a real extraction pipeline instead of a placeholder/manual seed
