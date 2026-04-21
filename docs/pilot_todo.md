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
Status note: the empty-state homework launcher now uses full-width two-line guidance instead of a capped prose block, and the student quick-start textarea chrome is stripped down to a flatter field without the leftover inner browser focus box. `P1` still remains open because the broader student shell still needs more walkthrough polish and real-device evidence.
Status note: the student chat inputs now also accept pasted clipboard images through the existing private upload path, and learner-visible provider failures no longer dump the old internal `Coach brouillon` text into the transcript. `P1` still remains open because the broader student shell still needs more walkthrough polish, stronger provider reliability, and real-device evidence.
Status note: the student shell now also carries a placeholder `Forward` activity alongside `Maps` and `Tests`, reserved for future "what comes next" guidance at a high level. It remains intentionally non-functional for now, and `P1` still stays open because these placeholder learning tools need to become real, be redesigned, or be removed before broader rollout.
Status note: the live student conversation rail is now reduced to a minimal file strip plus one explicit completion button at the bottom. The old learner-facing attachment detail card and session-summary panel are gone from the active chat, while file removal is now possible directly from uploaded-file pills. `P1` still remains open because the remaining chat surface still needs broader walkthrough evidence and a later decision on whether explicit completion should stay visible at all.
Status note: the student conversation rail is now also pinned as a viewport-height split pane under the student header instead of stretching through the whole transcript, and uploaded image pills can open a full overlay preview without leaving the chat. `P1` still remains open because the broader chat surface still needs real learner walkthrough evidence and a later decision on whether explicit completion should stay visible at all.
Status note: the student conversation rail now previews uploaded images inline before any fullscreen expansion, adds a hover-only expand action for the larger overlay, and lets desktop users resize the rail width manually. `P1` still remains open because the broader chat surface still needs real learner walkthrough evidence, plus a later decision on whether private-image preview should gain generated thumbnails for faster loads.
Status note: the student transcript now also keeps hover-only copy controls under each turn and renders assistant math through a KaTeX-backed markdown path, so basic formula replies no longer leak raw `$...$` syntax into the learner view. `P1` still remains open because the broader chat surface still needs real learner walkthrough evidence, richer message rendering QA, and a later decision on whether explicit completion should stay visible at all.
Status note: the live student composer now stays pinned at the bottom of the conversation view, and a chevron jump-to-latest control appears above it when the learner scrolls up through older turns. `P1` still remains open because the broader chat surface still needs real learner walkthrough evidence and more cross-device behavior checks around long transcripts.
Status note: the explicit completion contract now surfaces its result immediately again in the live chat. After `Homework done!`, the right rail opens a fourth `Summary` section with the returned student recap, weakness tags, and next-step recommendation instead of leaving completion visible only in backend state or after a later page reload. `P1` still remains open because the broader chat surface still needs real learner walkthrough evidence and a later decision on whether the explicit completion button itself should remain permanent.
Status note: the retired `/app/new` path exposed one more student dead end after the route cleanup: brand-new learners with no existing subject tags landed on the homework dashboard but only saw a self-link CTA. The dashboard empty state now owns a real first-homework launcher with subject selection, but `P2.1` still remains open because the broader student first-run path still needs full walkthrough validation after the onboarding and homework-start changes.
Status note: add a focused new-user dashboard follow-up under `P2.1`: the learner home for a freshly created account should feel purpose-built for first homework start instead of looking like the returning-user homework dashboard with only partial empty-state adaptation.
Status note: add a focused auth-surface polish follow-up under `P1.3` for the first commercial-feeling student demo. Sign-up and onboarding still need UI tightening around hierarchy, spacing, copy directness, and perceived continuity so the student does not feel like they are moving through a temporary bootstrap path before reaching the real product.

### P2 Journey And UX Hardening

- [ ] P2.1 Review the first-run student journey end to end from landing or auth through completed session.
- [ ] P2.2 Review the parent and tutor journeys from invite or approval through oversight and settings.
- [ ] P2.3 Convert friction findings into bounded fixes with before or after notes, screenshots, or smoke evidence.
- [ ] P2.4 Map which conversation or coaching modes should exist per subject family, and decide which ones stay universal versus subject-specific before the pilot broadens.
- [x] P2.5 Add a parent-created learner bootstrap path from the parent workspace while preserving the existing learner-created self-bootstrap flow.
- [ ] P2.6 Merge the standalone onboarding page into account creation once sign-up can collect role, age-gating, and profile essentials in one pass.
- [ ] P2.7 Design subject-wide learner resource libraries so longer-lived PDFs or notes can be attached at the subject level, toggled per conversation, and retrieved in a cost-safe way instead of being re-read wholesale on every request.

