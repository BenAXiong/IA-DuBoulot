# Student Intake V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [Student dashboard V1](student_dashboard_v1.md) | [Storage and attachment rules](storage_attachment_rules.md) | [API route map](api_route_map.md)

## Purpose

Describe the first real `/app/new` intake surface so future sessions know what is already implemented and what is still intentionally staged.

## Scope

This document covers `A3.2.1` to `A3.2.4`:

- assignment title entry
- subject entry
- image, screenshot, and PDF staging from the browser
- pasted-text input
- graded-homework toggle
- extracted-text review and manual edit panel

## Source Files

- Entry page: `app/app/new/page.tsx`
- Entry wrapper: `components/dashboard/student/new-homework-entry.tsx`
- Intake form: `components/dashboard/student/new-homework-intake-form.tsx`
- File list: `components/dashboard/student/intake-file-list.tsx`
- Readiness card: `components/dashboard/student/intake-readiness-card.tsx`
- Client-side intake config: `lib/intake/intake-config.ts`

## Current Behavior

The route is real and protected, but the intake draft is still local to the browser.

What works now:

- the route checks student access and start-state gating through the existing dashboard snapshot
- the student can enter a title and subject
- the student can stage allowed files in the browser
- the student can paste readable homework text
- the student can toggle whether the homework is graded
- the student can review and edit the text that will later feed the chat

What does not happen yet:

- no `conversations` row is created yet
- no `attachments` row is created yet
- no storage upload is sent yet
- no extraction job runs yet
- no draft is restored after navigation or refresh

Those belong to `A3.3` and `A4.3`.

## File Staging Rules

The intake form already respects the planned MVP limits:

- max `5` files
- max total staged size `50 MB`
- allowed types: image MIME types plus PDF

The UI treats screenshots as the same browser file path as images for now. The later upload-confirm flow can still distinguish upload source through attachment metadata.

## Extraction Review Rule

The extracted-text panel is intentionally decoupled from the future OCR pipeline.

Current seed logic:

- if pasted text exists, use it as the initial review text
- otherwise, if files exist, create a manual transcription placeholder
- otherwise, keep the panel empty

This means the review/edit surface can already be designed and tested before the true extraction backend exists.

## Why A3.2 Can Be Complete Before A3.3

`A3.2` is the intake surface.
`A3.3` is persistence.

That split is intentional:

- intake defines what the student prepares
- persistence defines how that preparation becomes a reusable conversation

Keeping them separate avoids binding the form to unfinished upload and conversation APIs too early.

## Next Extension Points

- `A3.3.1`: create the first conversation shell and persist the intake draft
- `A3.3.2`: restore the local draft and then replace it with real persisted draft behavior
- `A3.3.3`: attach staged files to the session history
- `A4.3`: replace the placeholder extraction seed with real PDF/image interpretation
