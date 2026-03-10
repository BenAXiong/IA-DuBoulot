# Implementation Plan

Related: [README](../README.md) | [Original brief](../project_brief_codex.txt) | [Brief adjustments](brief_adjustments.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [MVP to-do list](mvp_todo.md) | [MVP timeline](mvp_timeline.md)

## Objective

Build the smallest serious version of IA DuBoulot: a supervised AI homework coach that works well on iPad and laptop, helps students without defaulting to answer dumping, and gives parents and tutors visibility into what happened.

## Planning Assumptions

- The product stays within the original MVP scope and keeps native apps out of scope.
- The first serious build target is a responsive web app with Next.js, Supabase, and a swappable AI provider layer.
- Build throughput assumes the user relies on Codex for most implementation work, so sequencing must minimize rework and context loss.
- Tight-budget constraints remain active, so the plan favors simple infrastructure, preview deployments, and reusable provider interfaces.
- The product name is locked as `IA DuBoulot`.
- MVP interface scope is `fr`, `en`, and `zh`, with AI help starting in French first and English only if it is low-cost to add after the French flow is stable.
- Deployment target is `Vercel`, assuming the Next.js app lives at repository root `./`.
- Primary starter AI direction is `Google Gemini`, but the app must preserve a swappable provider interface from day one. Free-tier usage should be treated as internal prototyping only until provider data-handling terms are acceptable for minors.
- Billing direction is `Lemon Squeezy`.

## Why The Sequence Changes Slightly From The Brief

The original brief already has a good product order, but for actual implementation the riskiest failure points are not visual screens. They are data contracts, role visibility, upload handling, AI guardrails, and documentation drift. Because of that:

1. Repository and operating discipline must come before feature work.
2. Schema, role matrix, and RLS must be defined before dashboard breadth.
3. Uploads and extracted-text review should be implemented before advanced conversation behavior, because they are core to real student intake.
4. AI provider abstraction and prompt contracts should be defined before expanding parent, tutor, and memory features.
5. Billing should be abstracted early but integrated late, because the provider decision is externally blocked by geography and entity setup.
6. PWA installability stays optional and only happens after the web experience is already solid on iPad Safari.

## Recommended Build Order

## Architecture Guardrails

The codebase should stay modular and intentionally boring:

- no god components that combine page layout, data fetching, mutations, permissions, and business rules in one file
- no god services that know about auth, billing, uploads, prompts, and summaries all at once
- no hidden domain logic inside UI helper files
- prefer feature folders and service boundaries that map to real product responsibilities
- keep pages and route handlers thin; move reusable policy logic into focused server-side modules
- keep AI provider code, prompt code, upload code, auth code, and billing code separate from each other

The architecture should optimize for future maintainability by another agent, not only short-term implementation speed.

### Phase A0 - Bootstrap And Governance

Create the repo operating system first:

- git and GitHub repo setup
- Vercel deployment setup
- service account inventory
- naming decisions
- documentation spine
- work session logging
- decision logging

This phase removes the main long-term risk: future sessions building blindly from partial context.

### Phase A1 - Data Contracts And Access Model

Before UI breadth, define:

- core SQL schema
- role linking model
- RLS policies
- API route map
- service boundaries for AI, uploads, billing, and summaries
- seed data and smoke test accounts

This phase makes later UI work much safer and faster.

### Phase A2 - App Foundation

Scaffold the actual application:

- Next.js app shell
- Tailwind and component primitives
- Supabase auth integration
- role-aware layouts
- linting and modularity guardrails
- i18n foundations for `fr`, `en`, and `zh`
- basic telemetry and feature flags

The goal is not polish. The goal is a stable shell that can host the first workflow slice.

### Phase A3 - Student Core Workflow

Build the first end-to-end learning path:

- student dashboard
- new homework intake
- file upload and extracted text preview
- conversation persistence
- homework chat
- workspace side panel
- session history and summary view

This is the real MVP center of gravity. If this slice is weak, the rest of the product does not matter.

### Phase A4 - AI Coaching And Safety

Add the behavior that makes the product distinct:

- Gemini-first provider implementation behind a provider abstraction
- coach-mode prompts
- upload interpretation
- moderation
- pedagogical guardrails
- summary generation
- parent translation support

This phase should optimize for trustworthy behavior, not model sophistication.

### Phase A5 - Parent And Tutor Oversight

Once the student slice works, add adult visibility:

- parent and tutor linking
- read-only review surfaces
- tutor private notes
- session summaries
- access audits for sensitive views

These features are part of the core product promise and should not be treated as admin afterthoughts.

### Phase A6 - Business And Retention Systems

Then add:

- student memory profile
- usage counters
- trial gating
- Lemon Squeezy billing abstraction and webhook handling
- privacy and deletion controls

These systems support monetization and responsible data handling without blocking the first core flow.

### Phase A7 - Quality, iPad Polish, And Launch Readiness

Finish with:

- iPad Safari QA
- smoke tests
- performance and cost caps
- optional PWA installability
- beta launch checklist

This phase turns a working internal tool into a usable MVP.

## Missing Elements Added To The Plan

The original brief was intentionally product-focused. For build execution, these items also need to exist:

- git initialization and GitHub repo creation
- branch and review conventions
- deployment setup for preview and production
- environment variable matrix and secret ownership
- role/access matrix before RLS implementation
- seed accounts and demo fixtures
- smoke test checklist
- decision log and work session log
- artifact index so docs, SQL, prompts, and scripts are hyperlinkable
- legal/privacy and deletion-path tasks suitable for minors
- modular architecture rules to prevent god components and hidden logic
- explicit iPad Safari verification as a recurring QA step
- localization structure that does not entangle UI copy with business logic

## High-Risk Areas And Mitigations

### 1. Traceability Drift

Risk: future sessions create code or docs without seeing the latest state.

Mitigation:

- keep [README](../README.md), [AGENTS](../AGENTS.md), [decision log](decision_log.md), and [work sessions log](work_sessions.md) mandatory
- require task IDs in logs and updates
- link every durable artifact from a source-of-truth doc

### 2. Role Visibility Bugs

Risk: student, parent, tutor, and admin data boundaries become unclear.

Mitigation:

- write the role matrix before code
- implement RLS and server-side checks
- maintain seed fixtures for student-parent-tutor combinations

### 3. AI Over-Helping

Risk: the assistant becomes a homework answer machine instead of a coach.

Mitigation:

- define prompt rules early
- log moderation and risky output events
- bias toward hints, decomposition, and attempt-first prompts

### 4. Upload Reliability

Risk: image and PDF intake works poorly on real homework materials.

Mitigation:

- test with real screenshots, photos, and PDFs early
- keep extracted text editable
- treat handwriting accuracy as limited in MVP

### 5. Billing And Geography

Risk: billing provider choice blocks late-stage work.

Mitigation:

- define a billing service interface early
- keep the real provider integration behind that abstraction
- do not make provider-specific assumptions in UI or DB models

## Immediate Founder Decisions Needed

These do not block writing docs, but they will block implementation quickly if delayed:

1. Enable branch protection on `main` in GitHub.
2. Initialize the Vercel project now that the repo is ready to push.
3. Choose the fallback AI provider after the Gemini-first implementation path is underway.
4. Confirm the legal/privacy baseline for minors, especially retention and deletion expectations.

## What "Minors Privacy, Retention, And Deletion Expectations" Means

Before implementation, the founder needs explicit answers to these questions:

- Are accounts for children under 13 allowed, and if yes, what parent-consent or parent-linking flow is required before use?
- What child data is truly necessary for the product to work: display name, age band, homework uploads, chats, summaries, tutor notes, and memory items?
- What child data must not be collected at all: precise location, unnecessary identifiers, behavioral advertising data, or unrelated profiling data?
- How long do raw uploads, extracted text, chats, summaries, tutor notes, memory items, and audit logs stay in the system if the account becomes inactive?
- When a parent or guardian asks for deletion, what is deleted immediately, what is deleted on a delay, and what must remain briefly for fraud, billing, or legal records?
- Can a parent review, export, and delete a child's data from the product without support intervention?
- Will any third-party provider use prompts, uploads, or logs for provider-side product improvement, and if not, how is that disabled?
- What privacy copy needs to be shown in signup, linking, and settings flows so parents understand what is stored and why?

## MVP Exit Criteria

The MVP is done when all of the following are true:

- A student can log in, start homework from text or file upload, and complete a full coaching session.
- Extracted text is reviewable and editable before the chat begins.
- Session history persists and can be reopened.
- A linked parent can review a translated session summary.
- A linked tutor can review sessions and leave private notes invisible to the student.
- Access control is enforced with both RLS and server-side checks.
- Usage caps and a trial path exist, even if pricing is still simple.
- The app is usable on iPad Safari across the core flow.
- The session and decision logs explain how the current system works.