Status note: the current MVP still runs one shared coaching workflow across subjects. The product already stores a `subject_tag`, shows recent-subject rollups, uses subject text inside prompts and summaries, and allows a custom subject through the intake `Other subject` path, but memory, prompts, and UI flows are not yet specialized by subject family. Pilot work should decide whether math/science/humanities/language-study need different coaching modes, and whether custom subjects stay free-text, become admin-curated, or need alias normalization.
Status note: `P2.4` should now explicitly test subject-family answer policies. For maths, physics, chemistry, and any similarly quantitative subject, banban should be stricter about units, dimensional correctness, and equation formatting, with LaTeX used inline or on separate lines when it improves readability. Additional subject families worth testing next are history or geography, biology, literature or language arts, and language-learning or writing support, because each of those likely needs a different balance of precision, explanation, correction, and source use.
Status note: `P2.4` should also test reply registers, starting with a more formal teacher-like baseline versus a friendlier child-facing style. Keep this as an internal test matrix first rather than a permanent learner-visible setting. In French specifically, the friendlier mode can reduce stiffness by preferring more natural spoken phrasing such as `on` over `nous` and avoiding overly formal inversion, while still keeping the pedagogical structure clear and non-infantilizing.
Status note: add a later writing-support capability under `P2.4`: for essay-like homework, banban will need more reliable error extraction and memory of recurring writing weaknesses, so those signals can later feed reinforcement or quiz tools instead of staying one-off corrections inside a single chat.
Status note: add a later answer-mode experiment under `P2.4`: test at least `fast`, `thinking`, and `interactive` response modes as internal teaching variants before deciding whether learners ever need to see them directly. The likely first implementation path is prompt- and policy-level mode control rather than separate visible "models": `fast` favors short direct answers, `thinking` favors more structured reasoning and checking, and `interactive` favors guided back-and-forth questioning.
Status note: the student chat now ships a first learner-visible mode switch, but `interactive` is intentionally disabled again for the current Pilot slice. The product keeps only `fast` and `thinking` visible until the richer follow-up path exists for embedded interactive HTML tools or diagrams that can justify a genuinely different learner experience. `P2.4` remains open because the team still needs to evaluate transcript quality by subject family and decide whether any future `interactive` mode should return as a real teaching tool instead of a premature label.
Status note: the first parent-dashboard rethink now gives the parent route a calmer entry shape, but `P2.2` remains open because the full parent or tutor journey still needs evidence from invite or approval through linked-learner follow-up, review, settings, and billing, with screenshots or notes captured as friction is found.
Status note: the parent journey now also closes one major friction point from that walkthrough path: pending parent-approval requests addressed to the signed-in adult now surface inside the parent `/app` rail and can be accepted there without reopening the raw invite link. `P2.2` still remains open because the broader invite, settings, billing, and tutor-side walkthrough evidence still needs to be captured end to end.
Status note: add a parent-support assistant idea to the Pilot backlog: when a parent asks something like "what can I help my kid with, she's still confused about X", the product should eventually be able to answer with concrete next actions such as which exercises to review, which video to watch together, or which practice game to try. Keep this as a later guided-parent-help capability, not as part of the current student-first MVP flow.
Status note: `P2.5` is now implemented through a parent-owned learner-creation panel in the parent `/app` rail. A signed-in parent can create a linked learner account, choose the learner's age band plus language defaults, and immediately bring that learner under the adult's billing and oversight context without removing the original learner-created self-bootstrap path. The current implementation is intentionally narrow: because learner identity still maps 1:1 to `auth.users`, the parent-created path creates an initial learner email and temporary password rather than a profile-only managed learner record. A later managed-profile plus learner-claim flow can still replace that bootstrap model if pilot evidence justifies the extra auth complexity.
Status note: the student redesign currently treats subjects as UI filters over the existing `subject_tag` field, not as canonical subject entities or project objects. The new left-rail "Homework" folders and subject-specific home view are intentionally built on top of that lighter filter contract until Pilot decides whether alias normalization or true subject entities are worth the extra data-model complexity.
Status note: the refreshed student `/app` and `/app/conversations/[conversationId]` surfaces now read like "open the chat with this homework" and "continue the discussion" rather than a multi-card session wizard, but the backend contract is still unchanged: a persisted conversation is created before the learner enters the chat, and summaries still depend on explicit completion. Pilot still needs to decide whether the first learner message should implicitly create the conversation and whether student summaries should be generated automatically when a chat closes without a manual completion step.
Status note: the main student path now starts and resumes from `/app`. Subject-level quick-start creates a bare conversation shell, uploads staged files, sends the learner's first real message, and only then opens the live chat. `/app/new` now survives only as a compatibility redirect for old links, and the `graded homework` toggle is effectively retired from the learner-facing flow because it has not shown strong student value in the chat-first path.
Status note: `P2.7` should treat subject-wide uploads as a separate shared-resource layer rather than as ordinary per-chat attachments. The cost concern is real: repeatedly re-parsing whole textbooks or year-long PDFs on every request would be wasteful and fragile, especially when the learner only needs one exercise or page. The Pilot direction should therefore be: extract once, split into addressable chunks or sections, track lightweight metadata, let the learner toggle only the relevant resources for a conversation, and retrieve only the most relevant chunks instead of resending entire documents to the model each turn. A later year-dependent subject split can build on that library once Pilot evidence justifies the extra structure.
Status note: the current learner upload path is still OCR-first and text-centric, so image-native reasoning tasks such as circuit sketches, geometry figures, graphs, or handwritten setups cannot be handled reliably when there is little or no extractable text. The recommended next Pilot path is a dedicated vision-preprocessing step for low-text images: run a bounded image-analysis pass first, turn the visual into structured text or diagram context, then feed that derived context into the existing coach flow. This is the lower-risk option because it fits the current attachment and prompt architecture, keeps the coach contract mostly text-based, and avoids widening the live multimodal surface too early.
Status note: true multimodal coaching should remain the later stronger path once Pilot evidence justifies it. That later version would pass raw image inputs directly into the coach reply call instead of relying on preprocessed text. It should produce better results on difficult diagrams and mixed visual reasoning tasks, but it requires broader service, prompt, logging, moderation, and cost-accounting changes than the preprocessing path. Treat preprocessing as the practical near-term fix and multimodal coaching as the later architecture upgrade, not as two parallel first-step implementations.
Status note: add a later Pilot visualization idea for the student right rail: when a concept benefits from a visual explanation, the assistant could generate safe HTML or code-backed interactive diagrams there instead of only text. Keep this as a post-MVP teaching aid and rendering-safety decision, not as part of the current core homework chat contract.
Status note: if the core student demo stabilizes, an acceptable `P2.4` or `Maps` `v0` could embed simple aesthetic diagrams directly in the student surface from generated code or summarized upload content. Keep that slice narrow: visually useful, safe to render, and clearly subordinate to the core homework chat rather than a second full workflow.
Status note: onboarding is now reduced to the profile essentials that sign-up still cannot collect in one pass. Role selection is already chosen during account creation, the shared public footer no longer appears on `/onboarding`, and `P2.6` remains open because the route should eventually disappear once sign-up can own role, age-gating, and profile setup without a second transitional screen.
Status note: when `P2.6` is implemented, replace the current age-band capture with a real birthdate field as the source of truth for age-gating and downstream learner rules, then remove the related age-bracket UI from sign-up and onboarding instead of maintaining both systems in parallel.
Status note: when `P2.6` is implemented, add an explicit class or grade selection during registration or merged onboarding, and use that level as part of the pedagogical baseline for banban. Example: if the learner is registered as `5e`, the coaching and explanation path should assume the normal prerequisites for that level have already been studied unless the learner context says otherwise.
Status note: add an onboarding discovery question for the learner's interests during Pilot planning, so future homework or practice examples can adapt to hobbies or themes that make the explanation more engaging when relevant. Keep this as a later personalization layer, not a blocker for the current sign-up or homework-start simplification.
Status note: add a later subject-learning-memory idea under `P2.4`: keep track of recurring language, expression, and wording weaknesses across subjects when that is pedagogically useful, so banban can later support targeted drilling or reinforcement instead of treating those issues as one-off corrections.
Status note: add a later student-input UX follow-up under `P1.3` and `P2.1`: the learner chat should support a clearer multi-line prompt experience on touch devices, so longer student questions or structured asks remain readable and editable before send.

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
- [ ] P5.3 Add a prompt-governance layer so AI prompt builders, routes, versions, and modification history stay reviewable and synchronized instead of drifting across code and docs.

