# MVP To-Do List

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [MVP timeline](mvp_timeline.md) | [Decision log](decision_log.md) | [Work sessions log](work_sessions.md)

Use these task IDs everywhere: session log, decision log, commits, reviews, and release notes.

## Phase A0 - Bootstrap And Governance

Outcome: the repo is real, the operating rules are in place, and future implementation has a stable source of truth.

### A0.1 Repository, Naming, And Deployment Bootstrap

- [x] A0.1.1 Initialize local git and connect a GitHub remote.
- [ ] A0.1.2 Create the GitHub repository and protect `main`.
- [x] A0.1.3 Decide the canonical project/product naming across repo, product, and deployment.
- [x] A0.1.4 Create preview and production deployment targets.
- [ ] A0.1.5 Write branch naming and PR review conventions once GitHub exists.

Current direction: GitHub repo exists, Vercel is the chosen deployment platform, the project is `https://vercel.com/bmavmartinez-8475s-projects/ia-du-boulot`, and the app is expected to live at repo root `./`.

### A0.2 Service Accounts And Environment Matrix

- [ ] A0.2.1 Create the Supabase project.
- [ ] A0.2.2 Create the PostHog project.
- [ ] A0.2.3 Create the Resend account and sender setup.
- [ ] A0.2.4 Choose the primary AI provider and a fallback provider.
- [x] A0.2.5 Choose the billing provider compatible with the founder's geography/entity setup.
- [ ] A0.2.6 Create `.env.example` and a secrets ownership checklist.

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

- [ ] A0.4.1 Write the role/access matrix for student, parent, tutor, and admin.
- [ ] A0.4.2 Write smoke-test acceptance criteria for the MVP core flows.
- [x] A0.4.3 Confirm the MVP language set and translation expectations.
- [x] A0.4.4 Define retention, deletion, and privacy expectations for minors.

Reference: [Minors privacy baseline](minors_privacy_baseline.md) is now the chosen MVP baseline for implementation, with later legal/policy review still required before launch.

## Phase A1 - Data Contracts And Service Boundaries

Outcome: the data model, access rules, and backend boundaries are explicit before UI breadth starts.

### A1.1 Core Schema

- [ ] A1.1.1 Draft the first Supabase SQL schema for core tables.
- [ ] A1.1.2 Add foreign keys, indexes, enums, timestamps, and deletion strategy.
- [ ] A1.1.3 Model attachments, workspace states, summaries, tutor notes, and usage counters.
- [ ] A1.1.4 Model audit logs, moderation events, and memory tables.
- [ ] A1.1.5 Review the schema against the role matrix and MVP scope boundaries.

### A1.2 Access Control And RLS

- [ ] A1.2.1 Write table-by-table access rules before coding policies.
- [ ] A1.2.2 Implement RLS policies for each role relationship.
- [ ] A1.2.3 Add server-side authorization checks for all sensitive routes.
- [ ] A1.2.4 Verify student, parent, tutor, and admin visibility with seeded test accounts.

### A1.3 Backend Contracts

- [ ] A1.3.1 Write the API route map for auth, uploads, conversations, summaries, memory, parent, tutor, billing, and admin.
- [ ] A1.3.2 Define service interfaces for AI, uploads, translation, moderation, and billing.
- [ ] A1.3.3 Define error handling and audit logging conventions.
- [ ] A1.3.4 Define file storage buckets and attachment metadata rules.

### A1.4 Seed Data And Smoke Fixtures

- [ ] A1.4.1 Create one seeded student-parent-tutor-admin fixture set.
- [ ] A1.4.2 Create realistic sample homework attachments and extracted-text examples.
- [ ] A1.4.3 Document test-account credentials and safe demo data rules.

## Phase A2 - App Foundation

Outcome: the application shell supports real role-aware development instead of isolated mockups.

### A2.1 Next.js Scaffold

