# Student Intake V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student dashboard V1](student_dashboard_v1.md) | [Storage and attachment rules](storage_attachment_rules.md) | [API route map](api_route_map.md)

## Purpose

Describe the current student intake boundary so future sessions know what moved into the faster subject quick-start, what the retired `/app/new` route now redirects to, and where persistence starts.

## Scope

This document covers `A3.2.1` to `A3.2.4`, plus the later student-shell adjustments that first demoted and then retired `/app/new` from the visible learner journey:

- subject entry
- image, screenshot, and PDF staging from the browser
- pasted-text input
- graded-homework toggle
- extracted-text review and manual edit panel
- student-facing "open chat" entry copy over the existing persisted-session bootstrap
- the retired richer intake path that no longer owns a student-facing route

## Source Files

- Compatibility redirect page: `app/app/new/page.tsx`
- Client-side intake config: `lib/intake/intake-config.ts`
- Student flow localization copy: `lib/i18n/student-flow-copy.ts`

## Current Behavior

The route still exists for compatibility, but it is no longer a real student destination.

What works now:

- the main subject quick-start on `/app?view=homework&subject=...` now creates a bare conversation shell, optionally uploads staged files, sends the learner's first real message through the normal message route, and only then opens `/app/conversations/[conversationId]`
- the direct subject quick-start now uses the learner's actual typed text as the first visible student message, instead of persisting the older machine-written intake summary
- the `+` control inside the subject quick-start now opens a real file picker and stages files before the chat starts
- `/app/new` now redirects straight into `/app?view=homework`, preserving `subject` and `draft` query params so older links still land in the current subject launcher
- if provider extraction fails during confirmation, the attachment is kept, marked `failed`, and returned with a manual-review warning instead of breaking the student flow
- the direct subject quick-start now owns the visible student start flow, while any older richer intake code is no longer presented as part of the product path

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

`A3.2` still defines the historical richer intake and source-review contract.
`A3.3` still defines how either student entry path becomes a reusable session.

Current UX compromise:

- the student now sees a subject-level chat box first, not an explicit session-creation ritual
- under the hood, the quick-start still persists the conversation before the chat opens
- `/app/new` no longer acts as a learner destination; old links collapse into the homework dashboard instead
- any future richer source-review surface will need a new home inside the homework dashboard or live chat rather than reviving `/app/new` as a visible route

That split is intentional for now because it improves the learner-facing tone without forcing a full upload-plus-first-message backend rewrite in the same slice.

## Next Extension Points

- tighten the upload limits and metadata capture to match [Storage and attachment rules](storage_attachment_rules.md)
- add a local non-provider extraction fallback or retry path if provider extraction failures stay common
- move long-running extraction or retry work into a queued path if synchronous confirmation becomes too slow
- decide later whether the retired richer intake code should be repurposed into a new in-flow source-review surface or removed completely once the chat-first launcher proves sufficient
