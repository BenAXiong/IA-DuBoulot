# Student Session Persistence V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student intake V1](student_intake_v1.md) | [Student workbench V1](student_workbench_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md)

## Purpose

Describe the current persisted student-session slice so future sessions can extend it without guessing what still uses the older intake-summary bootstrap versus the newer chat-first shell creation path.

## Scope

This document covers `A3.3.1` to `A3.3.3`, plus the later student-shell adjustment that added a lighter subject-level conversation bootstrap:

- create a persisted conversation draft or conversation shell from the student entry flow
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

There are now two student creation paths:

1. the newer subject quick-start on `/app?view=homework&subject=...`, which:
   - creates a bare `conversations` row plus `workspace_states` row through `POST /api/conversations?mode=shell`
   - optionally uploads staged files against that conversation
   - sends the first learner-written message through `POST /api/conversations/[conversationId]/messages`
   - opens `/app/conversations/[conversationId]` only after the first assistant reply is persisted
2. the older `/app/new` fallback, which still:
   - creates a `conversations` row
   - creates a `workspace_states` row
   - creates one initial student message with the intake summary
   - redirects to `/app/conversations/[conversationId]`

The recent-session cards on the dashboard now link back to that persisted route.

## What Is Persisted

- title
- subject tag
- graded-homework flag
- pasted assignment text
- edited extracted text
- the first real student message for the newer quick-start path
- one initial intake-summary message for the older `/app/new` fallback path
- human-readable attachment references in the initial message and workspace notes

## Important Boundary

This document records the original `A3.3` persistence boundary.

The current local workspace has already moved beyond the original boundary into the real upload path, but the older `/app/new` behavior still explains why the initial intake-summary message contract existed in the first place.

At the original `A3.3` exit point:

- there are no `attachments` rows yet for the staged browser files
- there is no storage upload yet
- the session history shows file references as text, not as stored downloadable attachments

The newer shell-first quick-start now avoids showing that intake summary to the learner, but the legacy contract still exists behind `/app/new` until the richer intake path is either redesigned or removed.

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
- decide later whether the older `/app/new` intake-summary bootstrap should be retired completely once the chat-first subject entry covers the remaining richer setup needs
