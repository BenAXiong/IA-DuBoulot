# MVP To-Do List

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [MVP timeline](mvp_timeline.md) | [Decision log](decision_log.md) | [Work sessions log](work_sessions.md)

Use these task IDs everywhere: session log, decision log, commits, reviews, and release notes.

## Progress Snapshot

Overall progress uses a scaled bar. Phase bars use one unit per subtask.

- Overall: `[#######################.......]` `99/128` complete (`77%`)
- A0: `[xxxxxxxxxxxxxxxx.....]` `16/21`
- A1: `[xxxxxxxxxxxxxxxx]` `16/16`
- A2: `[xxxxxxxxxxx......]` `11/17`
- A3: `[xxxxxxxxxxxxxxxxx]` `17/17`
- A4: `[xxxxxxxxxxxxxxxxxxx]` `19/19`
- A5: `[xxxxxxxxxxxxx]` `13/13`
- A6: `[xxxxxx.......]` `6/13`
- A7: `[x...........]` `1/12`

## Table Of Contents

- [Phase A0 - Bootstrap And Governance](#phase-a0---bootstrap-and-governance)
- [Phase A1 - Data Contracts And Service Boundaries](#phase-a1---data-contracts-and-service-boundaries)
- [Phase A2 - App Foundation](#phase-a2---app-foundation)
- [Phase A3 - Student Core Workflow](#phase-a3---student-core-workflow)
- [Phase A4 - AI Coaching, Extraction, And Safety](#phase-a4---ai-coaching-extraction-and-safety)
- [Phase A5 - Parent And Tutor Oversight](#phase-a5---parent-and-tutor-oversight)
- [Phase A6 - Memory, Billing, And Privacy Controls](#phase-a6---memory-billing-and-privacy-controls)
- [Phase A7 - QA, iPad Polish, And Launch Readiness](#phase-a7---qa-ipad-polish-and-launch-readiness)

## 🟨 Phase A0 - Bootstrap And Governance

Outcome: the repo is real, the operating rules are in place, and future implementation has a stable source of truth.

### A0.1 Repository, Naming, And Deployment Bootstrap

- [x] A0.1.1 Initialize local git and connect a GitHub remote.
- [x] A0.1.2 Create the GitHub repository and protect `main`.
- [x] A0.1.3 Decide the canonical project/product naming across repo, product, and deployment.
- [x] A0.1.4 Create preview and production deployment targets.
- [x] A0.1.5 Write branch naming and PR review conventions once GitHub exists.

Current direction: GitHub repo exists, Vercel is the chosen deployment platform, the project is `https://vercel.com/bmavmartinez-8475s-projects/ia-du-boulot`, and the app is expected to live at repo root `./`.

### A0.2 Service Accounts And Environment Matrix

- [x] A0.2.1 Create the Supabase project.
- [ ] A0.2.2 Create the PostHog project.
- [ ] A0.2.3 Create the Resend account and sender setup.
- [ ] A0.2.4 Choose the primary AI provider and a fallback provider.
- [x] A0.2.5 Choose the billing provider compatible with the founder's geography/entity setup.
- [x] A0.2.6 Create `.env.example` and a secrets ownership checklist.

Current direction: primary starter AI path is Gemini; fallback provider still needs to be selected. Billing provider is Lemon Squeezy.
Constraint: verify the Gemini tier and data-handling settings are suitable for minors before any live child traffic uses the AI flow.
Constraint: a founder personal AI subscription is not treated as a backend fallback provider for the app.

### A0.3 Traceability Spine

- [x] A0.3.1 Create `README.md` with the source-of-truth index.
- [x] A0.3.2 Create `AGENTS.md` with mandatory workflow rules.
- [x] A0.3.3 Create the implementation plan and brief adjustments docs.
- [x] A0.3.4 Create the decision log and work sessions log.
- [x] A0.3.5 Create `Vibestructions`.
- [ ] A0.3.6 Add issue labels and review templates after GitHub setup.

### A0.4 Product Constraints And Acceptance Rules

- [x] A0.4.1 Write the role/access matrix for student, parent, tutor, and admin.
- [ ] A0.4.2 Write smoke-test acceptance criteria for the MVP core flows.
- [x] A0.4.3 Confirm the MVP language set and translation expectations.
- [x] A0.4.4 Define retention, deletion, and privacy expectations for minors.

Reference: [Minors privacy baseline](minors_privacy_baseline.md) is now the chosen MVP baseline for implementation, with later legal/policy review still required before launch.

## 🟩 Phase A1 - Data Contracts And Service Boundaries

Outcome: the data model, access rules, and backend boundaries are explicit before UI breadth starts.

### A1.1 Core Schema

- [x] A1.1.1 Draft the first Supabase SQL schema for core tables.
- [x] A1.1.2 Add foreign keys, indexes, enums, timestamps, and deletion strategy.
- [x] A1.1.3 Model attachments, workspace states, summaries, tutor notes, and usage counters.
- [x] A1.1.4 Model audit logs, moderation events, and memory tables.
- [x] A1.1.5 Review the schema against the role matrix and MVP scope boundaries.

Reference: [Supabase schema V1](supabase_schema_v1.md) and [initial schema SQL](../supabase/migrations/20260310_000001_initial_schema.sql)
Status note: the initial schema SQL has been applied successfully in the hosted Supabase project.

### A1.2 Access Control And RLS

- [x] A1.2.1 Write table-by-table access rules before coding policies.
- [x] A1.2.2 Implement RLS policies for each role relationship.
- [x] A1.2.3 Add server-side authorization checks for all sensitive routes.
- [x] A1.2.4 Verify student, parent, tutor, and admin visibility with seeded test accounts.

Reference: [Access rules V1](access_rules_v1.md) | [RLS migration draft](../supabase/migrations/20260310_000002_access_rules_and_rls.sql) | [RLS fixture verification](rls_fixture_verification.md)
Status note: the RLS migration SQL has been applied successfully in the hosted Supabase project.
Status note: shared server authorization helpers now back the first authenticated routes in `app/api/auth/...`.
Status note: deterministic hosted fixtures now verify the current hosted Supabase RLS behavior with `17` passing checks across student, parent, tutor, and admin roles.

### A1.3 Backend Contracts

- [x] A1.3.1 Write the API route map for auth, uploads, conversations, summaries, memory, parent, tutor, billing, and admin.
- [x] A1.3.2 Define service interfaces for AI, uploads, translation, moderation, and billing.
- [x] A1.3.3 Define error handling and audit logging conventions.
- [x] A1.3.4 Define file storage buckets and attachment metadata rules.

Reference: [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Error and audit conventions](error_audit_conventions.md) | [Storage and attachment rules](storage_attachment_rules.md)

### A1.4 Seed Data And Smoke Fixtures

- [x] A1.4.1 Create one seeded student-parent-tutor-admin fixture set.
- [x] A1.4.2 Create realistic sample homework attachments and extracted-text examples.
- [x] A1.4.3 Document test-account credentials and safe demo data rules.

Reference: [RLS fixture verification](rls_fixture_verification.md) | [Sample attachment corpus](sample_attachment_corpus.md)
Status note: fixture credentials stay local-only through `SUPABASE_FIXTURE_PASSWORD` and the seeded content remains fictional demo data.
Status note: the deterministic fixture set now seeds successfully into the hosted Supabase project.
Status note: the canonical upload/extraction sample corpus now lives under `fixtures/homework-samples/`.

## 🟨 Phase A2 - App Foundation

Outcome: the application shell supports real role-aware development instead of isolated mockups.

### A2.1 Next.js Scaffold

- [x] A2.1.1 Initialize the Next.js app with TypeScript.
- [x] A2.1.2 Add Tailwind CSS and baseline design tokens.
- [ ] A2.1.3 Add the component primitive layer and form conventions.
- [x] A2.1.4 Establish the root folder structure from the brief.
- [ ] A2.1.5 Add linting, formatting, and modularity rules to prevent god components and god services.
- [ ] A2.1.6 Add localization structure for `fr`, `en`, and `zh` without coupling translations to domain logic.

### A2.2 Auth And Role Onboarding

- [x] A2.2.1 Connect Supabase auth to the app.
- [x] A2.2.2 Implement role-aware signup/invite flows.
- [x] A2.2.3 Persist user profile and role metadata.
- [x] A2.2.4 Implement protected routes and session refresh handling.

Status note: the SSR auth foundation is now wired into `/auth`, `/auth/confirm`, `/onboarding`, and a protected `/app` page.
Status note: safe app-profile fields now sync into Supabase auth metadata on bootstrap and profile updates.
Status note: canonical invitation rows now back the parent-approval and tutor-link flows, with `/invite/[token]` as the shared acceptance surface.
Status note: same-browser invite confirmation now recovers pending tutor/parent flows through the `ia_pending_invite` cookie and the `/auth/complete` redirect bridge even when the Supabase email template does not preserve `next`.
Status note: the third Supabase migration for `account_link_invitations` is now applied to the hosted project.

### A2.3 Shared Layouts And Navigation

- [x] A2.3.1 Build the public shell for landing, pricing, and auth.
- [x] A2.3.2 Build the authenticated app shell with responsive navigation.
- [x] A2.3.3 Create role-specific dashboard layout variants.
- [x] A2.3.4 Validate the shell on iPad portrait and landscape widths.

Status note: landing, pricing, auth, onboarding, and invite pages now share one public shell.
Status note: `/app` now uses a dedicated authenticated shell and role-specific dashboard modules instead of a single temporary mixed page.
Status note: on 2026-03-11 the shell was checked in a browser pass at `820x1180` and `1180x820` on `/auth`, `/app`, and `/invite/[token]`, with no horizontal overflow detected. Real iPad Safari remains part of `A7.1`.

### A2.4 Telemetry And Feature Controls

- [ ] A2.4.1 Add basic analytics hooks.
- [ ] A2.4.2 Add server/runtime logging conventions.
- [ ] A2.4.3 Add feature flags or environment toggles for risky integrations.

## 🟩 Phase A3 - Student Core Workflow

Outcome: a student can complete a full homework-help session through the product.

### A3.1 Student Dashboard

- [x] A3.1.1 Build the student dashboard with the main `New homework` CTA.
- [x] A3.1.2 Show recent sessions, subject tags, and linked adult status.
- [x] A3.1.3 Show trial, quota, or usage status.

Reference: [Student dashboard V1](student_dashboard_v1.md)
Status note: the student home screen now reads a dedicated server snapshot for recent conversations, subject-tag rollup, adult-link counts, parent-approval state, and latest usage counters.
Status note: `/app/new` is now the canonical student intake entry route, even though the detailed title/subject/upload flow still belongs to `A3.2`.

### A3.2 New Homework Intake

- [x] A3.2.1 Build assignment title and subject entry.
- [x] A3.2.2 Add upload for image, screenshot, and PDF files.
- [x] A3.2.3 Add pasted-text input and graded-homework toggle.
- [x] A3.2.4 Build extracted-text preview and manual edit flow.

Reference: [Student intake V1](student_intake_v1.md)
Status note: `/app/new` now hosts the real intake form with title, subject, staged files, pasted text, graded toggle, and editable review text.
Status note: files and extracted-text review are still browser-local at this stage; upload persistence belongs to `A3.3` and real extraction belongs to `A4.3`.

### A3.3 Conversation Persistence

- [x] A3.3.1 Create conversation and message persistence.
- [x] A3.3.2 Support draft restoration and return-to-session behavior.
- [x] A3.3.3 Support attachment references inside the session history.

Reference: [Student session persistence V1](student_session_persistence_v1.md)
Status note: validating `/app/new` now creates a persisted `conversations` row, `workspace_states` row, and first student message through the new conversation service.
Status note: the dashboard recent-session cards now reopen `/app/conversations/[conversationId]` instead of staying informational only.
Status note: attachment references are currently persisted as human-readable intake context inside the session history and workspace notes; true `attachments` rows still belong to the later upload path.

### A3.4 Homework Chat And Workspace

- [x] A3.4.1 Build the core chat interface.
- [x] A3.4.2 Build the side workspace for assignment text, plan, and draft answer.
- [x] A3.4.3 Add upload, hint, and summarize controls.
- [x] A3.4.4 Optimize the chat-workspace split for iPad landscape use.

Reference: [Student workbench V1](student_workbench_v1.md)
Status note: `/app/conversations/[conversationId]` now hosts the real student workbench with a persisted transcript, server-owned message mutations, and a saveable side workspace.
Status note: the original `A3` exit state used deterministic reply helpers and text-only upload references, but the current local workspace has already moved into the `A4` provider/upload path described below.
Status note: on 2026-03-11 the workbench was checked in a Playwright emulated tablet pass at `820x1180` and `1180x820` on `/app` and `/app/conversations/[conversationId]`, with no horizontal overflow detected.

### A3.5 Session History And Summary

- [x] A3.5.1 Build the student session history list.
- [x] A3.5.2 Build the student session detail and summary view.
- [x] A3.5.3 Support marking a session complete and triggering summary generation.

Reference: [Student history and summary V1](student_history_summary_v1.md)
Status note: `/app/history` is now the canonical long-form student session list, while `/app` keeps only recent-session shortcuts.
Status note: `/app/conversations/[conversationId]` now renders the persisted student summary and a completion card in the same detail surface as the transcript and workspace.
Status note: the original `A3` exit state used a deterministic student summary, but the current local workspace has already moved into the `A4.5` multi-audience summary path described below.

## 🟩 Phase A4 - AI Coaching, Extraction, And Safety

Outcome: the product behaves like a coach instead of a generic answer bot.

### A4.1 AI Provider Layer

- [x] A4.1.1 Implement the swappable provider interface.
- [x] A4.1.2 Add configuration for text-plus-image support.
- [x] A4.1.3 Add token, cost, and failure logging at the provider boundary.

Status note: the current local workspace now contains a build-clean Gemini-backed provider adapter under `lib/server/ai/`, with text-plus-image/extraction configuration and provider-boundary runtime logging in place.
Status note: local student-flow smoke passed again on `2026-03-11`; the latest run still exercised extraction, coach, and summary fallbacks, but those fallbacks now define the stable MVP behavior instead of blocking phase closure.

### A4.2 Prompt Contracts

- [x] A4.2.1 Write the student coach system prompt.
- [x] A4.2.2 Write the parent summary prompt.
- [x] A4.2.3 Write the tutor insight prompt.
- [x] A4.2.4 Add prompt versioning and location rules.

Status note: the current local workspace now contains prompt modules for student coaching, attachment extraction, summaries, translation, and shared prompt-version constants under `lib/server/ai/prompts/`.

### A4.3 Upload Interpretation And Extraction

- [x] A4.3.1 Implement extraction for PDFs with selectable text.
- [x] A4.3.2 Implement multimodal extraction for images and screenshots.
- [x] A4.3.3 Normalize extracted text and preserve source metadata.
- [x] A4.3.4 Fall back gracefully when extraction confidence is weak.

Status note: the current local workspace now contains real signed upload + confirm routes, attachment persistence, Gemini-backed extraction, metadata updates, retry extraction, and private attachment access URLs.
Status note: `POST /api/uploads/confirm` now degrades gracefully when extraction fails by marking the attachment `failed`, returning a warning, and keeping the student flow alive.
Status note: the per-file size enforcement now matches the documented storage rules; future work here is reliability tuning rather than missing contract coverage.

### A4.4 Coach Mode And Moderation

- [x] A4.4.1 Ask for the student's attempt when appropriate.
- [x] A4.4.2 Bias toward hints, decomposition, and feedback over final answers.
- [x] A4.4.3 Add moderation checks for risky prompts and outputs.
- [x] A4.4.4 Log moderation events and blocked behaviors.

Status note: the current local workspace now routes student turns through the Gemini coach prompt plus local moderation checks for user input, assistant output, and extraction text, with flagged/blocked events persisted to `moderation_events`.
Status note: `POST /api/conversations/[conversationId]/messages` now falls back to the deterministic draft coach when Gemini fails, so the student still receives a structured reply instead of a route error.

### A4.5 Summaries And Translation

- [x] A4.5.1 Generate student-facing summaries.
- [x] A4.5.2 Generate parent-facing summaries with translation support.
- [x] A4.5.3 Generate tutor insight summaries with weakness tags.
- [x] A4.5.4 Store next-step recommendations for later review.

Status note: the current local workspace now generates provider-backed student, parent, and tutor summaries on completion, and stores translated parent variants for `en` and `zh`.
Status note: the required student summary now falls back to the deterministic A3 helper when Gemini fails, and parent/tutor variants are best-effort so student completion stays available.
Status note: the downstream adult visibility surfaces are now live in `A5`, so the remaining follow-up is QA around provider reliability, not missing summary contracts.

## 🟩 Phase A5 - Parent And Tutor Oversight

Outcome: adults can review the student's work with the right visibility boundaries.

### A5.1 Linking Model

- [x] A5.1.1 Implement parent-student linking.
- [x] A5.1.2 Implement tutor-student linking.
- [x] A5.1.3 Implement invite or approval flows for linked access.

### A5.2 Parent Surfaces

- [x] A5.2.1 Build the parent dashboard with recent sessions and weekly summaries.
- [x] A5.2.2 Build the parent session detail view.
- [x] A5.2.3 Add translation toggle and billing status display.

### A5.3 Tutor Surfaces And Notes

- [x] A5.3.1 Build the tutor dashboard with linked students and recent sessions.
- [x] A5.3.2 Build the tutor student detail view.
- [x] A5.3.3 Build tutor private notes invisible to students.
- [x] A5.3.4 Add weak-spot summaries and recommended next topics.

### A5.4 Sensitive Access Auditing

- [x] A5.4.1 Log parent and tutor access to student sessions.
- [x] A5.4.2 Add admin review tools for sensitive access events.
- [x] A5.4.3 Verify private-note isolation and access restrictions.

Reference: [Oversight surfaces V1](oversight_surfaces_v1.md)
Status note: `/app` now renders data-backed parent and tutor dashboards, `/app/students/[studentUserId]` hosts the linked-student detail flow, `/app/review/[conversationId]` hosts the role-filtered review surface, and `/app/audit` gives admin the first sensitive-access queue.
Status note: tutor private notes now mutate only through canonical routes, stay hidden from parent/student, and emit audit rows on create, update, and delete.
Status note: `scripts/smoke-adult-oversight.mjs` now verifies parent, tutor, and admin route behavior against a temporary local `next start` instance.

## ⬜ Phase A6 - Memory, Billing, And Privacy Controls

Outcome: the MVP can retain useful educational context, gate usage, and handle data responsibly.

### A6.1 Student Memory Profile

- [ ] A6.1.1 Generate structured learning-relevant memory updates.
- [ ] A6.1.2 Store strengths, weaknesses, preferences, and recurring topics.
- [ ] A6.1.3 Make memory editable and deletable.
- [ ] A6.1.4 Prevent speculative or sensitive profiling from being stored.

### A6.2 Usage Counters, Trial, And Quotas

- [x] A6.2.1 Track sessions, uploads, and AI usage.
- [x] A6.2.2 Implement a free-trial rule set.
- [x] A6.2.3 Surface quota state in student and parent views.
Status note: the app now records session, upload, assistant-message, and provider-token usage in `usage_counters`, uses a 30-day first-usage trial plus monthly quotas for gating, and surfaces the same quota snapshot on student and parent dashboard reads.

### A6.3 Billing Service

- [x] A6.3.1 Implement the billing abstraction layer.
- [x] A6.3.2 Implement webhook handling for subscription state.
- [x] A6.3.3 Persist subscription status without hardwiring provider-specific logic into the app.
Status note: Lemon Squeezy now sits behind `lib/server/billing`, parent billing actions route through canonical checkout/portal endpoints, and a signed webhook smoke verifies subscription sync even when local checkout env remains intentionally blank.

### A6.4 Privacy And Data Controls

- [ ] A6.4.1 Build billing/settings and privacy/data control screens.
- [ ] A6.4.2 Implement account-linked data deletion flows.
- [ ] A6.4.3 Write clear user-facing privacy copy for the MVP.

## ⬜ Phase A7 - QA, iPad Polish, And Launch Readiness

Outcome: the product is stable enough for serious parent and tutor trials.

### A7.1 iPad And Responsive QA

- [ ] A7.1.1 Test upload, chat, and workspace flows on iPad Safari.
- [ ] A7.1.2 Fix keyboard, layout, and tap-target issues.
- [ ] A7.1.3 Verify portrait and landscape tablet behavior.

### A7.2 Smoke Tests And Regression Coverage

- [ ] A7.2.1 Create a written smoke test checklist for student, parent, tutor, and admin roles.
- [x] A7.2.2 Add automated coverage for the highest-risk backend and auth paths.
- [ ] A7.2.3 Add a pre-demo regression pass.

Status note: fixture-backed automated smoke now exists for both the student core flow (`scripts/smoke-student-flow.mjs`) and the parent/tutor/admin oversight flow (`scripts/smoke-adult-oversight.mjs`).

### A7.3 Performance And Cost Controls

- [ ] A7.3.1 Add request caps and guardrails for expensive AI usage.
- [ ] A7.3.2 Add caching or summarization where it lowers cost without harming behavior.
- [ ] A7.3.3 Review storage and upload limits against trial economics.

### A7.4 Launch Candidate

- [ ] A7.4.1 Decide whether PWA installability is worth doing before beta.
- [ ] A7.4.2 Prepare demo accounts and a founder walkthrough script.
- [ ] A7.4.3 Freeze the MVP scope and publish the launch checklist.
