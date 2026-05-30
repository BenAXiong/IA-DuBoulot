# Pilot Structural Audit And Refactor Discipline

Related: [Pilot_todo](../pilot_todo.md) | [README](../../README.md) | [AGENTS](../../AGENTS.md) | [MVP to-do list](../mvp_todo.md) | [Decision log](../decision_log.md) | [Work sessions log](../work_sessions.md)

## Purpose

Structural hotspot evidence, bounded refactor planning, and prompt-governance notes.

This file holds long-form evidence and historical status notes. Keep the canonical task IDs and checkboxes in [Pilot_todo](../pilot_todo.md).

## Task IDs

- P5.1 - Run a targeted structural audit on MVP-era files that grew during delivery, and log concrete mixed-responsibility or dead-code hotspots with evidence.
- P5.2 - Turn structural-audit findings into bounded refactor slices, dead-code cleanup, or reopened MVP bugs instead of one sweeping rewrite.
- P5.3 - Add a prompt-governance layer so AI prompt builders, routes, versions, and modification history stay reviewable and synchronized instead of drifting across code and docs.

## Evidence And Status Notes

Status note: the first `P5.1` hotspot audit flags six areas as the highest-value refactor targets. `lib/server/conversations/conversation-service.ts` currently mixes request parsing, validation, auth, persistence, moderation, AI orchestration, usage tracking, and completion side effects in one module. `lib/server/links/invitation-service.ts` mixes parsing, token lifecycle, invitation creation, acceptance flows, link activation, and route-href derivation in one file. `lib/server/memory/service.ts` combines sensitive-text policy, fallback generation, parsing, loading, mutation handling, and completion-triggered refresh logic. The shared copy layer is now split by domain but still concentrated into very large dictionaries in `lib/i18n/ui-copy.ts`, `lib/i18n/student-flow-copy.ts`, and `lib/i18n/dashboard-copy.ts`, which makes copy iteration and review harder than it should be. `components/dashboard/student/student-conversation-workbench.tsx` still owns too much client state plus fetch and mutation orchestration for the student session surface. The smoke suite also duplicates server-bootstrap, cookie-jar, and authenticated-request harness code across `scripts/smoke-*.mjs`, so test maintenance will keep getting more expensive unless that harness is extracted.
Status note: `P5.3` now has a first foundation. The current prompt families are inventoried in `docs/ai_prompt_registry_v1.md`, generated from `lib/server/ai/prompt-registry.json` plus live version constants in `lib/server/ai/prompts/shared.ts`, and synced by `scripts/sync-prompt-registry.mjs`. `P5.3` remains open because this still needs stronger enforcement and later coverage if the prompt surface expands beyond the current seven families.
Status note: summary iteration now also uses the existing completion route as the single regeneration surface in development. A non-production-only summary-regenerate control can explicitly bypass stored-summary reuse for testing, instead of introducing a second summary-specific endpoint that would be harder to govern.
