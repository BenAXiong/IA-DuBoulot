# Student Memory Profile V1

Related: [README](../README.md) | [Student dashboard V1](student_dashboard_v1.md) | [Student history and summary V1](student_history_summary_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [Service interfaces](service_interfaces.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document records the first durable student-memory slice delivered in `A6.1`.

It exists so later sessions do not have to reconstruct:

- how memory is generated
- who can read or edit raw memory
- which categories are allowed
- where sensitive or speculative profiling is blocked

## Scope

This V1 covers `A6.1.1` to `A6.1.4`:

- generate structured learning-relevant memory during conversation completion
- store durable strengths, weaknesses, preferences, and recurring topics
- let the student or linked parent correct and delete memory items
- keep sensitive, diagnostic, or speculative profiling out of storage

## Canonical Surfaces And Routes

Pages:

- `/app` for the student memory panel
- `/app/students/[studentUserId]` for the linked-parent memory panel

API:

- `GET /api/students/[studentId]/memory`
- `PATCH /api/students/[studentId]/memory`

Trigger path:

- `POST /api/conversations/[conversationId]/complete` refreshes generated memory best-effort after the student summary flow

## Source Files

- Route: `app/api/students/[studentId]/memory/route.ts`
- Service: `lib/server/memory/service.ts`
- Types: `lib/server/memory/types.ts`
- Prompt: `lib/server/ai/prompts/memory-profile.ts`
- Provider boundary: `lib/server/ai/types.ts` and `lib/server/ai/gemini-provider.ts`
- Student surface: `components/dashboard/student-dashboard.tsx`
- Shared panel: `components/dashboard/memory/memory-panel.tsx`
- Parent surface: `components/dashboard/oversight/parent-student-detail.tsx`
- Completion integration: `lib/server/conversations/conversation-service.ts`
- Verification: `scripts/smoke-memory-profile.mjs`

## Data Contract

The memory surface reads one `StudentMemorySnapshot`:

- `viewerRole`
- `canEdit`
- profile summaries for strengths, weaknesses, and preferences
- active memory items
- items grouped by category for rendering

Current categories:

- `strength`
- `weakness`
- `preference`
- `topic`
- `learning_note`

Current mutation rule:

- manual create or edit only allows `strength`, `weakness`, `preference`, and `topic`
- `learning_note` stays reserved for generated or internal future use

Current storage limits:

- generated refresh writes at most `6` deduped items per completion
- each student keeps at most `24` active items
- generated items currently expire after `180` days unless refreshed again

## Generation Rules

- generation source is the completed conversation, workspace, transcript, attachments, and stored summaries
- the provider path uses the `memory-profile-v1` prompt contract
- provider usage is recorded through the shared usage service
- if Gemini fails, a deterministic fallback still derives pedagogical items from the subject, weakness tags, and explicit language preference
- the deterministic fallback copy now preserves accented French while still deriving the learner-facing help-language preference from `ai_help_language`
- generated items are deduped by normalized `category + title`
- memory refresh never blocks conversation completion

## Visibility And Editing Rules

- the student can read, edit, and delete their own raw memory
- a linked parent can read, edit, and delete the linked child's raw memory
- an admin can read and edit any student's raw memory
- tutor raw-memory access is denied with `404`
- parent and admin reads emit audit rows through the memory service
- conversation transcripts, summaries, and raw uploads remain separate from memory; the panel only handles durable pedagogical items

## Safety Rules

- the prompt forbids diagnoses, health labels, psychology labels, behavioral judgments, family context, religion, politics, sexuality, ethnicity, nationality, finances, and other sensitive or speculative profiling
- manual mutations and provider-generated items both pass server-side sanitization before persistence
- global labels such as `lazy`, `genius`, or `anxious` are explicitly rejected
- the UI copy keeps the memory panel framed as educational context only
- memory mutation validation, not-found, no-access, active-limit, and service-failure messages now resolve from the viewer language instead of hardcoded French strings

## Verification

Current regression coverage:

- `npm run smoke:memory`
- `npm run smoke:student-flow`
- `npm run smoke:adult-oversight`

Latest local result on 2026-03-12:

- the memory smoke passed across student dashboard rendering, completion-triggered refresh, manual create/update/delete, parent linked-student rendering, and tutor raw-memory denial
- the latest pass also exercised the deterministic memory fallback after a provider failure, while still persisting a safe refreshed snapshot and the localized memory-mutation path
