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
- `A7.1.1` to `A7.1.3` real iPad Safari validation and fixes
- `A7.4.4` to `A7.4.6` full shared-interface localization and zh-aware tablet verification

## Pilot Backlog

### P1 Interface Trust And Visual Cohesion

- [ ] P1.1 Audit the shared visual language across public shell, app shell, cards, forms, and settings surfaces.
- [ ] P1.2 Define a calmer brand system for colors, typography, spacing, states, and empty/loading/error views.
- [ ] P1.3 Remove distracting UI imperfections and obvious polish gaps on the highest-traffic routes.

Status note: the shared shell and primitive layer still owns the theme bootstrap through `app/globals.css`, `components/theme/theme-script.tsx`, and `lib/theme/config.ts`, but the user-facing MVP now follows the operating-system light or dark preference by default and hides direct theme selection controls while the visual system settles. The landing page now also uses a wider story-first product layout with a simplified near-full-width top bar, a centered hero, three alternating `preview + 3 glass cards` rows with matched GIF sizing, locally hosted neutral placeholder GIFs in `public/landing/`, a shared slow CTA gradient drift, a floating helper for links plus pilot context, a globe-menu language dropdown, and a centered closing CTA instead of the previous toolbox hero. The shared auth route now also uses a smaller HUD-style header, drops the repeated footer framing, stays as one centered card by default, and starts directly with the `Sign in` or `New user` segmented control instead of carrying explanatory copy above it. The authenticated shell also drops pilot badges and literal route-hint scaffolding from the main role surfaces. `P1` stays open because real product media, stronger copy iteration, empty/loading/error consistency, and broader route-level visual cleanup still remain.
Status note: the visible filler copy sweep now also replaces the most implementation-facing language across pricing, onboarding, auth-complete, app-home, landing helper text, and the shared student start/history/workbench surfaces, so those routes present themselves as product flows rather than scaffolding. `P1` still remains open because the remaining polish work is now more about copy excellence, media quality, and route-level coherence than obvious placeholder leaks.

### P2 Journey And UX Hardening

- [ ] P2.1 Review the first-run student journey end to end from landing or auth through completed session.
- [ ] P2.2 Review the parent and tutor journeys from invite or approval through oversight and settings.
- [ ] P2.3 Convert friction findings into bounded fixes with before or after notes, screenshots, or smoke evidence.
- [ ] P2.4 Map which conversation or coaching modes should exist per subject family, and decide which ones stay universal versus subject-specific before the pilot broadens.

Status note: the current MVP still runs one shared coaching workflow across subjects. The product already stores a `subject_tag`, shows recent-subject rollups, uses subject text inside prompts and summaries, and allows a custom subject through the intake `Other subject` path, but memory, prompts, and UI flows are not yet specialized by subject family. Pilot work should decide whether math/science/humanities/language-study need different coaching modes, and whether custom subjects stay free-text, become admin-curated, or need alias normalization.

### P3 Device, Accessibility, And Reliability

- [ ] P3.1 Expand the device matrix beyond tablet emulation to cover the real pilot browser set.
- [ ] P3.2 Run a focused accessibility pass on tap targets, focus states, contrast, and motion.
- [ ] P3.3 Tighten empty-state, retry, and failure-recovery behavior before widening access.

### P4 Pilot Operations And Learning Loop

- [ ] P4.1 Define the weekly pilot triage cadence, evidence format, and severity language.
- [ ] P4.2 Add a lightweight operator change log for pilot-facing fixes, regressions, and known issues.
- [ ] P4.3 Define exit criteria for moving from Pilot to Beta, including UX, support load, and regression confidence.
- [ ] P4.4 Add a dev-only mock-AI mode and explicit dev-versus-pilot Gemini project guidance so UI iteration does not burn pilot quota.
- [ ] P4.5 Define how the pilot verifies or operationally trusts that a `parent` account really belongs to an adult, and when stronger checks are required before wider rollout.

Status note: `docs/pilot_todo.md` maintenance is now mandatory whenever a session changes pilot-facing polish, UX findings, release-ops assumptions, or `P*` task status, and a verified coherent slice should now also be committed and pushed in the same session. `P4` stays open because the triage cadence, operator-facing change log, Pilot-to-Beta exit criteria, and the current parent-account adulthood-verification posture are still not fully defined.

### P5 Structural Audit And Refactor Discipline

- [ ] P5.1 Run a targeted structural audit on MVP-era files that grew during delivery, and log concrete mixed-responsibility or dead-code hotspots with evidence.
- [ ] P5.2 Turn structural-audit findings into bounded refactor slices, dead-code cleanup, or reopened MVP bugs instead of one sweeping rewrite.

## Working Method

For each pilot slice record:

1. the target journey or trust problem
2. the evidence source
3. the bounded change set
4. the verification method
5. the remaining risk or follow-up
6. the `P*` status note or backlog line updated in this file

Keep the pilot lane strict, but do not let it absorb unfinished MVP launch blockers.
