# Launch Checklist V1

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [Smoke checklist V1](smoke_checklist_v1.md) | [Founder walkthrough V1](founder_walkthrough_v1.md) | [AI ops and economics V1](ai_ops_economics_v1.md) | [Environment matrix](environment_matrix.md) | [RLS fixture verification](rls_fixture_verification.md) | [MVP to-do list](mvp_todo.md) | [Pilot_todo](pilot_todo.md) | [Decision log](decision_log.md)

## Purpose

This document freezes the current MVP launch-candidate scope and defines the checklist for a closed pilot-ready build.

## PWA Decision

Decision for `A7.4.1`: defer PWA installability before beta.

Reason:

- the implementation plan already treats PWA as optional after the web experience is solid on the target devices
- the repo currently has no manifest, service worker, or installability path
- the higher-value near-term validation is the deployed web flow plus tablet-emulation pre-pass, not install banners or offline support

Revisit PWA only after:

- post-pilot `P6.12` is complete on a real iPad if iPad becomes a priority device again
- real pilot or beta usage shows repeated return traffic that would materially benefit from installability

## Frozen MVP Scope

Keep in the launch candidate:

- student web flow from `/app` homework launch through upload, coaching, completion, history, and memory refresh
- parent, tutor, and admin visibility with documented role separation
- Lemon Squeezy checkout, portal, and webhook wiring
- privacy/settings, deletion-request queueing, and audit visibility
- deterministic fixture seeding plus the current regression and smoke suite
- Gemini-backed coaching, extraction, summaries, translations, and memory with documented fallback behavior
- shared interface copy that is genuinely shippable in `fr`, `en`, and `zh` for the first Taiwan pilot cohort

Explicitly defer beyond this launch candidate:

- PWA installability
- real iPad Safari validation and iPad-specific keyboard or tap-target polish, now tracked as post-pilot `P6.12`
- a second AI provider or richer retry orchestration
- adult-summary repair or manual summary-regeneration tooling
- richer analytics, dashboards, or marketing-site polish
- broader UX and visual refinement beyond the shared shell baseline now tracked in [Pilot_todo](pilot_todo.md)
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
- Gemini production traffic uses a dedicated project or tier with enough rate headroom for the pilot; do not rely on the free-tier dev project for live user traffic
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

- local `npm run smoke:tablet-emulation` pre-pass is green and logged
- real iPad Safari validation is deferred to post-pilot `P6.12` because hardware validation is practically constrained and is no longer a closed-Pilot launch blocker

## Current Remaining Blockers

The primary release blocker is reopened `A0.2.1`: the Supabase hostname configured in local and Vercel production environments no longer resolves. The 2026-08-29 canonical regression passes typecheck, lint, localization contracts, production build, and public-route smoke, then stops before fixture mutation at the hosted reseed. Restore the project or provision a replacement, replay and verify migrations, update the Supabase URL/anon/service-role values in both environments, relink the CLI, and rerun the full fixture-backed regression.

`A0.2.3` Resend sender/domain setup remains open if real transactional email delivery is required for the Pilot. The trilingual interface gate is complete, and production commit `f00a395` passes the 12-check French/English/Chinese public smoke including language-preserving signed-out app redirects. Real iPad Safari validation remains post-pilot `P6.12`.

Post-launch polish, UX hardening, and broader pilot operating work now live in [Pilot_todo](pilot_todo.md) instead of being mixed into the launch gate.
