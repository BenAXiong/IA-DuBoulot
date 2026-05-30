# Pilot_todo

Related: [README](../README.md) | [AGENTS](../AGENTS.md) | [Launch checklist V1](launch_checklist_v1.md) | [MVP to-do list](mvp_todo.md) | [Frontend foundations V1](frontend_foundations_v1.md) | [Smoke checklist V1](smoke_checklist_v1.md) | [Decision log](decision_log.md) | [Work sessions log](work_sessions.md)

## Purpose

This document tracks the post-MVP hardening lane for the first closed real-user rollout.

It exists so polish, UX, and operating discipline can expand without hiding true launch blockers.

## Naming

Recommendation:

- use `Pilot` for the next phase
- reserve `Beta` for a broader external release after the closed pilot

Reference:

- alpha: mostly internal or unstable, with contracts, UX, or operating rules still moving fast
- beta: broader external access with a mostly trustworthy core workflow and fewer known rough edges
- pilot: a narrow real-user rollout with close observation, founder support, and explicit feedback capture

## Split With MVP

Rules:

- keep true launch blockers in [docs/mvp_todo.md](mvp_todo.md) until they are closed
- do not duplicate open `A*` blockers here; reference them instead
- use `P*` task IDs from this document for pilot-hardening work in logs, decisions, commits, and testing notes
- if pilot work reveals a real launch blocker, add or reopen an `A*` task instead of hiding it under a pilot label
- if a session changes pilot-facing polish, UX findings, release-ops assumptions, or `P*` task status, update this document in the same session instead of leaving pilot state implicit in chat or git diff only

Current carryover blockers that still stay in MVP:

- `A0.2.3` Resend sender setup and the later real mailer slice
- `A7.4.5` to `A7.4.6` full shared-interface localization and zh-aware tablet-emulation verification

Deferred beyond Pilot:

- `P6.12` real iPad Safari validation and iPad-specific polish, moved out of MVP/Pilot gates on 2026-05-31 because hardware validation is practically constrained.

## Temporary Nath Demo Task Intake

Source: archived [Demo Nath_0410](archive/demo_Nath_0410.md). These are unsorted legacy demo-readiness tasks copied forward so they can be reviewed, de-duplicated, and dispatched into existing `P*` sections later.

- Gemini/demo operations: verify production uses a paid Gemini project or otherwise trustworthy pilot provider setup; rerun a live learner conversation and confirm provider fallback is rare enough for demo use.
- Student-only live smoke: verify sign-in, required onboarding, subject creation from Homework, first-message send/reply, file upload, pasted-image behavior, right-rail behavior, `Homework done!` recap, and Fast versus Thinking response speed on the deployed app.
- First-prompt responsiveness: keep upload pills and pending chat state visible quickly when a conversation initializes from the first-prompt handoff.
- Tablet pre-pass polish: rerun tablet emulation, test the deployed app in an iPad-sized browser viewport when useful, fix obvious sub-`44x44` tap-target issues found without hardware, and keep real iPad Safari plus keyboard-open behavior deferred to `P6.12`.
- Student UI polish: make recent homework chat lists credible and tap-friendly, keep avatar behavior acceptable if real avatar upload stays deferred, localize subject toggles, disable or clearly mark placeholder sidebar sections, and remove visual rough edges that still read as prototype.
- Demo narrative: remove developer wording, internal fallback-looking phrasing, confusing multi-role affordances, and dead-end homework-start/completion navigation; make unsupported non-homework asks produce a concise homework-mode warning.
- Commercial posture: decide whether a demo should expose free-plan wording, whether the demo account simply runs on paid access, and ensure quota copy is not coupled to Gemini free-project limits.
- Non-student surfaces: consider hiding, blocking, or deprioritizing parent/tutor/admin entry points for student-only demos when they distract from the learner flow.
- Completion output polish: ensure `Homework done!` feels like a short learner recap with covered material and current strength/confidence, not an operator summary or debug trace.
- Prompting feedback: consider concise prompting feedback only when useful, such as overloaded prompts, answer-seeking too early, unclear pictures, or missing attempt context.
- French-expression follow-up: consider a lightweight learner French-expression issue log across syntax, grammar, and vocabulary, later usable in the side rail or asynchronous drilling.
- Stretch only after core stability: subject-wide library upload and Maps `v0` should stay narrow and should not widen beyond the core homework chat until the student demo is stable.

## Pilot Detail Docs

