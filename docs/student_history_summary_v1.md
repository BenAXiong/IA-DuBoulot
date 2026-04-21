# Student History And Summary V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student dashboard V1](student_dashboard_v1.md) | [Student workbench V1](student_workbench_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md)

## Purpose

Describe the first student history and closure slice so future sessions can extend summaries, adult views, and AI generation without rebuilding the session-end contract from scratch.

## Scope

This document covers `A3.5.1` to `A3.5.3`:

- summary-aware recent-session shortcuts on `/app`
- summary-aware session detail on `/app/conversations/[conversationId]`
- explicit session completion that persists a student summary

## Source Files

- Compatibility redirect: `app/app/history/page.tsx`
- Conversation page: `app/app/conversations/[conversationId]/page.tsx`
- Summary panel UI: `components/dashboard/student/student-session-summary-panel.tsx`
- Student flow localization copy: `lib/i18n/student-flow-copy.ts`
- Complete route: `app/api/conversations/[conversationId]/complete/route.ts`
- Conversation service: `lib/server/conversations/conversation-service.ts`
- Summary service: `lib/server/summaries/service.ts`
- Translation service: `lib/server/translations/service.ts`
- Gemini provider: `lib/server/ai/gemini-provider.ts`
- Conversation types: `lib/server/conversations/types.ts`

## Current Behavior

The student flow now has two active session surfaces plus one compatibility redirect:

1. `/app` for recent-session shortcuts
2. `/app/conversations/[conversationId]` for the detailed transcript, workspace, and final summary
3. `/app/history` only as a compatibility redirect back into the homework surface

The student completion or summary panel now also localizes its route copy through `lib/i18n/student-flow-copy.ts`, while the persisted summary artifacts continue to come from the provider-backed summary pipeline. The live student workbench now also consumes the returned student summary immediately after completion and shows it inside the right-rail `Summary` section instead of waiting for a later page reload.

When the student marks a session complete, the app now:

1. updates `conversations.status` to `completed`
2. stamps `completed_at`
3. generates a required student summary, with a deterministic fallback if the provider call fails
4. attempts provider-backed parent and tutor summaries plus translated parent variants for `en` and `zh`, but treats those adult artifacts as best-effort during the student completion path
5. turns the session read-only for student message/workspace writes
6. reuses the persisted student summary on repeated completion calls instead of regenerating summaries or refreshing memory again

The deterministic student-summary fallback now localizes from the student's `ai_help_language`, and the student plus tutor summary surfaces map the stored weakness-tag codes back to human labels before rendering them.

## Important Boundaries

- the summary path is now provider-backed in the current local workspace, but the required student artifact has a localized deterministic fallback and adult artifacts are best-effort
- parent and tutor summary data now feeds the dedicated adult review surfaces documented in [Oversight surfaces V1](oversight_surfaces_v1.md)
- completed sessions stay readable, but the student must start a new session to keep working
- repeated completion of an already-completed session should be a cheap read of the stored student artifact, not a second expensive generation pass

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
  - repeated upload confirmation and repeated completion reuse the existing expensive artifacts
  - `POST /api/conversations/[conversationId]/complete` returns only the student-visible summary audience
  - the completed session rejects new student turns
  - stored summaries retain the required student variant and report any missing adult variants as warnings
- Result: the local smoke now passes, with repeated completion staying idempotent; the latest run may still exercise deterministic student-summary fallback and skip adult variants after provider failures
- Cleanup: the smoke script removes the temporary conversation, attachments, audit rows, and uploaded object before exit

## Next Extension Points

- improve provider reliability or a second provider path so adult variants are present more consistently
- extend the completion verification pass so parent/tutor variants can be retried or repaired explicitly once those surfaces are live
