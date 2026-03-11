# Launch Checklist V1

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [Smoke checklist V1](smoke_checklist_v1.md) | [Founder walkthrough V1](founder_walkthrough_v1.md) | [Environment matrix](environment_matrix.md) | [RLS fixture verification](rls_fixture_verification.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

## Purpose

This document freezes the current MVP launch-candidate scope and defines the checklist for an internal beta-ready build.

## PWA Decision

Decision for `A7.4.1`: defer PWA installability before beta.

Reason:

- the implementation plan already treats PWA as optional after the web experience is solid on real iPad Safari
- the repo currently has no manifest, service worker, or installability path
- the higher-value remaining validation is real iPad Safari behavior under `A7.1`, not install banners or offline support

Revisit PWA only after:

- `A7.1` is closed on a real device
- real beta usage shows repeated return traffic that would materially benefit from installability

## Frozen MVP Scope

Keep in the launch candidate:

- student web flow from `/app/new` through upload, coaching, completion, history, and memory refresh
- parent, tutor, and admin visibility with documented role separation
- Lemon Squeezy checkout, portal, and webhook wiring
- privacy/settings, deletion-request queueing, and audit visibility
- deterministic fixture seeding plus the current regression and smoke suite
- Gemini-backed coaching, extraction, summaries, translations, and memory with documented fallback behavior

Explicitly defer beyond this launch candidate:

- PWA installability
- a second AI provider or richer retry orchestration
- adult-summary repair or manual summary-regeneration tooling
- richer analytics, dashboards, or marketing-site polish
- broader admin tooling than the current audit-focused surface

## Launch Candidate Checklist

### Code And Docs

- `main` contains the intended MVP slice
- `docs/mvp_todo.md`, `docs/decision_log.md`, and `docs/work_sessions.md` reflect the real code state
- source-of-truth docs cover billing, privacy, memory, oversight, and the founder walkthrough

### Regression

- `npm run regress:mvp` passes locally
- latest known non-blocking warnings are understood and documented
- any new warning class is either fixed or explicitly accepted before demo or beta use

### Deployment

- Vercel production deploy is healthy
- production env vars match the documented matrix
- Lemon webhook target and mode match the intended walkthrough or beta environment
- Gemini-backed paths are reachable in production even if fallback may still be exercised intermittently

### Access And Privacy

- role separation is verified through the fixture-backed RLS and smoke passes
- deletion-requested write blocking still works
- parent, tutor, and admin audit visibility still matches the access matrix

### Demo Readiness

- fixture accounts are reseeded if needed
- the founder walkthrough script is current
- the sample attachment corpus is available locally
- billing demos use the right account type for the chosen story

### Device Readiness

- real iPad Safari validation is completed and logged

## Current Remaining Blocker

The only remaining open work inside `A7` is `A7.1` real iPad Safari validation.

This checklist freezes the scope for launch-candidate prep, but it does not close that manual device task.
