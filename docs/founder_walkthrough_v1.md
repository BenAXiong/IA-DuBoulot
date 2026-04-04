# Founder Walkthrough V1

Related: [README](../README.md) | [Smoke checklist V1](smoke_checklist_v1.md) | [RLS fixture verification](rls_fixture_verification.md) | [App shell V1](app_shell_v1.md) | [Student workbench V1](student_workbench_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [Privacy controls V1](privacy_controls_v1.md) | [Launch checklist V1](launch_checklist_v1.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the canonical founder-led product walkthrough for demos, investor conversations, pilot parent calls, and future beta dry runs.

It exists so the demo flow stays consistent with the product that actually ships, instead of drifting into one-off manual scripts.

## Canonical Demo Environment

- deployed app: `https://ia-du-boulot.vercel.app`
- billing mode for walkthroughs: Lemon test mode until live cutover is explicitly approved
- pre-demo regression gate: `npm run regress:mvp`
- canonical sample attachment: `fixtures/homework-samples/attachments/fractions-partage.pdf`

## Demo Accounts

Use the deterministic fixture accounts for role demos:

| Role | Email | Primary use | Notes |
| --- | --- | --- | --- |
| student | `rls-student@iaduboulot.local` | student homework flow | linked to the fixture parent and tutor |
| parent | `rls-parent@iaduboulot.local` | parent oversight and settings demo | seeded with a fixture subscription row for RLS coverage; do not use for a real Lemon checkout walkthrough |
| tutor | `rls-tutor@iaduboulot.local` | tutor review and private-note demo | linked to the fixture student |
| admin | `rls-admin@iaduboulot.local` | audit and support demo | use only for the audit surface |

Password rule:

- the shared fixture password is the local `SUPABASE_FIXTURE_PASSWORD`
- do not commit or print the password in docs
- rotate or reset it out of band before any external walkthrough if access hygiene becomes unclear

Billing rule:

- if you want to demonstrate a real Lemon test checkout, use a separate fresh parent account instead of the fixture parent
- the fixture parent exists to stabilize RLS and dashboard coverage, not to act as the canonical checkout test account

## Pre-Demo Reset

Run this sequence before any serious walkthrough:

1. `npm run seed:rls-fixtures`
2. `npm run regress:mvp`
3. confirm Vercel production env parity for Supabase, Gemini, and Lemon
4. confirm the Lemon webhook still targets `https://ia-du-boulot.vercel.app/api/billing/webhooks/lemonsqueezy`
5. confirm Lemon is still in the intended mode for the walkthrough (`test` until live cutover)

If the walkthrough needs a real checkout:

1. use a fresh parent account, not the fixture parent
2. link it to a demo student before the call
3. keep the test card flow ready

## Walkthrough Script

### 1. Public Framing

- open `/`
- explain the product in one line: supervised AI homework help for students, with parent and tutor visibility
- open `/pricing`
- note that the current MVP exposes one real Family monthly billing path

### 2. Student Flow

- sign in as the fixture student on `/auth`
- land on `/app` and point out recent sessions, quota state, and the memory panel
- choose a subject from the homework dashboard and start a fresh chat from the subject quick-start
- add a file in the subject quick-start or the live chat if needed
- show the extracted-text workspace, the plan area, and one coaching turn
- complete the session and show the student summary

Narration rule:

- if the coach or summary falls back to the deterministic path, say that the student contract stays intact even when the provider is unstable
- if extraction falls back, say the file is still kept and the student is asked to manually review the useful zone

### 3. Parent Flow

- sign in as the fixture parent
- show `/app` with linked-student visibility, quota state, billing card, and the linked student entry point
- open `/app/students/[studentUserId]`
- show recent sessions and the pedagogical memory panel
- open one session review through `/app/review/[conversationId]`
- confirm only parent-visible summary content is exposed
- open `/app/settings` and show privacy and deletion controls

### 4. Tutor Flow

- sign in as the fixture tutor
- open the linked student detail
- open a session review
- create or edit one tutor note
- mention that tutor raw-memory access is intentionally blocked

### 5. Admin Flow

- sign in as the fixture admin
- open `/app/audit`
- show the access-event trail and tutor-note activity
- explain that the MVP admin surface is intentionally narrow and audit-focused

### 6. Billing Demo

Only do this when you explicitly want to show the Lemon path:

- use a separate fresh parent account
- trigger `Activer Family` from the parent dashboard
- complete the Lemon test-mode checkout
- return to `/app` and confirm the billing card updates

## What To Avoid In The Walkthrough

- do not promise PWA installability; it is explicitly deferred before beta
- do not rely on optional adult summary variants appearing on every run
- do not use the fixture parent for the real checkout story
- do not improvise new demo content outside the safe sample corpus if the walkthrough can use the existing fixtures

## Success Criteria

The walkthrough is ready when:

- the pre-demo reset steps are green
- each role can reach its main surface without role leakage
- the student flow survives Gemini fallback cases without blocking
- the presenter knows which billing story is fixture-only versus real Lemon test checkout
