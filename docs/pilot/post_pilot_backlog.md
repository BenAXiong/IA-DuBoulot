# Post-Pilot Candidate Backlog

Related: [Pilot_todo](../pilot_todo.md) | [README](../../README.md) | [AGENTS](../../AGENTS.md) | [MVP to-do list](../mvp_todo.md) | [Decision log](../decision_log.md) | [Work sessions log](../work_sessions.md)

## Purpose

Longer-horizon post-pilot candidates that should not crowd the current Pilot working board.

This file holds long-form evidence and historical status notes. Keep the canonical task IDs and checkboxes in [Pilot_todo](../pilot_todo.md).

## Task IDs

- P6.1 - Optionally add an explicit "promote to subject doc" action for chat-only uploads from the workspace, after Pilot evidence shows learners need a shortcut. This must remain opt-in and must not silently convert chat attachments into long-lived subject docs.
- P6.2 - Evaluate embeddings or a stronger retrieval/reranking layer for subject resources only after `P2.7.12` token-impact and retrieval-quality data show lexical retrieval is insufficient.
- P6.3 - Add stronger section-aware chunking for subject resources so chunks follow real course sections, methods, exercises, definitions, or headings instead of only page estimates and lightweight first-line title inference.
- P6.4 - Decide whether to run an old-PDF subject-resource backfill. Only implement it after an explicit product/ops choice on cost, user value, failure handling, and whether old weak outlines/chunks should be updated automatically or left untouched.
- P6.5 - If old-PDF backfill is approved, implement it as a bounded operator/admin job with progress logs, retry limits, weak-outline handling, and no silent learner-visible semantic changes.
- P6.6 - Run broader non-PDF subject-doc smoke coverage for DOC, DOCX, TXT, MD, and JSON resources after the core PDF flow is stable; keep failures as format-specific follow-ups rather than reopening `P2.7`.
- P6.7 - Run and review the production subject-resource token-impact report, `npm run report:subject-resource-token-impact -- --days=14 --limit=500`, once enough real selected-resource turns exist; use the result to decide whether lexical retrieval remains acceptable or should feed `P6.2`.
- P6.8 - Track extraction failures on large or highly structured PDFs/workbooks, especially Sésamath-like files, and decide whether they need provider fallback, local fallback, workbook-specific handling, or explicit out-of-scope messaging.
- P6.9 - Add automatic session checkpoints for meaningful unfinished homework work, so Banban can retain lower-confidence learning signals even when the learner never clicks the final completion action. Checkpoints must be clearly separate from trusted completion summaries and must define update, overwrite, and deletion behavior.
- P6.10 - Add cleanup paths for stale or misclassified homework items, such as archive, not a homework, done elsewhere, or dismiss from active counters, so students who do not maintain their board perfectly do not accumulate permanent unfinished-work pressure.
- P6.11 - Explore post-completion reinforcement actions: turn completed homework into practice, log it for later revision, or let the learner mark topics as needing reinforcement when they feel Banban did not fully grasp their difficulty.
- P6.12 - Run real iPad Safari validation and iPad-specific polish after practical device constraints clear, including upload, chat, workspace, keyboard-open behavior, tap targets, and portrait/landscape checks.

## Evidence And Status Notes

Status note: on 2026-05-31, the open MVP `A7.1.1` to `A7.1.3` real iPad Safari tasks moved here because hardware validation is practically constrained. Near-term demo and Pilot readiness should rely on the repeatable tablet-emulation pre-pass plus ordinary deployed-browser checks; hardware Safari behavior should be revisited after the closed pilot when access to the target device is realistic.
