# Smoke Checklist V1

Related: [README](../README.md) | [RLS fixture verification](rls_fixture_verification.md) | [Student dashboard V1](student_dashboard_v1.md) | [Student workbench V1](student_workbench_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [Privacy controls V1](privacy_controls_v1.md) | [Student memory profile V1](student_memory_profile_v1.md) | [MVP to-do list](mvp_todo.md)

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
- workspace persists extracted or manual text
- assistant reply appends successfully, with fallback allowed
- completion produces at least the required student summary and leaves the conversation read-only
- completion-triggered memory refresh succeeds, with fallback allowed

### Parent

- parent dashboard loads linked students and billing state
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

- confirm the deployed environment has the expected AI, Supabase, and Lemon env vars
- confirm the Lemon webhook target matches the deployed domain
- confirm the active Lemon mode matches the intended test or live walkthrough
- run the key flows on real iPad Safari for `A7.1`; emulation does not close that task

## Current Operating Rule

- run `npm run regress:mvp` before demos or after any cross-cutting auth, billing, privacy, memory, or provider change
- if the automated pass is green but a manual deployment check fails, treat the build as not demo-ready

## Latest Recorded Result

- 2026-03-11 local `npm run regress:mvp`: success
- latest observed non-blocking warnings: provider-backed extraction, coach reply, student summary, or memory refresh may fall back to the documented deterministic path; optional adult summary variants can also be missing in some student-flow runs without breaking the student contract
