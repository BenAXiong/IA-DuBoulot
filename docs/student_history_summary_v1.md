# Student History And Summary V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student dashboard V1](student_dashboard_v1.md) | [Student workbench V1](student_workbench_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md)

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
- Summary service: `lib/server/summaries/service.ts`
- Translation service: `lib/server/translations/service.ts`
- Gemini provider: `lib/server/ai/gemini-provider.ts`
- Conversation types: `lib/server/conversations/types.ts`

## Current Behavior

The student flow now has three session surfaces:

1. `/app` for recent-session shortcuts
2. `/app/history` for the long-form history list
3. `/app/conversations/[conversationId]` for the detailed transcript, workspace, and final summary

When the student marks a session complete, the app now:

1. updates `conversations.status` to `completed`
2. stamps `completed_at`
3. generates a required student summary, with a deterministic fallback if the provider call fails
4. attempts provider-backed parent and tutor summaries plus translated parent variants for `en` and `zh`, but treats those adult artifacts as best-effort during the student completion path
5. turns the session read-only for student message/workspace writes

## Important Boundaries

- the summary path is now provider-backed in the current local workspace, but the required student artifact has a deterministic fallback and adult artifacts are best-effort
- parent and tutor summary data now feeds the dedicated adult review surfaces documented in [Oversight surfaces V1](oversight_surfaces_v1.md)
- completed sessions stay readable, but the student must start a new session to keep working

## Why The Completion Contract Still Matters

`A3.5` is still about product closure and persistence first.

The newer provider-backed path keeps the same product contract stable:

- there is a canonical completion route
- `session_summaries` remains an active table with audience segregation
- the detail page knows where to render the persisted student summary
- later adult surfaces can consume the already-persisted parent and tutor summary rows

## Smoke Record

- Date: `2026-03-11`
- Method: targeted fixture-backed local server smoke using `scripts/smoke-student-flow.mjs`
- Checked:
  - `/api/conversations` creates a fresh student draft
  - the flow reaches upload, workspace save, chat, and completion through the real API routes
  - `POST /api/conversations/[conversationId]/complete` returns only the student-visible summary audience
  - the completed session rejects new student turns
  - stored summaries retain the required student variant and report any missing adult variants as warnings
- Result: the local smoke now passes, but the latest run exercised the deterministic student-summary fallback and skipped adult variants after provider failures
- Cleanup: the smoke script removes the temporary conversation, attachments, audit rows, and uploaded object before exit

## Next Extension Points

- improve provider reliability or a second provider path so adult variants are present more consistently
- extend the completion verification pass so parent/tutor variants can be retried or repaired explicitly once those surfaces are live
