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

Status note: the shared shell and primitive layer still owns the theme bootstrap through `app/globals.css`, `components/theme/theme-script.tsx`, and `lib/theme/config.ts`, and the MVP now exposes only a simple light-or-dark toggle in the shared public/app toolbar chrome while leaving the earlier preset/custom theme controls hidden. The landing page now also uses a wider story-first product layout with a simplified near-full-width top bar, a centered hero, three alternating `preview + 3 glass cards` rows with matched GIF sizing, locally hosted neutral placeholder GIFs in `public/landing/`, a shared slow CTA gradient drift, a floating helper for links plus pilot context, a globe-menu language dropdown, and a centered closing CTA instead of the previous toolbox hero. The shared auth route now also uses a smaller HUD-style header, drops the repeated footer framing, stays as one centered card by default, and starts directly with the `Sign in` or `New user` segmented control instead of carrying explanatory copy above it. The authenticated shell also drops pilot badges and literal route-hint scaffolding from the main role surfaces, while reusing the same utility controls in its top header. `P1` stays open because real product media, stronger copy iteration, empty/loading/error consistency, and broader route-level visual cleanup still remain.
Status note: the visible filler copy sweep now also replaces the most implementation-facing language across pricing, onboarding, auth-complete, app-home, landing helper text, and the shared student start/history/workbench surfaces, so those routes present themselves as product flows rather than scaffolding. `P1` still remains open because the remaining polish work is now more about copy excellence, media quality, and route-level coherence than obvious placeholder leaks.
Status note: the parent `/app` dashboard now has a role-specific oversight layout with a compact account or billing dock, a linked-learners rail, and one grouped activity hub for weekly rhythm plus recent sessions, replacing the more generic shared-sidebar plus scattered-card pattern. `P1` still stays open because the new layout still needs real parent walkthrough feedback, final spacing or hierarchy polish, and stronger visual consistency with the tutor and student surfaces.
Status note: the student role now also uses a dedicated `StudentAppShell` with a collapsible subject rail, a minimal top bar, a placeholder learner avatar dock, and a flatter chat-first conversation layout with a secondary sources/notes rail. `/app/new` no longer acts as a learner destination and now only survives as a compatibility redirect. `P1` remains open because the student shell still needs real walkthrough polish, the avatar is still placeholder-only, and `maps` or `tests` remain explicit placeholders rather than real tools.
Status note: the student shell has now been tightened again around that chat-first model: subject lists and recent homework chats are flatter and more list-like, the learner profile dock defaults to a minimal unoutlined identity row with a hover menu, the subject view and live conversation route both use a true right-side panel instead of floating meta cards, and the quick-start/live composer controls now sit inside the input field with discreet `+`, disabled mic, and send actions. `P1` still remains open because the student shell still needs real learner walkthrough evidence, a real avatar flow, and placeholder `Maps`/`Tests` content still has to either become real tools or disappear before a broader rollout.
Status note: the student shell now also carries a placeholder `Forward` activity alongside `Maps` and `Tests`, reserved for future "what comes next" guidance at a high level. It remains intentionally non-functional for now, and `P1` still stays open because these placeholder learning tools need to become real, be redesigned, or be removed before broader rollout.
Status note: the live student conversation rail is now reduced to a minimal file strip plus one explicit completion button at the bottom. The old learner-facing attachment detail card and session-summary panel are gone from the active chat, while file removal is now possible directly from uploaded-file pills. `P1` still remains open because the remaining chat surface still needs broader walkthrough evidence and a later decision on whether explicit completion should stay visible at all.
Status note: the retired `/app/new` path exposed one more student dead end after the route cleanup: brand-new learners with no existing subject tags landed on the homework dashboard but only saw a self-link CTA. The dashboard empty state now owns a real first-homework launcher with subject selection, but `P2.1` still remains open because the broader student first-run path still needs full walkthrough validation after the onboarding and homework-start changes.

### P2 Journey And UX Hardening

- [ ] P2.1 Review the first-run student journey end to end from landing or auth through completed session.
- [ ] P2.2 Review the parent and tutor journeys from invite or approval through oversight and settings.
- [ ] P2.3 Convert friction findings into bounded fixes with before or after notes, screenshots, or smoke evidence.
- [ ] P2.4 Map which conversation or coaching modes should exist per subject family, and decide which ones stay universal versus subject-specific before the pilot broadens.
- [x] P2.5 Add a parent-created learner bootstrap path from the parent workspace while preserving the existing learner-created self-bootstrap flow.
- [ ] P2.6 Merge the standalone onboarding page into account creation once sign-up can collect role, age-gating, and profile essentials in one pass.