- [ ] A2.1.1 Initialize the Next.js app with TypeScript.
- [ ] A2.1.2 Add Tailwind CSS and baseline design tokens.
- [ ] A2.1.3 Add the component primitive layer and form conventions.
- [ ] A2.1.4 Establish the root folder structure from the brief.
- [ ] A2.1.5 Add linting, formatting, and modularity rules to prevent god components and god services.
- [ ] A2.1.6 Add localization structure for `fr`, `en`, and `zh` without coupling translations to domain logic.

### A2.2 Auth And Role Onboarding

- [ ] A2.2.1 Connect Supabase auth to the app.
- [ ] A2.2.2 Implement role-aware signup/invite flows.
- [ ] A2.2.3 Persist user profile and role metadata.
- [ ] A2.2.4 Implement protected routes and session refresh handling.

### A2.3 Shared Layouts And Navigation

- [ ] A2.3.1 Build the public shell for landing, pricing, and auth.
- [ ] A2.3.2 Build the authenticated app shell with responsive navigation.
- [ ] A2.3.3 Create role-specific dashboard layout variants.
- [ ] A2.3.4 Validate the shell on iPad portrait and landscape widths.

### A2.4 Telemetry And Feature Controls

- [ ] A2.4.1 Add basic analytics hooks.
- [ ] A2.4.2 Add server/runtime logging conventions.
- [ ] A2.4.3 Add feature flags or environment toggles for risky integrations.

## Phase A3 - Student Core Workflow

Outcome: a student can complete a full homework-help session through the product.

### A3.1 Student Dashboard

- [ ] A3.1.1 Build the student dashboard with the main `New homework` CTA.
- [ ] A3.1.2 Show recent sessions, subject tags, and linked adult status.
- [ ] A3.1.3 Show trial, quota, or usage status.

### A3.2 New Homework Intake

- [ ] A3.2.1 Build assignment title and subject entry.
- [ ] A3.2.2 Add upload for image, screenshot, and PDF files.
- [ ] A3.2.3 Add pasted-text input and graded-homework toggle.
- [ ] A3.2.4 Build extracted-text preview and manual edit flow.

### A3.3 Conversation Persistence

- [ ] A3.3.1 Create conversation and message persistence.
- [ ] A3.3.2 Support draft restoration and return-to-session behavior.
- [ ] A3.3.3 Support attachment references inside the session history.

### A3.4 Homework Chat And Workspace

- [ ] A3.4.1 Build the core chat interface.
- [ ] A3.4.2 Build the side workspace for assignment text, plan, and draft answer.
- [ ] A3.4.3 Add upload, hint, and summarize controls.
- [ ] A3.4.4 Optimize the chat-workspace split for iPad landscape use.

### A3.5 Session History And Summary

- [ ] A3.5.1 Build the student session history list.
- [ ] A3.5.2 Build the student session detail and summary view.
- [ ] A3.5.3 Support marking a session complete and triggering summary generation.

## Phase A4 - AI Coaching, Extraction, And Safety

Outcome: the product behaves like a coach instead of a generic answer bot.

### A4.1 AI Provider Layer

- [ ] A4.1.1 Implement the swappable provider interface.
- [ ] A4.1.2 Add configuration for text-plus-image support.
- [ ] A4.1.3 Add token, cost, and failure logging at the provider boundary.

### A4.2 Prompt Contracts

- [ ] A4.2.1 Write the student coach system prompt.
- [ ] A4.2.2 Write the parent summary prompt.
- [ ] A4.2.3 Write the tutor insight prompt.
- [ ] A4.2.4 Add prompt versioning and location rules.

### A4.3 Upload Interpretation And Extraction

- [ ] A4.3.1 Implement extraction for PDFs with selectable text.
- [ ] A4.3.2 Implement multimodal extraction for images and screenshots.
- [ ] A4.3.3 Normalize extracted text and preserve source metadata.
- [ ] A4.3.4 Fall back gracefully when extraction confidence is weak.

### A4.4 Coach Mode And Moderation

- [ ] A4.4.1 Ask for the student's attempt when appropriate.
- [ ] A4.4.2 Bias toward hints, decomposition, and feedback over final answers.
- [ ] A4.4.3 Add moderation checks for risky prompts and outputs.
- [ ] A4.4.4 Log moderation events and blocked behaviors.

