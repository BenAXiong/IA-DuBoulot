# Student History And Summary V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student dashboard V1](student_dashboard_v1.md) | [Student workbench V1](student_workbench_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md)

## Purpose

Describe the first student history and closure slice so future sessions can extend summaries, adult views, and AI generation without rebuilding the session-end contract from scratch.

## Scope

This document covers `A3.5.1` to `A3.5.3`:

- full student history list at `/app/history`
- summary-aware session detail on `/app/conversations/[conversationId]`
- explicit session completion that persists a student summary

## Source Files

- History page: `app/app/history/page.tsx`
- History list UI: `components/dashboard/student/student-session-history-list.tsx`
- Conversation page: `app/app/conversations/[conversationId]/page.tsx`
- Summary panel UI: `components/dashboard/student/student-session-summary-panel.tsx`
- Complete route: `app/api/conversations/[conversationId]/complete/route.ts`
- Conversation service: `lib/server/conversations/conversation-service.ts`
- Deterministic summary helper: `lib/server/conversations/draft-summary.ts`
- Conversation types: `lib/server/conversations/types.ts`

## Current Behavior

The student flow now has three session surfaces:

1. `/app` for recent-session shortcuts
2. `/app/history` for the long-form history list
3. `/app/conversations/[conversationId]` for the detailed transcript, workspace, and final summary

When the student marks a session complete, the app now:

1. updates `conversations.status` to `completed`
2. stamps `completed_at`
3. upserts one `session_summaries` row for audience `student`
4. turns the session read-only for student message/workspace writes

## Important Boundaries

- the completion summary is deterministic, not provider-backed
- only the student summary is generated in this slice
- parent and tutor summary generation still belong to `A4.5`
- completed sessions stay readable, but the student must start a new session to keep working

## Why Deterministic Summary Generation Is Acceptable Here

`A3.5` is about product closure and persistence, not final AI quality.

The deterministic summary keeps these contracts stable now:

- there is a canonical completion route
- `session_summaries` becomes a real active table
- the detail page knows where to render the persisted summary
- later provider-backed generation can replace the helper without redesigning the student UI

## Smoke Record

- Date: `2026-03-11`
- Method: targeted local server smoke using the seeded student fixture session
- Checked:
  - `/app/history` renders the fixture conversation
  - `POST /api/conversations/[conversationId]/complete` returns `ok: true`
  - the session switches to `completed`
  - the detail page renders the student summary panel afterward
- Cleanup: the hosted fixture set was reseeded after the smoke pass

## Next Extension Points

- `A4.1` to `A4.4`: replace deterministic completion summaries with the provider, prompt, extraction, and moderation stack
- `A4.5`: generate parent and tutor audiences
- upload routes: connect true `attachments` rows so completed summaries can reference real files instead of text-only notes