Status note: the current MVP still runs one shared coaching workflow across subjects. The product already stores a `subject_tag`, shows recent-subject rollups, uses subject text inside prompts and summaries, and allows a custom subject through the intake `Other subject` path, but memory, prompts, and UI flows are not yet specialized by subject family. Pilot work should decide whether math/science/humanities/language-study need different coaching modes, and whether custom subjects stay free-text, become admin-curated, or need alias normalization.
Status note: the first parent-dashboard rethink now gives the parent route a calmer entry shape, but `P2.2` remains open because the full parent or tutor journey still needs evidence from invite or approval through linked-learner follow-up, review, settings, and billing, with screenshots or notes captured as friction is found.
Status note: the parent journey now also closes one major friction point from that walkthrough path: pending parent-approval requests addressed to the signed-in adult now surface inside the parent `/app` rail and can be accepted there without reopening the raw invite link. `P2.2` still remains open because the broader invite, settings, billing, and tutor-side walkthrough evidence still needs to be captured end to end.
Status note: `P2.5` is now implemented through a parent-owned learner-creation panel in the parent `/app` rail. A signed-in parent can create a linked learner account, choose the learner's age band plus language defaults, and immediately bring that learner under the adult's billing and oversight context without removing the original learner-created self-bootstrap path. The current implementation is intentionally narrow: because learner identity still maps 1:1 to `auth.users`, the parent-created path creates an initial learner email and temporary password rather than a profile-only managed learner record. A later managed-profile plus learner-claim flow can still replace that bootstrap model if pilot evidence justifies the extra auth complexity.
Status note: the student redesign currently treats subjects as UI filters over the existing `subject_tag` field, not as canonical subject entities or project objects. The new left-rail "Homework" folders and subject-specific home view are intentionally built on top of that lighter filter contract until Pilot decides whether alias normalization or true subject entities are worth the extra data-model complexity.
Status note: the refreshed student `/app` and `/app/conversations/[conversationId]` surfaces now read like "open the chat with this homework" and "continue the discussion" rather than a multi-card session wizard, but the backend contract is still unchanged: a persisted conversation is created before the learner enters the chat, and summaries still depend on explicit completion. Pilot still needs to decide whether the first learner message should implicitly create the conversation and whether student summaries should be generated automatically when a chat closes without a manual completion step.
Status note: the main student path now starts and resumes from `/app`. Subject-level quick-start creates a bare conversation shell, uploads staged files, sends the learner's first real message, and only then opens the live chat. `/app/new` now survives only as a compatibility redirect for old links, and the `graded homework` toggle is effectively retired from the learner-facing flow because it has not shown strong student value in the chat-first path.
Status note: onboarding is now reduced to the profile essentials that sign-up still cannot collect in one pass. Role selection is already chosen during account creation, the shared public footer no longer appears on `/onboarding`, and `P2.6` remains open because the route should eventually disappear once sign-up can own role, age-gating, and profile setup without a second transitional screen.
Status note: add an onboarding discovery question for the learner's interests during Pilot planning, so future homework or practice examples can adapt to hobbies or themes that make the explanation more engaging when relevant. Keep this as a later personalization layer, not a blocker for the current sign-up or homework-start simplification.

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

Status note: the first `P5.1` hotspot audit flags six areas as the highest-value refactor targets. `lib/server/conversations/conversation-service.ts` currently mixes request parsing, validation, auth, persistence, moderation, AI orchestration, usage tracking, and completion side effects in one module. `lib/server/links/invitation-service.ts` mixes parsing, token lifecycle, invitation creation, acceptance flows, link activation, and route-href derivation in one file. `lib/server/memory/service.ts` combines sensitive-text policy, fallback generation, parsing, loading, mutation handling, and completion-triggered refresh logic. The shared copy layer is now split by domain but still concentrated into very large dictionaries in `lib/i18n/ui-copy.ts`, `lib/i18n/student-flow-copy.ts`, and `lib/i18n/dashboard-copy.ts`, which makes copy iteration and review harder than it should be. `components/dashboard/student/student-conversation-workbench.tsx` still owns too much client state plus fetch and mutation orchestration for the student session surface. The smoke suite also duplicates server-bootstrap, cookie-jar, and authenticated-request harness code across `scripts/smoke-*.mjs`, so test maintenance will keep getting more expensive unless that harness is extracted.

## Working Method

For each pilot slice record:

1. the target journey or trust problem
2. the evidence source
3. the bounded change set
4. the verification method
5. the remaining risk or follow-up
6. the `P*` status note or backlog line updated in this file

Keep the pilot lane strict, but do not let it absorb unfinished MVP launch blockers.
