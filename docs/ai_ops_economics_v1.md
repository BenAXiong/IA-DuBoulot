# AI Ops And Economics V1

Related: [README](../README.md) | [AI prompt registry V1](ai_prompt_registry_v1.md) | [Service interfaces](service_interfaces.md) | [Student workbench V1](student_workbench_v1.md) | [Student history and summary V1](student_history_summary_v1.md) | [Student memory profile V1](student_memory_profile_v1.md) | [Storage and attachment rules](storage_attachment_rules.md) | [Environment matrix](environment_matrix.md) | [Launch checklist V1](launch_checklist_v1.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document is the consolidated operating note for AI quota windows, prompt flow, guardrails, usage accounting, rough cost estimation, and the current paid-vs-trial recommendation for parent-facing AI value.

It is intentionally explicit about the difference between:

- what is already implemented in code
- what is only a policy recommendation for future product changes

## Current Provider And Pricing Baseline

- provider: `Gemini`
- current model for coaching, extraction, summaries, memory, and translation: `gemini-2.5-flash`
- current token pricing snapshot in code:
  - input: `$0.30 / 1M tokens`
  - output: `$2.50 / 1M tokens`
- pricing source of truth in code: `lib/server/ai/config.ts`

These prices are implementation constants, not a legal or billing guarantee. Re-check the provider docs before relying on them for real margin planning.

## Gemini Provider Limit Model

Official references:

- rate limits: <https://ai.google.dev/gemini-api/docs/rate-limits>
- troubleshooting: <https://ai.google.dev/gemini-api/docs/troubleshooting>
- context caching: <https://ai.google.dev/gemini-api/docs/caching>
- batch API: <https://ai.google.dev/gemini-api/docs/batch-api>

Key provider facts to plan around:

- Gemini limits are enforced per Google project, not per API key. Rotating keys inside the same project will not bypass a saturated free-tier RPM or RPD window.
- The free tier exposes both per-minute and per-day limits by model. In practice, the common `429 RESOURCE_EXHAUSTED` class can mean either the RPM window or the daily request window was reached.
- Google documents the daily window as resetting at midnight Pacific time.
- Linking billing raises available limits, but the exact ceilings remain model and tier specific, so re-check the official table before deciding pilot capacity.

Current repo implication:

- treat the current free-tier Gemini setup as a development-only path
- do not reuse the same Google project for both local iteration and the first real pilot
- before live pilot traffic, provision a dedicated billed Gemini project and mirror that project's key into Vercel plus the local production-like env
- the runtime should log enough provider failure detail to distinguish a project-level `429` or `RESOURCE_EXHAUSTED` limit from a generic upstream provider failure when learner chat falls back to the retry message

Operational recommendation:

1. keep one Gemini project for local or dev work
2. keep a separate Gemini project for pilot or production traffic
3. keep the free-tier project out of live walkthroughs once real reliability matters
4. add explicit 429 handling and backoff if provider-limit errors become visible in pilot telemetry

What not to over-claim:

- context caching can reduce repeated large-prefix cost, but it does not remove the underlying standard `GenerateContent` rate limits
- the Batch API is useful for asynchronous bulk work, not for live student chat or synchronous completion flows
- a second provider path may help resilience later, but it does not remove the need to size the primary Gemini project correctly

## Quota Windows

Current implemented windows:

- free trial starts on first recorded student usage
- trial duration: `30 days`
- usage counters roll on the current calendar month for both trial and paid plans
- warning state starts when the trial is close to ending or a quota metric falls below the configured warning threshold

Current implemented limits:

| Plan | Sessions | Uploads | Assistant messages | Input tokens | Output tokens |
| --- | --- | --- | --- | --- | --- |
| `trial_free` | `20` | `40` | `200` | `500,000` | `250,000` |
| `family_monthly` paid access | `120` | `240` | `1,200` | `3,000,000` | `1,500,000` |

Current non-implementation:

- no `4h` bucket
- no `1 week` bucket
- no burst throttling or rate-limit window beyond the monthly quota and route validation guards

Recommendation:

- keep the current `30-day + calendar-month` model for MVP stability
- only add shorter windows such as `4h` or `1 week` if real abuse or runaway usage appears in production telemetry

## What Gets Counted

The shared usage service currently tracks:

- new conversations
- uploads
- assistant replies
- provider input tokens
- provider output tokens

The counters live in `usage_counters`, and the canonical enforcement path lives in `lib/server/usage/service.ts`.

Activity mapping:

| Activity | Counter effect | AI call involved | Notes |
| --- | --- | --- | --- |
| create conversation draft | `sessions +1` | no | gated by quota before creation |
| create upload target | `uploads +1` | no | gated by quota before upload reservation |
| confirm upload with extraction | token counters only if provider usage is returned | yes | repeated confirm now reuses existing extraction result |
| student message -> coach reply | `assistantMessages +1` plus provider tokens | yes | deterministic coach fallback keeps the flow alive |
| complete conversation | provider tokens for summaries, translations, and memory when those calls succeed | yes | repeated completion now reuses the existing student summary |

## Usage Snapshot Shape

The canonical per-call usage snapshot currently contains:

- `inputTokens`
- `outputTokens`
- `totalTokens`
- `estimatedCostUsd`

This snapshot is intentionally small. It is used for quota accounting, rough cost estimation, and runtime diagnostics, not as a full provider transcript.

## Successful Coach Output Debug Capture

The learner-facing coach path now has one dedicated debug sink for successful replies:

- table: `public.ai_generation_debug_captures`
- scope: successful `coach_reply` generations only
- stored fields: conversation and message references, request metadata, provider/model, prompt version, reply mode, raw successful provider text, final learner-visible text, usage snapshot, and lightweight coach metadata

Current access model:

- this is a server-owned debug table, not a browser feature
- it exists so operators can inspect successful raw coach outputs without polluting `audit_logs`
- it should be queried directly in Supabase or through later operator tooling, typically by `conversation_id` and `created_at`

## Prompt Pipeline

### Student Coach

- route: `POST /api/conversations/[conversationId]/messages`
- prompt version: `student-coach-v1`
- context inputs:
  - assignment text
  - edited extracted text
  - plan
  - draft answer
  - student notes
  - attachment context
  - recent transcript excerpt
- output cap: `500` tokens
- fallback: deterministic coach reply

### Attachment Extraction

- route: `POST /api/uploads/confirm`
- prompt version: `attachment-extraction-v1`
- context inputs:
  - uploaded file sent through Gemini file understanding
  - extraction instruction block
- output cap: no dedicated output-token cap is currently applied
- fallback: attachment is kept, marked `failed`, and returned with a manual-review warning

### Session Summaries

- route: `POST /api/conversations/[conversationId]/complete`
- prompt versions:
  - `student-summary-v1`
  - `parent-summary-v1`
  - `tutor-summary-v1`
- output cap: `450` tokens per summary call
- fallback behavior:
  - student summary is required and falls back deterministically
  - parent and tutor variants are best-effort

### Parent Summary Translation

- route path: completion flow only, not a direct parent action
- prompt version: `translation-v1`
- languages currently generated: `en`, `zh`
- output cap: `900` tokens
- behavior: optional and best-effort

### Memory Refresh

- route path: completion flow only
- prompt version: `memory-profile-v1`
- output cap: `280` tokens
- fallback: deterministic pedagogical memory refresh

## Context Compaction And Guardrails

Current route-level validation caps:

- pasted text: `12,000` chars
- edited extracted text: `12,000` chars
- plan text: `8,000` chars
- draft answer text: `8,000` chars
- student notes: `8,000` chars
- student message text: `4,000` chars

Current AI context caps:

| Context piece | Limit |
| --- | --- |
| assignment text | `3,500` chars |
| edited extracted text | `3,500` chars |
| plan text | `1,800` chars |
| draft answer text | `1,800` chars |
| student notes | `1,200` chars |
| attachment extracted text in prompt context | `2,000` chars |
| attachment text inside Gemini attachment-part context | `1,200` chars |
| recent transcript messages | `8` |
| each transcript message excerpt | `600` chars |
| summaries used for memory generation | `5` |
| each summary excerpt | `900` chars |
| translation source text | `2,400` chars |

Implementation rule:

- truncation happens server-side in `lib/server/ai/guardrails.ts`
- truncated text is explicitly marked with `[tronque pour limiter le cout IA]`

## Artifact Reuse

The current cost-control strategy prefers artifact reuse over a broad hidden cache.

Implemented reuse:

- repeated upload confirmation reuses the stored extraction result
- repeated conversation completion reuses the stored student summary and skips another memory refresh

This matters because the most expensive student path is completion, not a single coach turn.

## Rough Cost Estimates

These are operating estimates, not financial promises.

### Per-Student Token Budget Ceiling

Using only the current token quota caps and current in-code Gemini pricing:

| Plan | Input budget ceiling | Output budget ceiling | Combined token-cost ceiling |
| --- | --- | --- | --- |
| `trial_free` | about `$0.15` | about `$0.625` | about `$0.775` |
| `family_monthly` paid access | about `$0.90` | about `$3.75` | about `$4.65` |

Interpretation:

- if a student fully exhausts the configured token budget, the current code-level Gemini token spend ceiling is still below `$1` on trial and below `$5` on paid access
- this does not include future provider pricing changes or any non-token provider billing mode that might appear later

### Output-Side Hard Ceilings Per Call

Using only the configured output-token caps:

| Operation | Output token cap | Output-side ceiling at current pricing |
| --- | --- | --- |
| coach reply | `500` | about `$0.00125` |
| summary generation | `450` | about `$0.001125` |
| memory profile | `280` | about `$0.00070` |
| translation | `900` | about `$0.00225` |

Important limitation:

- real call cost also depends on input tokens
- attachment extraction has no dedicated output cap today
- the completion path can still trigger multiple calls in one user action

### Most Expensive Current AI Workflow

A fully successful completion can trigger up to these provider calls:

1. required student summary
2. parent summary in French
3. parent summary translation to English
4. parent recommendation translation to English
5. parent summary translation to Chinese
6. parent recommendation translation to Chinese
7. tutor summary in French
8. memory refresh

That is why:

- artifact reuse on repeated completion matters
- parent-facing AI expansion should be monetized deliberately

## Reproducibility And Abuse Notes

Already implemented:

- repeated confirm and repeated complete are covered in the student smoke
- provider token and estimated-cost metadata are normalized at the provider boundary
- monthly per-student quotas bound the maximum sustained usage per account

Not yet implemented:

- no standalone benchmark harness that records token usage per canned prompt set
- no per-operation dashboard or report that aggregates historical spend by activity type
- no short-window anti-abuse throttle such as per-hour caps

Recommendation:

- if usage pressure appears in production, add a deterministic benchmark harness before widening parent-side AI features
- for local UI-heavy iteration, add a dev-only mock-AI mode before spending more effort on prompt-path polish against the live Gemini project

## Parent-Facing AI Policy

### Current Shipped State

- parents can view stored parent summary variants when they exist
- parents can review the learner's work, billing state, quota state, privacy controls, and pedagogical memory
- there is no parent-triggered AI route today

### Recommended MVP Policy

- keep passive parent oversight available without requiring a paid AI action
- reserve any parent-initiated AI action for the paid `Family` plan
- keep stored parent summary variants inside the student completion contract for the MVP, because they are generated as a side effect of the student's completion flow rather than a parent-originated action

Examples of future paid-only parent AI actions:

- on-demand parent summary regeneration
- parent-triggered translation refresh
- parent-side "ask the coach about this homework" tools
- parent-side recommendation drafting or lesson-planning helpers

If a limited unpaid preview is desired later:

- expose a very small capped parent AI trial
- do not leave parent-triggered AI unlimited on the free path

## Capacity Planning Caveat

The repo currently defines per-student quota ceilings, not a full global saturation model.

So the unanswered question is not "what can one student cost?" because that is now reasonably bounded.

The unanswered question is:

- how many concurrently active trial and paid students can the business absorb at current margin targets?

That answer depends on:

- real completion frequency
- adult-summary hit rate
- fallback frequency
- provider pricing changes
- how much parent-triggered AI is added later

For MVP, the safest rule is:

- finish the web MVP with the current student-first AI contract
- monetize any new adult-triggered AI surfaces instead of widening the unpaid path first