- [P1 interface trust details](pilot/interface_trust.md)
- [P2 journey and UX details](pilot/journey_ux.md)
- [P3 device and reliability details](pilot/device_reliability.md)
- [P4 operations details](pilot/operations.md)
- [P5 refactor discipline details](pilot/refactor_discipline.md)
- [P6 post-pilot backlog details](pilot/post_pilot_backlog.md)

Keep this file as the canonical Pilot board: task IDs, checkboxes, and short current status only. Put long-form evidence, historical status notes, and investigation detail in the matching detail doc above.

## Pilot Backlog

### P1 Interface Trust And Visual Cohesion

- [ ] P1.1 Audit the shared visual language across public shell, app shell, cards, forms, and settings surfaces.
- [ ] P1.2 Define a calmer brand system for colors, typography, spacing, states, and empty/loading/error views.
- [ ] P1.3 Remove distracting UI imperfections and obvious polish gaps on the highest-traffic routes.

Detail notes: [Pilot Interface Trust And Visual Cohesion](pilot/interface_trust.md).

### P2 Journey And UX Hardening

- [ ] P2.1 Review the first-run student journey end to end from landing or auth through completed session.
- [ ] P2.2 Review the parent and tutor journeys from invite or approval through oversight and settings.
- [ ] P2.3 Convert friction findings into bounded fixes with before or after notes, screenshots, or smoke evidence.
- [ ] P2.4 Map which conversation or coaching modes should exist per subject family, and decide which ones stay universal versus subject-specific before the pilot broadens.
- [x] P2.5 Add a parent-created learner bootstrap path from the parent workspace while preserving the existing learner-created self-bootstrap flow.
- [ ] P2.6 Merge the standalone onboarding page into account creation once sign-up can collect role, age-gating, and profile essentials in one pass.
- [x] P2.7 Subject-wide upload/resource umbrella. First version is complete: the learner can understand, select, retrieve from, and safely manage subject-level resources in a pilot-ready way. Remaining broader QA, measurement, and enhancement work is tracked under `P6`.
- [x] P2.7.1 Document the subject-wide upload plan, target architecture, deferred risks, and slice boundaries.
- [x] P2.7.2 Add durable subject-resource storage, conversation-resource links, PDF promotion after extraction, and same-student/same-subject hash reuse.
- [x] P2.7.3 Add deterministic subject-resource chunk storage after extraction or reuse.
- [x] P2.7.4 Add retrieval v1 so selected conversation resources inject only bounded top chunk excerpts into coach context.
- [x] P2.7.5 Add the first late-page retrieval regression guard for the front-loaded PDF failure class.
- [x] P2.7.6 Apply and verify the subject-resource migrations and RLS policies in hosted Supabase.
- [x] P2.7.7 Build the learner-facing subject resource library UI for listing PDFs/resources by subject.
- [x] P2.7.8 Add per-conversation resource selection/toggles backed by `conversation_resource_links.selected`.
- [x] P2.7.9 Clarify upload entry points and save semantics: chat-only attachment versus subject-level saved resource.
- [x] P2.7.10 Improve PDF preview and outline formatting around real course sections/headings rather than pages alone.
- [x] P2.7.11 Define and implement resource lifecycle behavior: unlink, delete, purge raw text/chunks/links/storage, and adult/tutor visibility.
- [x] P2.7.12 Expand retrieval evaluation, observability, and token-impact measurement before considering embeddings.
- [ ] P2.8 Evaluate and design a durable conversation working-memory layer for active tutoring state, including assistant-generated questions, student answers, current correction targets, unresolved points, and explicit interactions with completion summaries, student memory profiles, subject-wide resources, and transcript-window compaction.

Detail notes: [Pilot Journey And UX Hardening](pilot/journey_ux.md).

### P3 Device, Accessibility, And Reliability

- [ ] P3.1 Expand the device matrix beyond tablet emulation to cover the real pilot browser set.
- [ ] P3.2 Run a focused accessibility pass on tap targets, focus states, contrast, and motion.
- [ ] P3.3 Tighten empty-state, retry, and failure-recovery behavior before widening access.

Detail notes: [Pilot Device, Accessibility, And Reliability](pilot/device_reliability.md).

### P4 Pilot Operations And Learning Loop

