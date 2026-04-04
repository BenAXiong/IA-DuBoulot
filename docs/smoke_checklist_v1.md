# Smoke Checklist V1

Related: [README](../README.md) | [RLS fixture verification](rls_fixture_verification.md) | [Founder walkthrough V1](founder_walkthrough_v1.md) | [Launch checklist V1](launch_checklist_v1.md) | [Student dashboard V1](student_dashboard_v1.md) | [Student workbench V1](student_workbench_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [Privacy controls V1](privacy_controls_v1.md) | [Student memory profile V1](student_memory_profile_v1.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the MVP smoke-test acceptance checklist for internal demos, parent trials, and future launch-candidate passes.

It exists to satisfy both:

- `A0.4.2` written smoke-test acceptance criteria for the MVP core flows
- `A7.2.1` a written smoke checklist for student, parent, tutor, and admin roles

## Canonical Pre-Demo Command

Run this from the repo root before any serious demo or external walkthrough:

```bash
npm run regress:mvp
```

This command currently runs:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run seed:rls-fixtures`
- `npm run verify:rls-fixtures`
- `npm run smoke:memory`
- `npm run smoke:student-flow`
- `npm run smoke:adult-oversight`
- `npm run smoke:privacy`
- `npm run smoke:billing`

## Pass Criteria

The build is demo-ready only when all of these are true:

- `npm run regress:mvp` exits successfully
- no role sees data outside the documented access matrix
- no student-critical flow is blocked by provider instability if a documented fallback exists
- billing, privacy, and memory surfaces reflect the same server-owned state the mutation routes enforce
- any warning raised during the pass is understood, documented, and accepted as non-blocking for the intended demo

Current non-blocking warning class:

- optional adult summary variants missing during a student-flow smoke run
- provider-backed extraction, coach reply, summary, or memory refresh falling back to the documented deterministic path while the student flow still succeeds

Current blocking failure class:

- failed auth bootstrap or role routing
- student unable to start, continue, or complete a homework flow
- parent, tutor, or admin visibility leaking outside the documented role boundaries
- billing webhook sync, deletion-requested write blocking, or tutor-note isolation failing

## Automated Acceptance Coverage

### Shared Infrastructure

- typecheck, lint, and production build succeed
- deterministic fixture reseed assumptions still hold under `verify:rls-fixtures`

### Student

- authenticated student can create a conversation draft
- file upload confirmation succeeds or degrades to manual review without breaking the flow
- repeated upload confirmation reuses the stored extraction result instead of re-running provider extraction
- workspace persists extracted or manual text
- assistant reply appends successfully, with fallback allowed
- completion produces at least the required student summary and leaves the conversation read-only
- repeated completion reuses the stored student summary and does not regenerate memory
- completion-triggered memory refresh succeeds, with fallback allowed

### Parent

- parent dashboard loads linked students and billing state
- parent can create a learner account from `/app`, and the new learner appears in the parent rail
- linked-student detail page loads recent sessions and pedagogical memory
- parent session review stays filtered to parent summaries only
- linked-child deletion can be queued from settings

### Tutor

- tutor dashboard and linked-student detail load
- tutor session review stays filtered to tutor summaries only
- tutor note create, update, and delete succeed
- tutor cannot access raw student memory

### Admin

- admin audit page loads
- admin access-event API captures adult review and tutor-note activity

### Billing And Privacy

- signed Lemon webhook persists subscription state
- parent dashboard reflects synced subscription state
- deletion-requested student is redirected to `/app/settings`
- deletion-requested student cannot create a new conversation

## Manual Role Checklist

Use this when demonstrating the deployed app, even after the automated pass is green.

### Student Manual Pass

- sign in as a student on the deployed app
- create a new homework from `/app/new`
- upload or paste homework content
- exchange at least one coaching turn
- complete the session and confirm the student summary appears
- return to `/app` and confirm the memory panel now reflects durable pedagogical context

### Parent Manual Pass

- sign in as a linked parent
- confirm `/app` shows the billing card and linked students
- open a linked student
- confirm recent sessions render and the memory panel loads
- open a session review and confirm only parent-visible summaries appear

### Tutor Manual Pass

- sign in as a linked tutor
- open a linked student and a session review
- create or edit a tutor note
- confirm no raw-memory surface is exposed

### Admin Manual Pass

- sign in as an admin
- open `/app/audit`
- confirm recent adult review and tutor-note actions appear

## Device And Deployment Checks

These remain required before an external demo even if the regression command passes.

- run `npm run smoke:tablet-emulation` from a local production build as the repeatable tablet pre-pass for `/app`, `/app/new`, and `/app/conversations/[conversationId]`
- rerun that same command with `SMOKE_UI_LANGUAGE=zh` when the tablet pre-pass needs to validate the translated student-route shell without manually editing the fixture profile first
- rerun that same command with `SMOKE_THEME_MODE=dark` when a shared theme or shell change needs dark-mode verification on the tablet-critical student routes
- confirm the deployed environment has the expected AI, Supabase, and Lemon env vars
- confirm the Lemon webhook target matches the deployed domain
- confirm the active Lemon mode matches the intended test or live walkthrough
- run the key flows on real iPad Safari for `A7.1`; emulation does not close that task

## Current Operating Rule

- run `npm run regress:mvp` before demos or after any cross-cutting auth, billing, privacy, memory, or provider change
- if the automated pass is green but a manual deployment check fails, treat the build as not demo-ready

## Latest Recorded Result

- 2026-03-11 local `npm run regress:mvp`: success, including deterministic fixture reseed before hosted RLS verification and the non-device smoke suite
- 2026-03-11 local `npm run smoke:tablet-emulation`: success against a temporary local `next start` instance, with no horizontal overflow and no detected sub-`44x44` controls on the checked student tablet surfaces
- 2026-03-12 local `npm run smoke:tablet-emulation`: success again after the trilingual copy refresh, with the selectors updated to the current accented French labels and no horizontal overflow or detected sub-`44x44` controls on the checked student tablet surfaces
- 2026-03-12 local `SMOKE_UI_LANGUAGE=zh npm run smoke:tablet-emulation`: success on the same student tablet surfaces after a temporary fixture-language flip, with no horizontal overflow and no detected sub-`44x44` controls
- 2026-03-12 local rerun of both tablet-emulation commands after the student-flow server-text and deterministic-fallback localization pass: success again on `/app`, `/app/new`, and `/app/conversations/[conversationId]`, with no horizontal overflow and no detected sub-`44x44` controls in either the default French or temporary `zh` fixture-language mode
- 2026-03-12 local `SMOKE_THEME_MODE=dark npm run smoke:tablet-emulation`: success on `/app`, `/app/new`, and `/app/conversations/[conversationId]` after the shared light or dark theme redesign, with no horizontal overflow and no detected sub-`44x44` controls on the checked student tablet surfaces
- 2026-04-02 local `npm run smoke:adult-oversight`: success after adding the parent-created learner bootstrap path, including parent dashboard learner creation, immediate learner-rail visibility, learner sign-in with the parent-chosen credentials, pending parent-approval visibility, direct dashboard acceptance, tutor-note mutations, and admin audit visibility
- 2026-04-04 local `npm run smoke:student-flow`: failed again on the existing sample-PDF extraction assertion after the newer student quick-start pass; the harness still drives the older `/app/new` draft-creation flow, the API path still created the draft and completed provider extraction, but the harness rejected a shorter-than-expected extracted-text block (`[Source : fractions-partage.pdf]` plus one line of body text). This still looks like smoke-harness or corpus drift rather than a student-chat regression, but the automated student smoke now also needs to be expanded so it covers the new subject quick-start path before the next full demo-regression run.
- latest observed non-blocking warnings: provider-backed extraction, coach reply, student summary, or memory refresh may fall back to the documented deterministic path; optional adult summary variants can also be missing in some student-flow runs without breaking the student contract
