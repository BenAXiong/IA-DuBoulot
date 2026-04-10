# AI Prompt Registry V1

Related: [README](../README.md) | [AI ops and economics V1](ai_ops_economics_v1.md) | [Service interfaces](service_interfaces.md) | [Student workbench V1](student_workbench_v1.md) | [Decision log](decision_log.md) | [Pilot_todo](pilot_todo.md)

## Purpose

This document is the human-review index for the current AI prompt surface.

Use it to answer four questions quickly:

- which prompt families currently exist
- which route or workflow calls each prompt
- what each prompt is trying to do and what output it is expected to return
- which code file and version constant must be changed when behavior evolves

The markdown below is generated from `lib/server/ai/prompt-registry.json` plus the live version constants in `lib/server/ai/prompts/shared.ts`.

## Current Families

| Family | Version | Builder | Routes | Aim | Outcome |
| --- | --- | --- | --- | --- | --- |
| `student-coach` | `student-coach-v6` | `buildStudentCoachSystemPrompt` in `lib/server/ai/prompts/student-coach.ts` | POST /api/conversations/[conversationId]/messages | Generate the live banban coaching reply for learner messages, hints, and summary requests. | Returns a plain-text coaching reply for the learner; the server derives lightweight coaching metadata defaults around that reply. |
| `conversation-title` | `conversation-title-v1` | `buildConversationTitlePrompt` in `lib/server/ai/prompts/conversation-title.ts` | POST /api/conversations/[conversationId]/messages (first successful learner turn only) | Shorten the first successful learner exchange into a compact conversation title that is easier to scan in history and subject views. | Returns a short plain-text title only; the service stores it best-effort on the conversation after the first assistant reply succeeds. |
| `attachment-extraction` | `attachment-extraction-v1` | `buildAttachmentExtractionPrompt` in `lib/server/ai/prompts/attachment-extraction.ts` | POST /api/uploads/confirm | Extract readable homework text and basic metadata from uploaded images or PDFs. | Returns JSON with extractedText, detectedLanguage, confidenceScore, needsManualReview, pageCountEstimate, and sourceSummary. |
| `student-summary` | `student-summary-v2` | `buildSummaryPrompt` in `lib/server/ai/prompts/summary-prompts.ts` | POST /api/conversations/[conversationId]/complete | Produce the learner-facing end-of-session summary and next-step recommendation. | Returns JSON with summaryText, weaknessTags, and nextStepRecommendation for the student audience. |
| `parent-summary` | `parent-summary-v2` | `buildSummaryPrompt` in `lib/server/ai/prompts/summary-prompts.ts` | POST /api/conversations/[conversationId]/complete | Produce the parent-facing oversight summary after session completion. | Returns JSON with summaryText, weaknessTags, and nextStepRecommendation for the parent audience. |
| `tutor-summary` | `tutor-summary-v2` | `buildSummaryPrompt` in `lib/server/ai/prompts/summary-prompts.ts` | POST /api/conversations/[conversationId]/complete | Produce the tutor-facing operational summary after session completion. | Returns JSON with summaryText, weaknessTags, and nextStepRecommendation for the tutor audience. |
| `memory-profile` | `memory-profile-v2` | `buildMemoryProfilePrompt` in `lib/server/ai/prompts/memory-profile.ts` | POST /api/conversations/[conversationId]/complete | Refresh durable pedagogical memory after a completed session. | Returns JSON with 0 to 6 educational memory items, each with category, title, detail, and confidence. |
| `translation` | `translation-v2` | `buildTranslationPrompt` in `lib/server/ai/prompts/translation.ts` | POST /api/conversations/[conversationId]/complete (best-effort follow-up) | Translate generated summary text for additional oversight languages without changing meaning. | Returns only the translated text. |

## Detailed Inventory

### Student coach reply

- Family ID: `student-coach`
- Current version: `student-coach-v6`
- Version constant: `STUDENT_COACH_PROMPT_VERSION`
- Builder: `buildStudentCoachSystemPrompt` in `lib/server/ai/prompts/student-coach.ts`
- Service method: `AiProvider.generateCoachReply`
- Routes or workflow: POST /api/conversations/[conversationId]/messages
- Aim: Generate the live banban coaching reply for learner messages, hints, and summary requests.
- Expected outcome: Returns a plain-text coaching reply for the learner; the server derives lightweight coaching metadata defaults around that reply.
- Primary docs: `docs/student_workbench_v1.md`, `docs/ai_ops_economics_v1.md`, `docs/service_interfaces.md`

### Conversation title summary

- Family ID: `conversation-title`
- Current version: `conversation-title-v1`
- Version constant: `CONVERSATION_TITLE_PROMPT_VERSION`
- Builder: `buildConversationTitlePrompt` in `lib/server/ai/prompts/conversation-title.ts`
- Service method: `AiProvider.generateConversationTitle`
- Routes or workflow: POST /api/conversations/[conversationId]/messages (first successful learner turn only)
- Aim: Shorten the first successful learner exchange into a compact conversation title that is easier to scan in history and subject views.
- Expected outcome: Returns a short plain-text title only; the service stores it best-effort on the conversation after the first assistant reply succeeds.
- Primary docs: `docs/student_dashboard_v1.md`, `docs/student_workbench_v1.md`, `docs/ai_ops_economics_v1.md`

