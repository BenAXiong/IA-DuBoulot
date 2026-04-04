# Student Intake V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student dashboard V1](student_dashboard_v1.md) | [Storage and attachment rules](storage_attachment_rules.md) | [API route map](api_route_map.md)

## Purpose

Describe the current student intake boundary so future sessions know what still lives on `/app/new`, what already moved into the faster subject quick-start, and where persistence starts.

## Scope

This document covers `A3.2.1` to `A3.2.4`, plus the later student-shell adjustment that demoted `/app/new` behind the faster subject quick-start:

- subject entry
- image, screenshot, and PDF staging from the browser
- pasted-text input
- graded-homework toggle
- extracted-text review and manual edit panel
- student-facing "open chat" entry copy over the existing persisted-session bootstrap
- the remaining legacy `/app/new` fallback after the newer subject-level direct chat start

## Source Files

- Entry page: `app/app/new/page.tsx`
- Entry wrapper: `components/dashboard/student/new-homework-entry.tsx`
- Intake form: `components/dashboard/student/new-homework-intake-form.tsx`
- File list: `components/dashboard/student/intake-file-list.tsx`
- Client-side intake config: `lib/intake/intake-config.ts`
- Student flow localization copy: `lib/i18n/student-flow-copy.ts`

## Current Behavior

The route is real and protected, but it is no longer the primary student entry point for normal homework chats.

What works now:

- the main subject quick-start on `/app?view=homework&subject=...` now creates a bare conversation shell, optionally uploads staged files, sends the learner's first real message through the normal message route, and only then opens `/app/conversations/[conversationId]`
- the direct subject quick-start now uses the learner's actual typed text as the first visible student message, instead of persisting the older machine-written intake summary
- the `+` control inside the subject quick-start now opens a real file picker and stages files before the chat starts
- `/app/new` still checks student access and start-state gating through the existing dashboard snapshot
- `/app/new` still lets the student enter or reuse a subject, including a subject prefilled from the student shell quick-start or a fallback route link
- `/app/new` still supports browser file staging, pasted-text input, the graded-homework toggle, and the editable source-text review panel
- the validated `/app/new` fallback still creates a conversation draft, uploads the selected files through the signed upload flow, confirms them, runs extraction, syncs extracted text back into the workspace, and then redirects into the persisted session page
- if provider extraction fails during confirmation, the attachment is kept, marked `failed`, and returned with a manual-review warning instead of breaking the student flow
- the intake route copy, subject labels, staged-file labels, client upload fallbacks, and provisional extraction draft now localize through `lib/i18n/student-flow-copy.ts` plus the localized helpers inside `lib/intake/intake-config.ts`
- the server-owned intake validations, upload validation errors, extraction warnings, and extracted-text source labels now also localize from the student's `preferred_ui_language`, so the route no longer drops back to mixed English or French when the server rejects or repairs part of the flow

What does not happen yet:

- the direct subject quick-start still creates the conversation shell first, then uploads files, then sends the first message; there is still no single server-side "one request creates the chat and includes staged files" contract
- the direct subject quick-start no longer exposes the graded-homework toggle, because that flag has not shown clear learner-facing value in the chat-first flow
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

`A3.2` still defines the richer intake fallback and source-review surface.
`A3.3` still defines how either student entry path becomes a reusable session.

Current UX compromise:

- the student now sees a subject-level chat box first, not an explicit session-creation ritual
- under the hood, the quick-start still persists the conversation before the chat opens
- `/app/new` remains available as a quieter fallback for the richer intake path rather than the default learner journey
- the graded toggle and extracted-text review flow are still tied to `/app/new` while the main subject quick-start stays chat-first

That split is intentional for now because it improves the learner-facing tone without forcing a full upload-plus-first-message backend rewrite in the same slice.

## Next Extension Points

- tighten the upload limits and metadata capture to match [Storage and attachment rules](storage_attachment_rules.md)
- add a local non-provider extraction fallback or retry path if provider extraction failures stay common
- move long-running extraction or retry work into a queued path if synchronous confirmation becomes too slow
- decide later whether `/app/new` should disappear completely once the subject quick-start can cover richer source-review needs without a fallback route