- [ ] P4.1 Define the weekly pilot triage cadence, evidence format, and severity language.
- [ ] P4.2 Add a lightweight operator change log for pilot-facing fixes, regressions, and known issues.
- [ ] P4.3 Define exit criteria for moving from Pilot to Beta, including UX, support load, and regression confidence.
- [ ] P4.4 Add a dev-only mock-AI mode and explicit dev-versus-pilot Gemini project guidance so UI iteration does not burn pilot quota.
- [ ] P4.5 Define how the pilot verifies or operationally trusts that a `parent` account really belongs to an adult, and when stronger checks are required before wider rollout.

Detail notes: [Pilot Operations And Learning Loop](pilot/operations.md).

Current status: trace docs now use current-plus-archive files, and long pilot evidence has moved into focused detail docs; `P4.2` stays open until a real pilot-facing operator change log exists.

### P5 Structural Audit And Refactor Discipline

- [ ] P5.1 Run a targeted structural audit on MVP-era files that grew during delivery, and log concrete mixed-responsibility or dead-code hotspots with evidence.
- [ ] P5.2 Turn structural-audit findings into bounded refactor slices, dead-code cleanup, or reopened MVP bugs instead of one sweeping rewrite.
- [ ] P5.3 Add a prompt-governance layer so AI prompt builders, routes, versions, and modification history stay reviewable and synchronized instead of drifting across code and docs.

Detail notes: [Pilot Structural Audit And Refactor Discipline](pilot/refactor_discipline.md).

### P6 Post-Pilot Candidate Backlog

- [ ] P6.1 Optionally add an explicit "promote to subject doc" action for chat-only uploads from the workspace, after Pilot evidence shows learners need a shortcut. This must remain opt-in and must not silently convert chat attachments into long-lived subject docs.
- [ ] P6.2 Evaluate embeddings or a stronger retrieval/reranking layer for subject resources only after `P2.7.12` token-impact and retrieval-quality data show lexical retrieval is insufficient.
- [ ] P6.3 Add stronger section-aware chunking for subject resources so chunks follow real course sections, methods, exercises, definitions, or headings instead of only page estimates and lightweight first-line title inference.
- [ ] P6.4 Decide whether to run an old-PDF subject-resource backfill. Only implement it after an explicit product/ops choice on cost, user value, failure handling, and whether old weak outlines/chunks should be updated automatically or left untouched.
- [ ] P6.5 If old-PDF backfill is approved, implement it as a bounded operator/admin job with progress logs, retry limits, weak-outline handling, and no silent learner-visible semantic changes.
- [ ] P6.6 Run broader non-PDF subject-doc smoke coverage for DOC, DOCX, TXT, MD, and JSON resources after the core PDF flow is stable; keep failures as format-specific follow-ups rather than reopening `P2.7`.
- [ ] P6.7 Run and review the production subject-resource token-impact report, `npm run report:subject-resource-token-impact -- --days=14 --limit=500`, once enough real selected-resource turns exist; use the result to decide whether lexical retrieval remains acceptable or should feed `P6.2`.
- [ ] P6.8 Track extraction failures on large or highly structured PDFs/workbooks, especially Sésamath-like files, and decide whether they need provider fallback, local fallback, workbook-specific handling, or explicit out-of-scope messaging.
- [ ] P6.9 Add automatic session checkpoints for meaningful unfinished homework work, so Banban can retain lower-confidence learning signals even when the learner never clicks the final completion action. Checkpoints must be clearly separate from trusted completion summaries and must define update, overwrite, and deletion behavior.
- [ ] P6.10 Add cleanup paths for stale or misclassified homework items, such as archive, not a homework, done elsewhere, or dismiss from active counters, so students who do not maintain their board perfectly do not accumulate permanent unfinished-work pressure.
- [ ] P6.11 Explore post-completion reinforcement actions: turn completed homework into practice, log it for later revision, or let the learner mark topics as needing reinforcement when they feel Banban did not fully grasp their difficulty.
- [ ] P6.12 Run real iPad Safari validation and iPad-specific polish after practical device constraints clear, including upload, chat, workspace, keyboard-open behavior, tap targets, and portrait/landscape checks.

Detail notes: [Post-Pilot Candidate Backlog](pilot/post_pilot_backlog.md).

## Working Method

For each pilot slice record:

1. the target journey or trust problem
2. the evidence source
3. the bounded change set
4. the verification method
5. the remaining risk or follow-up
6. the `P*` status note or backlog line updated in this file, with long-form evidence moved into the matching detail doc under `docs/pilot/`

Keep the pilot lane strict, but do not let it absorb unfinished MVP launch blockers.