### Attachment extraction

- Family ID: `attachment-extraction`
- Current version: `attachment-extraction-v1`
- Version constant: `ATTACHMENT_EXTRACTION_PROMPT_VERSION`
- Builder: `buildAttachmentExtractionPrompt` in `lib/server/ai/prompts/attachment-extraction.ts`
- Service method: `AiProvider.extractAttachmentText`
- Routes or workflow: POST /api/uploads/confirm
- Aim: Extract readable homework text and basic metadata from uploaded images or PDFs.
- Expected outcome: Returns JSON with extractedText, detectedLanguage, confidenceScore, needsManualReview, pageCountEstimate, and sourceSummary.
- Primary docs: `docs/student_intake_v1.md`, `docs/storage_attachment_rules.md`, `docs/ai_ops_economics_v1.md`

### Student summary

- Family ID: `student-summary`
- Current version: `student-summary-v2`
- Version constant: `STUDENT_SUMMARY_PROMPT_VERSION`
- Builder: `buildSummaryPrompt` in `lib/server/ai/prompts/summary-prompts.ts`
- Service method: `AiProvider.generateSummary`
- Routes or workflow: POST /api/conversations/[conversationId]/complete
- Aim: Produce the learner-facing end-of-session summary and next-step recommendation.
- Expected outcome: Returns JSON with summaryText, weaknessTags, and nextStepRecommendation for the student audience.
- Primary docs: `docs/student_history_summary_v1.md`, `docs/ai_ops_economics_v1.md`

### Parent summary

- Family ID: `parent-summary`
- Current version: `parent-summary-v2`
- Version constant: `PARENT_SUMMARY_PROMPT_VERSION`
- Builder: `buildSummaryPrompt` in `lib/server/ai/prompts/summary-prompts.ts`
- Service method: `AiProvider.generateSummary`
- Routes or workflow: POST /api/conversations/[conversationId]/complete
- Aim: Produce the parent-facing oversight summary after session completion.
- Expected outcome: Returns JSON with summaryText, weaknessTags, and nextStepRecommendation for the parent audience.
- Primary docs: `docs/oversight_surfaces_v1.md`, `docs/student_history_summary_v1.md`, `docs/ai_ops_economics_v1.md`

### Tutor summary

- Family ID: `tutor-summary`
- Current version: `tutor-summary-v2`
- Version constant: `TUTOR_SUMMARY_PROMPT_VERSION`
- Builder: `buildSummaryPrompt` in `lib/server/ai/prompts/summary-prompts.ts`
- Service method: `AiProvider.generateSummary`
- Routes or workflow: POST /api/conversations/[conversationId]/complete
- Aim: Produce the tutor-facing operational summary after session completion.
- Expected outcome: Returns JSON with summaryText, weaknessTags, and nextStepRecommendation for the tutor audience.
- Primary docs: `docs/oversight_surfaces_v1.md`, `docs/student_history_summary_v1.md`, `docs/ai_ops_economics_v1.md`

### Memory refresh

- Family ID: `memory-profile`
- Current version: `memory-profile-v2`
- Version constant: `MEMORY_PROFILE_PROMPT_VERSION`
- Builder: `buildMemoryProfilePrompt` in `lib/server/ai/prompts/memory-profile.ts`
- Service method: `AiProvider.generateMemoryProfile`
- Routes or workflow: POST /api/conversations/[conversationId]/complete
- Aim: Refresh durable pedagogical memory after a completed session.
- Expected outcome: Returns JSON with 0 to 6 educational memory items, each with category, title, detail, and confidence.
- Primary docs: `docs/student_memory_profile_v1.md`, `docs/ai_ops_economics_v1.md`, `docs/service_interfaces.md`

### Summary translation

- Family ID: `translation`
- Current version: `translation-v2`
- Version constant: `TRANSLATION_PROMPT_VERSION`
- Builder: `buildTranslationPrompt` in `lib/server/ai/prompts/translation.ts`
- Service method: `AiProvider.translateText`
- Routes or workflow: POST /api/conversations/[conversationId]/complete (best-effort follow-up)
- Aim: Translate generated summary text for additional oversight languages without changing meaning.
- Expected outcome: Returns only the translated text.
- Primary docs: `docs/student_history_summary_v1.md`, `docs/ai_ops_economics_v1.md`, `docs/service_interfaces.md`

## Editing Workflow

1. Edit the actual prompt builder in `lib/server/ai/prompts/...`.
2. If the prompt family, route ownership, or expected output changed, update `lib/server/ai/prompt-registry.json`.
3. If the prompt logic meaningfully changed, update `docs/decision_log.md` and the relevant product or ops doc in the same slice.
4. Run `npm run sync:prompt-registry`.
5. If you want a non-mutating guard, run `npm run verify:prompt-registry` before commit.

## Rules

- Keep prompt-family metadata in the registry JSON, not scattered across chat notes.
- Keep version constants in `lib/server/ai/prompts/shared.ts`, not hard-coded in route handlers.
- Treat this registry doc as generated output. Do not hand-edit it; regenerate it.