### A4.5 Summaries And Translation

- [ ] A4.5.1 Generate student-facing summaries.
- [ ] A4.5.2 Generate parent-facing summaries with translation support.
- [ ] A4.5.3 Generate tutor insight summaries with weakness tags.
- [ ] A4.5.4 Store next-step recommendations for later review.

## Phase A5 - Parent And Tutor Oversight

Outcome: adults can review the student's work with the right visibility boundaries.

### A5.1 Linking Model

- [ ] A5.1.1 Implement parent-student linking.
- [ ] A5.1.2 Implement tutor-student linking.
- [ ] A5.1.3 Implement invite or approval flows for linked access.

### A5.2 Parent Surfaces

- [ ] A5.2.1 Build the parent dashboard with recent sessions and weekly summaries.
- [ ] A5.2.2 Build the parent session detail view.
- [ ] A5.2.3 Add translation toggle and billing status display.

### A5.3 Tutor Surfaces And Notes

- [ ] A5.3.1 Build the tutor dashboard with linked students and recent sessions.
- [ ] A5.3.2 Build the tutor student detail view.
- [ ] A5.3.3 Build tutor private notes invisible to students.
- [ ] A5.3.4 Add weak-spot summaries and recommended next topics.

### A5.4 Sensitive Access Auditing

- [ ] A5.4.1 Log parent and tutor access to student sessions.
- [ ] A5.4.2 Add admin review tools for sensitive access events.
- [ ] A5.4.3 Verify private-note isolation and access restrictions.

## Phase A6 - Memory, Billing, And Privacy Controls

Outcome: the MVP can retain useful educational context, gate usage, and handle data responsibly.

### A6.1 Student Memory Profile

- [ ] A6.1.1 Generate structured learning-relevant memory updates.
- [ ] A6.1.2 Store strengths, weaknesses, preferences, and recurring topics.
- [ ] A6.1.3 Make memory editable and deletable.
- [ ] A6.1.4 Prevent speculative or sensitive profiling from being stored.

### A6.2 Usage Counters, Trial, And Quotas

- [ ] A6.2.1 Track sessions, uploads, and AI usage.
- [ ] A6.2.2 Implement a free-trial rule set.
- [ ] A6.2.3 Surface quota state in student and parent views.

### A6.3 Billing Service

- [ ] A6.3.1 Implement the billing abstraction layer.
- [ ] A6.3.2 Implement webhook handling for subscription state.
- [ ] A6.3.3 Persist subscription status without hardwiring provider-specific logic into the app.

### A6.4 Privacy And Data Controls

- [ ] A6.4.1 Build billing/settings and privacy/data control screens.
- [ ] A6.4.2 Implement account-linked data deletion flows.
- [ ] A6.4.3 Write clear user-facing privacy copy for the MVP.

## Phase A7 - QA, iPad Polish, And Launch Readiness

Outcome: the product is stable enough for serious parent and tutor trials.

### A7.1 iPad And Responsive QA

- [ ] A7.1.1 Test upload, chat, and workspace flows on iPad Safari.
- [ ] A7.1.2 Fix keyboard, layout, and tap-target issues.
- [ ] A7.1.3 Verify portrait and landscape tablet behavior.

### A7.2 Smoke Tests And Regression Coverage

- [ ] A7.2.1 Create a written smoke test checklist for student, parent, tutor, and admin roles.
- [ ] A7.2.2 Add automated coverage for the highest-risk backend and auth paths.
- [ ] A7.2.3 Add a pre-demo regression pass.

### A7.3 Performance And Cost Controls

- [ ] A7.3.1 Add request caps and guardrails for expensive AI usage.
- [ ] A7.3.2 Add caching or summarization where it lowers cost without harming behavior.
- [ ] A7.3.3 Review storage and upload limits against trial economics.

### A7.4 Launch Candidate

- [ ] A7.4.1 Decide whether PWA installability is worth doing before beta.
- [ ] A7.4.2 Prepare demo accounts and a founder walkthrough script.
- [ ] A7.4.3 Freeze the MVP scope and publish the launch checklist.
