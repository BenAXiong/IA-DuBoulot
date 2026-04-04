# Student Intake V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student dashboard V1](student_dashboard_v1.md) | [Storage and attachment rules](storage_attachment_rules.md) | [API route map](api_route_map.md)

## Purpose

Describe the first real `/app/new` intake surface so future sessions know what is already implemented and where persistence starts.

## Scope

This document covers `A3.2.1` to `A3.2.4`:

- subject entry
- image, screenshot, and PDF staging from the browser
- pasted-text input
- graded-homework toggle
- extracted-text review and manual edit panel
- student-facing "open chat" entry copy over the existing persisted-session bootstrap

## Source Files

- Entry page: `app/app/new/page.tsx`
- Entry wrapper: `components/dashboard/student/new-homework-entry.tsx`
- Intake form: `components/dashboard/student/new-homework-intake-form.tsx`
- File list: `components/dashboard/student/intake-file-list.tsx`
- Client-side intake config: `lib/intake/intake-config.ts`
- Student flow localization copy: `lib/i18n/student-flow-copy.ts`

## Current Behavior

The route is real, protected, and still creates a persisted session draft when validated, but the learner-facing UI now treats it as a quiet "open the chat with this homework" surface instead of a wizard.

What works now:

- the route checks student access and start-state gating through the existing dashboard snapshot
- the student can enter or reuse a subject, including a subject prefilled from the student shell quick-start
- the student can stage allowed files in the browser
- the student can paste readable homework text in one main freeform box
- the student can toggle whether the homework is graded
- the student can review and edit the text that will later feed the chat through a quieter collapsible source-text panel
- the validated intake now creates a conversation draft, uploads the selected files through the signed upload flow, confirms them, runs extraction, syncs extracted text back into the workspace, and then redirects into the persisted session page
- if provider extraction fails during confirmation, the attachment is kept, marked `failed`, and returned with a manual-review warning instead of breaking the student flow
- the intake route copy, subject labels, staged-file labels, client upload fallbacks, and provisional extraction draft now localize through `lib/i18n/student-flow-copy.ts` plus the localized helpers inside `lib/intake/intake-config.ts`
- the server-owned intake validations, upload validation errors, extraction warnings, and extracted-text source labels now also localize from the student's `preferred_ui_language`, so the route no longer drops back to mixed English or French when the server rejects or repairs part of the flow

What does not happen yet:

- there is still no dedicated background queue for extraction retries or long-running attachment processing
- per-file enforcement and metadata capture still need to be tightened to match the full storage contract exactly
- there is still no non-provider local PDF extraction fallback when Gemini is unavailable

Those belong to the remaining stabilization work in `A4.3`.

## File Staging Rules

The intake form already respects the planned MVP limits:

- max `5` files
- max total staged size `50 MB`
- allowed types: image MIME types plus PDF

The UI treats screenshots as the same browser file path as images for now. The later upload-confirm flow can still distinguish upload source through attachment metadata.

## Extraction Review Rule

The extracted-text panel is intentionally decoupled from the future OCR pipeline and now sits behind a calmer "review source text" step instead of a separate readiness card.

Current seed logic:

- if pasted text exists, use it as the initial review text
- otherwise, if files exist, create a manual transcription placeholder
- otherwise, keep the panel empty

This means the review/edit surface can already be designed and tested before the true extraction backend exists.

## Relationship To A3.3

`A3.2` still defines the entry surface.
`A3.3` still defines how that entry becomes a reusable session.

Current UX compromise:

- the student now sees an "open chat" flow instead of an explicit session-creation ritual
- under the hood, the route still persists the conversation before the chat opens
- the route itself is now intentionally minimal on the surface: a simple back-to-homework link plus the real intake form, with no extra hero container

That split is intentional for now because it improves the learner-facing tone without forcing a larger backend rewrite in the same slice.

## Next Extension Points

- tighten the upload limits and metadata capture to match [Storage and attachment rules](storage_attachment_rules.md)
- add a local non-provider extraction fallback or retry path if provider extraction failures stay common
- move long-running extraction or retry work into a queued path if synchronous confirmation becomes too slow
- decide later whether the first learner message should implicitly create the conversation instead of routing through this entry page