Status note: the first `P5.1` hotspot audit flags six areas as the highest-value refactor targets. `lib/server/conversations/conversation-service.ts` currently mixes request parsing, validation, auth, persistence, moderation, AI orchestration, usage tracking, and completion side effects in one module. `lib/server/links/invitation-service.ts` mixes parsing, token lifecycle, invitation creation, acceptance flows, link activation, and route-href derivation in one file. `lib/server/memory/service.ts` combines sensitive-text policy, fallback generation, parsing, loading, mutation handling, and completion-triggered refresh logic. The shared copy layer is now split by domain but still concentrated into very large dictionaries in `lib/i18n/ui-copy.ts`, `lib/i18n/student-flow-copy.ts`, and `lib/i18n/dashboard-copy.ts`, which makes copy iteration and review harder than it should be. `components/dashboard/student/student-conversation-workbench.tsx` still owns too much client state plus fetch and mutation orchestration for the student session surface. The smoke suite also duplicates server-bootstrap, cookie-jar, and authenticated-request harness code across `scripts/smoke-*.mjs`, so test maintenance will keep getting more expensive unless that harness is extracted.
Status note: `P5.3` now has a first foundation. The current prompt families are inventoried in `docs/ai_prompt_registry_v1.md`, generated from `lib/server/ai/prompt-registry.json` plus live version constants in `lib/server/ai/prompts/shared.ts`, and synced by `scripts/sync-prompt-registry.mjs`. `P5.3` remains open because this still needs stronger enforcement and later coverage if the prompt surface expands beyond the current seven families.

## Working Method

For each pilot slice record:

1. the target journey or trust problem
2. the evidence source
3. the bounded change set
4. the verification method
5. the remaining risk or follow-up
6. the `P*` status note or backlog line updated in this file

Keep the pilot lane strict, but do not let it absorb unfinished MVP launch blockers.
